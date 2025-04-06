import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300; // 5 dakikada bir yenile

const API_KEY = process.env.EXCHANGERATE_API_KEY;
const BASE_CURRENCY = 'TRY';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD'];

export async function GET() {
  if (!API_KEY) {
    console.error('Exchange Rate API key is not configured');
    return NextResponse.json(
      { error: 'API anahtarı yapılandırılmamış' },
      { status: 500 }
    );
  }

  try {
    console.log('Fetching exchange rates...');
    console.log('Using API Key:', API_KEY.substring(0, 5) + '...');

    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`;
    console.log('Request URL:', url.replace(API_KEY, 'HIDDEN'));

    const response = await fetch(url, {
      next: {
        revalidate: 300 // 5 dakika cache
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exchange Rate API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Exchange rate data:', data);

    if (data.result !== 'success') {
      console.error('Exchange Rate API Error:', data);
      throw new Error(data['error-type'] || 'Invalid API response');
    }

    const rates = {
      USD: 1 / data.conversion_rates.USD,
      EUR: 1 / data.conversion_rates.EUR,
      GBP: 1 / data.conversion_rates.GBP,
      CAD: 1 / data.conversion_rates.CAD,
      lastUpdate: new Date().toISOString()
    };

    console.log('Formatted exchange rates:', rates);
    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Finance API Error:', error);
    return NextResponse.json(
      { error: 'Döviz kurları alınamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
} 