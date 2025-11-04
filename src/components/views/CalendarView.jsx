import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
  const handleEventClick = (event) => {
    if (event.type === 'task') {
      onTaskClick(event);
    } else if (event.type === 'routine' && onRoutineClick) {
      onRoutineClick(event);
    }
  };

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
                    className={`min-h-[120px] p-2 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${
                      !dayData.isCurrentMonth ? (darkMode ? 'bg-gray-900' : 'bg-gray-50') : ''
                    } ${weekend && dayData.isCurrentMonth ? (darkMode ? 'bg-gray-800' : 'bg-blue-50') : ''} ${
                      today ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-100') : ''
                    } hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
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
                          onClick={() => handleEventClick(event)}
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
    </div>
  );
};
