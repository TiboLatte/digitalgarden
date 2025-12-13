"use client";

import { useMemo, useState, useRef } from 'react';
import { Book } from '@/types';
import { Minus, Plus, Maximize, Move } from 'lucide-react';

interface RecommendedBook extends Book {
    matchScore?: number;
}

interface ConstellationGraphProps {
    books: RecommendedBook[];
    onAdd: (book: Book) => void;
}

export function ConstellationGraph({ books, onAdd }: ConstellationGraphProps) {
    const [hoveredBook, setHoveredBook] = useState<RecommendedBook | null>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate Positions
    const nodes = useMemo(() => {
        return books.map((book, i) => {
            const score = book.matchScore || 0;
            const distance = Math.max(50, (100 - score) * 4); // Spread out more

            const angleStep = (Math.PI * 2) / books.length;
            const angle = (i * angleStep) + (book.id.charCodeAt(0) % 100) / 100;

            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            // Generate a random control point for organic root curve
            const curveOffset = ((book.id.charCodeAt(0) % 50) - 25);

            return { ...book, x, y, score, curveOffset };
        });
    }, [books]);

    const centerX = 400;
    const centerY = 300;

    // --- NAVIGATION ---
    const handleWheel = (e: React.WheelEvent) => {
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.4, transform.scale + delta), 4);
        setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 4) }));
    const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.4) }));
    const handleReset = () => setTransform({ x: 0, y: 0, scale: 1 });

    return (
        <div
            ref={containerRef}
            className="w-full h-[600px] bg-[#141614] rounded-xl border border-emerald-900/30 relative overflow-hidden shadow-2xl cursor-move active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >

            {/* The Graph */}
            <svg className="w-full h-full" viewBox="0 0 800 600">
                <defs>
                    <radialGradient id="grad-core" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Transform Group */}
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`} style={{ transformOrigin: 'center' }}>

                    {/* Organic Rings */}
                    <circle cx={centerX} cy={centerY} r="100" fill="none" stroke="#065f46" strokeWidth="0.5" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" opacity="0.3" />
                    <circle cx={centerX} cy={centerY} r="250" fill="none" stroke="#065f46" strokeWidth="0.5" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" opacity="0.2" />

                    {/* ROOT CONNECTIONS (Always visible but faint) */}
                    {nodes.map(node => (
                        <path
                            key={`root-${node.id}`}
                            d={`M ${centerX} ${centerY} Q ${centerX + node.x / 2 + node.curveOffset} ${centerY + node.y / 2 + node.curveOffset} ${centerX + node.x} ${centerY + node.y}`}
                            fill="none"
                            stroke={hoveredBook?.id === node.id ? "#34d399" : "#065f46"}
                            strokeWidth={hoveredBook?.id === node.id ? 2 : 1}
                            opacity={hoveredBook?.id === node.id ? 1 : 0.2}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}

                    {/* Nodes (Spores) */}
                    {nodes.map((node) => (
                        <g
                            key={node.id}
                            transform={`translate(${centerX + node.x}, ${centerY + node.y})`}
                            onMouseEnter={() => setHoveredBook(node)}
                            onMouseLeave={() => setHoveredBook(null)}
                            className="cursor-pointer transition-opacity duration-300"
                            style={{ opacity: hoveredBook && hoveredBook.id !== node.id ? 0.3 : 1 }}
                        >
                            {/* Spore Glow */}
                            <circle r={(node.score > 80 ? 10 : 5) / transform.scale} fill={node.score > 80 ? "#10b981" : "#d97706"} opacity="0.2" className="animate-pulse" />

                            {/* Spore Core */}
                            <circle r={(node.score > 80 ? 5 : 3) / transform.scale} fill={node.score > 80 ? "#34d399" : "#f59e0b"} />

                            {/* Label */}
                            {(node.score > 85 || hoveredBook?.id === node.id) && (
                                <text
                                    y={-12 / transform.scale}
                                    textAnchor="middle"
                                    fill={hoveredBook?.id === node.id ? "white" : "#a7f3d0"}
                                    fontSize={10 / transform.scale}
                                    fontWeight="bold"
                                    className="pointer-events-none drop-shadow-md font-serif tracking-wide"
                                >
                                    {node.title.length > 20 ? node.title.substring(0, 18) + '...' : node.title}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* User Core (Tree Trunk) */}
                    <circle cx={centerX} cy={centerY} r={12 / transform.scale} fill="url(#grad-core)" />
                    <circle cx={centerX} cy={centerY} r={3 / transform.scale} fill="#ecfdf5" />
                    <text x={centerX} y={centerY + (25 / transform.scale)} textAnchor="middle" fill="#34d399" fontSize={10 / transform.scale} fontWeight="bold" letterSpacing="1">ROOT</text>
                </g>

            </svg>

            {/* Navigation Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 bg-[#0f110f]/80 backdrop-blur rounded-lg p-1 border border-emerald-900/50 shadow-xl">
                <button onClick={handleZoomIn} className="p-2 text-emerald-600/50 hover:text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors" title="Zoom In"><Plus size={16} /></button>
                <button onClick={handleZoomOut} className="p-2 text-emerald-600/50 hover:text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors" title="Zoom Out"><Minus size={16} /></button>
                <button onClick={handleReset} className="p-2 text-emerald-600/50 hover:text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors" title="Reset View"><Maximize size={16} /></button>
            </div>

            {/* Overlay Card */}
            {hoveredBook && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-auto md:top-4 w-full md:w-64 bg-[#0f110f]/95 backdrop-blur-md border border-emerald-900/50 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                    <div className="flex gap-3">
                        <img src={hoveredBook.coverUrl || '/placeholder.png'} className="w-16 h-24 object-cover rounded shadow-md grayscale-[20%]" />
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h4 className="text-emerald-50 font-serif font-bold leading-tight line-clamp-2 text-sm">{hoveredBook.title}</h4>
                            <p className="text-emerald-400/60 text-xs uppercase tracking-wider">{hoveredBook.author}</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className={`text-xs font-bold ${hoveredBook.matchScore && hoveredBook.matchScore > 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                                    {hoveredBook.matchScore}% DNA
                                </span>
                                <button
                                    style={{ pointerEvents: 'auto' }}
                                    onClick={(e) => { e.stopPropagation(); onAdd(hoveredBook); }}
                                    className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs px-3 py-1.5 rounded-full font-bold transition-colors shadow-lg shadow-emerald-900/50"
                                >
                                    Plant +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 text-emerald-800/60 text-xs pointer-events-none select-none font-serif italic">
                <p>Inner Roots: High Compatibility</p>
                <p>Outer Spores: New Discoveries</p>
            </div>
        </div>
    );
}
