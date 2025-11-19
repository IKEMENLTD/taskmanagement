/**
 * 統計ユーティリティ
 */

/**
 * 日付が指定期間内かチェック
 */
export const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 時刻を00:00:00にリセット
  checkDate.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return checkDate >= start && checkDate <= end;
};

/**
 * 期間範囲を取得
 */
export const getDateRange = (period) => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  switch (period) {
    case 'today':
      // 今日
      break;
    case 'week':
      // 今週（日曜日から土曜日）
      const day = today.getDay();
      startDate.setDate(today.getDate() - day);
      endDate.setDate(today.getDate() + (6 - day));
      break;
    case 'month':
      // 今月
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      break;
    case 'year':
      // 今年
      startDate.setMonth(0, 1);
      endDate.setMonth(11, 31);
      break;
    default:
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

/**
 * プロジェクト統計を計算
 */
export const calculateProjectStats = (projects, startDate, endDate) => {
  const stats = {
    total: projects.length,
    active: 0,
    completed: 0,
    delayed: 0,
    averageProgress: 0,
    byStatus: {
      planning: 0,
      active: 0,
      completed: 0,
      onHold: 0
    }
  };

  const today = new Date().toISOString().split('T')[0];
  let totalProgress = 0;

  projects.forEach(project => {
    // ステータス別カウント
    if (project.status) {
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;
    }

    // アクティブ・完了カウント
    if (project.status === 'completed') {
      stats.completed++;
    } else if (project.status === 'active') {
      stats.active++;
    }

    // 遅延チェック
    if (project.timeline && project.timeline.end < today && project.status !== 'completed') {
      stats.delayed++;
    }

    // 進捗率
    totalProgress += project.progress || 0;
  });

  stats.averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

  return stats;
};

/**
 * タスク統計を計算
 */
export const calculateTaskStats = (projects, startDate, endDate) => {
  const stats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    delayed: 0,
    byPriority: {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    byStatus: {
      todo: 0,
      inProgress: 0,
      completed: 0
    },
    completionRate: 0
  };

  const today = new Date().toISOString().split('T')[0];

  projects.forEach(project => {
    if (!project.tasks) return;

    project.tasks.forEach(task => {
      stats.total++;

      // ステータス別カウント
      if (task.status) {
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      }

      // 完了・進行中カウント
      if (task.status === 'completed') {
        stats.completed++;
      } else if (task.status === 'inProgress') {
        stats.inProgress++;
      }

      // 優先度別カウント
      if (task.priority) {
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      }

      // 遅延チェック
      if (task.dueDate && task.dueDate < today && task.status !== 'completed') {
        stats.delayed++;
      }
    });
  });

  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return stats;
};

/**
 * ルーティン統計を計算
 */
export const calculateRoutineStats = (routineTasks, startDate, endDate) => {
  const stats = {
    total: 0,
    completed: 0,
    completionRate: 0,
    byCategory: {},
    dailyRates: []
  };

  // 期間内の日付ごとに集計
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];

    // routineTasksが配列形式の場合に対応
    const dayRoutines = Array.isArray(routineTasks)
      ? routineTasks.filter(task => task.date === dateStr)
      : (routineTasks[dateStr] || []);

    if (dayRoutines.length > 0) {
      const completed = dayRoutines.filter(r => r.completed || r.status === 'completed').length;
      const total = dayRoutines.length;

      stats.total += total;
      stats.completed += completed;

      stats.dailyRates.push({
        date: dateStr,
        rate: Math.round((completed / total) * 100),
        completed,
        total
      });

      // カテゴリ別集計
      dayRoutines.forEach(routine => {
        const category = routine.category || 'other';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = { total: 0, completed: 0 };
        }
        stats.byCategory[category].total++;
        if (routine.completed || routine.status === 'completed') {
          stats.byCategory[category].completed++;
        }
      });
    }
  }

  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return stats;
};

/**
 * チームメンバー統計を計算
 */
export const calculateTeamStats = (projects, routineTasks, teamMembers, startDate, endDate) => {
  const stats = {};

  teamMembers.forEach(member => {
    stats[member.name] = {
      name: member.name,
      role: member.role,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      delayedTasks: 0,
      taskCompletionRate: 0,
      routineCompletionRate: 0,
      projects: []
    };
  });

  const today = new Date().toISOString().split('T')[0];

  // タスク統計
  projects.forEach(project => {
    if (!project.tasks) return;

    project.tasks.forEach(task => {
      if (task.assignee && stats[task.assignee]) {
        const memberStats = stats[task.assignee];
        memberStats.totalTasks++;

        if (task.status === 'completed') {
          memberStats.completedTasks++;
        } else if (task.status === 'inProgress') {
          memberStats.inProgressTasks++;
        }

        if (task.dueDate && task.dueDate < today && task.status !== 'completed') {
          memberStats.delayedTasks++;
        }

        // プロジェクトリストに追加
        if (!memberStats.projects.includes(project.name)) {
          memberStats.projects.push(project.name);
        }
      }
    });
  });

  // ルーティン統計
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayRoutines = routineTasks[dateStr] || [];

    dayRoutines.forEach(routine => {
      if (routine.assignee && stats[routine.assignee]) {
        // ルーティン統計の集計は別途管理
      }
    });
  }

  // 完了率計算
  Object.keys(stats).forEach(memberName => {
    const memberStats = stats[memberName];
    if (memberStats.totalTasks > 0) {
      memberStats.taskCompletionRate = Math.round((memberStats.completedTasks / memberStats.totalTasks) * 100);
    }
  });

  return Object.values(stats);
};

/**
 * 期間別タスク完了数を計算（チャート用）
 */
export const calculateTaskCompletionTrend = (projects, startDate, endDate) => {
  const trend = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    let completed = 0;
    let total = 0;

    projects.forEach(project => {
      if (!project.tasks) return;

      project.tasks.forEach(task => {
        // その日に完了したタスク
        if (task.completedDate === dateStr) {
          completed++;
        }
        // その日が期限のタスク
        if (task.dueDate === dateStr) {
          total++;
        }
      });
    });

    trend.push({
      date: dateStr,
      completed,
      total
    });
  }

  return trend;
};

/**
 * プロジェクト進捗分布を計算（チャート用）
 */
export const calculateProgressDistribution = (projects) => {
  const distribution = {
    '0-25': 0,
    '26-50': 0,
    '51-75': 0,
    '76-99': 0,
    '100': 0
  };

  projects.forEach(project => {
    const progress = project.progress || 0;
    if (progress === 0) {
      distribution['0-25']++;
    } else if (progress <= 25) {
      distribution['0-25']++;
    } else if (progress <= 50) {
      distribution['26-50']++;
    } else if (progress <= 75) {
      distribution['51-75']++;
    } else if (progress < 100) {
      distribution['76-99']++;
    } else {
      distribution['100']++;
    }
  });

  return Object.keys(distribution).map(range => ({
    range,
    count: distribution[range]
  }));
};

/**
 * 優先度別タスク分布を計算（チャート用）
 */
export const calculatePriorityDistribution = (projects) => {
  const distribution = {
    urgent: { total: 0, completed: 0 },
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 }
  };

  projects.forEach(project => {
    if (!project.tasks) return;

    project.tasks.forEach(task => {
      const priority = task.priority || 'medium';
      distribution[priority].total++;
      if (task.status === 'completed') {
        distribution[priority].completed++;
      }
    });
  });

  return Object.keys(distribution).map(priority => ({
    priority,
    total: distribution[priority].total,
    completed: distribution[priority].completed,
    remaining: distribution[priority].total - distribution[priority].completed
  }));
};

/**
 * 全体サマリーを計算
 */
export const calculateOverallSummary = (projects, routineTasks, startDate, endDate) => {
  const projectStats = calculateProjectStats(projects, startDate, endDate);
  const taskStats = calculateTaskStats(projects, startDate, endDate);
  const routineStats = calculateRoutineStats(routineTasks, startDate, endDate);

  return {
    projects: projectStats,
    tasks: taskStats,
    routines: routineStats,
    overallHealth: calculateOverallHealth(projectStats, taskStats, routineStats)
  };
};

/**
 * 全体健全性スコアを計算
 */
const calculateOverallHealth = (projectStats, taskStats, routineStats) => {
  // プロジェクト進捗、タスク完了率、ルーティン達成率の加重平均
  const projectScore = projectStats.averageProgress;
  const taskScore = taskStats.completionRate;
  const routineScore = routineStats.completionRate;

  const overallScore = Math.round((projectScore * 0.4 + taskScore * 0.3 + routineScore * 0.3));

  let status = 'excellent';
  if (overallScore < 50) status = 'poor';
  else if (overallScore < 70) status = 'fair';
  else if (overallScore < 85) status = 'good';

  return {
    score: overallScore,
    status
  };
};
