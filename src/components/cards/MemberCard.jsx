import React, { memo } from 'react';
import { User } from 'lucide-react';

// ヘルパー関数をコンポーネント外に定義（パフォーマンス向上）
const getLoadColor = (load, darkMode) => {
  if (load >= 85) return darkMode ? 'text-red-400' : 'text-red-500';
  if (load >= 70) return darkMode ? 'text-yellow-400' : 'text-yellow-500';
  return darkMode ? 'text-green-400' : 'text-green-500';
};

const getLoadBgColor = (load) => {
  if (load >= 85) return 'bg-red-500';
  if (load >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * チームメンバーカードコンポーネント（React.memoで最適化）
 * @param {Object} member - メンバーオブジェクト
 * @param {Function} onClick - クリックハンドラー
 * @param {boolean} darkMode - ダークモードフラグ
 */
const MemberCardComponent = ({ member, onClick, darkMode = false }) => {

  // アバターがURLかどうかを判定
  const isAvatarUrl = member.avatar && (member.avatar.startsWith('http://') || member.avatar.startsWith('https://'));

  // loadのデフォルト値
  const load = member.load || 0;
  const availability = member.availability || 'available';

  return (
    <div
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } rounded-xl p-6 border hover:shadow-lg transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">
            {isAvatarUrl ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span>{member.avatar || '👤'}</span>
            )}
          </div>
          <div>
            <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {member.name}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {member.role}
            </p>
          </div>
        </div>
        <div className={`text-2xl font-bold ${getLoadColor(load, darkMode)}`}>
          {load}%
        </div>
      </div>

      {/* 負荷率プログレスバー */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            負荷率
          </span>
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {load}%
          </span>
        </div>
        <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div
            className={`${getLoadBgColor(load)} h-2 rounded-full transition-all`}
            style={{ width: `${load}%` }}
          ></div>
        </div>
      </div>

      {/* 稼働状態 */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${availability === 'available'
          ? 'bg-green-500'
          : availability === 'busy'
            ? 'bg-red-500'
            : 'bg-yellow-500'
          }`}></div>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {availability === 'available' ? 'サポート可能' : '手いっぱい'}
        </span>
      </div>

      {/* スキル（オプション） */}
      {member.skills && member.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded ${darkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// React.memoでラップしてエクスポート（props が変更されない限り再レンダリングをスキップ）
export const MemberCard = memo(MemberCardComponent);
