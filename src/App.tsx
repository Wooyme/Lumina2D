import React from 'react';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { CanvasRenderer } from './components/CanvasRenderer';
import { TopBar } from './components/TopBar';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SidebarLeft />
        <main className="flex-1 relative">
          <CanvasRenderer />
        </main>
        <SidebarRight />
      </div>
    </div>
  );
}
