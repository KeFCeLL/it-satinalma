import { NextResponse } from 'next/server';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const CITY = 'Istanbul'; // Varsayılan şehir

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'OpenWeather API anahtarı bulunamadı' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

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

    return NextResponse.json({
      temperature: Math.round(data.main.temp),
      condition: getCondition(data.weather[0].id),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      city: data.name
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Hava durumu bilgisi alınamadı' },
      { status: 500 }
    );
  }
} 