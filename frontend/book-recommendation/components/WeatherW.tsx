'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentWeather, getUserLocation, WeatherData } from '@/lib/weather';
import { Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';
import Link from 'next/link';

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      const location = await getUserLocation();
      if (location) {
        const data = await getCurrentWeather(location.lat, location.lon);
        setWeather(data);
      }
      setLoading(false);
    }

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Card className="">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-blue-200 rounded w-1/2"></div>
            <div className="h-10 bg-blue-200 rounded w-3/4"></div>
            <div className="h-3 bg-blue-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            Weather unavailable
          </p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (icon: string) => {
    if (icon.startsWith('01')) return <Sun className="h-16 w-16 text-yellow-500" />;
    if (icon.startsWith('09') || icon.startsWith('10'))
      return <CloudRain className="h-16 w-16 text-blue-500" />;
    if (icon.startsWith('13')) return <CloudSnow className="h-16 w-16 text-blue-300" />;
    if (icon.startsWith('50')) return <Wind className="h-16 w-16 text-gray-400" />;
    return <Cloud className="h-16 w-16 text-gray-500" />;
  };

  return (
    <Card className="bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 text-neutral-700">
      <CardContent className="p-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1"> {weather.city}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{weather.temp}</span>
              <span className="text-2xl">°C</span>
            </div>
            <p className="text-sm capitalize text-muted-foreground mt-1">
              {weather.description}
            </p>
          </div>
          <div className="shrink-0">
            {getWeatherIcon(weather.icon)}
          </div>
        </div>
        <div className='flex mt-5'>
           <Link href={'/'}>Weather Mood Book?</Link> 
        </div>
      </CardContent>
    </Card>
  );
}
