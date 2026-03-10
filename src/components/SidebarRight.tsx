import React from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Sun, Globe, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { ColorInput } from './ColorInput';

export function SidebarRight() {
  const lights = useStore((state) => state.lights);
  const layers = useStore((state) => state.layers);
  const globalAmbient = useStore((state) => state.globalAmbient);
  const selectedLightId = useStore((state) => state.selectedLightId);
  
  const addLight = useStore((state) => state.addLight);
  const updateLight = useStore((state) => state.updateLight);
  const removeLight = useStore((state) => state.removeLight);
  const setGlobalAmbient = useStore((state) => state.setGlobalAmbient);
  const setSelectedLightId = useStore((state) => state.setSelectedLightId);

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full text-zinc-300">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="font-semibold text-zinc-100 mb-4">Global Lighting</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Ambient Color</span>
            <div className="flex items-center gap-2">
              <ColorInput
                value={globalAmbient}
                onChange={(val) => setGlobalAmbient(val)}
              />
              <span className="text-xs text-zinc-500 font-mono uppercase">{globalAmbient}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-100">Light Sources</h2>
        <button
          onClick={addLight}
          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {lights.map((light) => (
          <div
            key={light.id}
            className={clsx(
              "p-3 rounded-lg border transition-colors",
              selectedLightId === light.id 
                ? "bg-zinc-800 border-zinc-700" 
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            )}
            onClick={() => setSelectedLightId(light.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {light.isGlobal ? <Globe className="w-4 h-4 text-blue-400" /> : <Layers className="w-4 h-4 text-purple-400" />}
                <input
                  type="text"
                  value={light.name}
                  onChange={(e) => updateLight(light.id, { name: e.target.value })}
                  className="bg-transparent border-none outline-none text-sm font-medium w-28 text-zinc-100"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeLight(light.id); }} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {selectedLightId === light.id && (
              <div className="space-y-4 mt-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between bg-zinc-950 p-1 rounded-md border border-zinc-800">
                  <button
                    className={clsx(
                      "flex-1 py-1 text-xs font-medium rounded transition-colors",
                      light.isGlobal ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    onClick={() => updateLight(light.id, { isGlobal: true, layerId: null })}
                  >
                    Global
                  </button>
                  <button
                    className={clsx(
                      "flex-1 py-1 text-xs font-medium rounded transition-colors",
                      !light.isGlobal ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    onClick={() => updateLight(light.id, { isGlobal: false, layerId: layers[0]?.id || null })}
                  >
                    Layer
                  </button>
                </div>

                {!light.isGlobal && (
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">Target Layer</div>
                    <select
                      value={light.layerId || ''}
                      onChange={(e) => updateLight(light.id, { layerId: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-md text-xs p-1.5 outline-none"
                    >
                      <option value="" disabled>Select a layer</option>
                      {layers.map(layer => (
                        <option key={layer.id} value={layer.id}>{layer.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Color</span>
                  <div className="flex items-center gap-2">
                    <ColorInput
                      value={light.color}
                      onChange={(val) => updateLight(light.id, { color: val })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Intensity</span>
                    <span>{Number(light.intensity || 0).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={light.intensity || 0}
                    onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) || 0 })}
                    className="w-full accent-zinc-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Radius</span>
                    <span>{light.radius || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={light.radius || 0}
                    onChange={(e) => updateLight(light.id, { radius: parseInt(e.target.value, 10) || 0 })}
                    className="w-full accent-zinc-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {lights.length === 0 && (
          <div className="text-center text-zinc-500 text-sm mt-8">
            No lights yet. Click + to add one.
          </div>
        )}
      </div>
    </div>
  );
}
