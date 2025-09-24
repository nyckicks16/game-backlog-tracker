# User Story #11: Implement User Profile Management and Account Settings

## User Story
**As a** registered user  
**I want to** manage my profile information and settings  
**So that** I can personalize my gaming experience and maintain account security

## 👤 Profile Management UI Design

### Profile Page Layout
- **Header Section:** User avatar (80px), name, email, join date
- **Navigation Tabs:** Profile, Settings, Security, Privacy
- **Main Content:** Card-based layout with dark gaming theme
- **Background:** #0f0f23 with #16213e content cards

### Avatar Management UI
- **Avatar Display:** 80px circle with hover overlay for edit
- **Upload State:** Dotted border, "Drop image or click to browse"
- **Preview Mode:** Real-time preview with crop/zoom controls
- **Fallback:** Initials on Sky Blue (#0ea5e9) background

## ⚙️ Settings Interface Design

### Theme Selection
- **Options:** Dark (default), Light, Auto (system)
- **Preview Cards:** Mini mockups showing each theme
- **Selection Indicator:** Sky Blue border and checkmark
- **Apply Button:** Instant theme switching with transition

### Notification Preferences
- **Section Groups:** Game Updates, Achievement Alerts, System
- **Toggle Switches:** Modern iOS-style with Sky Blue active state
- **Descriptions:** Clear explanation for each notification type
- **Save State:** Auto-save with subtle success indicator

## 🔒 Security Section UI

### Active Sessions Management
- **Session Cards:** Device icon, browser/OS, location, last active
- **Current Session:** Highlighted with "This device" badge
- **Revoke Action:** Red outline button with confirmation modal
- **Refresh Button:** Manual reload with loading spinner

### Account Security Options
- **Password Section:** "Managed by Google" read-only indicator
- **Two-Factor:** Status card with enable/disable toggle
- **Data Export:** "Download My Data" button with GDPR compliance
- **Account Deletion:** Separate danger zone section

## 📊 Profile Statistics UI

### Gaming Stats Dashboard
- **Stat Cards:** Total games, completed, hours played, achievements
- **Visual Design:** Dark cards with colored accent borders
- **Icons:** Gaming-themed with consistent Sky Blue theming
- **Animation:** Count-up effect when loading stats

### Recent Activity Feed
- **Timeline Design:** Vertical list with game thumbnails
- **Activity Types:** Added, completed, updated games
- **Timestamps:** Relative time (2 hours ago, Yesterday)
- **Load More:** Pagination with smooth loading states

## 📱 Responsive Profile Design

### Mobile Layout (≤767px)
- **Header:** Stacked layout, avatar centered above name
- **Tabs:** Horizontal scrollable tabs with current tab indicator
- **Forms:** Full-width inputs with proper spacing (1rem)
- **Buttons:** Full-width primary actions, 44px touch targets

### Desktop Layout (768px+)
- **Sidebar Navigation:** Vertical tab list on left
- **Main Content:** 2-column layout for forms and previews
- **Avatar Upload:** Drag-and-drop with hover states
- **Settings Panels:** Expandable sections with smooth animations

## 🎮 Form Design & Interactions

### Input Styling
- **Base Style:** #1a1a2e background, #cbd5e1 border
- **Focus State:** #0ea5e9 border, subtle glow effect
- **Error State:** #ef4444 border with error message below
- **Success State:** #22c55e border with checkmark icon

### Form Validation UI
- **Real-time Validation:** Immediate feedback as user types
- **Error Messages:** Specific, actionable guidance
- **Character Counters:** For bio and display name fields
- **Save Indicators:** "Saving..." → "Saved" with success animation

## Technical Implementation

### Backend Dependencies
- multer: ^1.4.5 - File upload middleware
- sharp: ^0.33.5 - Image processing
- joi: ^17.13.3 - Validation schema

### Frontend Dependencies
- react-hook-form: ^7.53.0 - Form management
- @hookform/resolvers: ^3.9.0 - Validation resolvers
- react-dropzone: ^14.2.3 - File upload handling
- react-image-crop: ^11.0.5 - Avatar cropping

### Database Schema (Prisma)
- displayName String?
- bio String?
- preferences Json?
- avatarUrl String?
- theme String @default("dark")

### API Endpoints
- GET /api/profile - Get user profile
- PUT /api/profile - Update profile
- POST /api/profile/avatar - Upload avatar
- DELETE /api/profile/avatar - Remove avatar
- GET /api/profile/export - Export user data

### Component Architecture
- /src/pages/ProfilePage.jsx - Main profile container
- /src/components/profile/ProfileHeader.jsx - Avatar and basic info
- /src/components/profile/ProfileTabs.jsx - Navigation tabs
- /src/components/profile/AvatarUpload.jsx - Image upload component
- /src/components/profile/SettingsPanel.jsx - Settings form sections
- /src/components/profile/SecurityPanel.jsx - Security management

## Acceptance Criteria

### 1. Profile Display
- User info display (name, email, avatar) with professional layout
- Registration date and last login timestamps
- Responsive design optimized for mobile and desktop
- Gaming statistics dashboard (games owned, completed, hours played)
- Recent activity feed with game thumbnails

### 2. Profile Editing
- Edit form with real-time validation and character limits
- Avatar upload with drag-and-drop support
- Image cropping and preview functionality
- Auto-save for preference changes
- Success/error notifications for all operations

### 3. Preferences
- Theme selection (Dark, Light, Auto) with live preview
- Language settings dropdown (future-proofing)
- Email notification preferences with toggle switches
- Privacy settings with clear explanations
- Gaming preferences (favorite genres, platforms)

### 4. Security
- Active sessions view with device and location info
- Session revocation with confirmation dialogs
- Two-factor authentication status and toggle
- Account security overview with recommendations
- Account deletion in protected "danger zone" section

### 5. Data Export
- GDPR-compliant data export functionality
- JSON and CSV export format options
- Profile synchronization capabilities
- Download progress indicator for large exports
- Email notification when export is ready

### 6. User Experience
- Tabbed navigation between Profile, Settings, Security sections
- Smooth transitions and micro-interactions
- Loading states for all async operations
- Mobile-optimized forms with proper touch targets
- Consistent dark gaming theme throughout

### 7. Accessibility
- WCAG 2.1 AA compliance throughout profile interface
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- High contrast focus indicators
- Descriptive form validation messages
- Logical tab order through all form sections

## ♿ Profile Accessibility

### Form Accessibility
- **Labels:** Descriptive labels for all form fields
- **Error Association:** aria-describedby for validation messages
- **Focus Management:** Logical tab order through form sections
- **Upload Accessibility:** Keyboard-accessible file selection

### Settings Navigation
- **Tab Navigation:** Arrow keys for tab switching
- **Section Headings:** Proper heading hierarchy (h2, h3)
- **State Announcements:** Screen reader feedback for saves