'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, Loader2 } from 'lucide-react';

interface FinanceData {
  totalBudget: number;
  totalSpent: number;
  percentageChange: number;
}

export function FinanceWidget() {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const response = await fetch('/api/finance');
        if (!response.ok) {
          throw new Error('Finans bilgileri alınamadı');
        }
        const data = await response.json();
        setFinance(data);
        setLoading(false);
      } catch (err) {
        setError('Finans bilgileri alınamadı');
        setLoading(false);
      }
    };

    fetchFinance();
    // Her saat başı güncelle
    const interval = setInterval(fetchFinance, 3600000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Finansal Durum</CardTitle>
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
          <CardTitle className="text-sm font-medium">Finansal Durum</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-500">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Finansal Durum</CardTitle>
      </CardHeader>
      <CardContent>
        {finance && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Toplam Bütçe</p>
              <p className="text-2xl font-bold">{formatCurrency(finance.totalBudget)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Harcanan</p>
                <p className="text-lg font-medium">{formatCurrency(finance.totalSpent)}</p>
              </div>
              <div className="flex items-center space-x-1">
                {finance.percentageChange > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={finance.percentageChange > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(finance.percentageChange)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 