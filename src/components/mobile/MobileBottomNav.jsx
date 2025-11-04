import React from 'react';
import { List, BarChart3, Calendar, Users, CheckSquare, Home } from 'lucide-react';

/**
 * モバイル用ボトムナビゲーション
 */
export const MobileBottomNav = ({ activeView, onViewChange, darkMode = false }) => {
  const navItems = [
    { id: 'timeline', label: 'プロジェクト', icon: List },
    { id: 'gantt', label: 'ガント', icon: BarChart3 },
    { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'routine', label: 'ルーティン', icon: CheckSquare },
    { id: 'statistics', label: '統計', icon: BarChart3 }
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-t shadow-lg z-50 safe-area-inset-bottom`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-[60px] ${
                isActive
                  ? darkMode
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'bg-blue-100 text-blue-600'
                  : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
