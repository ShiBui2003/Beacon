# Google Maps Setup Guide

This guide will help you set up Google Maps integration for the admin issues map view.

## Getting a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:

    - Maps JavaScript API
    - Places API (optional, for address autocomplete)
    - Geocoding API (optional, for address to coordinates conversion)

4. Go to "Credentials" and create a new API key
5. Restrict the API key to your domain for security

## Environment Setup

1. Copy your API key
2. Add it to your `.env.local` file:

    ```
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
    ```

3. Restart your development server

## Features

The map view includes:

-   **Interactive Google Maps**: Real map with satellite/street view options
-   **Issue Markers**: Color-coded markers based on issue status
    -   Blue: Submitted
    -   Yellow: In Review
    -   Orange: In Progress
    -   Green: Resolved
-   **Filtering**: Filter issues by status, priority, and category
-   **Issue Details**: Click markers to view issue information
-   **Responsive Design**: Works on desktop and mobile

## Fallback Mode

If no API key is provided, the app will show a fallback map with:

-   Mock markers positioned on a grid
-   All filtering and selection functionality
-   Visual representation of issue locations

## Security Notes

-   Always restrict your API key to specific domains in production
-   Consider setting up billing alerts in Google Cloud Console
-   Monitor API usage to avoid unexpected charges

## Troubleshooting

**Map not loading?**

-   Check that your API key is correct
-   Ensure the Maps JavaScript API is enabled
-   Check browser console for error messages

**Markers not appearing?**

-   Verify that issues have valid `location_lat` and `location_lng` values
-   Check that the database query is returning issues with coordinates

**Performance issues?**

-   Consider implementing marker clustering for large numbers of issues
-   Add pagination or limit the number of issues loaded at once
