import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw color spectrum
    const hueGradient = ctx.createLinearGradient(0, 0, width, 0);
    hueGradient.addColorStop(0, '#ff0000');
    hueGradient.addColorStop(1/6, '#ffff00');
    hueGradient.addColorStop(2/6, '#00ff00');
    hueGradient.addColorStop(3/6, '#00ffff');
    hueGradient.addColorStop(4/6, '#0000ff');
    hueGradient.addColorStop(5/6, '#ff00ff');
    hueGradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = hueGradient;
    ctx.fillRect(0, 0, width, height);

    const whiteGradient = ctx.createLinearGradient(0, 0, 0, height/2);
    whiteGradient.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, width, height);

    const blackGradient = ctx.createLinearGradient(0, height/2, 0, height);
    blackGradient.addColorStop(0, 'rgba(0,0,0,0)');
    blackGradient.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const pickColor = (e: React.MouseEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvas.width - 1));
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvas.height - 1));

    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(imageData[0], imageData[1], imageData[2]);
    onChange(hex);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    pickColor(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      pickColor(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={200}
        height={150}
        className="w-full h-32 rounded cursor-crosshair border border-zinc-700 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded border border-zinc-700 shrink-0" 
          style={{ backgroundColor: color }}
        />
        <input 
          type="text" 
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-800 text-xs p-1 rounded border border-zinc-700 text-zinc-300 uppercase"
        />
      </div>
    </div>
  );
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function PopoverColorPicker({ color, onChange }: { color: string, onChange: (c: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Calculate position
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.right - 192, // 192 is w-48
        });
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        className="w-full h-full rounded border border-zinc-700 cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="absolute z-50 p-2 bg-zinc-900 border border-zinc-700 rounded shadow-xl w-48"
          style={{ top: position.top, left: position.left }}
        >
          <ColorPicker color={color} onChange={onChange} />
        </div>,
        document.body
      )}
    </>
  );
}
