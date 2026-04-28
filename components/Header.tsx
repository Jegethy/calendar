'use client';

import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
  user: User;
  onColorChange: (color: string) => void;
}

export default function Header({ user, onColorChange }: HeaderProps) {
  const router = useRouter();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(user.color);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleColorSave = async () => {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: selectedColor }),
      });
      onColorChange(selectedColor);
      setShowColorPicker(false);
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  const presetColors = [
    '#3b82f6', '#ec4899', '#10b981', '#f59e0b',
    '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-indigo-100 rounded-lg">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Shared Calendar</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 w-56">
                <p className="text-xs font-medium text-gray-500 mb-3">Your Event Color</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  />
                  <span className="text-xs text-gray-500">Custom color</span>
                </div>
                <button
                  onClick={handleColorSave}
                  className="w-full bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700 transition"
                >
                  Save Color
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
