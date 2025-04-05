'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, CloudLightning, CloudSnow, CloudFog, Loader2 } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  city: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather');
        if (!response.ok) {
          throw new Error('Hava durumu bilgisi alınamadı');
        }
        const data = await response.json();
        setWeather(data);
        setLoading(false);
      } catch (err) {
        setError('Hava durumu bilgisi alınamadı');
        setLoading(false);
      }
    };

    fetchWeather();
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchWeather, 300000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'güneşli':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'bulutlu':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'yağmurlu':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'fırtınalı':
        return <CloudLightning className="h-6 w-6 text-yellow-600" />;
      case 'karlı':
        return <CloudSnow className="h-6 w-6 text-blue-200" />;
      case 'sisli':
        return <CloudFog className="h-6 w-6 text-gray-400" />;
      default:
        return <Cloud className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Hava Durumu</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Hava Durumu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-500">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Hava Durumu</CardTitle>
      </CardHeader>
      <CardContent>
        {weather && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{weather.temperature}°C</p>
              <p className="text-xs text-muted-foreground">{weather.city}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getWeatherIcon(weather.condition)}
              <span className="text-sm">{weather.condition}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 