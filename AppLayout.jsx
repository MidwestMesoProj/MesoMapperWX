import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col text-foreground select-none bg-[#0f1115]">
      {/* Simple Navigation Bar */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
            MesoMapper<span className="text-primary">WX</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link to="/library" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Formula Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content View Container */}
      <main className="flex-1 overflow-auto p-6">
        {/* The Outlet is where USHeatMap or SavedFormulasList will safely inject */}
        <Outlet />
      </main>
    </div>
  );
}
