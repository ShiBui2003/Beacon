import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No API key configured',
        status: 'missing_key'
      }, { status: 400 });
    }

    // Test the API key by making a simple request to Google Maps API
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return NextResponse.json({ 
        status: 'valid',
        message: 'API key is working correctly',
        apiKey: apiKey.substring(0, 10) + '...' // Show partial key for verification
      });
    } else {
      return NextResponse.json({ 
        status: 'invalid',
        error: data.error_message || data.status,
        message: 'API key is not working properly',
        apiKey: apiKey.substring(0, 10) + '...'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error testing Maps API:', error);
    return NextResponse.json({ 
      error: 'Failed to test API key',
      status: 'test_failed'
    }, { status: 500 });
  }
}
