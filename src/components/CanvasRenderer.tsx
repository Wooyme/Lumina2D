import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';

function hexToRgb(hex: string) {
  if (!hex) return { r: 255, g: 255, b: 255 };
  
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) || 0,
    g: parseInt(result[2], 16) || 0,
    b: parseInt(result[3], 16) || 0
  } : { r: 255, g: 255, b: 255 };
}

export function CanvasRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  
  const layers = useStore((state) => state.layers);
  const lights = useStore((state) => state.lights);
  const globalAmbient = useStore((state) => state.globalAmbient);
  
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const selectedLightId = useStore((state) => state.selectedLightId);
  const activeTool = useStore((state) => state.activeTool);
  const canvasZoom = useStore((state) => state.canvasZoom);
  const canvasPan = useStore((state) => state.canvasPan);
  const eyedropperCallback = useStore((state) => state.eyedropperCallback);
  
  const updateLayer = useStore((state) => state.updateLayer);
  const updateLight = useStore((state) => state.updateLight);
  const setSelectedLayerId = useStore((state) => state.setSelectedLayerId);
  const setSelectedLightId = useStore((state) => state.setSelectedLightId);
  const setCanvasZoom = useStore((state) => state.setCanvasZoom);
  const setCanvasPan = useStore((state) => state.setCanvasPan);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = size;
    canvas.width = width;
    canvas.height = height;

    // Helper to draw lights
    const drawLights = (targetCtx: CanvasRenderingContext2D, lightList: typeof lights, ambient: string) => {
      targetCtx.fillStyle = ambient;
      targetCtx.fillRect(0, 0, width, height);
      targetCtx.globalCompositeOperation = 'lighter';
      
      lightList.forEach(light => {
        const grad = targetCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
        const rgb = hexToRgb(light.color);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${light.intensity})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        targetCtx.fillStyle = grad;
        targetCtx.beginPath();
        targetCtx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        targetCtx.fill();
      });
      targetCtx.globalCompositeOperation = 'source-over';
    };

    // 1. Create global light canvas
    const globalLightCanvas = document.createElement('canvas');
    globalLightCanvas.width = width;
    globalLightCanvas.height = height;
    const globalLightCtx = globalLightCanvas.getContext('2d')!;
    
    const globalLights = lights.filter(l => l.isGlobal);
    drawLights(globalLightCtx, globalLights, globalAmbient);

    // 2. Render scene
    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = width;
    sceneCanvas.height = height;
    const sceneCtx = sceneCanvas.getContext('2d')!;

    // Draw layers from bottom to top (layers array is top-to-bottom, so we reverse)
    const reversedLayers = [...layers].reverse();

    reversedLayers.forEach(layer => {
      if (!layer.visible || !layer.image) return;

      // Layer image canvas
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = width;
      layerCanvas.height = height;
      const layerCtx = layerCanvas.getContext('2d')!;

      layerCtx.drawImage(
        layer.image,
        layer.x,
        layer.y,
        layer.image.width * layer.scale,
        layer.image.height * layer.scale
      );

      // Layer light accumulation canvas
      const layerLightCanvas = document.createElement('canvas');
      layerLightCanvas.width = width;
      layerLightCanvas.height = height;
      const layerLightCtx = layerLightCanvas.getContext('2d')!;

      // Start with global lights
      layerLightCtx.drawImage(globalLightCanvas, 0, 0);

      // Add layer-specific lights
      const layerSpecificLights = lights.filter(l => !l.isGlobal && l.layerId === layer.id);
      if (layerSpecificLights.length > 0) {
        layerLightCtx.globalCompositeOperation = 'lighter';
        layerSpecificLights.forEach(light => {
          const grad = layerLightCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
          const rgb = hexToRgb(light.color);
          grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${light.intensity})`);
          grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          layerLightCtx.fillStyle = grad;
          layerLightCtx.beginPath();
          layerLightCtx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
          layerLightCtx.fill();
        });
        layerLightCtx.globalCompositeOperation = 'source-over';
      }

      // Multiply layer image by its light accumulation
      layerCtx.globalCompositeOperation = 'multiply';
      layerCtx.drawImage(layerLightCanvas, 0, 0);
      
      // Restore original alpha channel
      layerCtx.globalCompositeOperation = 'destination-in';
      layerCtx.drawImage(
        layer.image,
        layer.x,
        layer.y,
        layer.image.width * layer.scale,
        layer.image.height * layer.scale
      );

      layerCtx.globalCompositeOperation = 'source-over';

      // Draw to scene
      sceneCtx.globalAlpha = layer.opacity;
      sceneCtx.globalCompositeOperation = layer.blendMode;
      sceneCtx.drawImage(layerCanvas, 0, 0);
      sceneCtx.globalAlpha = 1.0;
      sceneCtx.globalCompositeOperation = 'source-over';
    });

    sceneCanvasRef.current = sceneCanvas;

    ctx.clearRect(0, 0, width, height);
    // Draw a checkerboard background for transparency
    const checkerSize = 20;
    for (let i = 0; i < width; i += checkerSize) {
      for (let j = 0; j < height; j += checkerSize) {
        ctx.fillStyle = (i / checkerSize + j / checkerSize) % 2 === 0 ? '#1a1a1a' : '#222222';
        ctx.fillRect(i, j, checkerSize, checkerSize);
      }
    }
    
    ctx.save();
    ctx.translate(canvasPan.x, canvasPan.y);
    ctx.scale(canvasZoom, canvasZoom);
    
    ctx.drawImage(sceneCanvas, 0, 0);

    // Draw UI overlays (selected light position)
    if (selectedLightId) {
      const light = lights.find(l => l.id === selectedLightId);
      if (light) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2 / canvasZoom;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 10 / canvasZoom, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(light.x - 15 / canvasZoom, light.y);
        ctx.lineTo(light.x + 15 / canvasZoom, light.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(light.x, light.y - 15 / canvasZoom);
        ctx.lineTo(light.x, light.y + 15 / canvasZoom);
        ctx.stroke();

        // Draw radius circle
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (selectedLayerId) {
      const layer = layers.find(l => l.id === selectedLayerId);
      if (layer && layer.image && layer.visible) {
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1 / canvasZoom;
        ctx.setLineDash([5 / canvasZoom, 5 / canvasZoom]);
        ctx.strokeRect(
          layer.x,
          layer.y,
          layer.image.width * layer.scale,
          layer.image.height * layer.scale
        );
        ctx.setLineDash([]);
      }
    }
    
    ctx.restore();

  }, [size, layers, lights, globalAmbient, selectedLayerId, selectedLightId, canvasZoom, canvasPan]);

  // Interaction state
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialItemPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Raw coordinates for panning
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Transformed coordinates for scene interaction
    const x = (rawX - canvasPan.x) / canvasZoom;
    const y = (rawY - canvasPan.y) / canvasZoom;

    if (activeTool === 'pan') {
      isDragging.current = true;
      dragStartPos.current = { x: rawX, y: rawY };
      initialItemPos.current = { x: canvasPan.x, y: canvasPan.y };
    } else if (activeTool === 'move-light' && selectedLightId) {
      const light = lights.find(l => l.id === selectedLightId);
      if (light) {
        isDragging.current = true;
        dragStartPos.current = { x, y };
        initialItemPos.current = { x: light.x, y: light.y };
      }
    } else if (activeTool === 'move-layer' && selectedLayerId) {
      const layer = layers.find(l => l.id === selectedLayerId);
      if (layer) {
        isDragging.current = true;
        dragStartPos.current = { x, y };
        initialItemPos.current = { x: layer.x, y: layer.y };
      }
    } else if (activeTool === 'eyedropper') {
      if (sceneCanvasRef.current && eyedropperCallback) {
        const ctx = sceneCanvasRef.current.getContext('2d');
        if (ctx) {
          // Ensure x and y are within bounds
          if (x >= 0 && x < sceneCanvasRef.current.width && y >= 0 && y < sceneCanvasRef.current.height) {
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            // If completely transparent, maybe return a default or blend. Let's just return the rgb.
            const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
            eyedropperCallback(hex);
          }
        }
      }
    } else if (activeTool === 'select') {
      // Simple hit test for lights
      const clickedLight = lights.find(l => {
        const dx = l.x - x;
        const dy = l.y - y;
        return Math.sqrt(dx*dx + dy*dy) < 20 / canvasZoom;
      });
      if (clickedLight) {
        setSelectedLightId(clickedLight.id);
        return;
      }
      
      // Hit test for layers (simple bounding box)
      const clickedLayer = layers.find(l => {
        if (!l.image || !l.visible) return false;
        const w = l.image.width * l.scale;
        const h = l.image.height * l.scale;
        return x >= l.x && x <= l.x + w && y >= l.y && y <= l.y + h;
      });
      if (clickedLayer) {
        setSelectedLayerId(clickedLayer.id);
      } else {
        setSelectedLayerId(null);
        setSelectedLightId(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const x = (rawX - canvasPan.x) / canvasZoom;
    const y = (rawY - canvasPan.y) / canvasZoom;

    if (activeTool === 'pan') {
      const dx = rawX - dragStartPos.current.x;
      const dy = rawY - dragStartPos.current.y;
      setCanvasPan({
        x: initialItemPos.current.x + dx,
        y: initialItemPos.current.y + dy
      });
    } else if (activeTool === 'move-light' && selectedLightId) {
      const dx = x - dragStartPos.current.x;
      const dy = y - dragStartPos.current.y;
      updateLight(selectedLightId, {
        x: initialItemPos.current.x + dx,
        y: initialItemPos.current.y + dy
      });
    } else if (activeTool === 'move-layer' && selectedLayerId) {
      const dx = x - dragStartPos.current.x;
      const dy = y - dragStartPos.current.y;
      updateLayer(selectedLayerId, {
        x: initialItemPos.current.x + dx,
        y: initialItemPos.current.y + dy
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomSensitivity = 0.001;
      const zoomDelta = -e.deltaY * zoomSensitivity;
      const newZoom = Math.max(0.1, Math.min(5, canvasZoom * (1 + zoomDelta)));
      
      // Calculate new pan to keep mouse position fixed
      const scaleChange = newZoom / canvasZoom;
      const newPanX = mouseX - (mouseX - canvasPan.x) * scaleChange;
      const newPanY = mouseY - (mouseY - canvasPan.y) * scaleChange;
      
      setCanvasZoom(newZoom);
      setCanvasPan({ x: newPanX, y: newPanY });
    } else {
      // Pan with trackpad
      setCanvasPan({
        x: canvasPan.x - e.deltaX,
        y: canvasPan.y - e.deltaY
      });
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-zinc-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className={clsx(
          "absolute top-0 left-0 touch-none",
          activeTool === 'pan' ? (isDragging.current ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
        )}
      />
    </div>
  );
}
