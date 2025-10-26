# Git Credential Helper Setup

To enable passwordless pushing to GitHub, you need to set up authentication.

## Option 1: GitHub Personal Access Token (Recommended)

### Step 1: Create a Personal Access Token
1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Mental Wellness App Auto-Sync"
4. Select scopes: ✅ **repo** (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Configure Git Credential Helper
```powershell
# Store credentials permanently
git config --global credential.helper store

# Or use Windows Credential Manager (more secure)
git config --global credential.helper manager
```

### Step 3: First Push (Enter credentials once)
```powershell
git push origin main
```
- Username: `Aditya3525`
- Password: `[PASTE YOUR TOKEN HERE]`

After this, all future pushes will be automatic!

---

## Option 2: SSH Key (Advanced)

### Step 1: Generate SSH Key
```powershell
ssh-keygen -t ed25519 -C "adityashirsat939@gmail.com"
```

### Step 2: Add to GitHub
```powershell
# Copy public key
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard
```

1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Paste your public key
4. Save

### Step 3: Change Remote to SSH
```powershell
git remote set-url origin git@github.com:Aditya3525/CurrentWorking-mental-wellness-ai-.git
```

---

## Verify Setup

```powershell
# Test connection
git remote -v

# Should show your repository
# origin  https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-.git (fetch)
# origin  https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-.git (push)
```

---

## Quick Test

```powershell
# Make a test commit
echo "# Test" > test.txt
git add test.txt
git commit -m "Test auto-sync"
git push origin main

# If successful, delete test file
git rm test.txt
git commit -m "Remove test file"
git push origin main
```

If this works without asking for password, you're all set! ✅
