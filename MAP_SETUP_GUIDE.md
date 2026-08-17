# Map Setup Guide - Fix Ocean View Issue

## 🌊 Problem: Map Shows Ocean by Default

If your map is showing the ocean instead of your local area, here's how to fix it:

## 🔧 Quick Fixes

### 1. **Update Default Location**

Edit `app/admin/issues/map/page.tsx` line ~118:

```javascript
// Change this to your city's coordinates
const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco

// Examples for other cities:
// New York: { lat: 40.7128, lng: -74.0060 }
// London: { lat: 51.5074, lng: -0.1278 }
// Tokyo: { lat: 35.6762, lng: 139.6503 }
// Sydney: { lat: -33.8688, lng: 151.2093 }
```

### 2. **Add Issues to Database**

The map centers on existing issues. If there are no issues:

1. **Visit the citizen portal** and report some test issues
2. **Or check the debug page**: `/admin/issues/debug`
3. **Make sure issues have coordinates** (location_lat, location_lng)

### 3. **Enable Location Services**

-   Allow location access when prompted
-   The map will center on your location automatically
-   Click "Get My Location" button to refresh

## 🗺️ How Map Centering Works

The map uses this priority order:

1. **Your GPS location** (zoom level 14) - most precise
2. **Nearby issues center** (zoom level 12) - within 10km
3. **All issues center** (zoom level 10) - city-wide view
4. **Default coordinates** (zoom level 4) - fallback

## 🐛 Debugging Steps

### Check Issues Data

Visit `/admin/issues/debug` to see:

-   Total number of issues
-   How many have coordinates
-   Sample issue data

### Browser Console

Open browser dev tools and check for:

-   Location permission errors
-   API key issues
-   Coordinate calculation logs

### Common Issues

-   **No issues in database** → Map shows default location
-   **Issues without coordinates** → Map can't center properly
-   **Location permission denied** → Map uses issue-based centering
-   **Wrong default coordinates** → Update the defaultCenter variable

## 🎯 Best Practices

1. **Set your city's coordinates** as the default center
2. **Ensure issues have valid GPS coordinates** when created
3. **Test with location services** both enabled and disabled
4. **Add sample issues** for testing if database is empty

## 🔍 Quick Test

1. Open browser console (F12)
2. Look for these log messages:
    - "Using user location: ..."
    - "Using nearby issues center: ..."
    - "Using all issues center: ..."
    - "Using default center: ... - no issues found"

This will tell you exactly why the map is centering where it is!

## 📍 Finding Your City's Coordinates

1. Go to [Google Maps](https://maps.google.com)
2. Right-click on your city center
3. Click the coordinates that appear
4. Copy the lat, lng values
5. Update the `defaultCenter` in the code
