import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Pipette } from 'lucide-react';

export function ColorInput({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const activeTool = useStore(state => state.activeTool);
  const setActiveTool = useStore(state => state.setActiveTool);
  const setEyedropperCallback = useStore(state => state.setEyedropperCallback);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleEyedropper = () => {
    setActiveTool('eyedropper');
    setEyedropperCallback((color: string) => {
      onChange(color);
      setActiveTool('select');
      setEyedropperCallback(null);
    });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        className={`w-8 h-8 rounded border border-zinc-700 cursor-pointer ${className || ''}`}
        style={{ backgroundColor: value }}
        onClick={() => setIsOpen(!isOpen)}
      />
      
      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl flex flex-col gap-3 w-48">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600"
            />
            <button 
              onClick={handleEyedropper}
              className={`p-1.5 rounded transition-colors ${activeTool === 'eyedropper' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}
              title="Pick color from canvas"
            >
              <Pipette className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-6 gap-1">
            {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#000000', '#888888', '#ff8800', '#8800ff', '#0088ff'].map(color => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-zinc-700 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
