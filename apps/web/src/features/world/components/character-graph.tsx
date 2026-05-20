import { useState } from 'react';
import type { GraphEdge, GraphNode } from '../hooks/use-character-graph';

const EDGE_COLORS: Record<string, string> = {
  lover: '#e05a9a',
  enemy: '#e05555',
  ally: '#4a90d9',
  family: '#5db85d',
};

const EDGE_LABELS: Record<string, string> = {
  lover: '연인',
  enemy: '적대',
  ally: '동료',
  family: '가족',
};

interface CharacterGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function CharacterGraph({ nodes, edges }: CharacterGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (nodes.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--sw-text-assistive)', fontSize: 14 }}>
        캐릭터를 추가하면 관계 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 600;
  const H = 440;
  const cx = W / 2;
  const cy = H / 2;
  // Scale radius to fit node count
  const R = Math.min(180, Math.max(120, nodes.length * 20));

  const nodePos = Object.fromEntries(
    nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      return [n.id, { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) }];
    })
  );

  const nodeRadius = 26;

  return (
    <div style={{ border: '1px solid var(--sw-line-default)', borderRadius: 12, overflow: 'hidden', background: 'var(--sw-bg-subtle)' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)' }}>
        {Object.entries(EDGE_LABELS).map(([type, label]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--sw-text-secondary)' }}>
            <span style={{ width: 20, height: 2, background: EDGE_COLORS[type], display: 'inline-block', borderRadius: 1 }} />
            {label}
          </span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Edges */}
        {edges.map((edge) => {
          const src = nodePos[edge.source];
          const tgt = nodePos[edge.target];
          if (!src || !tgt) return null;
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;
          // Slight curve offset
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ox = -dy / len * 24;
          const oy = dx / len * 24;
          const cpx = mx + ox;
          const cpy = my + oy;
          const color = EDGE_COLORS[edge.type] ?? '#888';
          const isHighlighted =
            hoveredNode === null || hoveredNode === edge.source || hoveredNode === edge.target;
          return (
            <g key={edge.id} opacity={isHighlighted ? 1 : 0.15}>
              <path
                d={`M ${src.x} ${src.y} Q ${cpx} ${cpy} ${tgt.x} ${tgt.y}`}
                stroke={color}
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
              />
              <text
                x={cpx}
                y={cpy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill={color}
                fontWeight={600}
              >
                {EDGE_LABELS[edge.type]}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePos[node.id];
          if (!pos) return null;
          const isHighlighted = hoveredNode === null || hoveredNode === node.id ||
            edges.some((e) => (e.source === hoveredNode && e.target === node.id) || (e.target === hoveredNode && e.source === node.id));
          return (
            <g
              key={node.id}
              transform={`translate(${pos.x},${pos.y})`}
              opacity={isHighlighted ? 1 : 0.25}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle
                r={nodeRadius}
                fill={hoveredNode === node.id ? 'var(--sw-primary)' : 'var(--sw-bg-surface)'}
                stroke={hoveredNode === node.id ? 'var(--sw-primary)' : 'var(--sw-line-strong)'}
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill={hoveredNode === node.id ? 'white' : 'var(--sw-text-primary)'}
              >
                {node.name.length > 5 ? `${node.name.slice(0, 5)}…` : node.name}
              </text>
              {node.role && (
                <text
                  y={nodeRadius + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="var(--sw-text-assistive)"
                >
                  {node.role.length > 7 ? `${node.role.slice(0, 7)}…` : node.role}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hoveredNode && (() => {
        const node = nodes.find((n) => n.id === hoveredNode);
        const nodeEdges = edges.filter((e) => e.source === hoveredNode || e.target === hoveredNode);
        if (!node) return null;
        return (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: 'var(--sw-text-primary)' }}>{node.name}</span>
            {node.role && <span style={{ color: 'var(--sw-text-assistive)', marginLeft: 8 }}>{node.role}</span>}
            {nodeEdges.length > 0 && (
              <span style={{ color: 'var(--sw-text-assistive)', marginLeft: 12 }}>
                관계: {nodeEdges.map((e) => {
                  const otherId = e.source === hoveredNode ? e.target : e.source;
                  const other = nodes.find((n) => n.id === otherId);
                  return other ? `${other.name}(${EDGE_LABELS[e.type]})` : '';
                }).filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
