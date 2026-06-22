const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, Zap, LogOut } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/library', label: 'Library', icon: BookOpen },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Metallic top nav */}
      <header
        className="h-14 shrink-0 flex items-center px-4 justify-between relative"
        style={{
          background: 'linear-gradient(180deg, hsl(220,16%,14%) 0%, hsl(220,14%,11%) 100%)',
          borderBottom: '1px solid hsl(215,22%,22%)',
          boxShadow: 'inset 0 1px 0 hsl(215,28%,26%), 0 2px 16px hsl(220,25%,4%/0.6)',
        }}
      >
        {/* Subtle chrome line at very top */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(215,30%,38%) 30%, hsl(210,25%,55%) 50%, hsl(215,30%,38%) 70%, transparent 100%)' }}
        />

        <div className="flex items-center gap-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(200,55%,38%) 0%, hsl(200,45%,24%) 100%)',
                boxShadow: 'inset 0 1px 0 hsl(195,60%,55%), 0 0 12px hsl(195,60%,40%/0.4)',
              }}
            >
              <Zap className="w-4 h-4 text-white relative z-10" />
            </div>
            <span
              className="font-bold tracking-tight hidden sm:block text-sm"
              style={{
                background: 'linear-gradient(180deg, hsl(210,30%,88%) 0%, hsl(210,15%,65%) 50%, hsl(210,25%,78%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Weather Formula Lab
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <button
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(160deg, hsl(220,16%,20%) 0%, hsl(220,14%,16%) 100%)',
                      border: '1px solid hsl(215,20%,26%)',
                      boxShadow: 'inset 0 1px 0 hsl(215,25%,28%)',
                    } : undefined}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground transition-all"
          style={{
            background: 'linear-gradient(160deg, hsl(220,14%,16%) 0%, hsl(220,12%,13%) 100%)',
            border: '1px solid hsl(215,18%,22%)',
            boxShadow: 'inset 0 1px 0 hsl(215,22%,24%)',
          }}
          onClick={() => db.auth.logout()}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}