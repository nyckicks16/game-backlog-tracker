# Google OAuth 2.0 Setup Guide - User Story #5

## Overview
This guide walks through setting up Google OAuth 2.0 credentials for the Game Backlog Tracker application. This is **User Story #5** and must be completed before implementing any authentication features.

## Prerequisites
- Google account with access to Google Cloud Console
- Project structure already created (User Story #6 ✅ Complete)

## Step-by-Step Setup

### 1. Google Cloud Console Project Creation

1. **Navigate to Google Cloud Console**
   - Go to https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown at the top
   - Click "NEW PROJECT"
   - Project name: `game-backlog-tracker`
   - Project ID: `game-backlog-tracker-[random-suffix]` (auto-generated)
   - Click "CREATE"
   - Wait for project creation to complete

3. **Select Your New Project**
   - Ensure "game-backlog-tracker" is selected in the project dropdown

### 2. Enable Required APIs

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" > "Library"

2. **Enable Google People API**
   - Search for "Google People API"
   - Click on "Google People API" in results
   - Click "ENABLE" button
   - Wait for API to be enabled

### 3. Configure OAuth Consent Screen

1. **Navigate to OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"

2. **Select User Type**
   - Choose "External" (for testing with personal Gmail accounts)
   - Click "CREATE"

3. **Fill App Information**
   - **App name**: `Game Backlog Tracker`
   - **User support email**: Your email address
   - **App logo**: (Optional - can skip for now)
   - **App domain**: Leave blank for development
   - **Developer contact information**: Your email address
   - Click "SAVE AND CONTINUE"

4. **Scopes Configuration**
   - Click "ADD OR REMOVE SCOPES"
   - Add these scopes:
     - `email` - See your primary Google Account email address
     - `profile` - See your personal info, including any personal info you've made publicly available
     - `openid` - Associate you with your personal info on Google
   - Click "UPDATE" then "SAVE AND CONTINUE"

5. **Test Users (Development Only)**
   - Click "ADD USERS"
   - Add your Gmail address as a test user
   - Add any other developer email addresses
   - Click "SAVE AND CONTINUE"

6. **Review and Finish**
   - Review all settings
   - Click "BACK TO DASHBOARD"

### 4. Create OAuth 2.0 Credentials

1. **Navigate to Credentials**
   - Go to "APIs & Services" > "Credentials"

2. **Create OAuth Client ID**
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: `Game Backlog Tracker - Development`

3. **Configure Authorized URLs**
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:5173`
   
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback`
     - `http://localhost:5173/auth/callback` (frontend fallback)

4. **Create and Download**
   - Click "CREATE"
   - **IMPORTANT**: Copy the Client ID and Client Secret immediately
   - Click "DOWNLOAD JSON" to save credentials file
   - Click "OK" to close dialog

### 5. Update Environment Variables

1. **Open Backend .env File**
   - Navigate to `backend/.env` in your project
   - Replace the placeholder values:

```env
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your-actual-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-actual-client-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

2. **Verify .gitignore Protection**
   - Ensure `backend/.env` is listed in `.gitignore`
   - Never commit real credentials to version control

### 6. Test Configuration

Run this quick test to ensure environment variables are loaded correctly:

```powershell
# Navigate to backend directory
cd backend

# Test environment loading
node -e "require('dotenv').config(); console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Loaded ✅' : 'Missing ❌')"
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] OAuth credentials are not committed to version control
- [ ] JWT_SECRET is at least 64 characters long
- [ ] SESSION_SECRET is different from JWT_SECRET
- [ ] OAuth consent screen is properly configured
- [ ] Redirect URIs match your development setup exactly

## Troubleshooting

### Common Issues:

1. **"OAuth Client ID not found"**
   - Verify Client ID is copied correctly without extra spaces
   - Ensure the OAuth client is created for "Web application" type

2. **"Redirect URI mismatch"**
   - Check that authorized redirect URIs in Google Console match exactly
   - URLs are case-sensitive and must include protocol (http://)

3. **"Access blocked: This app's request is invalid"**
   - OAuth consent screen is not properly configured
   - Required scopes (email, profile, openid) are not added

## Next Steps

Once Google OAuth is configured:

1. ✅ **User Story #5**: Complete (OAuth configuration)
2. 🚀 **User Story #8**: Create Backend Authentication API Endpoints  
3. 🚀 **User Story #10**: Implement Session Management
4. 🚀 **User Stories #7, #9, #11**: Frontend authentication components

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google People API Documentation](https://developers.google.com/people)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)