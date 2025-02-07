import axios from 'axios';
import type { GeoLocation, TraceServer, TraceResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const IP_API_BASE = 'http://ip-api.com/json';



// Virginia trace data from real measurements
const NEWYORK_TRACE_DATA = [
  { hop: 1, ip: '208.91.105.1', name: '_gateway', latency: 0.294 },
  { hop: 2, ip: '100.103.63.1', name: '', latency: 0.264 },
  { hop: 3, ip: '100.103.10.6', name: '', latency: 0.865 },
  { hop: 4, ip: '100.103.11.0', name: '', latency: 0.934 },
  { hop: 5, ip: '204.16.241.168', name: '', latency: 11.703 },
  { hop: 6, ip: '62.115.154.68', name: 'pitt-b2-link.ip.twelve99.net', latency: 5.627 },
  { hop: 7, ip: '62.115.142.224', name: 'ash-bb2-link.ip.twelve99.net', latency: 13.557 },
  { hop: 8, ip: '62.115.123.125', name: 'ash-b2-link.ip.twelve99.net', latency: 13.543 },
  { hop: 9, ip: '62.115.145.225', name: 'google-ic-373139.ip.twelve99-cust.net', latency: 14.947 },
  { hop: 10, ip: '209.85.250.245', name: '', latency: 13.876 },
  { hop: 12, ip: '216.239.48.95', name: '', latency: 14.175 },
  { hop: 13, ip: '142.251.237.185', name: '', latency: 16.092 },
  { hop: 14, ip: '142.251.244.136', name: '', latency: 14.711 },
  { hop: 15, ip: '216.239.62.193', name: '', latency: 14.104 }
];

export const TRACE_SERVERS: TraceServer[] = [
  // North America
  {
    id: 'us-ny',
    name: 'US East (New York)',
    location: 'New York',
    country: 'United States',
    latencyOffset: 0,
    realData: NEWYORK_TRACE_DATA
  },
  {
    id: 'us-ca-sj',
    name: 'US West (San Jose, CA)',
    location: 'San Jose, CA',
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
    id: 'pa-pty',
    name: 'Panama (Panama City)',
    location: 'Panama City',
    country: 'Panama',
    latencyOffset: 90
  },
  // South America
  {
    id: 'br-ipatinga',
    name: 'Brazil (Ipatinga)',
    location: 'Ipatinga',
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
    name: 'Spain (Valencia)',
    location: 'Valencia',
    country: 'Spain',
    latencyOffset: 160
  },
  // Oceania
  {
    id: 'au-mel',
    name: 'Australia (Melbourne)',
    location: 'Melbourne',
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

export function simulateTrace(host: string, server: TraceServer): Promise<TraceResult[]> {
  return new Promise(async (resolve) => {
    // If we have real data for New York, use it
    if (server.realData) {
      const hops = server.realData.map(hop => ({
        hop: hop.hop,
        ip: hop.ip,
        location: hop.name || `${server.location} Region`,
        latency: hop.latency,
        provider: hop.name ? hop.name.split('.')[0] : `${server.country} ISP`
      }));
      resolve(hops);
      return;
    }

    // For other servers, use the simulation logic
    const hops: TraceResult[] = [];
    const numHops = Math.floor(Math.random() * 5) + 8;
    let accumulatedLatency = 0;
    
    for (let i = 1; i <= numHops; i++) {
      const baseLatency = await measureLatency(host);
      const hopLatency = getServerLatency(baseLatency, server);
      accumulatedLatency += hopLatency;

      hops.push({
        hop: i,
        ip: `192.0.2.${i}`,
        location: i === numHops ? host : `${server.location} Region`,
        latency: accumulatedLatency,
        provider: i === numHops ? 'Target Network' : `${server.country} ISP`
      });
    }
    
    resolve(hops);
  });
}