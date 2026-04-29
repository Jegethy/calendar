'use client';

import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { HouseHeart, Sun, Moon, LogOut } from 'lucide-react';
import GoogleLogo from './GoogleLogo';

interface HeaderProps {
  user: User;
  onColorChange: (color: string) => void;
}

export default function Header({ user, onColorChange }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedColor, setSelectedColor] = useState(user.color);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
    }
  };

  const handleColorSave = async () => {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: selectedColor }),
      });
      onColorChange(selectedColor);
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  const presetColors = [
    '#3b82f6', '#ec4899', '#10b981', '#f59e0b',
    '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
  ];

  const isGoogleConnected = !!user.googleAccessToken;

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-indigo-100 dark:bg-indigo-950 rounded-lg">
            <HouseHeart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">Scott & Sue&apos;s Calendar</h1>
        </div>

        <div className="flex items-center gap-3">
          {isGoogleConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 font-semibold">
              <GoogleLogo size="sm" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Linked</span>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              <GoogleLogo size="sm" />
              <span>Connect Google Calendar</span>
            </button>
          )}

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-700 shadow"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">{user.name}</span>
              <svg 
                className={`w-4 h-4 text-gray-500 dark:text-zinc-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 p-4 z-50 w-64 animate-scale-in origin-top-right">
                {/* Section 1: User Profile */}
                <div className="mb-3 pb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{user.email}</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 dark:bg-zinc-700 mb-3" />

                {/* Section 2: Event Color Selection */}
                <div className="mb-3 pb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">Event Colour</p>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          handleColorSave();
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          selectedColor === color ? 'border-gray-800 dark:border-zinc-200 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        title="Event colour"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        handleColorSave();
                      }}
                      className="w-7 h-7 rounded cursor-pointer border border-gray-300 dark:border-zinc-600"
                    />
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Custom</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 dark:bg-zinc-700 mb-3" />

                {/* Section 3: Theme & Sign Out */}
                <div className="space-y-1">
                  {mounted && (
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-sm text-gray-700 dark:text-zinc-200"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4 text-yellow-500" />
                          <span>Light Theme</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 text-gray-400" />
                          <span>Dark Theme</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition text-sm text-gray-700 dark:text-zinc-200 hover:text-red-700 dark:hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
