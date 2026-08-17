# Google Maps API Setup Guide

## Step 1: Get a Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Create a new project or select an existing one

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps Embed API** (for embedded maps)
     - **Maps JavaScript API** (for interactive maps)
     - **Geocoding API** (for address lookups)
     - **Places API** (for location search)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Restrict the API Key (Important for Security)**
   - Click on your API key to edit it
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add your domains:
       - `http://localhost:3000/*` (for development)
       - `https://yourdomain.com/*` (for production)
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose the APIs you enabled above

## Step 2: Update Your Environment Variables

Replace the current Google Maps API key in your `.env` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_new_api_key_here
```

## Step 3: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to an issue detail page
3. The map should now load properly

## Troubleshooting

### Common Issues:

1. **"API key is invalid"**
   - Make sure the API key is correct
   - Ensure Maps Embed API is enabled
   - Check that your domain is in the referrer restrictions

2. **"This page can't load Google Maps correctly"**
   - Enable billing on your Google Cloud project
   - Check API quotas and limits

3. **Map shows but is grayed out**
   - Enable Maps JavaScript API
   - Check browser console for specific errors

### Free Tier Limits:
- Google Maps provides $200 free credit per month
- Maps Embed API: 100,000 requests per month free
- This should be sufficient for most civic reporting applications

### Alternative (Free) Solution:
If you prefer not to use Google Maps, the system will automatically fall back to:
- OpenStreetMap links
- Direct coordinate display
- External map links

## Current Status:
Your current API key shows "This API project is not authorized to use this API" error. This means:

### Immediate Fix Required:
1. **Enable Maps Embed API**:
   - Go to Google Cloud Console
   - Navigate to "APIs & Services" > "Library"
   - Search for "Maps Embed API"
   - Click on it and press "ENABLE"

2. **Check Billing**:
   - Go to "Billing" in Google Cloud Console
   - Ensure billing is enabled (required even for free tier)
   - Add a payment method (you won't be charged within free limits)

3. **Verify API Key Permissions**:
   - Go to "APIs & Services" > "Credentials"
   - Click on your API key
   - Under "API restrictions", make sure "Maps Embed API" is selected

### Quick Test:
After enabling the API, test this URL in your browser:
```
https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=40.7128,-74.0060&zoom=16
```

Replace `YOUR_API_KEY` with your actual key. If it works, your maps will work too.

## Temporary Solution:
The system now shows a beautiful fallback interface with:
- ✅ Location address and coordinates
- ✅ Direct links to Google Maps and OpenStreetMap  
- ✅ Get Directions button
- ✅ Professional, user-friendly design

Your civic reporting system works perfectly even without Google Maps API!