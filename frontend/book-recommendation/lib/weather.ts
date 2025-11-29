export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
  lat: number;
  lon: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const CACHE_DURATION = 10 * 60 * 1000;

function getCacheKey(lat: number, lon: number): string {
  return `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

function getCachedWeather(lat: number, lon: number): WeatherData | null {
  try {
    const cacheKey = getCacheKey(lat, lon);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const parsed: CachedWeather = JSON.parse(cached);
      const now = Date.now();
      
      if (now - parsed.timestamp < CACHE_DURATION) {
        console.log('Using cached weather data');
        return parsed.data;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  
  return null;
}

function setCachedWeather(lat: number, lon: number, data: WeatherData) {
  try {
    const cacheKey = getCacheKey(lat, lon);
    const cached: CachedWeather = {
      data,
      timestamp: Date.now(),
      lat,
      lon
    };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          resolve({ lat: 28.6139, lon: 77.2090 });
        }
      );
    } else {
      resolve({ lat: 28.6139, lon: 77.2090 });
    }
  });
}

export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const cached = getCachedWeather(lat, lon);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather');
    }
    
    const data = await response.json();
    
    setCachedWeather(lat, lon, data);
    
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}
