import React from 'react';
import { MousePointer2, Move, Sun, Hand, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useStore } from '../store';
import { clsx } from 'clsx';

export function TopBar() {
  const activeTool = useStore((state) => state.activeTool);
  const setActiveTool = useStore((state) => state.setActiveTool);
  const canvasZoom = useStore((state) => state.canvasZoom);
  const setCanvasZoom = useStore((state) => state.setCanvasZoom);
  const setCanvasPan = useStore((state) => state.setCanvasPan);

  const handleZoomIn = () => setCanvasZoom(Math.min(canvasZoom * 1.2, 5));
  const handleZoomOut = () => setCanvasZoom(Math.max(canvasZoom / 1.2, 0.1));
  const handleResetView = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

  return (
    <div className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 justify-between">
      <div className="flex items-center gap-2">
        <Sun className="w-6 h-6 text-yellow-500" />
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Lumina 2D</h1>
      </div>
      
      <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={() => setActiveTool('select')}
          className={clsx(
            "p-2 rounded-md transition-colors",
            activeTool === 'select' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
          title="Select"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTool('pan')}
          className={clsx(
            "p-2 rounded-md transition-colors",
            activeTool === 'pan' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
          title="Pan Canvas"
        >
          <Hand className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTool('move-layer')}
          className={clsx(
            "p-2 rounded-md transition-colors",
            activeTool === 'move-layer' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
          title="Move Layer"
        >
          <Move className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTool('move-light')}
          className={clsx(
            "p-2 rounded-md transition-colors",
            activeTool === 'move-light' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
          title="Move Light"
        >
          <Sun className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-zinc-300 w-12 text-center font-mono">
          {Math.round((canvasZoom || 1) * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <button
          onClick={handleResetView}
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
