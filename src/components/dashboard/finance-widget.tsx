'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        console.log('Fetching exchange rates...');
        const response = await fetch('/api/finance');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Döviz kurları alınamadı');
        }

        console.log('Received exchange rates:', data);
        setRates(data);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 300000); // 5 dakikada bir güncelle
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
        <CardTitle>Döviz Kurları</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : rates ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">USD/TRY</div>
                <div className="text-lg font-medium">{rates.USD.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">EUR/TRY</div>
                <div className="text-lg font-medium">{rates.EUR.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">GBP/TRY</div>
                <div className="text-lg font-medium">{rates.GBP.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">CAD/TRY</div>
                <div className="text-lg font-medium">{rates.CAD.toFixed(4)}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Son güncelleme: {new Date(rates.lastUpdate).toLocaleTimeString('tr-TR')}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
} 