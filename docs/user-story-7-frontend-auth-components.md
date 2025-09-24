# User Story #7: Implement Frontend Authentication UI Components

## User Story
**As a** user  
**I want to** see intuitive login/logout UI components  
**So that** I can easily sign in with Google and manage my authentication status

## 🎨 UI Design System (Gaming Theme)

### Color Palette
- **Primary BG:** #0f0f23 (Gaming Dark)
- **Secondary BG:** #1a1a2e
- **Accent:** #0ea5e9 (Sky Blue - Trust)
- **Text Primary:** #f8fafc
- **Success:** #22c55e

### Typography & Spacing
- **Font:** Inter, system-ui, sans-serif
- **Hero:** 3rem (48px), weight: 800
- **Button:** 1.125rem (18px), weight: 600
- **Spacing:** 8px base unit system

## 🖥️ Component Specifications

### Google Sign-In Button
- **Style:** White bg, Google branding, 12px border-radius
- **Padding:** 1rem 2rem (16px 32px)
- **States:** Default → Hover (lift effect) → Loading (spinner) → Success
- **Accessibility:** aria-label, keyboard focus, screen reader support

### User Profile Dropdown
- **Avatar:** 32px circle, Sky Blue bg, white initials
- **Dropdown:** 240px width, dark surface bg, 8px shadow
- **Menu Items:** Profile, Settings, Analytics, Sign Out
- **Animation:** Smooth show/hide transitions

## 📱 Responsive Design
- **Mobile (≤767px):** Smaller text, full-width dropdown, 44px touch targets
- **Tablet (768px+):** Navigation links visible, fixed dropdown
- **Desktop (1024px+):** Full layout, hover states active

## ♿ Accessibility (WCAG 2.1 AA)
- 4.5:1 color contrast ratio
- Keyboard navigation (Tab, Enter, Escape, Arrows)
- Screen reader announcements
- Focus indicators (2px Sky Blue outline)
- Semantic HTML structure

## Technical Implementation

### Required Dependencies
- @google-cloud/local-auth: ^3.0.1 - Google authentication
- axios: ^1.7.7 - HTTP client for API calls
- react-hot-toast: ^2.4.1 - Toast notifications
- @heroicons/react: ^2.1.5 - Icon library
- clsx: ^2.1.1 - Conditional className utility

### Component Architecture
- /src/components/auth/LoginButton.jsx - Google login button
- /src/components/auth/UserProfile.jsx - User profile dropdown
- /src/components/auth/AuthProvider.jsx - Authentication context provider
- /src/components/ui/LoadingSpinner.jsx - Loading indicator
- /src/hooks/useAuth.js - Authentication hook

## Acceptance Criteria

### 1. Login Component
- Google 'Sign in with Google' button component created
- Button displays Google branding and follows design guidelines
- Button triggers OAuth flow via window.location redirect
- Loading state shown during authentication process
- Error messages displayed using react-hot-toast
- Button disabled during loading state

### 2. User Profile Component
- User avatar/profile picture displayed when authenticated
- User name and email shown in profile dropdown
- Profile component responsive across screen sizes
- Fallback avatar for users without profile pictures
- Dropdown menu with logout option

### 3. Navigation Authentication State
- Navigation shows login button when user not authenticated
- Navigation shows user profile when authenticated
- Logout option available in user profile dropdown
- Authentication state updates in real-time via Context API
- Smooth transitions between states using CSS transitions

### 4. Protected Route Indicators
- Clear messaging when users try to access protected content
- Redirect to login flow from protected routes
- Return to intended page after successful authentication
- Toast notification for successful login/logout

### 5. Styling and UX
- Components follow dark gaming theme design system
- Hover states and interactions properly implemented
- Accessible (ARIA labels, keyboard navigation, focus management)
- Mobile-responsive design with touch-friendly targets (min 44px)
- Loading spinners and skeleton states

### 6. Accessibility (WCAG 2.1 AA)
- All buttons have proper ARIA labels
- Focus management for dropdown menus
- Screen reader announcements for state changes
- Keyboard navigation support (Enter, Escape, Arrow keys)
- Color contrast ratio minimum 4.5:1