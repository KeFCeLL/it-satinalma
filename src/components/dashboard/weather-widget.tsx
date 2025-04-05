'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WeatherData {
  temperature: number;
  condition: string;
  city: string;
  icon: string;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 dakikada bir güncelle
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hava Durumu</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : weather ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src={weather.icon} 
                  alt={weather.condition}
                  className="w-16 h-16"
                />
                <div>
                  <div className="text-3xl font-bold">{weather.temperature}°C</div>
                  <div className="text-sm text-muted-foreground">
                    Hissedilen: {weather.feelsLike}°C
                  </div>
                </div>
              </div>
            </div>
            <div className="text-lg font-medium">{weather.condition}</div>
            <div className="text-sm text-muted-foreground">{weather.city}</div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Nem</div>
                <div className="text-lg font-medium">{weather.humidity}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Rüzgar</div>
                <div className="text-lg font-medium">{weather.windSpeed} km/s</div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
} 