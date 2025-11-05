import { useLocalStorage } from './useLocalStorage';

/**
 * ルーティンタスク管理用カスタムフック（LocalStorage対応）
 * @param {Object} initialRoutines - 初期ルーティンデータ
 * @returns {Object} ルーティン管理用の関数とデータ
 */
export const useRoutines = (initialRoutines = {}) => {
  // LocalStorageを使用してデータを永続化
  const [routineTasks, setRoutineTasks] = useLocalStorage('routineTasks', initialRoutines);

  /**
   * 今日のルーティンを取得
   */
  const getTodayRoutines = (currentTime) => {
    const today = currentTime.toISOString().split('T')[0];
    return routineTasks[today] || [];
  };

  /**
   * 今日のルーティン達成率を計算
   * スキップされたタスクを除外して計算
   */
  const getRoutineCompletionRate = (currentTime) => {
    const todayRoutines = getTodayRoutines(currentTime);
    if (todayRoutines.length === 0) return 0;

    const completed = todayRoutines.filter(r => r.completed || r.status === 'completed').length;
    const skipped = todayRoutines.filter(r => r.status === 'skipped').length;
    const total = todayRoutines.length;

    // スキップを除外したタスクから達成率を計算
    const eligibleTasks = total - skipped;
    if (eligibleTasks === 0) return 0;

    return Math.round((completed / eligibleTasks) * 100);
  };

  /**
   * 今日のルーティン詳細統計を取得
   * 完了数、スキップ数、達成率、スキップ率などを含む
   */
  const getRoutineDetailedStats = (currentTime) => {
    const todayRoutines = getTodayRoutines(currentTime);

    const completed = todayRoutines.filter(r => r.completed || r.status === 'completed').length;
    const skipped = todayRoutines.filter(r => r.status === 'skipped').length;
    const pending = todayRoutines.filter(r => r.status === 'pending' || (!r.status && !r.completed)).length;
    const total = todayRoutines.length;

    const eligibleTasks = total - skipped;
    const completionRate = eligibleTasks > 0 ? Math.round((completed / eligibleTasks) * 100) : 0;
    const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

    return {
      completed,
      skipped,
      pending,
      total,
      completionRate,
      skipRate,
      eligibleTasks
    };
  };

  /**
   * ルーティンタスクの完了/未完了を切り替え
   */
  const toggleRoutineTask = (taskId, currentTime) => {
    const today = currentTime.toISOString().split('T')[0];
    setRoutineTasks(prev => ({
      ...prev,
      [today]: prev[today].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  /**
   * フィルター条件に基づいてルーティンを取得
   */
  const getFilteredRoutines = (currentTime, filters = {}) => {
    let routines = getTodayRoutines(currentTime);

    if (filters.member && filters.member !== 'all') {
      routines = routines.filter(r => r.assignee === filters.member);
    }

    if (filters.project && filters.project !== 'all') {
      routines = routines.filter(r => r.projectId === parseInt(filters.project));
    }

    if (filters.category && filters.category !== 'all') {
      routines = routines.filter(r => r.category === filters.category);
    }

    return routines;
  };

  /**
   * チーム全体のルーティン統計を取得
   * スキップされたタスクを考慮
   */
  const getTeamRoutineStats = (currentTime, teamMembers) => {
    const todayRoutines = getTodayRoutines(currentTime);
    const stats = {};

    teamMembers.forEach(member => {
      const memberRoutines = todayRoutines.filter(r => r.assignee === member.name);
      const completed = memberRoutines.filter(r => r.completed || r.status === 'completed').length;
      const skipped = memberRoutines.filter(r => r.status === 'skipped').length;
      const total = memberRoutines.length;

      // スキップを除外したタスクから達成率を計算
      const eligibleTasks = total - skipped;
      const rate = eligibleTasks > 0 ? Math.round((completed / eligibleTasks) * 100) : 0;

      // スキップ率も計算
      const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

      stats[member.name] = {
        completed,
        skipped,
        total,
        rate,
        skipRate,
        routines: memberRoutines
      };
    });

    return stats;
  };

  /**
   * プロジェクトごとにルーティンをグループ化
   */
  const getRoutinesByProject = (currentTime, projects) => {
    const todayRoutines = getTodayRoutines(currentTime);
    const grouped = {
      withProject: {},
      withoutProject: []
    };

    todayRoutines.forEach(routine => {
      if (routine.projectId) {
        const project = projects.find(p => p.id === routine.projectId);
        if (project) {
          if (!grouped.withProject[project.id]) {
            grouped.withProject[project.id] = {
              project: project,
              routines: []
            };
          }
          grouped.withProject[project.id].routines.push(routine);
        }
      } else {
        grouped.withoutProject.push(routine);
      }
    });

    return grouped;
  };

  /**
   * カテゴリー別にルーティンをグループ化
   */
  const getRoutinesByCategory = (currentTime) => {
    const todayRoutines = getTodayRoutines(currentTime);
    const grouped = {
      work: [],
      health: [],
      personal: []
    };

    todayRoutines.forEach(routine => {
      if (grouped[routine.category]) {
        grouped[routine.category].push(routine);
      }
    });

    return grouped;
  };

  /**
   * ルーティンの順序を変更
   * @param {Array} newRoutines - 新しい順序のルーティン配列
   * @param {Date} currentTime - 現在時刻
   */
  const reorderRoutines = (newRoutines, currentTime) => {
    const today = currentTime.toISOString().split('T')[0];
    setRoutineTasks(prev => ({
      ...prev,
      [today]: newRoutines
    }));
  };

  return {
    routineTasks,
    setRoutineTasks,
    getTodayRoutines,
    getRoutineCompletionRate,
    getRoutineDetailedStats,
    toggleRoutineTask,
    getFilteredRoutines,
    getTeamRoutineStats,
    getRoutinesByProject,
    getRoutinesByCategory,
    reorderRoutines
  };
};
