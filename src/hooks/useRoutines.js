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
   */
  const getRoutineCompletionRate = (currentTime) => {
    const todayRoutines = getTodayRoutines(currentTime);
    if (todayRoutines.length === 0) return 0;
    const completed = todayRoutines.filter(r => r.completed).length;
    return Math.round((completed / todayRoutines.length) * 100);
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
   */
  const getTeamRoutineStats = (currentTime, teamMembers) => {
    const todayRoutines = getTodayRoutines(currentTime);
    const stats = {};

    teamMembers.forEach(member => {
      const memberRoutines = todayRoutines.filter(r => r.assignee === member.name);
      const completed = memberRoutines.filter(r => r.completed).length;
      const total = memberRoutines.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      stats[member.name] = {
        completed,
        total,
        rate,
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
    toggleRoutineTask,
    getFilteredRoutines,
    getTeamRoutineStats,
    getRoutinesByProject,
    getRoutinesByCategory,
    reorderRoutines
  };
};
