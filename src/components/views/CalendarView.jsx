import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import {
  generateMonthCalendar,
  generateWeekCalendar,
  getDateString,
  isToday,
  isWeekend,
  getEventsForDate,
  getMonthName,
  getWeekRange,
  getEventColor,
  sortEventsByPriority,
  navigateMonth,
  navigateWeek,
  getDayName
} from '../../utils/calendarUtils';

/**
 * カレンダービューコンポーネント
 */
export const CalendarView = ({
  projects,
  routineTasks,
  teamMembers,
  onTaskClick,
  onRoutineClick,
  darkMode = false
}) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // ビューモード
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // フィルター
  const [filterProject, setFilterProject] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  // 日付選択モーダル
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  // モーダル内フィルター
  const [modalFilterType, setModalFilterType] = useState('all'); // all, task, routine
  const [modalFilterProject, setModalFilterProject] = useState('all');
  const [modalFilterMember, setModalFilterMember] = useState('all');

  // カレンダーデータを生成
  const calendarData = useMemo(() => {
    if (viewMode === 'month') {
      return generateMonthCalendar(selectedYear, selectedMonth);
    } else {
      return [generateWeekCalendar(currentDate)];
    }
  }, [viewMode, selectedYear, selectedMonth, currentDate]);

  // フィルター済みプロジェクト
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (filterProject !== 'all' && project.id !== parseInt(filterProject)) {
        return false;
      }
      if (filterMember !== 'all') {
        return project.team.includes(filterMember);
      }
      return true;
    });
  }, [projects, filterProject, filterMember]);

  // 各日付のイベントを取得
  const getDateEvents = (date) => {
    const events = getEventsForDate(date, filteredProjects, routineTasks);

    // メンバーフィルター適用
    if (filterMember !== 'all') {
      return events.filter(event => {
        if (event.type === 'task') {
          return event.assignee === filterMember;
        } else if (event.type === 'routine') {
          return event.assignee === filterMember || event.assignee === undefined;
        }
        return true;
      });
    }

    return sortEventsByPriority(events);
  };

  // ナビゲーション
  const handleNavigate = (direction) => {
    if (viewMode === 'month') {
      const newDate = navigateMonth(selectedYear, selectedMonth, direction);
      setSelectedYear(newDate.year);
      setSelectedMonth(newDate.month);
    } else {
      const newDate = navigateWeek(currentDate, direction);
      setCurrentDate(newDate);
      setSelectedYear(newDate.getFullYear());
      setSelectedMonth(newDate.getMonth());
    }
  };

  // 今日に戻る
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // イベントクリックハンドラー
  const handleEventClick = (event, e) => {
    e.stopPropagation(); // 日付クリックイベントの伝播を防ぐ
    if (event.type === 'task') {
      onTaskClick(event);
    } else if (event.type === 'routine' && onRoutineClick) {
      onRoutineClick(event);
    }
  };

  // 日付セルクリックハンドラー
  const handleDateClick = (date, events) => {
    setSelectedDate(date);
    setSelectedDateEvents(events);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setSelectedDate(null);
    setSelectedDateEvents([]);
    // フィルターをリセット
    setModalFilterType('all');
    setModalFilterProject('all');
    setModalFilterMember('all');
  };

  // モーダル内のイベントをフィルタリング
  const filteredModalEvents = useMemo(() => {
    let filtered = [...selectedDateEvents];

    // タイプフィルター
    if (modalFilterType !== 'all') {
      filtered = filtered.filter(event => event.type === modalFilterType);
    }

    // プロジェクトフィルター（タスクのみ）
    if (modalFilterProject !== 'all') {
      filtered = filtered.filter(event =>
        event.type !== 'task' || event.projectName === modalFilterProject
      );
    }

    // 担当者フィルター
    if (modalFilterMember !== 'all') {
      filtered = filtered.filter(event => event.assignee === modalFilterMember);
    }

    return filtered;
  }, [selectedDateEvents, modalFilterType, modalFilterProject, modalFilterMember]);

  // 表示タイトル
  const displayTitle = useMemo(() => {
    if (viewMode === 'month') {
      return getMonthName(selectedYear, selectedMonth);
    } else {
      const range = getWeekRange(currentDate);
      return `${range.start} ~ ${range.end}`;
    }
  }, [viewMode, selectedYear, selectedMonth, currentDate]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textColor}`}>カレンダー</h2>
          <p className={`${textSecondary} mt-1`}>プロジェクトとルーティンのスケジュールを表示</p>
        </div>
      </div>

      {/* コントロールパネル */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          {/* 表示モード選択 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'month'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
            >
              月表示
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'week'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
            >
              週表示
            </button>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigate('prev')}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
            >
              <ChevronLeft size={20} />
            </button>
            <div className={`px-4 py-2 ${textColor} font-semibold min-w-[200px] text-center`}>
              {displayTitle}
            </div>
            <button
              onClick={() => handleNavigate('next')}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
            >
              今日
            </button>
          </div>

          {/* フィルター */}
          <div className="flex items-center gap-2">
            <Filter size={18} className={textSecondary} />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
            >
              <option value="all">全プロジェクト</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
            >
              <option value="all">全メンバー</option>
              {teamMembers.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className={`${cardBg} rounded-xl border overflow-hidden`}>
        {/* 曜日ヘッダー */}
        <div className={`grid grid-cols-7 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
            <div
              key={dayIndex}
              className={`p-3 text-center font-semibold ${
                dayIndex === 0 ? 'text-red-500' : dayIndex === 6 ? 'text-blue-500' : textColor
              }`}
            >
              {getDayName(dayIndex)}
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div>
          {calendarData.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className={`grid grid-cols-7 ${weekIndex < calendarData.length - 1 ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}`}
            >
              {week.map((dayData, dayIndex) => {
                const dateStr = getDateString(dayData.date);
                const events = getDateEvents(dayData.date);
                const today = isToday(dayData.date);
                const weekend = isWeekend(dayData.date);

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] p-2 border-r cursor-pointer ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${
                      !dayData.isCurrentMonth ? (darkMode ? 'bg-gray-900' : 'bg-gray-50') : ''
                    } ${weekend && dayData.isCurrentMonth ? (darkMode ? 'bg-gray-800' : 'bg-blue-50') : ''} ${
                      today ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-100') : ''
                    } hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
                    onClick={() => handleDateClick(dayData.date, events)}
                  >
                    {/* 日付 */}
                    <div className={`text-sm font-semibold mb-2 ${
                      today ? 'text-blue-600 dark:text-blue-400' :
                      !dayData.isCurrentMonth ? textSecondary :
                      weekend ? (dayIndex === 0 ? 'text-red-500' : 'text-blue-500') : textColor
                    }`}>
                      {dayData.date.getDate()}
                    </div>

                    {/* イベント一覧 */}
                    <div className="space-y-1">
                      {events.slice(0, 3).map((event, eventIndex) => (
                        <button
                          key={eventIndex}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`w-full text-left px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-all`}
                          style={{
                            backgroundColor: getEventColor(event),
                            color: 'white'
                          }}
                          title={event.name || event.title}
                        >
                          {event.type === 'routine' && '📋 '}
                          {event.type === 'task' && '✓ '}
                          {event.name || event.title}
                        </button>
                      ))}
                      {events.length > 3 && (
                        <div className={`text-xs ${textSecondary} px-2`}>
                          +{events.length - 3} 件
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className={textSecondary}>タスク</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className={textSecondary}>完了済みルーティン</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className={textSecondary}>未完了ルーティン</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}></div>
            <span className={textSecondary}>今日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}></div>
            <span className={textSecondary}>週末</span>
          </div>
        </div>
      </div>

      {/* イベントがない場合 */}
      {filteredProjects.length === 0 && (
        <div className={`${cardBg} rounded-xl p-12 border text-center`}>
          <Calendar size={48} className={`mx-auto mb-4 ${textSecondary}`} />
          <p className={`${textColor} text-lg font-semibold mb-2`}>表示するデータがありません</p>
          <p className={textSecondary}>プロジェクトやタスクを追加してください</p>
        </div>
      )}

      {/* 日付詳細モーダル */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div
            className={`${cardBg} rounded-xl border shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-lg font-bold ${textColor}`}>
                  {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
                  ({getDayName(selectedDate.getDay())})
                </h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  {filteredModalEvents.length}件のイベント
                  {filteredModalEvents.length !== selectedDateEvents.length && (
                    <span className="ml-1">（全{selectedDateEvents.length}件）</span>
                  )}
                </p>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X size={20} />
              </button>
            </div>

            {/* フィルター */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-opacity-50`}>
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={16} className={textSecondary} />

                {/* タイプフィルター */}
                <select
                  value={modalFilterType}
                  onChange={(e) => setModalFilterType(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
                >
                  <option value="all">全タイプ</option>
                  <option value="task">タスクのみ</option>
                  <option value="routine">ルーティンのみ</option>
                </select>

                {/* プロジェクトフィルター */}
                <select
                  value={modalFilterProject}
                  onChange={(e) => setModalFilterProject(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
                >
                  <option value="all">全プロジェクト</option>
                  {[...new Set(selectedDateEvents
                    .filter(e => e.type === 'task' && e.projectName)
                    .map(e => e.projectName)
                  )].map(projectName => (
                    <option key={projectName} value={projectName}>{projectName}</option>
                  ))}
                </select>

                {/* 担当者フィルター */}
                <select
                  value={modalFilterMember}
                  onChange={(e) => setModalFilterMember(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
                >
                  <option value="all">全担当者</option>
                  {[...new Set(selectedDateEvents
                    .filter(e => e.assignee)
                    .map(e => e.assignee)
                  )].map(assignee => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>

                {/* フィルターリセットボタン */}
                {(modalFilterType !== 'all' || modalFilterProject !== 'all' || modalFilterMember !== 'all') && (
                  <button
                    onClick={() => {
                      setModalFilterType('all');
                      setModalFilterProject('all');
                      setModalFilterMember('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor} transition-colors`}
                  >
                    リセット
                  </button>
                )}
              </div>
            </div>

            {/* モーダルボディ */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-160px)]">
              {filteredModalEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className={`mx-auto mb-4 ${textSecondary}`} />
                  <p className={`${textSecondary}`}>
                    {selectedDateEvents.length === 0
                      ? 'この日にイベントはありません'
                      : 'フィルター条件に一致するイベントがありません'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredModalEvents.map((event, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleEventClick(event, e)}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                        darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* カラーインジケーター */}
                        <div
                          className="w-1 h-full rounded-full flex-shrink-0 mt-1"
                          style={{
                            backgroundColor: getEventColor(event),
                            minHeight: '40px'
                          }}
                        ></div>

                        {/* イベント情報 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">
                              {event.type === 'routine' && '📋'}
                              {event.type === 'task' && '✓'}
                            </span>
                            <h4 className={`font-semibold ${textColor} truncate`}>
                              {event.name || event.title}
                            </h4>
                          </div>

                          {/* プロジェクト名（タスクの場合） */}
                          {event.type === 'task' && event.projectName && (
                            <p className={`text-sm ${textSecondary} mb-1`}>
                              📁 {event.projectName}
                            </p>
                          )}

                          {/* 担当者 */}
                          {event.assignee && (
                            <p className={`text-sm ${textSecondary} mb-1`}>
                              👤 {event.assignee}
                            </p>
                          )}

                          {/* ルーティンの時刻 */}
                          {event.type === 'routine' && event.time && (
                            <p className={`text-sm ${textSecondary}`}>
                              🕐 {event.time}
                            </p>
                          )}

                          {/* タスクの優先度 */}
                          {event.type === 'task' && event.priority && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                              event.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              event.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                              event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {event.priority === 'urgent' && '🔴 緊急'}
                              {event.priority === 'high' && '🟠 高'}
                              {event.priority === 'medium' && '🟡 中'}
                              {event.priority === 'low' && '🟢 低'}
                            </span>
                          )}

                          {/* ルーティンの完了状態 */}
                          {event.type === 'routine' && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                              event.completed
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                              {event.completed ? '✓ 完了' : '○ 未完了'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
