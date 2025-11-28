'use client';

import { useEffect, useState } from 'react';
import { getCurrentWeather, getUserLocation, WeatherData } from '@/lib/weather';
import { Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 bg-neutral-300 rounded-full"></div>
          <div className="h-3 w-16 bg-neutral-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const getWeatherIcon = (icon: string) => {
    const iconClass = "h-5 w-5";
    if (icon.startsWith('01')) return <Sun className={`${iconClass} text-yellow-500`} />;
    if (icon.startsWith('09') || icon.startsWith('10'))
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    if (icon.startsWith('13')) return <CloudSnow className={`${iconClass} text-blue-300`} />;
    if (icon.startsWith('50')) return <Wind className={`${iconClass} text-gray-400`} />;
    return <Cloud className={`${iconClass} text-gray-500`} />;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 ">
      {getWeatherIcon(weather.icon)}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-neutral-700">{weather.temp}°C</span>
        <span className="text-xs text-neutral-500 hidden sm:inline">{weather.city}</span>
      </div>
    </div>
  );
}
