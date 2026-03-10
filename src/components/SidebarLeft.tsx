import React, { useRef } from 'react';
import { useStore, BlendMode } from '../store';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const BLEND_MODES: BlendMode[] = [
  'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

export function SidebarLeft() {
  const layers = useStore((state) => state.layers);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const addLayer = useStore((state) => state.addLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const removeLayer = useStore((state) => state.removeLayer);
  const moveLayerUp = useStore((state) => state.moveLayerUp);
  const moveLayerDown = useStore((state) => state.moveLayerDown);
  const setSelectedLayerId = useStore((state) => state.setSelectedLayerId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, layerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        updateLayer(layerId, { image: img });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full text-zinc-300">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-100">Layers</h2>
        <button
          onClick={addLayer}
          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={clsx(
              "p-3 rounded-lg border transition-colors",
              selectedLayerId === layer.id 
                ? "bg-zinc-800 border-zinc-700" 
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            )}
            onClick={() => setSelectedLayerId(layer.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={layer.name}
                  onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                  className="bg-transparent border-none outline-none text-sm font-medium w-24 text-zinc-100"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); moveLayerUp(layer.id); }} className="text-zinc-500 hover:text-zinc-300">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); moveLayerDown(layer.id); }} className="text-zinc-500 hover:text-zinc-300">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="text-red-400 hover:text-red-300 ml-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-md cursor-pointer text-xs transition-colors">
                  <ImageIcon className="w-3 h-3" />
                  {layer.image ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, layer.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </div>

              {selectedLayerId === layer.id && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Opacity</span>
                      <span>{Math.round((layer.opacity || 0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={layer.opacity || 0}
                      onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) || 0 })}
                      className="w-full accent-zinc-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Scale</span>
                      <span>{Number(layer.scale || 1).toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={layer.scale || 1}
                      onChange={(e) => updateLayer(layer.id, { scale: parseFloat(e.target.value) || 1 })}
                      className="w-full accent-zinc-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Blend Mode</div>
                    <select
                      value={layer.blendMode}
                      onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-md text-xs p-1.5 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {BLEND_MODES.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {layers.length === 0 && (
          <div className="text-center text-zinc-500 text-sm mt-8">
            No layers yet. Click + to add one.
          </div>
        )}
      </div>
    </div>
  );
}
