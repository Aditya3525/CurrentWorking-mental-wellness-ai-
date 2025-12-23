# Help & Safety API Quick Reference

## 🔑 Authentication
- **Public Routes**: No token required
- **User Routes**: Requires `Authorization: Bearer <JWT_TOKEN>` header
- **Admin Routes**: Requires admin session cookie

---

## 📋 Support Tickets

### Create Support Ticket
```http
POST /api/support/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Having trouble with login",
  "message": "I can't log into my account even though my password is correct.",
  "category": "TECHNICAL",
  "attachmentUrl": "https://example.com/screenshot.png" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "clx...",
      "subject": "Having trouble with login",
      "status": "OPEN",
      "priority": "MEDIUM",
      "createdAt": "2024-12-04T10:00:00.000Z"
    }
  },
  "message": "Support ticket created successfully"
}
```

---

### Get User's Tickets
```http
GET /api/support/tickets?status=OPEN
Authorization: Bearer <token>
```

---

### Get Single Ticket
```http
GET /api/support/tickets/:id
Authorization: Bearer <token>
```

---

### Close Ticket
```http
PUT /api/support/tickets/:id/acknowledge
Authorization: Bearer <token>
```

---

## ❓ FAQs

### List All FAQs
```http
GET /api/faq?category=GENERAL&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "faqs": [
      {
        "id": "clx...",
        "question": "How do I get started?",
        "answer": "Getting started is easy!...",
        "category": "GENERAL",
        "viewCount": 125,
        "helpfulCount": 45,
        "notHelpfulCount": 3
      }
    ],
    "total": 8
  }
}
```

---

### Search FAQs
```http
GET /api/faq/search?q=privacy
```

---

### Track FAQ View
```http
POST /api/faq/:id/view
```

---

### Vote on FAQ
```http
POST /api/faq/:id/vote
Content-Type: application/json

{
  "helpful": true
}
```

---

## 🚨 Crisis Resources & Safety Plans

### Get Crisis Resources
```http
GET /api/crisis/resources?country=US
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "clx...",
        "name": "988 Suicide & Crisis Lifeline",
        "type": "HOTLINE",
        "phoneNumber": "988",
        "website": "https://988lifeline.org/",
        "description": "Free and confidential support...",
        "availability": "24/7",
        "country": "US"
      }
    ]
  }
}
```

---

### Create/Update Safety Plan
```http
POST /api/crisis/safety-plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "warningSignsJson": ["feeling hopeless", "isolating from friends"],
  "copingStrategiesJson": ["call a friend", "practice breathing exercises"],
  "supportContactsJson": [
    { "name": "Mom", "phone": "555-1234", "relationship": "parent" }
  ],
  "professionalContactsJson": [
    { "name": "Dr. Smith", "phone": "555-5678", "type": "therapist" }
  ],
  "environmentSafetyJson": ["remove harmful objects", "stay with family"],
  "reasonsToLiveJson": ["my family", "my goals", "my pets"]
}
```

---

### Get Safety Plan
```http
GET /api/crisis/safety-plan
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "safetyPlan": {
      "id": "clx...",
      "warningSignsJson": [...],
      "copingStrategiesJson": [...],
      "supportContactsJson": [...],
      "professionalContactsJson": [...],
      "environmentSafetyJson": [...],
      "reasonsToLiveJson": [...],
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-04T10:00:00.000Z"
    }
  }
}
```

---

### Delete Safety Plan
```http
DELETE /api/crisis/safety-plan
Authorization: Bearer <token>
```

---

## 👨‍⚕️ Therapist Directory & Bookings

### List Therapists
```http
GET /api/therapists?specialty=Anxiety&location=CA&insurance=Aetna&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "therapists": [
      {
        "id": "clx...",
        "name": "Dr. Sarah Johnson",
        "credential": "PSYCHOLOGIST",
        "title": "Clinical Psychologist, PhD",
        "bio": "Dr. Johnson specializes in...",
        "specialtiesJson": ["Anxiety", "Depression", "CBT"],
        "city": "San Francisco",
        "state": "CA",
        "acceptsInsurance": true,
        "insurances": ["Aetna", "Blue Cross Blue Shield"],
        "sessionFee": 150,
        "offersSliding": true,
        "yearsExperience": 15,
        "isVerified": true
      }
    ],
    "total": 5
  }
}
```

---

### Get Single Therapist
```http
GET /api/therapists/:id
```

---

### Search Therapists
```http
GET /api/therapists/search?q=trauma
```

---

### Request Booking
```http
POST /api/therapists/booking
Authorization: Bearer <token>
Content-Type: application/json

{
  "therapistId": "clx...",
  "preferredDate": "2024-12-10",
  "preferredTime": "2:00 PM",
  "message": "I'm looking for help with anxiety and would prefer afternoon appointments."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clx...",
      "therapistId": "clx...",
      "preferredDate": "2024-12-10",
      "preferredTime": "2:00 PM",
      "status": "PENDING",
      "message": "I'm looking for help with anxiety...",
      "createdAt": "2024-12-04T10:00:00.000Z"
    }
  },
  "message": "Booking request submitted successfully"
}
```

---

### Get User's Bookings
```http
GET /api/therapists/bookings
Authorization: Bearer <token>
```

---

### Cancel Booking
```http
DELETE /api/therapists/bookings/:id
Authorization: Bearer <token>
```

---

## 🔧 Admin Endpoints

### Support Ticket Management

#### Get All Tickets
```http
GET /api/admin/help-safety/support/tickets?status=OPEN&priority=HIGH&limit=50&offset=0
Cookie: connect.sid=<session_cookie>
```

---

#### Respond to Ticket
```http
POST /api/admin/help-safety/support/tickets/:id/respond
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "response": "Thank you for contacting support. Here's how to fix your issue..."
}
```

---

#### Close Ticket
```http
PUT /api/admin/help-safety/support/tickets/:id/close
Cookie: connect.sid=<session_cookie>
```

---

### FAQ Management

#### Create FAQ
```http
POST /api/admin/help-safety/faq
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "question": "How do I reset my password?",
  "answer": "Click on 'Forgot Password' on the login page...",
  "category": "TECHNICAL",
  "order": 9,
  "tags": "password, reset, login"
}
```

---

#### Update FAQ
```http
PUT /api/admin/help-safety/faq/:id
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "answer": "Updated answer with more details..."
}
```

---

#### Delete FAQ
```http
DELETE /api/admin/help-safety/faq/:id
Cookie: connect.sid=<session_cookie>
```

---

### Crisis Resource Management

#### Create Crisis Resource
```http
POST /api/admin/help-safety/crisis/resources
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "name": "Mental Health America Hotline",
  "type": "HOTLINE",
  "phoneNumber": "1-800-273-8255",
  "website": "https://mhanational.org/",
  "description": "Provides information and support...",
  "availability": "24/7",
  "country": "US",
  "language": "English",
  "order": 9,
  "tags": "mental health, support, hotline"
}
```

---

#### Update Crisis Resource
```http
PUT /api/admin/help-safety/crisis/resources/:id
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "phoneNumber": "1-800-NEW-NUMBER",
  "isActive": false
}
```

---

#### Delete Crisis Resource
```http
DELETE /api/admin/help-safety/crisis/resources/:id
Cookie: connect.sid=<session_cookie>
```

---

### Therapist Management

#### Create Therapist
```http
POST /api/admin/help-safety/therapists
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "name": "Dr. Alex Martinez",
  "credential": "PSYCHOLOGIST",
  "title": "Clinical Psychologist, PhD",
  "bio": "Dr. Martinez specializes in...",
  "specialtiesJson": "[\"Anxiety\", \"Depression\", \"Trauma\"]",
  "email": "alex.martinez@example.com",
  "phone": "(555) 678-9012",
  "street": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "zipCode": "78701",
  "country": "US",
  "acceptsInsurance": true,
  "insurances": "[\"Aetna\", \"Blue Cross\"]",
  "sessionFee": 140,
  "offersSliding": true,
  "availabilityJson": "[{\"day\":\"Monday\",\"times\":[\"9:00 AM - 5:00 PM\"]}]",
  "yearsExperience": 10,
  "languages": "English, Spanish",
  "isVerified": true
}
```

---

#### Update Therapist
```http
PUT /api/admin/help-safety/therapists/:id
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "sessionFee": 160,
  "offersSliding": false
}
```

---

#### Deactivate Therapist
```http
DELETE /api/admin/help-safety/therapists/:id
Cookie: connect.sid=<session_cookie>
```
*Note: This deactivates the therapist (sets `isActive: false`) rather than deleting.*

---

### Booking Management

#### Get All Bookings
```http
GET /api/admin/help-safety/therapists/bookings?status=PENDING&limit=50&offset=0
Cookie: connect.sid=<session_cookie>
```

---

#### Process Booking
```http
PUT /api/admin/help-safety/therapists/bookings/:id/process
Cookie: connect.sid=<session_cookie>
Content-Type: application/json

{
  "status": "CONFIRMED",
  "adminNotes": "Confirmed appointment for December 10 at 2:00 PM. Sent confirmation email to user."
}
```

---

## 📊 Enum Values Reference

### TicketCategory
- `GENERAL`
- `TECHNICAL`
- `BILLING`
- `FEEDBACK`
- `CRISIS`
- `OTHER`

### TicketStatus
- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

### TicketPriority
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### FAQCategory
- `GENERAL`
- `PRIVACY`
- `ASSESSMENTS`
- `CHATBOT`
- `BILLING`
- `TECHNICAL`
- `SAFETY`

### ResourceType
- `HOTLINE`
- `TEXT_LINE`
- `CHAT_SERVICE`
- `EMERGENCY`
- `SUPPORT_GROUP`
- `WEBSITE`

### TherapistCredential
- `PSYCHOLOGIST`
- `PSYCHIATRIST`
- `LCSW` (Licensed Clinical Social Worker)
- `LMFT` (Licensed Marriage and Family Therapist)
- `LPC` (Licensed Professional Counselor)
- `LMHC` (Licensed Mental Health Counselor)

### BookingStatus
- `PENDING`
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`

---

## 🚨 Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    "Detailed validation error 1",
    "Detailed validation error 2"
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Testing Examples (cURL)

### Create Support Ticket
```bash
curl -X POST http://localhost:5000/api/support/tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test ticket",
    "message": "This is a test support ticket message.",
    "category": "TECHNICAL"
  }'
```

### Search FAQs
```bash
curl -X GET "http://localhost:5000/api/faq/search?q=privacy"
```

### Get Crisis Resources
```bash
curl -X GET "http://localhost:5000/api/crisis/resources?country=US"
```

### Search Therapists
```bash
curl -X GET "http://localhost:5000/api/therapists?specialty=Anxiety&location=CA"
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- JSON arrays for therapist specialties and availability must be stringified
- Safety plan JSON fields should contain properly structured arrays/objects
- Admin endpoints require valid admin session (use existing admin login flow)
- Pagination defaults: limit=50, offset=0

---

**Last Updated**: December 4, 2024
**API Version**: 1.0.0
