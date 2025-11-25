import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Moon, Sun, Menu, X, Settings, LogOut } from 'lucide-react';

// データとユーティリティのインポート
import { sampleProjects } from '../data/sampleProjects';
import { sampleTeamMembers } from '../data/sampleTeam';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotifications } from '../hooks/useNotifications';
import { defaultNotificationSettings } from '../utils/notificationUtils';
import { isMobileBrowser } from '../utils/deviceUtils';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../utils/authUtils';
import { skipRoutine, autoSkipPreviousDayTasks, getTodaysRoutines, completeRoutine, resetRoutine } from '../utils/routineUtils';
import { getAllProjects, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask } from '../utils/projectUtils';
import { getAllTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from '../utils/teamMemberUtils';
import { getAllRoutineCategories } from '../utils/routineCategoryUtils';
import { supabase } from '../lib/supabase';

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
  // 認証情報
  const { user, organizationId } = useAuth();

  // 時刻管理
  const [currentTime, setCurrentTime] = useState(new Date());

  // ビュー管理（LocalStorage対応）
  const [selectedView, setSelectedView] = useLocalStorage('selectedView', 'timeline');
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

  // データ（Supabase対応）
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [routineCategories, setRoutineCategories] = useState([]);
  const [routineTasks, setRoutineTasks] = useState([]);  // プロジェクトと同じパターン
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 通知設定（LocalStorage対応）
  const [notificationSettings, setNotificationSettings] = useLocalStorage('notificationSettings', defaultNotificationSettings);

  // オンボーディング状態
  const [showOnboarding, setShowOnboarding] = useState(false);

  // キーボードショートカットヘルプ
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // 時計の更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabaseからプロジェクト、チームメンバー、ルーティンカテゴリーを読み込む
  const loadData = useCallback(async () => {
    // organizationIdが設定されるまで待つ
    if (!user) {
      setIsLoadingData(false);
      return;
    }

    // organizationIdが未設定の場合は何もしない
    if (!organizationId) {
      console.log('⏳ 組織ID取得待ち... organizationId:', organizationId);
      setIsLoadingData(false);
      return;
    }

    console.log('✅ 組織IDで データ取得開始:', organizationId);
    setIsLoadingData(true);

    // プロジェクトを取得
    const { data: projectsData, error: projectsError } = await getAllProjects();
    if (!projectsError && projectsData) {
      setProjects(projectsData);
    } else if (projectsError) {
      console.error('プロジェクト取得エラー:', projectsError);
    }

    // チームメンバーを取得
    const { data: membersData, error: membersError } = await getAllTeamMembers();
    if (!membersError && membersData) {
      setTeamMembers(membersData);
    } else if (membersError) {
      console.error('チームメンバー取得エラー:', membersError);
    }

    // ルーティンカテゴリーを取得
    const { data: categoriesData, error: categoriesError } = await getAllRoutineCategories(organizationId);
    if (!categoriesError && categoriesData) {
      setRoutineCategories(categoriesData);
    } else if (categoriesError) {
      console.error('ルーティンカテゴリー取得エラー:', categoriesError);
    }

    // ルーティンタスクを取得
    const today = new Date().toISOString().split('T')[0];
    const { data: routinesData, error: routinesError } = await getTodaysRoutines(organizationId, today);
    if (!routinesError && routinesData) {
      // getTodaysRoutinesは既に正しい形式で返すので、そのまま使用
      setRoutineTasks(routinesData);
    }

    setIsLoadingData(false);
  }, [user, organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // リアルタイム同期の設定
  useEffect(() => {
    if (!user) return;

    // プロジェクトの変更を監視
    const projectsSubscription = supabase
      .channel('projects-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async (payload) => {
        console.log('プロジェクト変更検知:', payload);

        // データを再取得
        const { data, error } = await getAllProjects();
        if (!error && data) {
          setProjects(data);
        }
      })
      .subscribe();

    // タスクの変更を監視
    const tasksSubscription = supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
        console.log('タスク変更検知:', payload);

        // データを再取得
        const { data, error } = await getAllProjects();
        if (!error && data) {
          setProjects(data);
        }
      })
      .subscribe();

    // チームメンバーの変更を監視
    const membersSubscription = supabase
      .channel('members-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, async (payload) => {
        console.log('チームメンバー変更検知:', payload);

        // データを再取得
        const { data, error } = await getAllTeamMembers();
        if (!error && data) {
          setTeamMembers(data);
        }
      })
      .subscribe();

    // ルーティンカテゴリーの変更を監視
    const categoriesSubscription = supabase
      .channel('categories-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routine_categories' }, async (payload) => {
        console.log('ルーティンカテゴリー変更検知:', payload);

        // データを再取得
        if (organizationId) {
          const { data, error } = await getAllRoutineCategories(organizationId);
          if (!error && data) {
            setRoutineCategories(data);
          }
        }
      })
      .subscribe();

    // ルーティンマスターの変更を監視
    const routinesMasterSubscription = supabase
      .channel('routines-master-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routines' }, async (payload) => {
        console.log('ルーティンマスター変更検知:', payload);

        // 今日のデータを再取得
        if (organizationId) {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await getTodaysRoutines(organizationId, today);

          if (!error && data) {
            setRoutineTasks(data);
          }
        }
      })
      .subscribe();

    // ルーティン実行記録の変更を監視
    const routinesTasksSubscription = supabase
      .channel('routines-tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routine_tasks' }, async (payload) => {
        console.log('ルーティン実行記録変更検知:', payload);

        // 今日のデータを再取得
        if (organizationId) {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await getTodaysRoutines(organizationId, today);

          if (!error && data) {
            setRoutineTasks(data);
          }
        }
      })
      .subscribe();

    // クリーンアップ
    return () => {
      projectsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
      routinesMasterSubscription.unsubscribe();
      routinesTasksSubscription.unsubscribe();
    };
  }, [user, organizationId]);

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

  // Supabaseから今日のルーティンを読み込む（マスター + 実行記録）
  useEffect(() => {
    const loadRoutineTasks = async () => {
      // organizationIdが設定されていない場合は何もしない
      if (!user?.id) return;
      if (!organizationId) {
        console.log('⏳ 組織ID取得待ち（ルーティンタスク）...');
        return;
      }

      const today = currentTime.toISOString().split('T')[0];
      const { data, error } = await getTodaysRoutines(organizationId, today);

      if (!error && data) {
        // getTodaysRoutinesは既に正しい形式で返すので、そのまま使用
        setRoutineTasks(data);
      }
    };

    loadRoutineTasks();
  }, [user?.id, organizationId]); // currentTimeを削除（日付が変わった時は別のuseEffectで処理）

  // 日付変更時の自動スキップ処理
  useEffect(() => {
    const today = currentTime.toISOString().split('T')[0];
    const lastCheckedDate = localStorage.getItem('lastCheckedDate');

    // 日付が変わった場合（かつ、初回起動ではない場合）
    if (lastCheckedDate && lastCheckedDate !== today) {
      // 前日の日付を取得
      const yesterday = new Date(currentTime);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // ユーザーがログインしていて、organizationIdが設定されている場合のみ実行
      if (user?.id && organizationId) {
        // 前日の未完了タスクを自動スキップ
        autoSkipPreviousDayTasks(organizationId, yesterdayStr).then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            console.log(`前日(${yesterdayStr})の未完了タスク ${data.length}件 を自動スキップしました`);

            // ローカルステートも更新（配列形式）
            setRoutineTasks(prev =>
              prev.map(task =>
                task.date === yesterdayStr && task.status === 'pending'
                  ? { ...task, status: 'skipped', skip_reason: '日付変更により自動スキップ' }
                  : task
              )
            );
          }
        });
      }
    }

    // 今日の日付を保存
    localStorage.setItem('lastCheckedDate', today);
  }, [currentTime, user, organizationId, setRoutineTasks]);

  // スタイル定義
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // 今日のルーティンの達成率を計算
  const completionRate = useMemo(() => {
    const today = currentTime.toISOString().split('T')[0];
    const todayRoutines = routineTasks.filter(r => r.date === today);

    if (todayRoutines.length === 0) return 0;

    const completed = todayRoutines.filter(r => r.completed || r.status === 'completed').length;
    const skipped = todayRoutines.filter(r => r.status === 'skipped').length;
    const total = todayRoutines.length;

    // スキップを除外した達成率
    const eligibleTasks = total - skipped;
    return eligibleTasks > 0 ? Math.round((completed / eligibleTasks) * 100) : 0;
  }, [routineTasks, currentTime]);

  // ルーティン切り替えハンドラー（新しい構造に対応）
  const handleToggleRoutine = useCallback(async (taskId) => {
    const today = currentTime.toISOString().split('T')[0];
    const task = routineTasks.find(t => t.id === taskId);

    if (!task) return;
    if (!organizationId) {
      alert('組織情報を取得中です。少々お待ちください。');
      return;
    }

    const newCompletedStatus = !(task.completed || task.status === 'completed');

    // Supabaseを更新（リアルタイム同期で自動的にstateが更新される）
    if (newCompletedStatus) {
      const { error } = await completeRoutine(organizationId, task.routineId, task.id, today);
      if (error) {
        console.error('ルーティン完了エラー:', error);
        alert('ルーティンの完了に失敗しました。');
        return;
      }
    } else {
      const { error } = await resetRoutine(task.id);
      if (error) {
        console.error('ルーティンリセットエラー:', error);
        alert('ルーティンのリセットに失敗しました。');
        return;
      }
    }
  }, [currentTime, routineTasks, organizationId]);

  // ルーティンスキップハンドラー（新しい構造に対応）
  const handleSkipRoutine = useCallback(async (taskId) => {
    const today = currentTime.toISOString().split('T')[0];
    const task = routineTasks.find(t => t.id === taskId);

    if (!task) return;
    if (!organizationId) {
      alert('組織情報を取得中です。少々お待ちください。');
      return;
    }

    // スキップ理由を入力するプロンプトを表示（オプション）
    const reason = window.prompt('スキップ理由を入力してください（任意）:');

    // Supabaseのスキップ関数を呼び出し（リアルタイム同期で自動的にstateが更新される）
    const { data, error } = await skipRoutine(organizationId, task.routineId, task.id, today, reason);

    if (error) {
      console.error('ルーティンスキップエラー:', error);
      alert('スキップに失敗しました。もう一度お試しください。');
      return;
    }
  }, [currentTime, routineTasks, organizationId]);

  // タスク更新ハンドラー（useCallbackで最適化）
  const handleUpdateTask = useCallback(async (updatedTask) => {
    // Supabaseを更新
    const { data, error } = await updateTask(updatedTask.id, updatedTask);

    if (error) {
      console.error('タスク更新エラー:', error);
      alert('タスクの更新に失敗しました');
      return;
    }

    // ローカルステートを更新
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
  }, [projects]);

  // タスク削除ハンドラー（useCallbackで最適化）
  const handleDeleteTask = useCallback(async (taskId, projectId) => {
    if (!window.confirm('このタスクを削除しますか？')) return;

    // Supabaseから削除
    const { error } = await deleteTask(taskId);

    if (error) {
      console.error('タスク削除エラー:', error);
      alert('タスクの削除に失敗しました');
      return;
    }

    // ローカルステートを更新
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
  }, [projects]);

  // ログアウトハンドラー
  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;

    const { error } = await signOut();
    if (error) {
      alert('ログアウトに失敗しました: ' + error.message);
    } else {
      // ログアウト成功（認証状態が変わるので自動的にログイン画面に遷移）
      console.log('👋 ログアウトしました');
    }
  };

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
                routineTasks={routineTasks}
                setRoutineTasks={setRoutineTasks}
                viewMode={routineViewMode}
                onViewModeChange={setRoutineViewMode}
                onToggleRoutine={handleToggleRoutine}
                onSkipRoutine={handleSkipRoutine}
                teamMembers={teamMembers}
                projects={projects}
                darkMode={darkMode}
                currentTime={currentTime}
                routineCategories={routineCategories}
                setRoutineCategories={setRoutineCategories}
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
                    <span className={`font-bold ${project.progress === 100 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {project.progress}%
                      {project.progress === 100 && ' ✓'}
                    </span>
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

            {/* ユーザー情報とアクションボタン */}
            <div className="flex items-center gap-3">
              {/* ユーザー情報 */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg btn-primary">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.email}</p>
                  </div>
                </div>
              )}

              {/* 設定ボタン */}
              <button
                id="settings-button"
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  } ${textColor} transition-all`}
                title="設定"
              >
                <Settings size={20} />
              </button>

              {/* ログアウトボタン */}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg ${darkMode ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'
                  } text-red-600 transition-all`}
                title="ログアウト"
              >
                <LogOut size={20} />
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
                  routineTasks={routineTasks}
                  setRoutineTasks={setRoutineTasks}
                  viewMode={routineViewMode}
                  onViewModeChange={setRoutineViewMode}
                  onToggleRoutine={handleToggleRoutine}
                  onSkipRoutine={handleSkipRoutine}
                  teamMembers={teamMembers}
                  projects={projects}
                  darkMode={darkMode}
                  currentTime={currentTime}
                  routineCategories={routineCategories}
                  setRoutineCategories={setRoutineCategories}
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
          onDataRefresh={loadData}
          teamMembers={teamMembers}
          projects={projects}
          routineTasks={routineTasks}
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
