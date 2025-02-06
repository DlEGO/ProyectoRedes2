export interface TraceResult {
  hop: number;
  ip: string;
  location: string;
  latency: number;
  provider: string;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

export interface TraceServer {
  id: string;
  name: string;
  location: string;
  country: string;
  latencyOffset: number;
}

export interface TraceData {
  target: string;
  timestamp: string;
  sourceServer: TraceServer;
  hops: TraceResult[];
}