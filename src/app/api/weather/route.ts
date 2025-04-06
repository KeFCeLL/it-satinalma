import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300; // 5 dakikada bir yenile

// Vercel'de environment variable'ı kontrol et, yoksa fallback key kullan
const API_KEY = process.env.WEATHERAPI_KEY || 'e398ebd102956a9b5942e5dbc8a3269b';
const CITY = 'Istanbul';

export async function GET() {
  try {
    console.log('Fetching weather data for:', CITY);
    console.log('Using API Key:', API_KEY.substring(0, 5) + '...');

    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CITY}&lang=tr`;
    console.log('Request URL:', url.replace(API_KEY, 'HIDDEN'));

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      next: {
        revalidate: 300 // 5 dakika cache
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WeatherAPI Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API anahtarı geçersiz' },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Şehir bulunamadı' },
          { status: 404 }
        );
      }
      
      throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Weather data received:', data);

    // WeatherAPI.com yanıt formatını kontrol et
    if (!data.current || !data.location) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid API response format');
    }

    const weatherResponse = {
      temperature: Math.round(data.current.temp_c),
      condition: data.current.condition.text,
      city: data.location.name,
      icon: data.current.condition.icon,
      description: data.current.condition.text,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph,
      feelsLike: Math.round(data.current.feelslike_c)
    };

    console.log('Formatted weather response:', weatherResponse);
    return NextResponse.json(weatherResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Hava durumu bilgisi alınamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
} 