// lib/weather.ts
export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
          // Default to Delhi, India
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
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}
