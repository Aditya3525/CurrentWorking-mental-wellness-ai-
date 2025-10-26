# 🔒 Security Improvements Guide

## Critical Security Enhancements

### 1. Authentication Security

#### A. Add JWT Token Blacklisting
**Issue**: Logged out tokens can still be used until expiration
**Solution**: Implement Redis-based token blacklist

```typescript
// backend/src/middleware/tokenBlacklist.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export class TokenBlacklist {
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await redisClient.get(`blacklist:${token}`);
    return result === 'true';
  }
}

// Update authenticate middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    if (await tokenBlacklist.isBlacklisted(token)) {
      res.status(401).json({ success: false, error: 'Token has been revoked' });
      return;
    }
    
    // ... rest of validation
  } catch (error) {
    // ...
  }
};
```

#### B. Implement Account Lockout
**Issue**: No protection against brute force attacks

```typescript
// backend/src/middleware/loginAttempts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function checkLoginAttempts(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user?.loginAttempts) return true;
  
  const attempts = JSON.parse(user.loginAttempts);
  if (attempts.count >= MAX_ATTEMPTS) {
    const lockoutExpiry = new Date(attempts.lastAttempt).getTime() + LOCKOUT_DURATION;
    if (Date.now() < lockoutExpiry) {
      return false; // Account locked
    }
    // Reset after lockout period
    await resetLoginAttempts(email);
  }
  
  return true;
}

export async function recordFailedLogin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  
  const attempts = user.loginAttempts ? JSON.parse(user.loginAttempts) : { count: 0 };
  attempts.count += 1;
  attempts.lastAttempt = new Date().toISOString();
  
  await prisma.user.update({
    where: { email },
    data: { loginAttempts: JSON.stringify(attempts) }
  });
}
```

**Add to schema.prisma:**
```prisma
model User {
  // ... existing fields
  loginAttempts String? // JSON: { count, lastAttempt }
  lastLoginAt   DateTime?
  lastLoginIp   String?
}
```

#### C. Implement 2FA (Two-Factor Authentication)

```typescript
// backend/src/services/twoFactorAuth.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorAuthService {
  generateSecret(email: string) {
    return speakeasy.generateSecret({
      name: `Mental Wellbeing AI (${email})`,
      length: 32
    });
  }

  async generateQRCode(secret: string): Promise<string> {
    return await QRCode.toDataURL(secret);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) variance
    });
  }
}
```

### 2. Data Protection

#### A. Encrypt Sensitive Fields at Rest

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Use in models
// Encrypt: emergencyPhone, emergencyContact, securityAnswerHash
```

#### B. Implement Field-Level Encryption Middleware

```typescript
// backend/src/middleware/fieldEncryption.ts
const ENCRYPTED_FIELDS = ['emergencyPhone', 'emergencyContact'];

export const encryptionMiddleware = {
  beforeCreate: (data: any) => {
    ENCRYPTED_FIELDS.forEach(field => {
      if (data[field]) {
        data[field] = encrypt(data[field]);
      }
    });
    return data;
  },
  
  afterRead: (data: any) => {
    ENCRYPTED_FIELDS.forEach(field => {
      if (data[field]) {
        try {
          data[field] = decrypt(data[field]);
        } catch (e) {
          // Handle decryption errors
        }
      }
    });
    return data;
  }
};
```

### 3. API Security

#### A. Implement API Key Management for Admin

```typescript
// backend/src/middleware/apiKeyAuth.ts
export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const hashedKey = crypto.createHash('sha256').update(apiKey as string).digest('hex');
  
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashedKey, isActive: true }
  });
  
  if (!key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Track usage
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { 
      lastUsedAt: new Date(),
      usageCount: { increment: 1 }
    }
  });
  
  next();
};
```

**Schema addition:**
```prisma
model ApiKey {
  id          String   @id @default(cuid())
  name        String
  keyHash     String   @unique
  userId      String?
  scope       String[] // ['admin', 'read', 'write']
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
  
  @@map("api_keys")
}
```

#### B. Implement Request Signing for Critical Operations

```typescript
// backend/src/middleware/requestSignature.ts
export const verifyRequestSignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  // Prevent replay attacks (5 min window)
  if (Math.abs(Date.now() - parseInt(timestamp as string)) > 300000) {
    return res.status(401).json({ error: 'Request expired' });
  }
  
  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.REQUEST_SIGNING_SECRET!)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

### 4. Input Validation & Sanitization

#### A. Enhanced XSS Protection

```typescript
// backend/src/middleware/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'html-escaper';

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potential XSS
      return DOMPurify.sanitize(value, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
    }
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = sanitizeValue(value[key]);
        return acc;
      }, {} as any);
    }
    return value;
  };
  
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  
  next();
};
```

#### B. SQL Injection Protection (Additional Layer)

```typescript
// backend/src/utils/sqlInjectionDetector.ts
const SQL_INJECTION_PATTERNS = [
  /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/g,
  /('|(\\')|(;)|(--)|(\*)|(<)|(>))/g
];

export function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// Use in validation middleware
export const sqlInjectionGuard = (req: Request, res: Response, next: NextFunction) => {
  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && detectSQLInjection(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object') {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };
  
  if (checkObject(req.body) || checkObject(req.query)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};
```

### 5. HIPAA Compliance Enhancements

#### A. Audit Logging

```typescript
// backend/src/middleware/auditLog.ts
export async function logAudit(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  reason?: string;
}) {
  await prisma.auditLog.create({
    data: {
      ...params,
      timestamp: new Date()
    }
  });
}
```

**Schema:**
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // 'create', 'read', 'update', 'delete'
  resource   String   // 'user', 'assessment', 'chatMessage'
  resourceId String?
  changes    Json?    // Before/after values
  ipAddress  String
  userAgent  String
  status     String
  reason     String?
  timestamp  DateTime @default(now())
  
  @@index([userId])
  @@index([timestamp])
  @@map("audit_logs")
}
```

#### B. Data Retention Policy

```typescript
// backend/src/scripts/dataRetention.ts
export async function enforceDataRetention() {
  const retentionPeriod = 365 * 2; // 2 years for HIPAA
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);
  
  // Archive old data instead of deleting
  const oldRecords = await prisma.chatMessage.findMany({
    where: { createdAt: { lt: cutoffDate } }
  });
  
  // Move to archive table
  await prisma.chatMessageArchive.createMany({
    data: oldRecords
  });
  
  // Delete from active table
  await prisma.chatMessage.deleteMany({
    where: { createdAt: { lt: cutoffDate } }
  });
}
```

### 6. Environment Security

#### A. Secrets Management

```typescript
// backend/src/config/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class SecretsManager {
  private client: SecretsManagerClient;
  
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }
  
  async getSecret(secretName: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await this.client.send(command);
    return response.SecretString || '';
  }
}

// Use instead of process.env for production
const secrets = new SecretsManager();
const jwtSecret = await secrets.getSecret('mental-wellness-jwt-secret');
```

#### B. Environment Variable Validation

```typescript
// backend/src/config/envValidation.ts
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(5000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().length(64).required(), // 32 bytes hex
  GEMINI_API_KEY_1: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  // ... other required vars
}).unknown();

export function validateEnv() {
  const { error } = envSchema.validate(process.env);
  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
}
```

### 7. Security Headers

```typescript
// backend/src/middleware/securityHeaders.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL!],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
});
```

### 8. Dependency Security

```bash
# Add to package.json scripts
"scripts": {
  "audit": "npm audit --production",
  "audit:fix": "npm audit fix",
  "snyk": "snyk test",
  "snyk:monitor": "snyk monitor"
}
```

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Implementation Priority

**Phase 1 (Immediate - Week 1):**
1. ✅ JWT token blacklisting
2. ✅ Account lockout mechanism
3. ✅ Enhanced input sanitization
4. ✅ Security headers
5. ✅ Audit logging

**Phase 2 (Short-term - Week 2-3):**
1. ✅ Field-level encryption
2. ✅ 2FA implementation
3. ✅ API key management
4. ✅ Request signing

**Phase 3 (Medium-term - Month 2):**
1. ✅ HIPAA compliance audit
2. ✅ Secrets management migration
3. ✅ Data retention policies
4. ✅ Penetration testing
