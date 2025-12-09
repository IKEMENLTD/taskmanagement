import React, { memo } from 'react';
import { User, Briefcase, CheckSquare, RotateCcw, AlertTriangle } from 'lucide-react';
import { getLoadColor, getLoadBgColor, getLoadLabel } from '../../utils/workloadUtils';

/**
 * チームメンバーカードコンポーネント（React.memoで最適化）
 * @param {Object} member - メンバーオブジェクト
 * @param {Object} workload - 負荷情報（workloadUtils.calculateMemberWorkloadの結果）
 * @param {Function} onClick - クリックハンドラー
 * @param {boolean} darkMode - ダークモードフラグ
 */
const MemberCardComponent = ({ member, workload, onClick, darkMode = false }) => {

  // アバターがURLかどうかを判定
  const isAvatarUrl = member.avatar && (member.avatar.startsWith('http://') || member.avatar.startsWith('https://'));

  // 負荷情報を取得（workloadがあれば自動計算値、なければ手動値）
  const load = workload?.load ?? member.load ?? 0;
  const availability = workload?.availability ?? member.availability ?? 'available';

  // 担当数
  const projectCount = workload?.projectCount ?? 0;
  const taskCount = workload?.taskCount ?? 0;
  const routineCount = workload?.routineCount ?? 0;
  const overdueCount = workload?.overdueTasks?.length ?? 0;

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
        <div className="text-right">
          <div className={`text-2xl font-bold ${getLoadColor(load, darkMode)}`}>
            {load}%
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getLoadLabel(load)}
          </div>
        </div>
      </div>

      {/* 担当数サマリー */}
      <div className={`grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Briefcase size={12} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
            <span className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {projectCount}
            </span>
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            PJ
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckSquare size={12} className={darkMode ? 'text-green-400' : 'text-green-500'} />
            <span className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {taskCount}
            </span>
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            タスク
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <RotateCcw size={12} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
            <span className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {routineCount}
            </span>
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ルーティン
          </div>
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
            style={{ width: `${Math.min(load, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* 警告表示（期限切れタスクがある場合） */}
      {overdueCount > 0 && (
        <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
          <AlertTriangle size={14} className="text-red-500" />
          <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            期限切れタスク: {overdueCount}件
          </span>
        </div>
      )}

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
