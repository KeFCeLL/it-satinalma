'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Euro, PoundSterling, Loader2 } from 'lucide-react';

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  CAD: number;
  lastUpdate: string;
}

export function FinanceWidget() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/finance');
        if (!response.ok) {
          throw new Error('Döviz kurları alınamadı');
        }
        const data = await response.json();
        setRates(data);
        setLoading(false);
      } catch (err) {
        setError('Döviz kurları alınamadı');
        setLoading(false);
      }
    };

    fetchRates();
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchRates, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Döviz Kurları</CardTitle>
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
          <CardTitle className="text-sm font-medium">Döviz Kurları</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-500">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Döviz Kurları</CardTitle>
      </CardHeader>
      <CardContent>
        {rates && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm">USD/TRY</span>
              </div>
              <span className="text-sm font-medium">{rates.USD.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-blue-500" />
                <span className="text-sm">EUR/TRY</span>
              </div>
              <span className="text-sm font-medium">{rates.EUR.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PoundSterling className="h-4 w-4 text-purple-500" />
                <span className="text-sm">GBP/TRY</span>
              </div>
              <span className="text-sm font-medium">{rates.GBP.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                <span className="text-sm">CAD/TRY</span>
              </div>
              <span className="text-sm font-medium">{rates.CAD.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Son güncelleme: {new Date(rates.lastUpdate).toLocaleTimeString('tr-TR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 