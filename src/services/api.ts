import axios from 'axios';
import type { GeoLocation, TraceServer } from '../types';

const IP_API_BASE = 'http://ip-api.com/json';

export const TRACE_SERVERS: TraceServer[] = [
  // North America
  {
    id: 'us-east',
    name: 'US East (Virginia)',
    location: 'Virginia',
    country: 'United States',
    latencyOffset: 0
  },
  {
    id: 'us-west',
    name: 'US South (Texas)',
    location: 'Texas',
    country: 'United States',
    latencyOffset: 30
  },
  // Central America
  {
    id: 'cr-sjo',
    name: 'Costa Rica (San José)',
    location: 'San José',
    country: 'Costa Rica',
    latencyOffset: 80
  },
  {
    id: 'gt-gua',
    name: 'Guatemala (Guatemala City)',
    location: 'Guatemala City',
    country: 'Guatemala',
    latencyOffset: 90
  },
  // South America
  {
    id: 'br-sao',
    name: 'Brazil (São Paulo)',
    location: 'São Paulo',
    country: 'Brazil',
    latencyOffset: 100
  },
  {
    id: 'ar-bue',
    name: 'Argentina (Buenos Aires)',
    location: 'Buenos Aires',
    country: 'Argentina',
    latencyOffset: 120
  },
  // Europe
  {
    id: 'es-mad',
    name: 'Spain (Madrid)',
    location: 'Madrid',
    country: 'Spain',
    latencyOffset: 150
  },
  {
    id: 'es-vlc',
    name: 'Spain (Barcelona)',
    location: 'Barcelona',
    country: 'Spain',
    latencyOffset: 160
  },
  // Oceania
  {
    id: 'au-per',
    name: 'Australia (Perth)',
    location: 'Perth',
    country: 'Australia',
    latencyOffset: 200
  },
  {
    id: 'au-syd',
    name: 'Australia (Sydney)',
    location: 'Sydney',
    country: 'Australia',
    latencyOffset: 180
  },
  // Africa
  {
    id: 'za-jnb',
    name: 'South Africa (Johannesburg)',
    location: 'Johannesburg',
    country: 'South Africa',
    latencyOffset: 220
  },
  {
    id: 'za-cpt',
    name: 'South Africa (Cape Town)',
    location: 'Cape Town',
    country: 'South Africa',
    latencyOffset: 240
  }
];

export async function getIpLocation(ip: string): Promise<GeoLocation> {
  try {
    const response = await axios.get(`${IP_API_BASE}/${ip}`);
    return {
      lat: response.data.lat,
      lon: response.data.lon,
      city: response.data.city,
      country: response.data.country
    };
  } catch (error) {
    console.error('Error fetching IP location:', error);
    throw error;
  }
}

export async function measureLatency(host: string): Promise<number> {
  const start = performance.now();
  try {
    await fetch(`https://${host}`, { mode: 'no-cors' });
    return performance.now() - start;
  } catch {
    return -1;
  }
}

export function getServerLatency(baseLatency: number, server: TraceServer): number {
  // Add some randomness to the latency while maintaining geographical patterns
  const jitter = Math.random() * 20 - 10; // ±10ms jitter
  const latency = baseLatency + server.latencyOffset + jitter;
  
  // Ensure minimum latency of 1ms
  return Math.max(1, latency);
}