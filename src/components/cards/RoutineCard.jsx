import React, { memo } from 'react';
import { Clock, CheckCircle, Target, GripVertical, XCircle } from 'lucide-react';
import { getCategoryColor, getCategoryText } from '../../utils/colorUtils';

/**
 * ルーティンタスクカードコンポーネント（React.memoで最適化）
 * @param {Object} routine - ルーティンオブジェクト
 * @param {Function} onToggle - 完了/未完了切り替えハンドラー
 * @param {Function} onSkip - スキップハンドラー
 * @param {Function} onClick - クリックハンドラー
 * @param {boolean} showAssignee - 担当者名を表示するか
 * @param {boolean} darkMode - ダークモードフラグ
 * @param {Object} draggableProps - ドラッグ用のprops（オプション）
 * @param {string} dropZoneStyle - ドロップゾーンのスタイル（オプション）
 * @param {boolean} isDraggable - ドラッグ可能かどうか（デフォルト: false）
 */
const RoutineCardComponent = ({
  routine,
  onToggle,
  onSkip,
  onClick,
  showAssignee = false,
  darkMode = false,
  draggableProps = {},
  dropZoneStyle = '',
  isDraggable = false
}) => {
  // ステータスに応じたスタイル
  const isCompleted = routine.completed || routine.status === 'completed';
  const isSkipped = routine.status === 'skipped';
  const isPending = !isCompleted && !isSkipped;
  return (
    <div
      className={`${
        isSkipped
          ? darkMode ? 'bg-gray-800 opacity-60' : 'bg-gray-100 opacity-70'
          : darkMode ? 'bg-gray-700' : 'bg-gray-50'
      } rounded-lg p-3 hover:bg-opacity-80 transition-all cursor-pointer border-2 border-transparent ${dropZoneStyle}`}
      onClick={onClick}
      {...draggableProps}
    >
      <div className="flex items-center gap-3">
        {isDraggable && (
          <GripVertical
            size={18}
            className={`flex-shrink-0 cursor-move ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
          />
        )}

        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggle(routine.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={isSkipped}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${
              isCompleted
                ? 'line-through text-gray-400'
                : isSkipped
                ? 'line-through text-gray-500'
                : darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {routine.name}
            </span>

            <span className={`px-2 py-0.5 rounded text-xs text-white ${getCategoryColor(routine.category)}`}>
              {getCategoryText(routine.category)}
            </span>

            {isSkipped && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-500 text-white">
                スキップ
              </span>
            )}

            {showAssignee && (
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                - {routine.assignee}
              </span>
            )}
          </div>

          <div className={`text-xs mt-1 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            <Clock size={12} />
            <span>{routine.time}</span>
            <span>•</span>
            <span>{routine.duration}分</span>
            {routine.streak && (
              <>
                <span>•</span>
                <span>🔥 {routine.streak}日連続</span>
              </>
            )}
            {routine.projectId && (
              <>
                <span>•</span>
                <Target size={12} />
                <span>プロジェクト紐付き</span>
              </>
            )}
            {isSkipped && routine.skip_reason && (
              <>
                <span>•</span>
                <span className="italic">{routine.skip_reason}</span>
              </>
            )}
          </div>
        </div>

        {isCompleted && !isSkipped && (
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
        )}

        {isSkipped && (
          <XCircle size={18} className="text-gray-500 flex-shrink-0" />
        )}

        {isPending && onSkip && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkip(routine.id);
            }}
            className={`px-3 py-1 rounded text-xs ${
              darkMode
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } transition-colors flex-shrink-0`}
            title="このタスクをスキップ"
          >
            スキップ
          </button>
        )}
      </div>
    </div>
  );
};

// React.memoでラップしてエクスポート（props が変更されない限り再レンダリングをスキップ）
export const RoutineCard = memo(RoutineCardComponent);
