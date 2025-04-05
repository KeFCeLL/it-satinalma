import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300; // 5 dakikada bir yenile

const API_KEY = process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD'];

export async function GET() {
  if (!API_KEY) {
    console.error('Alpha Vantage API key is not configured');
    return NextResponse.json(
      { error: 'API anahtarı yapılandırılmamış' },
      { status: 500 }
    );
  }

  try {
    console.log('Fetching exchange rates...');
    console.log('Using API Key:', API_KEY.substring(0, 5) + '...');

    // Her bir döviz kuru için ayrı istek yap
    const exchangeRates = await Promise.all(
      CURRENCIES.map(async (currency) => {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${currency}&to_currency=TRY&apikey=${API_KEY}`;
        console.log(`Fetching rate for ${currency} from:`, url.replace(API_KEY, 'HIDDEN'));

        const response = await fetch(url, {
          next: {
            revalidate: 300 // 5 dakika cache
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching ${currency} rate:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Failed to fetch ${currency} rate: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`${currency} rate response:`, data);

        if (data['Error Message']) {
          console.error(`Alpha Vantage error for ${currency}:`, data['Error Message']);
          throw new Error(data['Error Message']);
        }

        if (!data['Realtime Currency Exchange Rate']) {
          console.error(`Invalid response format for ${currency}:`, data);
          throw new Error(`Invalid response format for ${currency}`);
        }

        const rate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
        console.log(`${currency} rate:`, rate);

        return {
          currency,
          rate
        };
      })
    );

    // Sonuçları formatla
    const rates = {
      USD: exchangeRates.find(r => r.currency === 'USD')?.rate || 0,
      EUR: exchangeRates.find(r => r.currency === 'EUR')?.rate || 0,
      GBP: exchangeRates.find(r => r.currency === 'GBP')?.rate || 0,
      CAD: exchangeRates.find(r => r.currency === 'CAD')?.rate || 0,
      lastUpdate: new Date().toISOString()
    };

    console.log('Final exchange rates:', rates);
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