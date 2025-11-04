import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Moon, Sun, Menu, X, Settings } from 'lucide-react';

// データとユーティリティのインポート
import { sampleProjects } from '../data/sampleProjects';
import { sampleTeamMembers } from '../data/sampleTeam';
import { sampleRoutines } from '../data/sampleRoutines';
import { useRoutines } from '../hooks/useRoutines';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotifications } from '../hooks/useNotifications';
import { defaultNotificationSettings } from '../utils/notificationUtils';
import { isMobileBrowser } from '../utils/deviceUtils';

// コンポーネントのインポート
import { TimelineView } from './views/TimelineView';
import { TeamView } from './views/TeamView';
import { RoutineView } from './views/RoutineView';
import { DailyReportView } from './views/DailyReportView';
import { GanttChartView } from './views/GanttChartView';
import { CalendarView } from './views/CalendarView';
import { StatisticsView } from './views/StatisticsView';
import { TaskDetailModal } from './modals/TaskDetailModal';
import { SettingsPanel } from './layout/SettingsPanel';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileHeader } from './mobile/MobileHeader';
import { MobileSidebar } from './mobile/MobileSidebar';
import { GlobalSearch } from './search/GlobalSearch';
import { OnboardingTour } from './onboarding/OnboardingTour';
import { shouldShowOnboarding } from '../utils/onboardingUtils';
import { KeyboardShortcutsHelp } from './help/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLineNotifyScheduler } from '../hooks/useLineNotifyScheduler';

/**
 * メインダッシュボードコンポーネント
 */
const Dashboard = () => {
  // 時刻管理
  const [currentTime, setCurrentTime] = useState(new Date());

  // ビュー管理（LocalStorage対応）
  const [selectedView, setSelectedView] = useLocalStorage('selectedView', 'routine');
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true);

  // モバイル対応
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // フィルター（各ビュー内で管理）

  // モーダル管理
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);

  // ルーティン管理（LocalStorage対応）
  const [routineViewMode, setRoutineViewMode] = useLocalStorage('routineViewMode', 'team');

  // データ（LocalStorage対応）
  const [projects, setProjects] = useLocalStorage('projects', sampleProjects);
  const [teamMembers, setTeamMembers] = useLocalStorage('teamMembers', sampleTeamMembers);
  const [routineCategories, setRoutineCategories] = useLocalStorage('routineCategories', []);

  // 通知設定（LocalStorage対応）
  const [notificationSettings, setNotificationSettings] = useLocalStorage('notificationSettings', defaultNotificationSettings);

  // オンボーディング状態
  const [showOnboarding, setShowOnboarding] = useState(false);

  // キーボードショートカットヘルプ
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // カスタムフックでルーティン管理
  const {
    routineTasks,
    setRoutineTasks,
    getTodayRoutines,
    getRoutineCompletionRate,
    toggleRoutineTask,
    getFilteredRoutines,
    getTeamRoutineStats,
    reorderRoutines
  } = useRoutines(sampleRoutines);

  // 時計の更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 通知管理
  useNotifications(projects, routineTasks, currentTime, notificationSettings);

  // LINE通知スケジューラー
  useLineNotifyScheduler(projects, routineTasks);

  // モバイル検出
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileBrowser());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // オンボーディング表示チェック
  useEffect(() => {
    // 少し遅延させてDOMの準備を待つ
    const timer = setTimeout(() => {
      if (shouldShowOnboarding()) {
        setShowOnboarding(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // スタイル定義
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // 今日のルーティンデータ（useMemoで最適化）
  const todayRoutines = useMemo(() => getTodayRoutines(currentTime), [currentTime, getTodayRoutines]);
  const completionRate = useMemo(() => getRoutineCompletionRate(currentTime), [currentTime, getRoutineCompletionRate]);
  const teamStats = useMemo(() => getTeamRoutineStats(currentTime, teamMembers), [currentTime, teamMembers, getTeamRoutineStats]);

  // ルーティン切り替えハンドラー（useCallbackで最適化）
  const handleToggleRoutine = useCallback((taskId) => {
    toggleRoutineTask(taskId, currentTime);
  }, [toggleRoutineTask, currentTime]);

  // ルーティン並び替えハンドラー（useCallbackで最適化）
  const handleReorderRoutines = useCallback((newRoutines) => {
    reorderRoutines(newRoutines, currentTime);
  }, [reorderRoutines, currentTime]);

  // タスク更新ハンドラー（useCallbackで最適化）
  const handleUpdateTask = useCallback((updatedTask) => {
    const updatedProjects = projects.map(project => {
      if (project.id === updatedTask.projectId) {
        return {
          ...project,
          tasks: project.tasks.map(task =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        };
      }
      return project;
    });
    setProjects(updatedProjects);
    // selectedTaskも更新して、モーダルが最新情報を表示するようにする
    setSelectedTask({ ...updatedTask });
  }, [projects, setProjects]);

  // タスク削除ハンドラー（useCallbackで最適化）
  const handleDeleteTask = useCallback((taskId, projectId) => {
    if (!window.confirm('このタスクを削除しますか？')) return;

    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        };
      }
      return project;
    });
    setProjects(updatedProjects);
    setSelectedTask(null); // モーダルを閉じる
  }, [projects, setProjects]);

  // キーボードショートカットハンドラー
  useKeyboardShortcuts({
    // グローバル検索にフォーカス
    focusSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="検索"]');
      if (searchInput) {
        searchInput.focus();
      }
    },

    // ヘルプを表示
    showHelp: () => {
      setShowKeyboardHelp(true);
    },

    // 設定を開く
    openSettings: () => {
      setShowSettings(true);
    },

    // ダークモード切り替え
    toggleDarkMode: () => {
      setDarkMode(!darkMode);
    },

    // ビュー切り替え
    switchView: (view) => {
      setSelectedView(view);
    },

    // モーダルを閉じる
    closeModal: () => {
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
      } else if (showSettings) {
        setShowSettings(false);
      } else if (selectedTask) {
        setSelectedTask(null);
      } else if (showOnboarding) {
        // オンボーディングは閉じない（スキップボタンを使う）
      }
    }
  }, !isMobile); // モバイルではキーボードショートカットを無効化

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* モバイルレイアウト */}
      {isMobile ? (
        <div className="flex flex-col h-screen">
          {/* モバイルヘッダー */}
          <MobileHeader
            title="プロジェクト管理"
            onMenuClick={() => setMobileSidebarOpen(true)}
            onSettingsClick={() => setShowSettings(true)}
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(!darkMode)}
          />

          {/* モバイルサイドバー */}
          <MobileSidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            darkMode={darkMode}
            projects={projects}
            completionRate={completionRate}
            teamMembers={teamMembers}
          />

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
            {/* モバイル検索 */}
            <div className="mb-4">
              <GlobalSearch
                projects={projects}
                routineTasks={routineTasks}
                teamMembers={teamMembers}
                onResultClick={(item, type) => {
                  if (type === 'task') {
                    setSelectedTask(item);
                    setActiveTab('overview');
                  } else if (type === 'project') {
                    setSelectedView('timeline');
                  } else if (type === 'routine') {
                    setSelectedView('routine');
                  } else if (type === 'member') {
                    setSelectedView('team');
                  }
                }}
                darkMode={darkMode}
              />
            </div>

            {selectedView === 'timeline' && (
              <TimelineView
                projects={projects}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setActiveTab('overview');
                }}
                setProjects={setProjects}
                teamMembers={teamMembers}
                darkMode={darkMode}
              />
            )}

            {selectedView === 'gantt' && (
              <GanttChartView
                projects={projects}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setActiveTab('overview');
                }}
                teamMembers={teamMembers}
                darkMode={darkMode}
              />
            )}

            {selectedView === 'calendar' && (
              <CalendarView
                projects={projects}
                routineTasks={routineTasks}
                teamMembers={teamMembers}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setActiveTab('overview');
                }}
                darkMode={darkMode}
              />
            )}

            {selectedView === 'statistics' && (
              <StatisticsView
                projects={projects}
                routineTasks={routineTasks}
                teamMembers={teamMembers}
                darkMode={darkMode}
              />
            )}

            {selectedView === 'team' && (
              <TeamView
                teamMembers={teamMembers}
                onMemberClick={(member) => console.log('Member clicked:', member)}
                setTeamMembers={setTeamMembers}
                darkMode={darkMode}
                projects={projects}
                routineTasks={routineTasks}
              />
            )}

            {selectedView === 'routine' && (
              <RoutineView
                routines={todayRoutines}
                teamStats={teamStats}
                completionRate={completionRate}
                viewMode={routineViewMode}
                onViewModeChange={setRoutineViewMode}
                onToggleRoutine={handleToggleRoutine}
                teamMembers={teamMembers}
                projects={projects}
                darkMode={darkMode}
                onReorderRoutines={handleReorderRoutines}
                routineTasks={routineTasks}
                setRoutineTasks={setRoutineTasks}
                currentTime={currentTime}
                routineCategories={routineCategories}
                setRoutineCategories={setRoutineCategories}
                getFilteredRoutines={getFilteredRoutines}
              />
            )}

            {selectedView === 'report' && (
              <DailyReportView
                projects={projects}
                routineTasks={routineTasks}
                teamMembers={teamMembers}
                darkMode={darkMode}
              />
            )}
          </main>

          {/* モバイルボトムナビゲーション */}
          <MobileBottomNav
            activeView={selectedView}
            onViewChange={setSelectedView}
            darkMode={darkMode}
          />
        </div>
      ) : (
        /* デスクトップレイアウト */
        <div className="flex h-screen overflow-hidden">
          {/* サイドバー */}
          {sidebarOpen && (
          <div className={`w-64 ${cardBg} border-r p-4 space-y-4 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold ${textColor}`}>メニュー</h2>
              <button onClick={() => setSidebarOpen(false)} className={textSecondary}>
                <X size={20} />
              </button>
            </div>

            {/* ダークモード切り替え */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${textColor} hover:bg-opacity-80 transition-all`}
            >
              <span className="flex items-center gap-2">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? 'ライトモード' : 'ダークモード'}
              </span>
            </button>

            {/* クイック統計 */}
            <div className={`${cardBg} rounded-xl shadow-lg p-4 border`}>
              <h4 className={`font-semibold mb-3 ${textColor} text-sm`}>今日の統計</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-xs ${textSecondary}`}>プロジェクト</span>
                  <span className={`text-xs font-bold ${textColor}`}>{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textSecondary}`}>チームメンバー</span>
                  <span className={`text-xs font-bold ${textColor}`}>{teamMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textSecondary}`}>ルーティン達成率</span>
                  <span className={`text-xs font-bold ${textColor}`}>{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* プロジェクト一覧 */}
            <div className={`${cardBg} rounded-xl shadow-lg p-4 border`}>
              <h4 className={`font-semibold mb-3 ${textColor} text-sm`}>プロジェクト</h4>
              <div className="space-y-2">
                {projects.slice(0, 3).map(project => (
                  <div key={project.id} className={`text-xs ${textSecondary} flex items-center justify-between`}>
                    <span>{project.name}</span>
                    <span className="font-bold">{project.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ヘッダー */}
          <header className={`${cardBg} border-b p-4 flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className={textColor}>
                  <Menu size={24} />
                </button>
              )}
              <div>
                <h1 className={`text-2xl font-bold ${textColor}`}>4次元プロジェクト管理</h1>
                <p className={`text-sm ${textSecondary}`}>
                  {currentTime.toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* グローバル検索 */}
            <div id="global-search" className="flex-1 max-w-2xl">
              <GlobalSearch
                projects={projects}
                routineTasks={routineTasks}
                teamMembers={teamMembers}
                onResultClick={(item, type) => {
                  if (type === 'task') {
                    setSelectedTask(item);
                    setActiveTab('overview');
                  } else if (type === 'project') {
                    setSelectedView('timeline');
                  } else if (type === 'routine') {
                    setSelectedView('routine');
                  } else if (type === 'member') {
                    setSelectedView('team');
                  }
                }}
                darkMode={darkMode}
              />
            </div>

            {/* 設定ボタン */}
            <div className="flex items-center gap-2">
              <button
                id="settings-button"
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  } ${textColor} transition-all`}
              >
                <Settings size={20} />
              </button>
            </div>
          </header>

          {/* ビュー切り替えタブ */}
          <div id="view-tabs" className={`${cardBg} border-b px-4 flex gap-1 overflow-x-auto`}>
            {[
              { id: 'timeline', label: 'プロジェクト一覧' },
              { id: 'gantt', label: 'ガントチャート' },
              { id: 'calendar', label: 'カレンダー' },
              { id: 'statistics', label: '統計' },
              { id: 'team', label: 'チーム' },
              { id: 'routine', label: 'ルーティン' },
              { id: 'report', label: '日報' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`px-6 py-3 font-medium transition-all border-b-2 ${selectedView === view.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
                  }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* メインビューエリア */}
          <main className="flex-1 overflow-y-auto p-6">
            {selectedView === 'timeline' && (
              <div id="timeline-view">
                <TimelineView
                  projects={projects}
                  onTaskClick={(task) => {
                    setSelectedTask(task);
                    setActiveTab('overview');
                  }}
                  setProjects={setProjects}
                  teamMembers={teamMembers}
                  darkMode={darkMode}
                />
              </div>
            )}

            {selectedView === 'gantt' && (
              <div id="gantt-view">
                <GanttChartView
                  projects={projects}
                  onTaskClick={(task) => {
                    setSelectedTask(task);
                    setActiveTab('overview');
                  }}
                  teamMembers={teamMembers}
                  darkMode={darkMode}
                />
              </div>
            )}

            {selectedView === 'calendar' && (
              <div id="calendar-view">
                <CalendarView
                  projects={projects}
                  routineTasks={routineTasks}
                  teamMembers={teamMembers}
                  onTaskClick={(task) => {
                    setSelectedTask(task);
                    setActiveTab('overview');
                  }}
                  darkMode={darkMode}
                />
              </div>
            )}

            {selectedView === 'statistics' && (
              <div id="statistics-view">
                <StatisticsView
                  projects={projects}
                  routineTasks={routineTasks}
                  teamMembers={teamMembers}
                  darkMode={darkMode}
                />
              </div>
            )}

            {selectedView === 'team' && (
              <TeamView
                teamMembers={teamMembers}
                onMemberClick={(member) => console.log('Member clicked:', member)}
                setTeamMembers={setTeamMembers}
                darkMode={darkMode}
                projects={projects}
                routineTasks={routineTasks}
              />
            )}

            {selectedView === 'routine' && (
              <div id="routine-view">
                <RoutineView
                  routines={todayRoutines}
                  teamStats={teamStats}
                  completionRate={completionRate}
                  viewMode={routineViewMode}
                  onViewModeChange={setRoutineViewMode}
                  onToggleRoutine={handleToggleRoutine}
                  teamMembers={teamMembers}
                  projects={projects}
                  darkMode={darkMode}
                  onReorderRoutines={handleReorderRoutines}
                  routineTasks={routineTasks}
                  setRoutineTasks={setRoutineTasks}
                  currentTime={currentTime}
                  routineCategories={routineCategories}
                  setRoutineCategories={setRoutineCategories}
                  getFilteredRoutines={getFilteredRoutines}
                />
              </div>
            )}

            {selectedView === 'report' && (
              <DailyReportView
                projects={projects}
                routineTasks={routineTasks}
                teamMembers={teamMembers}
                darkMode={darkMode}
              />
            )}
          </main>
        </div>
        </div>
      )}

      {/* モーダル */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          projects={projects}
          darkMode={darkMode}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          teamMembers={teamMembers}
        />
      )}

      {/* 設定パネル */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          darkMode={darkMode}
          projects={projects}
          setProjects={setProjects}
          teamMembers={teamMembers}
          setTeamMembers={setTeamMembers}
          routineTasks={routineTasks}
          setRoutineTasks={setRoutineTasks}
          routineCategories={routineCategories}
          setRoutineCategories={setRoutineCategories}
          currentTime={currentTime}
          notificationSettings={notificationSettings}
          setNotificationSettings={setNotificationSettings}
        />
      )}

      {/* オンボーディングツアー */}
      {showOnboarding && (
        <OnboardingTour
          darkMode={darkMode}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* キーボードショートカットヘルプ */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp
          darkMode={darkMode}
          onClose={() => setShowKeyboardHelp(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
