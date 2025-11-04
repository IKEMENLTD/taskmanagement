import React from 'react';
import { Menu, Settings, Moon, Sun } from 'lucide-react';

/**
 * モバイル用ヘッダー
 */
export const MobileHeader = ({
  title,
  onMenuClick,
  onSettingsClick,
  darkMode,
  onDarkModeToggle
}) => {
  return (
    <header
      className={`sticky top-0 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b shadow-sm z-40`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* 左側：メニューボタン */}
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-lg ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          } transition-colors`}
        >
          <Menu size={24} className={darkMode ? 'text-gray-100' : 'text-gray-900'} />
        </button>

        {/* 中央：タイトル */}
        <h1 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {title}
        </h1>

        {/* 右側：アクション */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDarkModeToggle}
            className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors`}
          >
            {darkMode ? (
              <Sun size={20} className="text-gray-100" />
            ) : (
              <Moon size={20} className="text-gray-900" />
            )}
          </button>
          <button
            onClick={onSettingsClick}
            className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors`}
          >
            <Settings size={20} className={darkMode ? 'text-gray-100' : 'text-gray-900'} />
          </button>
        </div>
      </div>
    </header>
  );
};
