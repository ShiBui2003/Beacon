# Nearby Issues Features

## 🎯 What's New

The admin issues map now automatically shows nearby issues by default using the user's current location.

## 🌟 Key Features

### 1. **Automatic Location Detection**

-   Requests user's location on page load
-   Shows nearby issues within 10km radius
-   Graceful fallback if location is denied

### 2. **Smart Map Centering**

-   **Priority 1**: User's current location (zoom level 14)
-   **Priority 2**: Center of nearby issues (zoom level 12)
-   **Priority 3**: Center of all issues (zoom level 10)
-   **Fallback**: Default city center

### 3. **Visual Location Indicators**

-   **Blue pulsing marker**: Your current location
-   **Colored issue markers**: Status-based colors
-   **Distance-based filtering**: 10km radius for "nearby"

### 4. **Enhanced UI**

-   **"Get My Location" button**: Manual location refresh
-   **Location status**: Shows nearby vs total issue counts
-   **Error handling**: Clear messages for location issues

### 5. **Nearby Issues Prioritization**

-   Issues list shows nearby issues first
-   Separate count display for nearby vs total
-   Distance-based sorting and filtering

## 🗺️ How It Works

1. **Page loads** → Requests user location
2. **Location granted** → Centers map on user location
3. **Calculates nearby issues** → Within 10km radius using Haversine formula
4. **Updates display** → Shows nearby count and prioritizes nearby issues
5. **Fallback mode** → Works without location permission

## 🔧 Technical Implementation

### Distance Calculation

```javascript
// Haversine formula for accurate distance calculation
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    // ... formula implementation
    return distance_in_km;
};
```

### Smart Zoom Levels

-   **Zoom 14**: User location (street level)
-   **Zoom 12**: Nearby issues (neighborhood level)
-   **Zoom 10**: All issues (city level)

### Location States

-   `userLocation`: Current GPS coordinates
-   `nearbyIssues`: Issues within 10km radius
-   `locationError`: Error messages for troubleshooting

## 🚀 User Experience

### First Visit

1. Browser asks for location permission
2. If granted: Map centers on user, shows nearby issues
3. If denied: Shows all issues with fallback center

### Subsequent Visits

-   Location cached for 5 minutes
-   Automatic refresh on page reload
-   Manual refresh via "Get My Location" button

### Mobile Friendly

-   Works on mobile devices with GPS
-   Responsive design for all screen sizes
-   Touch-friendly markers and controls

## 🛠️ Configuration

### Nearby Radius

Currently set to 10km - can be adjusted in the code:

```javascript
return distance <= 10; // Change this value
```

### Default Center

Update the default city coordinates:

```javascript
const defaultCenter = { lat: 40.7128, lng: -74.006 }; // Your city
```

## 🔒 Privacy & Security

-   Location data never stored on server
-   Only used for client-side distance calculations
-   User can deny location permission
-   Graceful fallback without location data

This creates a much more relevant and useful experience for admins managing local civic issues!
