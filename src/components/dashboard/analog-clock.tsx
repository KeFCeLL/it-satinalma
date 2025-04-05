'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Yedi segment display için segment tanımları
const segments = {
  0: [1, 1, 1, 1, 1, 1, 0], // [top, topRight, bottomRight, bottom, bottomLeft, topLeft, middle]
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
};

function SevenSegmentDigit({ value }: { value: number }) {
  const activeSegments = segments[value as keyof typeof segments];
  
  return (
    <div className="relative w-16 h-28 mx-1">
      {/* Top */}
      <div className={`absolute top-0 left-2 right-2 h-2 ${activeSegments[0] ? 'bg-primary' : 'bg-primary/10'} rounded-sm transform -skew-x-12`} />
      
      {/* Top Right */}
      <div className={`absolute top-1 right-0 w-2 h-12 ${activeSegments[1] ? 'bg-primary' : 'bg-primary/10'} rounded-sm transform skew-y-12`} />
      
      {/* Bottom Right */}
      <div className={`absolute bottom-1 right-0 w-2 h-12 ${activeSegments[2] ? 'bg-primary' : 'bg-primary/10'} rounded-sm transform -skew-y-12`} />
      
      {/* Bottom */}
      <div className={`absolute bottom-0 left-2 right-2 h-2 ${activeSegments[3] ? 'bg-primary' : 'bg-primary/10'} rounded-sm transform skew-x-12`} />
      
      {/* Bottom Left */}
      <div className={`absolute bottom-1 left-0 w-2 h-12 ${activeSegments[4] ? 'bg-primary' : 'bg-primary/10'} rounded-sm transform skew-y-12`} />
      
      {/* Top Left */}
      <div className={`absolute top-1 left-0 w-2 h-12 ${activeSegments[5] ? 'bg-primary' : 'bg-primary/10'} rounded-sm transform -skew-y-12`} />
      
      {/* Middle */}
      <div className={`absolute top-1/2 left-2 right-2 h-2 -translate-y-1/2 ${activeSegments[6] ? 'bg-primary' : 'bg-primary/10'} rounded-sm`} />
    </div>
  );
}

function FlipCard({ value }: { value: number }) {
  return (
    <div className="relative w-16 h-24 mx-1">
      <div className="absolute inset-0 bg-black rounded-lg shadow-lg">
        <div className="absolute inset-0.5 bg-zinc-900 rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
            {value}
          </div>
          {/* Horizontal line in middle */}
          <div className="absolute top-1/2 w-full h-[1px] bg-black/20" />
          {/* Left dot */}
          <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-black rounded-full -translate-x-1/2 -translate-y-1/2" />
          {/* Right dot */}
          <div className="absolute right-0 top-1/2 w-1.5 h-1.5 bg-black rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col justify-center h-24 mx-1 space-y-2">
      <div className="w-2 h-2 bg-zinc-800 rounded-full" />
      <div className="w-2 h-2 bg-zinc-800 rounded-full" />
    </div>
  );
}

export function AnalogClock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Saat</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Saati iki haneli formata çevir
  const hourDigits = hours.toString().padStart(2, '0').split('').map(Number);
  const minuteDigits = minutes.toString().padStart(2, '0').split('').map(Number);
  const secondDigits = seconds.toString().padStart(2, '0').split('').map(Number);

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Saat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-full pt-0">
        <div className="bg-zinc-950 p-8 rounded-xl shadow-2xl">
          <div className="flex items-center">
            <FlipCard value={hourDigits[0]} />
            <FlipCard value={hourDigits[1]} />
            <Separator />
            <FlipCard value={minuteDigits[0]} />
            <FlipCard value={minuteDigits[1]} />
            <Separator />
            <FlipCard value={secondDigits[0]} />
            <FlipCard value={secondDigits[1]} />
          </div>
        </div>
        
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {time.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </CardContent>
    </Card>
  );
} 