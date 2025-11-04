import React, { useState, useMemo } from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, GitBranch } from 'lucide-react';
import {
  generateDateRange,
  calculateTaskPosition,
  calculateTodayPosition,
  formatDateForGantt,
  getViewRange,
  isTaskDelayed,
  getProjectDateRange,
  isWeekend,
  isToday
} from '../../utils/ganttUtils';
import { getAllTasksFromProjects } from '../../utils/dependencyUtils';

/**
 * ガントチャートビューコンポーネント
 */
export const GanttChartView = ({ projects, onTaskClick, teamMembers, darkMode = false }) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // 表示モード
  const [viewMode, setViewMode] = useState('month'); // week, month, quarter, year
  const [baseDate, setBaseDate] = useState(new Date());

  // フィルター
  const [filterProject, setFilterProject] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  // 依存関係表示切り替え
  const [showDependencies, setShowDependencies] = useState(true);

  // 表示範囲を取得
  const { startDate, endDate } = useMemo(() => {
    return getViewRange(viewMode, baseDate);
  }, [viewMode, baseDate]);

  // 日付範囲を生成
  const dateRange = useMemo(() => {
    return generateDateRange(startDate, endDate, viewMode);
  }, [startDate, endDate, viewMode]);

  // フィルター済みプロジェクトとタスク
  const filteredData = useMemo(() => {
    return projects
      .filter(project => filterProject === 'all' || project.id === parseInt(filterProject))
      .map(project => {
        const filteredTasks = (project.tasks || []).filter(task => {
          if (filterMember === 'all') return true;
          return task.assignee === filterMember;
        });

        return {
          ...project,
          tasks: filteredTasks
        };
      })
      .filter(project => project.tasks.length > 0 || filterProject !== 'all');
  }, [projects, filterProject, filterMember]);

  // 期間を移動
  const navigatePeriod = (direction) => {
    const newDate = new Date(baseDate);

    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'quarter') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }

    setBaseDate(newDate);
  };

  // 今日に戻る
  const goToToday = () => {
    setBaseDate(new Date());
  };

  // 今日の位置
  const todayPosition = calculateTodayPosition(startDate, endDate, 100);

  // チャートの幅
  const CHART_WIDTH = 100; // パーセント

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textColor}`}>ガントチャート</h2>
          <p className={`${textSecondary} mt-1`}>プロジェクトとタスクのタイムラインを表示</p>
        </div>
      </div>

      {/* コントロールパネル */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          {/* 表示モード選択 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'week'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
            >
              週
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'month'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('quarter')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'quarter'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
            >
              四半期
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                viewMode === 'year'
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
            >
              年
            </button>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigatePeriod('prev')}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
            >
              今日
            </button>
            <button
              onClick={() => navigatePeriod('next')}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
            >
              <ChevronRight size={20} />
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
            <button
              onClick={() => setShowDependencies(!showDependencies)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                showDependencies
                  ? 'bg-blue-500 text-white'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
              title="依存関係を表示/非表示"
            >
              <GitBranch size={16} />
              依存関係
            </button>
          </div>
        </div>
      </div>

      {/* ガントチャート */}
      <div className={`${cardBg} rounded-xl border overflow-hidden`}>
        <div className="overflow-x-auto">
          <div style={{ minWidth: '800px' }}>
            {/* タイムラインヘッダー */}
            <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${cardBg} z-10`}>
              <div className="flex">
                {/* プロジェクト名列 */}
                <div className={`w-64 p-4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} font-semibold ${textColor}`}>
                  プロジェクト / タスク
                </div>

                {/* 日付列 */}
                <div className="flex-1 flex">
                  {dateRange.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-1 p-2 text-center text-xs border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${
                        isToday(date) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                      } ${isWeekend(date) ? (darkMode ? 'bg-gray-700' : 'bg-gray-50') : ''} ${textSecondary}`}
                      style={{ minWidth: '40px' }}
                    >
                      {formatDateForGantt(date, viewMode)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* チャートボディ */}
            <div className="relative">
              {filteredData.map((project, projectIndex) => (
                <div key={project.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  {/* プロジェクト行 */}
                  <div className="flex items-center hover:bg-opacity-50 transition-colors">
                    <div className={`w-64 p-4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${textColor} font-semibold`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        {project.name}
                      </div>
                      <div className={`text-xs ${textSecondary} mt-1`}>
                        {project.progress}% 完了
                      </div>
                    </div>

                    <div className="flex-1 relative" style={{ height: '60px' }}>
                      {/* 今日のライン */}
                      {todayPosition !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{ left: `${todayPosition}%` }}
                        ></div>
                      )}

                      {/* プロジェクトバー */}
                      {(() => {
                        const position = calculateTaskPosition(
                          { startDate: project.timeline.start, dueDate: project.timeline.end },
                          startDate,
                          endDate,
                          CHART_WIDTH
                        );

                        return (
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 h-8 rounded flex items-center justify-center text-white text-xs font-semibold shadow-lg"
                            style={{
                              left: `${position.left}%`,
                              width: `${position.width}%`,
                              backgroundColor: project.color,
                              opacity: 0.8
                            }}
                          >
                            {position.width > 10 && `${project.progress}%`}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* タスク行 */}
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                      onClick={() => onTaskClick({ ...task, projectName: project.name, projectId: project.id })}
                    >
                      <div className={`w-64 p-3 pl-8 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${textColor} text-sm`}>
                        <div className="truncate">{task.name}</div>
                        <div className={`text-xs ${textSecondary} mt-1`}>
                          {task.assignee}
                        </div>
                      </div>

                      <div className="flex-1 relative" style={{ height: '50px' }}>
                        {/* 今日のライン */}
                        {todayPosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-30"
                            style={{ left: `${todayPosition}%` }}
                          ></div>
                        )}

                        {/* タスクバー */}
                        {(() => {
                          const position = calculateTaskPosition(task, startDate, endDate, CHART_WIDTH);
                          const delayed = isTaskDelayed(task);

                          return (
                            <div
                              className="absolute top-1/2 transform -translate-y-1/2 h-6 rounded flex items-center justify-between px-2 text-white text-xs shadow"
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                backgroundColor: delayed ? '#ef4444' : project.color,
                                opacity: task.status === 'completed' ? 0.5 : 0.9
                              }}
                            >
                              {position.width > 15 && (
                                <>
                                  <span>{task.progress}%</span>
                                  {delayed && <span className="text-xs">⚠️</span>}
                                </>
                              )}

                              {/* 進捗バー */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-white opacity-20 rounded"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* 依存関係の矢印（SVGレイヤー） */}
              {showDependencies && (() => {
                const allTasks = getAllTasksFromProjects(projects);
                const arrows = [];
                let currentY = 60; // プロジェクト行の高さ

                filteredData.forEach((project) => {
                  currentY += 60; // プロジェクト行をスキップ

                  project.tasks.forEach((task, taskIndex) => {
                    if (task.dependencies && task.dependencies.length > 0) {
                      task.dependencies.forEach(depId => {
                        const depTask = allTasks.find(t => t.id === depId);
                        if (depTask) {
                          // 依存元タスクの位置を探す
                          let depY = 60;
                          let found = false;

                          filteredData.forEach((proj) => {
                            if (found) return;
                            depY += 60; // プロジェクト行

                            proj.tasks.forEach((t) => {
                              if (found) return;
                              if (t.id === depId) {
                                found = true;
                                return;
                              }
                              depY += 50; // タスク行
                            });

                            if (!found) {
                              // このプロジェクトにはなかった、次のプロジェクトへ
                            }
                          });

                          if (found) {
                            const fromPos = calculateTaskPosition(depTask, startDate, endDate, 100);
                            const toPos = calculateTaskPosition(task, startDate, endDate, 100);

                            arrows.push({
                              key: `${depId}-${task.id}`,
                              fromX: fromPos.left + fromPos.width,
                              fromY: depY,
                              toX: toPos.left,
                              toY: currentY + (taskIndex * 50),
                              color: darkMode ? '#60a5fa' : '#3b82f6'
                            });
                          }
                        }
                      });
                    }
                  });

                  currentY += project.tasks.length * 50;
                });

                if (arrows.length === 0) return null;

                return (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      zIndex: 5
                    }}
                  >
                    {arrows.map(arrow => {
                      // 矢印のパスを生成
                      const midX = (arrow.fromX + arrow.toX) / 2;
                      const path = `M ${arrow.fromX + 256}% ${arrow.fromY + 25}
                                    L ${midX + 256}% ${arrow.fromY + 25}
                                    L ${midX + 256}% ${arrow.toY + 25}
                                    L ${arrow.toX + 256}% ${arrow.toY + 25}`;

                      return (
                        <g key={arrow.key}>
                          {/* 矢印のライン */}
                          <path
                            d={path}
                            stroke={arrow.color}
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray="4,4"
                            opacity="0.6"
                          />
                          {/* 矢印のヘッド */}
                          <polygon
                            points={`${arrow.toX + 256},${arrow.toY + 25} ${arrow.toX + 256 - 6},${arrow.toY + 25 - 4} ${arrow.toX + 256 - 6},${arrow.toY + 25 + 4}`}
                            fill={arrow.color}
                            opacity="0.6"
                          />
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className={textSecondary}>進行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className={textSecondary}>遅延</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded opacity-50"></div>
            <span className={textSecondary}>完了</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500"></div>
            <span className={textSecondary}>今日</span>
          </div>
        </div>
      </div>

      {/* データがない場合 */}
      {filteredData.length === 0 && (
        <div className={`${cardBg} rounded-xl p-12 border text-center`}>
          <Calendar size={48} className={`mx-auto mb-4 ${textSecondary}`} />
          <p className={`${textColor} text-lg font-semibold mb-2`}>表示するデータがありません</p>
          <p className={textSecondary}>プロジェクトやタスクを追加してください</p>
        </div>
      )}
    </div>
  );
};
