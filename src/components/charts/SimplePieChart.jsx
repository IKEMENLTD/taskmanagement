import React from 'react';

/**
 * シンプルな円グラフコンポーネント
 */
export const SimplePieChart = ({ data, darkMode = false, size = 200 }) => {
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${textSecondary}`} style={{ width: size, height: size }}>
        データがありません
      </div>
    );
  }

  // 合計値を計算
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${textSecondary}`} style={{ width: size, height: size }}>
        データがありません
      </div>
    );
  }

  // 各セグメントの角度を計算
  let currentAngle = 0;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    };
    currentAngle += angle;
    return segment;
  });

  // SVGパスを生成
  const generatePath = (startAngle, endAngle) => {
    const start = polarToCartesian(100, 100, 90, startAngle);
    const end = polarToCartesian(100, 100, 90, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M 100 100`,
      `L ${start.x} ${start.y}`,
      `A 90 90 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* 円グラフ */}
      <div style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={generatePath(segment.startAngle, segment.endAngle)}
              fill={segment.color || '#3b82f6'}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </svg>
      </div>

      {/* 凡例 */}
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: segment.color || '#3b82f6' }}
            ></div>
            <span className={`text-sm ${textColor}`}>
              {segment.label}
            </span>
            <span className={`text-sm ${textSecondary}`}>
              ({segment.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
