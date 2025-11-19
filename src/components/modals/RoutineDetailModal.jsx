import React, { useState } from 'react';
import { Clock, CheckCircle, Target, User, Calendar, X, Edit, Trash2, History } from 'lucide-react';
import { getCategoryColor, getCategoryText } from '../../utils/colorUtils';

/**
 * 繰り返しテキストを取得
 */
const getRepeatText = (routine) => {
  if (routine.repeat === 'daily') return '毎日';
  if (routine.repeat === 'weekday') return '平日';
  if (routine.repeat === 'weekend') return '週末';

  // カスタム繰り返し: selected_days（スネークケース）も確認
  const selectedDays = routine.selectedDays || routine.selected_days;
  if (routine.repeat === 'custom' && selectedDays && selectedDays.length > 0) {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    // 文字列と数値の両方に対応
    return selectedDays.map(day => {
      const index = typeof day === 'string' ? parseInt(day, 10) : day;
      return dayNames[index];
    }).join('・');
  }
  return 'カスタム';
};

/**
 * ルーティン詳細モーダルコンポーネント
 * @param {Object} routine - ルーティンオブジェクト
 * @param {Function} onClose - モーダルを閉じるハンドラー
 * @param {Function} onToggle - 完了/未完了切り替えハンドラー
 * @param {Function} onEdit - 編集ハンドラー
 * @param {Function} onDelete - 削除ハンドラー
 * @param {Function} onUpdateRoutine - ルーティン更新ハンドラー
 * @param {Array} projects - プロジェクト一覧
 * @param {boolean} darkMode - ダークモードフラグ
 */
export const RoutineDetailModal = ({
  routine,
  onClose,
  onToggle,
  onEdit,
  onDelete,
  onUpdateRoutine,
  projects,
  darkMode = false
}) => {
  if (!routine) return null;

  // メモの状態管理
  const [notes, setNotes] = useState(routine.notes || '');

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const getProjectNameFromRoutine = (projectId) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : null;
  };

  const projectName = getProjectNameFromRoutine(routine.projectId);

  // Streak（連続達成日数）を計算
  const calculateStreak = () => {
    // completedDatesがない、または空配列の場合は0を返す
    if (!routine.completedDates || !Array.isArray(routine.completedDates) || routine.completedDates.length === 0) {
      return 0;
    }

    // 日付を降順にソート（新しい順）
    const sortedDates = [...routine.completedDates].sort((a, b) => new Date(b) - new Date(a));

    // 今日の日付
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 最新の完了日
    const latestCompletedDate = new Date(sortedDates[0]);
    latestCompletedDate.setHours(0, 0, 0, 0);

    // 最新の完了日が今日または昨日でなければ、streakは0
    const daysSinceLatest = Math.floor((today - latestCompletedDate) / (1000 * 60 * 60 * 24));
    if (daysSinceLatest > 1) {
      return 0;
    }

    // 今日または昨日から遡って連続日数を計算
    let streak = 0;
    let expectedDate = new Date(latestCompletedDate);

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);
      currentDate.setHours(0, 0, 0, 0);

      // 期待される日付と一致する場合
      if (currentDate.getTime() === expectedDate.getTime()) {
        streak++;
        // 次の期待日は1日前
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // 連続が途切れたら終了
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // メモを保存
  const handleSaveNotes = () => {
    if (onUpdateRoutine && notes !== routine.notes) {
      onUpdateRoutine({ ...routine, notes });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${cardBg} rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden border flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-2xl font-bold ${textColor}`}>{routine.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs text-white ${getCategoryColor(routine.category)}`}>
                  {getCategoryText(routine.category)}
                </span>
                {routine.completed && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                    ✓ 完了
                  </span>
                )}
              </div>
              <div className={`text-sm ${textSecondary} flex items-center gap-4 flex-wrap`}>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {routine.time} ({routine.duration}分)
                </span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {routine.assignee}
                </span>
                {projectName && (
                  <span className="flex items-center gap-1">
                    <Target size={14} />
                    {projectName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {getRepeatText(routine)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${textSecondary} hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 統計情報 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>達成状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-sm ${textSecondary} mb-1`}>連続達成日数</div>
                <div className="flex items-end gap-2">
                  <div className={`text-3xl font-bold ${textColor}`}>{streak}</div>
                  <div className="text-lg font-normal text-gray-500 mb-1">日</div>
                </div>
                <div className={`text-xs ${textSecondary} mt-1`}>
                  {streak > 0 ? `🔥 継続は力なり！` : '今日から始めよう！'}
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-sm ${textSecondary} mb-1`}>予定時間</div>
                <div className="flex items-end gap-2">
                  <div className={`text-3xl font-bold ${textColor}`}>{routine.duration}</div>
                  <div className="text-lg font-normal text-gray-500 mb-1">分</div>
                </div>
                <div className={`text-xs ${textSecondary} mt-1`}>
                  {routine.time}から開始
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`text-sm ${textSecondary} mb-1`}>繰り返し</div>
                <div className={`text-2xl font-bold ${textColor} mb-1`}>
                  {getRepeatText(routine)}
                </div>
                <div className={`text-xs ${textSecondary}`}>
                  {routine.repeat === 'daily' ? '毎日実行' :
                    routine.repeat === 'weekdays' ? '月〜金' :
                      routine.repeat === 'weekly' ? '週1回' : '不定期'}
                </div>
              </div>
            </div>
          </div>

          {/* 説明 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-semibold ${textColor}`}>詳細</h3>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1 transition-colors`}
                >
                  <Edit size={14} />
                  編集
                </button>
              )}
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <p className={`${textColor} leading-relaxed`}>{routine.description}</p>
            </div>
          </div>

          {/* プロジェクト紐付け */}
          {projectName && (
            <div>
              <h3 className={`text-lg font-semibold ${textColor} mb-3`}>プロジェクト</h3>
              <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg p-4 border-l-4 border-blue-500`}>
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-blue-500" />
                  <div>
                    <div className={`font-semibold ${textColor}`}>{projectName}</div>
                    <div className={`text-xs ${textSecondary} mt-1`}>
                      このルーティンはプロジェクトに紐づいています
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* メモ */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>メモ</h3>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <textarea
                placeholder="メモを追加..."
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                className={`w-full bg-transparent border-none focus:outline-none ${textColor} placeholder-gray-400 resize-none`}
              ></textarea>
              {notes !== routine.notes && (
                <div className="mt-2 text-xs text-blue-500">
                  変更があります。フォーカスを外すと自動保存されます。
                </div>
              )}
            </div>
          </div>

          {/* 最近の達成履歴 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-3`}>最近の達成履歴</h3>
            {/* 修正: completedDatesがundefinedの場合のチェック */}
            {(!routine.completedDates || routine.completedDates.length === 0) ? (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-8 text-center`}>
                <History className={`mx-auto mb-3 ${textSecondary}`} size={48} />
                <p className={textSecondary}>まだ達成履歴がありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {routine.completedDates.slice(0, 7).map((date, idx) => (
                  <div
                    key={idx}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-500" />
                      <span className={textColor}>{date}</span>
                    </div>
                    <span className={`text-xs ${textSecondary}`}>完了</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <div className="flex gap-2">
            {!routine.completed ? (
              <button
                onClick={() => {
                  onToggle(routine.id);
                  onClose();
                }}
                className={`${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all`}
              >
                <CheckCircle size={18} />
                完了にする
              </button>
            ) : (
              <button
                onClick={() => {
                  onToggle(routine.id);
                  onClose();
                }}
                className={`${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all`}
              >
                未完了に戻す
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className={`${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all`}
              >
                <Trash2 size={16} />
                削除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} py-2 rounded-lg transition-colors font-medium`}
            >
              閉じる
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2`}
              >
                <Edit size={16} />
                編集
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
