import React, { useState } from 'react';
import { Network, Globe2, Server } from 'lucide-react';
import { TraceVisualizer } from './components/TraceVisualizer';
import { getServerLatency, measureLatency, TRACE_SERVERS, simulateTrace } from './services/api';
import type { TraceData, TraceResult, TraceServer } from './types';

const DEMO_TARGETS = [
  { name: 'Google', host: 'google.com' },
  { name: 'Amazon', host: 'amazon.com' },
  { name: 'Cloudflare', host: 'cloudflare.com' }
];

function App() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceResults, setTraceResults] = useState<TraceData[]>([]);

  const simulateTraceFromServer = async (host: string, server: TraceServer) => {
    const hops = await simulateTrace(host, server);
    return {
      target: host,
      timestamp: new Date().toISOString(),
      sourceServer: server,
      hops
    };
  };

  const handleTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    setLoading(true);

    try {
        const response = await fetch('http://localhost:5000/trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target })
        });

        if (!response.ok) {
            throw new Error('Server response was not ok');
        }

        const result = await response.json();
        console.log(result);
        alert('Trace started. Check the server for results.');

        // Simular el trace después de que el servidor responde (sin verificación de archivos)
        const results = await Promise.all(TRACE_SERVERS.map(server => simulateTraceFromServer(target, server)));
        console.log(results);
        setTraceResults(results);

    } catch (error) {
        console.error('Error during trace:', error);

        const results = await Promise.all(TRACE_SERVERS.map(server => simulateTraceFromServer(target, server)));
        console.log(results);
        setTraceResults(results);

    } finally {
        setLoading(false);
    }
};

 const exportData = () => {
    if (!traceResults.length) return;
    
    const csvData = traceResults.flatMap(result => {
        const serverInfo = `\nTrace from ${result.sourceServer.name}\n`;
        const headers = ['Hop', 'IP/Router Name', 'IP(IPV4)', 'Average Latency (ms)'].join(',');
        const rows = result.hops.map(hop => {
            const routerName = hop.provider !== `${result.sourceServer.country} ISP` ? hop.provider : '';
            const identifier = routerName || '*';
            return [hop.hop, identifier, hop.ip || '*', hop.latency?.toFixed(3) || '*'].join(',');
        });
        return [serverInfo, headers, ...rows];
    });
    
    // Extraer todas las latencias y filtrar valores válidos
    const allLatencies = traceResults.flatMap(result => result.hops.map(hop => hop.latency)).filter(latency => latency !== undefined);
    const avgLatency = allLatencies.length ? (allLatencies.reduce((sum, val) => (sum ?? 0) + (val ?? 0), 0) / allLatencies.length).toFixed(3) : '*';
    
    // Obtener el IP con mayor y menor latencia
    const maxLatencyHop = traceResults.flatMap(result => result.hops).reduce((max, hop) => (hop.latency && hop.latency > (max.latency || 0) ? hop : max), { hop: 0, ip: '', latency: 0, provider: '' });
    const minLatencyHop = traceResults.flatMap(result => result.hops).reduce((min, hop) => (hop.latency !== undefined && hop.latency < (min.latency ?? Infinity) ? hop : min), { hop: 0, ip: '', latency: Infinity, provider: '' });
    
    // Obtener el sitio/IP con mayor y menor número de saltos
    const maxHopsResult = traceResults.reduce((max, result) => (result.hops.length > (max.hops?.length || 0) ? result : max), {
        target: '',
        timestamp: '',
        sourceServer: { id: '', name: '', location: '', country: '', latencyOffset: 0 },
        hops: []
    } as TraceData);
    const minHopsResult = traceResults.reduce((min, result) => (result.hops.length < (min.hops?.length || Infinity) ? result : min), {
        target: '',
        timestamp: '',
        sourceServer: { id: '', name: '', location: '', country: '', latencyOffset: 0 },
        hops: []
    } as TraceData);
    
    // Agregar las estadísticas al CSV
    csvData.push('\nStatistics');
    csvData.push(`Average Latency (ms),${avgLatency}`);
    csvData.push(`IP with Max Latency,${maxLatencyHop.ip || '*'},${maxLatencyHop.latency?.toFixed(3) || '*'}`);
    csvData.push(`IP with Min Latency,${minLatencyHop.ip || '*'},${minLatencyHop.latency?.toFixed(3) || '*'}`);
    csvData.push(`Site/IP with Max Hops,${maxHopsResult.target || '*'},${maxHopsResult.hops?.length || '*'}`);
    csvData.push(`Site/IP with Min Hops,${minHopsResult.target || '*'},${minHopsResult.hops?.length || '*'}`);
    
    const csv = csvData.join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${traceResults[0].target}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

  const groupedServers = TRACE_SERVERS.reduce((acc, server) => {
    const region = server.country === 'United States' ? 'North America' :
                  ['Costa Rica', 'Panama'].includes(server.country) ? 'Central America' :
                  ['Brazil', 'Argentina'].includes(server.country) ? 'South America' :
                  ['Spain'].includes(server.country) ? 'Europe' :
                  ['Australia'].includes(server.country) ? 'Oceania' :
                  'Africa';
    
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(server);
    return acc;
  }, {} as Record<string, TraceServer[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-2">
            <Network className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Network Route Tracer</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleTrace} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter hostname (e.g., google.com)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Tracing...' : 'Start Trace'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {DEMO_TARGETS.map(server => (
              <button
                key={server.host}
                onClick={() => setTarget(server.host)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                {server.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-3">
            <Server className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Global Trace Servers</h3>
              <div className="mt-4 space-y-6">
                {Object.entries(groupedServers).map(([region, servers]) => (
                  <div key={region}>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">{region}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {servers.map(server => (
                        <div key={server.id} className="bg-gray-50 p-3 rounded-md">
                          <div className="font-medium text-gray-900">{server.name}</div>
                          <div className="text-sm text-gray-500">{server.location}, {server.country}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {traceResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Trace Results</h2>
              <button
                onClick={exportData}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {traceResults.map((result, index) => (
                <TraceVisualizer key={result.sourceServer.id} data={result} />
              ))}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detailed Results</h3>
              </div>
              {traceResults.map((result) => (
                <div key={result.sourceServer.id} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-6 py-3 bg-gray-50">
                    <h4 className="font-medium text-gray-900">
                      Trace from {result.sourceServer.name}
                    </h4>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hop</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP/Router Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP(IPV4)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Latency (ms)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((hopNumber) => {
                        const hop = result.hops.find(h => h.hop === hopNumber);
                        const routerName = hop && hop.provider !== `${result.sourceServer.country} ISP` ? hop.provider : '';
                        const identifier = routerName || '*';
                        
                        return (
                          <tr key={hopNumber}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hopNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{identifier}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hop?.ip || '*'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hop?.latency ? hop.latency.toFixed(3) : '*'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Globe2 className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
              <p className="mt-1 text-sm text-blue-600">
                Due to browser security restrictions, this is a simulation of network tracing. 
                Real traceroute functionality requires server-side implementation. 
                Latency measurements are approximated using ping-like requests where possible.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

function loadTraceData() {
  throw new Error('Function not implemented.');
}
