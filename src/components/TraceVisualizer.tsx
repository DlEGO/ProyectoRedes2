import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TraceData } from '../types';

interface Props {
  data: TraceData;
}

export function TraceVisualizer({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.hops.length) return;

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain([0, data.hops.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data.hops, d => d.latency) || 100])
      .range([height - margin.bottom, margin.top]);

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x)
        .ticks(10)
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat(() => '')
      )
      .style('stroke-opacity', 0.1);

    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .ticks(10)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat(() => '')
      )
      .style('stroke-opacity', 0.1);

    const line = d3.line<any>()
      .x(d => x(d.hop - 1))
      .y(d => y(d.latency))
      .curve(d3.curveMonotoneX);

    // Add path with gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', y(0))
      .attr('x2', 0)
      .attr('y2', y(d3.max(data.hops, d => d.latency) || 100));

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#60a5fa');

    svg.append('path')
      .datum(data.hops)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add points
    svg.selectAll('circle')
      .data(data.hops)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.hop - 1))
      .attr('cy', d => y(d.latency))
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .append('title')
      .text(d => `Hop ${d.hop}\nIP: ${d.ip}\nLatency: ${d.latency.toFixed(2)}ms\nLocation: ${d.location}`);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(data.hops.length));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin.left - 40)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .attr('fill', '#4b5563')
      .text('Latency (ms)');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4b5563')
      .text('Hop Number');

  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Trace from {data.sourceServer.name}
        </h3>
        <p className="text-sm text-gray-500">
          Target: {data.target}
        </p>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}