import { NextResponse } from 'next/server';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const CITY = 'Istanbul'; // Varsayılan şehir

export async function GET() {
  if (!API_KEY) {
    console.error('OpenWeather API key is not configured');
    return NextResponse.json(
      { error: 'API anahtarı yapılandırılmamış' },
      { status: 500 }
    );
  }

  try {
    console.log('Fetching weather data for:', CITY);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=tr`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenWeather API Error:', errorData);
      throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Weather data received:', data);

    // Hava durumu durumlarını Türkçe'ye çevirme
    const getCondition = (weatherId: number) => {
      if (weatherId >= 200 && weatherId < 300) return 'Fırtınalı';
      if (weatherId >= 300 && weatherId < 400) return 'Çiseli';
      if (weatherId >= 500 && weatherId < 600) return 'Yağmurlu';
      if (weatherId >= 600 && weatherId < 700) return 'Karlı';
      if (weatherId >= 700 && weatherId < 800) return 'Sisli';
      if (weatherId === 800) return 'Güneşli';
      if (weatherId > 800) return 'Bulutlu';
      return 'Bilinmiyor';
    };

    const weatherResponse = {
      temperature: Math.round(data.main.temp),
      condition: getCondition(data.weather[0].id),
      city: data.name
    };

    console.log('Formatted weather response:', weatherResponse);
    return NextResponse.json(weatherResponse);
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Hava durumu bilgisi alınamadı' },
      { status: 500 }
    );
  }
} 