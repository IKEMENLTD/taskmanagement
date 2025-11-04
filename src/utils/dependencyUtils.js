/**
 * タスク依存関係ユーティリティ
 */

/**
 * タスクの依存関係を検証
 */
export const validateDependencies = (task, allTasks) => {
  const errors = [];
  const warnings = [];

  if (!task.dependencies || task.dependencies.length === 0) {
    return { valid: true, errors, warnings };
  }

  // 依存タスクをチェック
  task.dependencies.forEach(depId => {
    const depTask = allTasks.find(t => t.id === depId);

    if (!depTask) {
      errors.push(`依存タスク ID:${depId} が見つかりません`);
      return;
    }

    // 循環依存チェック
    if (hasCircularDependency(task, depTask, allTasks)) {
      errors.push(`タスク "${depTask.name}" との間で循環依存が検出されました`);
    }

    // 依存タスクが完了していない場合の警告
    if (depTask.status !== 'completed' && task.status === 'inProgress') {
      warnings.push(`依存タスク "${depTask.name}" がまだ完了していません`);
    }

    // 日付の整合性チェック
    if (task.startDate && depTask.dueDate && task.startDate < depTask.dueDate) {
      warnings.push(`依存タスク "${depTask.name}" の期限前に開始予定です`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 循環依存をチェック
 */
export const hasCircularDependency = (task, depTask, allTasks, visited = new Set()) => {
  if (visited.has(depTask.id)) {
    return depTask.id === task.id;
  }

  visited.add(depTask.id);

  if (!depTask.dependencies || depTask.dependencies.length === 0) {
    return false;
  }

  for (const depId of depTask.dependencies) {
    const nextTask = allTasks.find(t => t.id === depId);
    if (nextTask && hasCircularDependency(task, nextTask, allTasks, new Set(visited))) {
      return true;
    }
  }

  return false;
};

/**
 * タスクが開始可能かチェック
 */
export const canStartTask = (task, allTasks) => {
  if (!task.dependencies || task.dependencies.length === 0) {
    return { canStart: true, blockedBy: [] };
  }

  const blockedBy = [];

  task.dependencies.forEach(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    if (depTask && depTask.status !== 'completed') {
      blockedBy.push(depTask);
    }
  });

  return {
    canStart: blockedBy.length === 0,
    blockedBy
  };
};

/**
 * プロジェクト内の全タスクを取得
 */
export const getAllTasksFromProjects = (projects) => {
  const allTasks = [];

  projects.forEach(project => {
    if (project.tasks) {
      project.tasks.forEach(task => {
        allTasks.push({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        });
      });
    }
  });

  return allTasks;
};

/**
 * タスクの依存先（このタスクに依存しているタスク）を取得
 */
export const getDependentTasks = (taskId, allTasks) => {
  return allTasks.filter(task =>
    task.dependencies && task.dependencies.includes(taskId)
  );
};

/**
 * タスクの依存元（このタスクが依存しているタスク）を取得
 */
export const getDependencyTasks = (task, allTasks) => {
  if (!task.dependencies || task.dependencies.length === 0) {
    return [];
  }

  return task.dependencies
    .map(depId => allTasks.find(t => t.id === depId))
    .filter(t => t !== undefined);
};

/**
 * クリティカルパスを計算
 */
export const calculateCriticalPath = (tasks) => {
  // 各タスクの最早開始時刻と最遅開始時刻を計算
  const taskMap = new Map();

  tasks.forEach(task => {
    taskMap.set(task.id, {
      ...task,
      earliestStart: 0,
      latestStart: 0,
      duration: calculateTaskDuration(task),
      slack: 0
    });
  });

  // 順方向パス（最早開始時刻）
  const visited = new Set();
  const calculateEarliestStart = (taskId) => {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const taskInfo = taskMap.get(taskId);
    if (!taskInfo) return;

    if (!taskInfo.dependencies || taskInfo.dependencies.length === 0) {
      taskInfo.earliestStart = 0;
    } else {
      let maxEnd = 0;
      taskInfo.dependencies.forEach(depId => {
        calculateEarliestStart(depId);
        const depInfo = taskMap.get(depId);
        if (depInfo) {
          maxEnd = Math.max(maxEnd, depInfo.earliestStart + depInfo.duration);
        }
      });
      taskInfo.earliestStart = maxEnd;
    }
  };

  tasks.forEach(task => calculateEarliestStart(task.id));

  // プロジェクト全体の期間
  let projectDuration = 0;
  taskMap.forEach(taskInfo => {
    projectDuration = Math.max(projectDuration, taskInfo.earliestStart + taskInfo.duration);
  });

  // 逆方向パス（最遅開始時刻）
  const calculateLatestStart = (taskId) => {
    const taskInfo = taskMap.get(taskId);
    if (!taskInfo) return;

    const dependents = tasks.filter(t =>
      t.dependencies && t.dependencies.includes(taskId)
    );

    if (dependents.length === 0) {
      taskInfo.latestStart = projectDuration - taskInfo.duration;
    } else {
      let minStart = Infinity;
      dependents.forEach(dep => {
        const depInfo = taskMap.get(dep.id);
        if (depInfo) {
          minStart = Math.min(minStart, depInfo.latestStart);
        }
      });
      taskInfo.latestStart = minStart - taskInfo.duration;
    }

    taskInfo.slack = taskInfo.latestStart - taskInfo.earliestStart;
  };

  // 末端タスクから逆順に計算
  tasks.forEach(task => calculateLatestStart(task.id));

  // クリティカルパス（スラックが0のタスク）
  const criticalPath = [];
  taskMap.forEach(taskInfo => {
    if (Math.abs(taskInfo.slack) < 0.01) { // 浮動小数点誤差を考慮
      criticalPath.push(taskInfo);
    }
  });

  return {
    criticalPath,
    projectDuration,
    taskDetails: Array.from(taskMap.values())
  };
};

/**
 * タスクの期間を計算（日数）
 */
const calculateTaskDuration = (task) => {
  if (!task.startDate || !task.dueDate) {
    return 1; // デフォルト1日
  }

  const start = new Date(task.startDate);
  const end = new Date(task.dueDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(diffDays, 1);
};

/**
 * 依存関係グラフを生成（表示用）
 */
export const buildDependencyGraph = (tasks) => {
  const nodes = tasks.map(task => ({
    id: task.id,
    label: task.name,
    status: task.status,
    projectName: task.projectName,
    projectColor: task.projectColor
  }));

  const edges = [];
  tasks.forEach(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        edges.push({
          from: depId,
          to: task.id,
          type: 'dependency'
        });
      });
    }
  });

  return { nodes, edges };
};

/**
 * トポロジカルソート（依存関係順に並べ替え）
 */
export const topologicalSort = (tasks) => {
  const sorted = [];
  const visited = new Set();
  const tempMark = new Set();

  const visit = (taskId) => {
    if (tempMark.has(taskId)) {
      // 循環依存
      return false;
    }
    if (visited.has(taskId)) {
      return true;
    }

    tempMark.add(taskId);

    const task = tasks.find(t => t.id === taskId);
    if (task && task.dependencies) {
      for (const depId of task.dependencies) {
        if (!visit(depId)) {
          return false;
        }
      }
    }

    tempMark.delete(taskId);
    visited.add(taskId);
    if (task) {
      sorted.push(task);
    }

    return true;
  };

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (!visit(task.id)) {
        // 循環依存がある場合は元の順序を返す
        return tasks;
      }
    }
  }

  return sorted;
};

/**
 * ガントチャート用の依存関係矢印座標を計算
 */
export const calculateDependencyArrow = (fromTask, toTask, startDate, endDate, chartWidth, rowHeight, fromIndex, toIndex) => {
  // タスクバーの位置を計算
  const chartStart = new Date(startDate).getTime();
  const chartEnd = new Date(endDate).getTime();
  const chartDuration = chartEnd - chartStart;

  const fromEnd = new Date(fromTask.dueDate).getTime();
  const toStart = new Date(toTask.startDate).getTime();

  const fromX = ((fromEnd - chartStart) / chartDuration) * chartWidth;
  const toX = ((toStart - chartStart) / chartDuration) * chartWidth;

  const fromY = fromIndex * rowHeight + rowHeight / 2;
  const toY = toIndex * rowHeight + rowHeight / 2;

  // 矢印のパスを生成
  const midX = (fromX + toX) / 2;

  return {
    path: `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`,
    fromX,
    fromY,
    toX,
    toY
  };
};

/**
 * 推奨開始日を計算
 */
export const calculateRecommendedStartDate = (task, allTasks) => {
  if (!task.dependencies || task.dependencies.length === 0) {
    return null; // 依存関係がない場合は推奨なし
  }

  let maxEndDate = null;

  task.dependencies.forEach(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    if (depTask && depTask.dueDate) {
      const endDate = new Date(depTask.dueDate);
      if (!maxEndDate || endDate > maxEndDate) {
        maxEndDate = endDate;
      }
    }
  });

  if (maxEndDate) {
    // 1日後を推奨
    const recommended = new Date(maxEndDate);
    recommended.setDate(recommended.getDate() + 1);
    return recommended.toISOString().split('T')[0];
  }

  return null;
};

/**
 * 依存関係の統計を計算
 */
export const calculateDependencyStats = (tasks) => {
  let totalDependencies = 0;
  let tasksWithDependencies = 0;
  let blockedTasks = 0;

  tasks.forEach(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      tasksWithDependencies++;
      totalDependencies += task.dependencies.length;

      const { canStart, blockedBy } = canStartTask(task, tasks);
      if (!canStart) {
        blockedTasks++;
      }
    }
  });

  return {
    totalTasks: tasks.length,
    tasksWithDependencies,
    totalDependencies,
    blockedTasks,
    averageDependencies: tasksWithDependencies > 0
      ? (totalDependencies / tasksWithDependencies).toFixed(1)
      : 0
  };
};
