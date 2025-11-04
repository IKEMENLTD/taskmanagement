import React, { memo } from 'react';

// カラークラスの定数（コンポーネント外に定義してパフォーマンス向上）
const COLOR_CLASSES = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  yellow: 'from-yellow-500 to-yellow-600'
};

/**
 * 統計情報カードコンポーネント（React.memoで最適化）
 * @param {string} title - カードのタイトル
 * @param {number|string} value - 表示する値
 * @param {string} unit - 単位（オプション）
 * @param {string} subtitle - サブタイトル（オプション）
 * @param {Component} icon - アイコンコンポーネント
 * @param {string} color - カラーテーマ（blue, green, purple, red, yellow）
 * @param {boolean} darkMode - ダークモードフラグ
 */
const StatsCardComponent = ({
  title,
  value,
  unit = '',
  subtitle = '',
  icon: Icon,
  color = 'blue',
  darkMode = false
}) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } rounded-xl p-6 border`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${COLOR_CLASSES[color]}`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <div className={`text-4xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
          {value}
        </div>
        {unit && (
          <div className="text-xl font-normal text-gray-500 mb-1">
            {unit}
          </div>
        )}
      </div>

      {subtitle && (
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

// React.memoでラップしてエクスポート（props が変更されない限り再レンダリングをスキップ）
export const StatsCard = memo(StatsCardComponent);
