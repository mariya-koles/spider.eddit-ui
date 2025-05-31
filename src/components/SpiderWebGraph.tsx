import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface GraphData {
  edges: Edge[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  frequency: number;
  size: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: Node;
  target: Node;
  weight: number;
  thickness: number;
}

interface SpiderWebGraphProps {
  data: GraphData;
}

const SpiderWebGraph: React.FC<SpiderWebGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 1200;
  const height = 800;

  const graphData = useMemo(() => {
    if (!data.edges || data.edges.length === 0) {
      return { nodes: [], links: [] };
    }

    // Calculate word frequencies
    const wordFrequency: { [word: string]: number } = {};
    
    data.edges.forEach(edge => {
      wordFrequency[edge.source] = (wordFrequency[edge.source] || 0) + 1;
      wordFrequency[edge.target] = (wordFrequency[edge.target] || 0) + 1;
    });

    // Get all unique words
    const uniqueWords = Array.from(new Set([
      ...data.edges.map(edge => edge.source),
      ...data.edges.map(edge => edge.target)
    ]));

    // Calculate min/max frequencies for scaling
    const frequencies = Object.values(wordFrequency);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);
    
    // Create nodes with scaled sizes
    const nodes: Node[] = uniqueWords.map(word => {
      const frequency = wordFrequency[word];
      // Scale node size between 10 and 50 based on frequency
      const normalizedFreq = maxFreq === minFreq ? 1 : (frequency - minFreq) / (maxFreq - minFreq);
      const size = 10 + (normalizedFreq * 40);
      
      return {
        id: word,
        frequency,
        size
      };
    });

    // Calculate min/max weights for edge scaling
    const weights = data.edges.map(edge => edge.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    // Create a map for easy node lookup
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    // Create links with scaled thickness
    const links: Link[] = data.edges.map(edge => {
      // Scale edge thickness between 1 and 10 based on weight
      const normalizedWeight = maxWeight === minWeight ? 1 : (edge.weight - minWeight) / (maxWeight - minWeight);
      const thickness = 1 + (normalizedWeight * 9);
      
      return {
        source: nodeMap.get(edge.source)!,
        target: nodeMap.get(edge.target)!,
        weight: edge.weight,
        thickness
      };
    });

    return { nodes, links };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Create zoom container
    const container = svg.append('g');

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Apply zoom to SVG
    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5));

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#666')
      .attr('stroke-width', (d: Link) => d.thickness)
      .attr('stroke-opacity', 0.6);

    // Create nodes group
    const node = container.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .style('cursor', 'grab')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', function(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          d3.select(this).style('cursor', 'grabbing');
        })
        .on('drag', (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', function(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          d3.select(this).style('cursor', 'grab');
        })
      );

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d: Node) => d.size / 2)
      .attr('fill', 'rgba(220,38,38,0.52)')
      .attr('stroke', '#961313')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text((d: Node) => d.id)
      .attr('font-size', (d: Node) => Math.max(10, d.size / 3))
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Add tooltips
    node.append('title')
      .text((d: Node) => `${d.id} (frequency: ${d.frequency})`);

    link.append('title')
      .text((d: Link) => `${(d.source as Node).id} ↔ ${(d.target as Node).id} (weight: ${d.weight})`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    });

    // Add zoom controls info
    const info = svg.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '14px')
      .attr('fill', '#888')
      .text('Use mouse wheel to zoom • Click and drag to pan');

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, width, height]);

  return (
    <div className="spider-web-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ backgroundColor: '#1a1a1a', cursor: 'move' }}
      />
    </div>
  );
};

export default SpiderWebGraph; 