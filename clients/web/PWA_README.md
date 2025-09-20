# BeQ Progressive Web App (PWA) Setup

## Overview
This document explains the PWA setup for the BeQ application, which enables users to install the web app on their devices like a native mobile app.

## Files Created

### 1. Web App Manifest (`public/site.webmanifest`)
- **Location**: `/public/site.webmanifest`
- **Purpose**: Defines the PWA metadata, icons, and installation behavior
- **Key Features**:
  - App name: "BeQ - Bricks and Quantas"
  - Short name: "BeQ"
  - Standalone display mode
  - App shortcuts for quick navigation
  - Theme colors and icons

### 2. App Icons
- **Location**: `/public/favicon.svg` - Main favicon (32x32 SVG)
- **Location**: `/public/apple-touch-icon.svg` - Apple touch icon (180x180 SVG)
- **Purpose**: Provide icons for different platforms and use cases

### 3. Test Page
- **Location**: `/public/manifest-test.html`
- **Purpose**: Test page to verify PWA functionality and manifest accessibility

## Manifest Configuration

```json
{
  "name": "BeQ - Bricks and Quantas",
  "short_name": "BeQ",
  "description": "AI-powered life management application...",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "32x32",
      "type": "image/svg+xml"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "url": "/dashboard"
    }
  ]
}
```

## How to Test

### 1. Manual Testing
1. Start the development server: `npm run dev`
2. Open browser and navigate to `http://localhost:3000`
3. Open browser dev tools → Application tab
4. Check if manifest is loaded under "Manifest" section
5. Look for "Add to Home Screen" prompt (on mobile)

### 2. Automated Testing
```bash
# Run the manifest test
node test-manifest.js
```

### 3. Test Page
Visit `http://localhost:3000/manifest-test.html` to test:
- Manifest accessibility
- PWA installability
- App shortcuts

## Browser Support

### PWA Features Supported:
- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Edge (Desktop & Mobile)
- ✅ Samsung Internet

### Installation Methods:
- **Android**: "Add to Home Screen" from browser menu
- **iOS**: Share button → "Add to Home Screen"
- **Desktop**: "Install" button in address bar (Chrome) or app menu

## Next Steps

### Recommended Improvements:
1. **Service Worker**: Add offline functionality
2. **Push Notifications**: Enable background notifications
3. **Better Icons**: Create PNG versions in multiple sizes
4. **Splash Screen**: Custom splash screen for better UX
5. **Cache Strategy**: Implement proper caching for offline use

### Icon Generation:
For production, generate proper PNG icons using tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## Troubleshooting

### Common Issues:

1. **404 Error for Manifest**:
   - ✅ FIXED: Created `public/site.webmanifest`
   - Ensure file is in the correct location

2. **Icons Not Loading**:
   - Check file paths in manifest
   - Ensure files exist in `/public/` directory
   - Verify file extensions match manifest types

3. **PWA Not Installable**:
   - Must have HTTPS (except localhost)
   - Service worker required for full PWA features
   - Manifest must be valid JSON

4. **Shortcuts Not Working**:
   - Only available after PWA installation
   - Test on actual installed PWA, not browser

## Development Notes

- Manifest is automatically referenced in `app/layout.tsx`
- Icons are configured in the metadata export
- Test regularly during development to ensure PWA functionality
- Use Lighthouse in Chrome DevTools to audit PWA score
