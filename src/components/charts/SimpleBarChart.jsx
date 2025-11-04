import React from 'react';

/**
 * シンプルなバーチャートコンポーネント
 */
export const SimpleBarChart = ({ data, darkMode = false, height = 200 }) => {
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const gridColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${textSecondary}`} style={{ height }}>
        データがありません
      </div>
    );
  }

  // 最大値を取得
  const maxValue = Math.max(...data.map(d => d.value || 0));

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              {/* バー */}
              <div className="w-full flex flex-col justify-end items-center" style={{ height: '100%' }}>
                <div className={`text-xs font-semibold ${textColor} mb-1`}>
                  {item.value}
                </div>
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: item.color || '#3b82f6',
                    minHeight: item.value > 0 ? '10px' : '0'
                  }}
                ></div>
              </div>

              {/* ラベル */}
              <div className={`text-xs ${textSecondary} text-center`}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* グリッドライン */}
      <div className={`border-t ${gridColor}`}></div>
    </div>
  );
};
