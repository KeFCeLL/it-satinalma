import { NextResponse } from 'next/server';

const API_KEY = process.env.EXCHANGERATE_API_KEY;
const BASE_CURRENCY = 'TRY';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD'];

export async function GET() {
  try {
    console.log('Fetching exchange rates...');

    // Fixer.io API'sini kullanarak döviz kurlarını al
    const response = await fetch(
      `https://api.apilayer.com/fixer/latest?base=${BASE_CURRENCY}&symbols=${CURRENCIES.join(',')}`,
      {
        headers: {
          'apikey': API_KEY as string
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Exchange Rate API Error:', errorData);
      throw new Error(`Exchange rate API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Exchange rate data received:', data);

    // Kurları TL bazlı olarak hesapla (1 TL kaç döviz ediyor)
    const rates = {
      USD: 1 / data.rates.USD,
      EUR: 1 / data.rates.EUR,
      GBP: 1 / data.rates.GBP,
      CAD: 1 / data.rates.CAD,
      lastUpdate: new Date(data.timestamp * 1000).toISOString()
    };

    console.log('Formatted exchange rates:', rates);
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Finance API Error:', error);
    return NextResponse.json(
      { error: 'Döviz kurları alınamadı' },
      { status: 500 }
    );
  }
} 