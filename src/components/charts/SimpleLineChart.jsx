import React from 'react';

/**
 * シンプルなラインチャートコンポーネント
 */
export const SimpleLineChart = ({ data, darkMode = false, height = 200 }) => {
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${textSecondary}`} style={{ height }}>
        データがありません
      </div>
    );
  }

  // 最大値・最小値を取得
  const values = data.map(d => d.value || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // SVGパスを生成
  const width = 100; // percentage
  const padding = 10;
  const pointWidth = (width - padding * 2) / (data.length - 1 || 1);

  const points = data.map((item, index) => {
    const x = padding + index * pointWidth;
    const y = 100 - padding - ((item.value - minValue) / range) * (100 - padding * 2);
    return { x, y, ...item };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // グリッドライン（5本）
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (range * i) / 4;
    const y = 100 - padding - ((value - minValue) / range) * (100 - padding * 2);
    return { y, value };
  });

  return (
    <div className="space-y-4">
      {/* チャート */}
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* グリッドライン */}
          {gridLines.map((line, i) => (
            <line
              key={i}
              x1={padding}
              y1={line.y}
              x2={100 - padding}
              y2={line.y}
              stroke={gridColor}
              strokeWidth="0.2"
              strokeDasharray="1,1"
            />
          ))}

          {/* ライン */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* エリア塗りつぶし */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`}
            fill="#3b82f6"
            opacity="0.1"
          />

          {/* ポイント */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill="#3b82f6"
                className="hover:r-2 transition-all cursor-pointer"
              />
              {/* ツールチップ用の大きな透明円 */}
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="transparent"
                className="cursor-pointer"
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
            </g>
          ))}
        </svg>

        {/* Y軸ラベル */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between" style={{ width: '40px' }}>
          {gridLines.reverse().map((line, i) => (
            <div key={i} className={`text-xs ${textSecondary} text-right pr-2`}>
              {Math.round(line.value)}
            </div>
          ))}
        </div>
      </div>

      {/* X軸ラベル */}
      <div className="flex justify-between px-10">
        {data.map((item, index) => {
          // ラベルが多い場合は間引く
          const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
          return (
            <div
              key={index}
              className={`text-xs ${textSecondary} ${showLabel ? '' : 'invisible'}`}
              style={{ flex: 1, textAlign: 'center' }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
