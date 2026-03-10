import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface Layer {
  id: string;
  name: string;
  image: HTMLImageElement | null;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  x: number;
  y: number;
  scale: number;
}

export interface Light {
  id: string;
  name: string;
  isGlobal: boolean;
  layerId: string | null;
  x: number;
  y: number;
  color: string;
  radius: number;
  intensity: number;
}

export type ActiveTool = 'select' | 'move-layer' | 'move-light' | 'pan' | 'eyedropper';

interface AppState {
  layers: Layer[];
  lights: Light[];
  globalAmbient: string; // hex color
  selectedLayerId: string | null;
  selectedLightId: string | null;
  activeTool: ActiveTool;
  canvasZoom: number;
  canvasPan: { x: number, y: number };
  eyedropperCallback: ((color: string) => void) | null;
  
  addLayer: () => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  
  addLight: () => void;
  updateLight: (id: string, updates: Partial<Light>) => void;
  removeLight: (id: string) => void;
  
  setGlobalAmbient: (color: string) => void;
  setSelectedLayerId: (id: string | null) => void;
  setSelectedLightId: (id: string | null) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number, y: number }) => void;
  setEyedropperCallback: (cb: ((color: string) => void) | null) => void;
}

export const useStore = create<AppState>((set) => ({
  layers: [],
  lights: [],
  globalAmbient: '#1a1a1a',
  selectedLayerId: null,
  selectedLightId: null,
  activeTool: 'select',
  canvasZoom: 1,
  canvasPan: { x: 0, y: 0 },
  eyedropperCallback: null,

  addLayer: () => set((state) => {
    const newLayer: Layer = {
      id: uuidv4(),
      name: `Layer ${state.layers.length + 1}`,
      image: null,
      visible: true,
      opacity: 1,
      blendMode: 'source-over',
      x: 0,
      y: 0,
      scale: 1,
    };
    return { layers: [newLayer, ...state.layers], selectedLayerId: newLayer.id };
  }),

  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
  })),

  removeLayer: (id) => set((state) => ({
    layers: state.layers.filter((l) => l.id !== id),
    selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    lights: state.lights.filter((l) => l.layerId !== id), // Remove lights attached to this layer
  })),

  moveLayerUp: (id) => set((state) => {
    const index = state.layers.findIndex((l) => l.id === id);
    if (index <= 0) return state;
    const newLayers = [...state.layers];
    [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
    return { layers: newLayers };
  }),

  moveLayerDown: (id) => set((state) => {
    const index = state.layers.findIndex((l) => l.id === id);
    if (index === -1 || index >= state.layers.length - 1) return state;
    const newLayers = [...state.layers];
    [newLayers[index + 1], newLayers[index]] = [newLayers[index], newLayers[index + 1]];
    return { layers: newLayers };
  }),

  addLight: () => set((state) => {
    const newLight: Light = {
      id: uuidv4(),
      name: `Light ${state.lights.length + 1}`,
      isGlobal: true,
      layerId: null,
      x: 400,
      y: 300,
      color: '#ffffff',
      radius: 300,
      intensity: 1,
    };
    return { lights: [...state.lights, newLight], selectedLightId: newLight.id };
  }),

  updateLight: (id, updates) => set((state) => ({
    lights: state.lights.map((l) => (l.id === id ? { ...l, ...updates } : l)),
  })),

  removeLight: (id) => set((state) => ({
    lights: state.lights.filter((l) => l.id !== id),
    selectedLightId: state.selectedLightId === id ? null : state.selectedLightId,
  })),

  setGlobalAmbient: (color) => set({ globalAmbient: color }),
  setSelectedLayerId: (id) => set({ selectedLayerId: id, selectedLightId: null, activeTool: 'select' }),
  setSelectedLightId: (id) => set({ selectedLightId: id, selectedLayerId: null, activeTool: 'select' }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
  setCanvasPan: (pan) => set({ canvasPan: pan }),
  setEyedropperCallback: (cb) => set({ eyedropperCallback: cb }),
}));
