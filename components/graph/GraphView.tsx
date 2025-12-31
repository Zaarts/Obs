import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GraphService, GraphNode } from '../../services/graphService';
import { VaultEntity } from '../../types';
import { Maximize, Minimize, MousePointer2 } from 'lucide-react';

interface GraphViewProps {
  entities: VaultEntity[];
  onNodeClick: (id: string) => void;
  activeId: string | null;
}

export const GraphView: React.FC<GraphViewProps> = ({ entities, onNodeClick, activeId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const data = useMemo(() => GraphService.buildGraph(entities), [entities]);
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  
  const nodesRef = useRef<GraphNode[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const currentNodes = nodesRef.current;
    nodesRef.current = data.nodes.map(newNode => {
      const existing = currentNodes.find(n => n.id === newNode.id);
      return existing ? { ...newNode, x: existing.x, y: existing.y } : newNode;
    });
  }, [data.nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = containerRef.current?.clientWidth || 800;
      canvas.height = containerRef.current?.clientHeight || 600;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const nodes = nodesRef.current;
      const links = data.links;

      // Physics logic
      nodes.forEach(n => {
        if (n === draggedNode) return;
        const centerX = (canvas.width / 2 - transform.x) / transform.scale;
        const centerY = (canvas.height / 2 - transform.y) / transform.scale;
        n.vx += (centerX - n.x) * 0.0005;
        n.vy += (centerY - n.y) * 0.0005;

        nodes.forEach(other => {
          if (n === other) return;
          const dx = other.x - n.x;
          const dy = other.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            n.vx -= (dx / dist) * (1.2 / dist);
            n.vy -= (dy / dist) * (1.2 / dist);
          }
        });
      });

      links.forEach(link => {
        const s = nodes.find(n => n.id === link.source);
        const t = nodes.find(n => n.id === link.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 120) * 0.005;
          if (s !== draggedNode) { s.vx += (dx / dist) * force; s.vy += (dy / dist) * force; }
          if (t !== draggedNode) { t.vx -= (dx / dist) * force; t.vy -= (dy / dist) * force; }
        }
      });

      // Links
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1 / transform.scale;
      links.forEach(link => {
        const s = nodes.find(n => n.id === link.source);
        const t = nodes.find(n => n.id === link.target);
        if (s && t) {
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
        }
      });

      // Nodes
      nodes.forEach(n => {
        if (n !== draggedNode) {
          n.x += n.vx; n.y += n.vy;
          n.vx *= 0.85; n.vy *= 0.85;
        }

        const entity = entities.find(e => e.id === n.id);
        const isActive = n.id === activeId;
        const timeSinceUpdate = entity ? (Date.now() - entity.updatedAt) : Infinity;
        
        // Heatmap Logic: Hot (recent) = Purple, Cold (old) = Gray
        const isHot = timeSinceUpdate < 1000 * 60 * 60 * 24; // 24 hours
        const pulse = isHot ? Math.sin(time/200) * 2 : 0;
        
        ctx.fillStyle = isActive ? '#a855f7' : (isHot ? '#7e22ce' : '#333');
        ctx.shadowBlur = isActive ? 15 : (isHot ? 8 : 0);
        ctx.shadowColor = '#a855f7';
        
        ctx.beginPath();
        const baseSize = isActive ? 8 : (isHot ? 6 : 4);
        ctx.arc(n.x, n.y, (baseSize + pulse) / transform.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (transform.scale > 0.6) {
          ctx.fillStyle = isActive ? '#fff' : (isHot ? '#aaa' : '#555');
          ctx.font = `${10 / transform.scale}px Inter`;
          ctx.textAlign = 'center';
          ctx.fillText(n.name, n.x, n.y + (16 / transform.scale));
        }
      });

      ctx.restore();
      frameRef.current = requestAnimationFrame(animate);
    };

    animate(0);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [data.links, activeId, transform, draggedNode, entities]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left - transform.x) / transform.scale;
    const my = (e.clientY - rect.top - transform.y) / transform.scale;
    const clickedNode = nodesRef.current.find(n => {
      const dx = n.x - mx; const dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) < 20 / transform.scale;
    });
    if (clickedNode) setDraggedNode(clickedNode); else setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
      draggedNode.x = (e.clientX - rect.left - transform.x) / transform.scale;
      draggedNode.y = (e.clientY - rect.top - transform.y) / transform.scale;
      draggedNode.vx = 0; draggedNode.vy = 0;
    } else if (isPanning) {
      setTransform(prev => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) onNodeClick(draggedNode.id);
    setDraggedNode(null); setIsPanning(false);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0a0a0a] relative overflow-hidden select-none">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setTransform(p => ({ ...p, scale: Math.max(0.1, Math.min(5, p.scale + delta)) }));
        }}
        className={`w-full h-full block ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      />
      
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <div className="bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-4 text-[10px] text-gray-500">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"/> Recent (Hot)</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#333]"/> Old (Cold)</div>
        </div>
      </div>
    </div>
  );
};