/**
 * 一括操作ユーティリティ
 */

/**
 * 複数のタスクのステータスを一括変更
 */
export const bulkUpdateStatus = (projects, taskIds, newStatus) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(task =>
      taskIds.includes(task.id)
        ? { ...task, status: newStatus }
        : task
    )
  }));
};

/**
 * 複数のタスクの担当者を一括変更
 */
export const bulkUpdateAssignee = (projects, taskIds, newAssignee) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(task =>
      taskIds.includes(task.id)
        ? { ...task, assignee: newAssignee }
        : task
    )
  }));
};

/**
 * 複数のタスクの優先度を一括変更
 */
export const bulkUpdatePriority = (projects, taskIds, newPriority) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(task =>
      taskIds.includes(task.id)
        ? { ...task, priority: newPriority }
        : task
    )
  }));
};

/**
 * 複数のタスクを一括削除
 */
export const bulkDeleteTasks = (projects, taskIds) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.filter(task => !taskIds.includes(task.id))
  }));
};

/**
 * 複数のタスクを別のプロジェクトに一括移動
 */
export const bulkMoveTasksToProject = (projects, taskIds, targetProjectId) => {
  // 移動するタスクを収集
  const tasksToMove = [];

  projects.forEach(project => {
    project.tasks.forEach(task => {
      if (taskIds.includes(task.id)) {
        tasksToMove.push(task);
      }
    });
  });

  // プロジェクトを更新
  return projects.map(project => {
    if (project.id === targetProjectId) {
      // ターゲットプロジェクトにタスクを追加
      return {
        ...project,
        tasks: [...project.tasks, ...tasksToMove]
      };
    } else {
      // 他のプロジェクトからタスクを削除
      return {
        ...project,
        tasks: project.tasks.filter(task => !taskIds.includes(task.id))
      };
    }
  });
};

/**
 * 複数のタスクの期限を一括変更
 */
export const bulkUpdateDueDate = (projects, taskIds, newDueDate) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(task =>
      taskIds.includes(task.id)
        ? { ...task, dueDate: newDueDate }
        : task
    )
  }));
};

/**
 * 複数のタスクにタグを一括追加
 */
export const bulkAddTags = (projects, taskIds, tags) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(task => {
      if (taskIds.includes(task.id)) {
        const existingTags = task.tags || [];
        const newTags = [...new Set([...existingTags, ...tags])];
        return { ...task, tags: newTags };
      }
      return task;
    })
  }));
};

/**
 * 複数のタスクからタグを一括削除
 */
export const bulkRemoveTags = (projects, taskIds, tags) => {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(task => {
      if (taskIds.includes(task.id)) {
        const existingTags = task.tags || [];
        const newTags = existingTags.filter(tag => !tags.includes(tag));
        return { ...task, tags: newTags };
      }
      return task;
    })
  }));
};

/**
 * 選択可能なタスクの総数を取得
 */
export const getTotalTaskCount = (projects) => {
  return projects.reduce((total, project) => total + project.tasks.length, 0);
};

/**
 * 選択されたタスクを取得
 */
export const getSelectedTasks = (projects, taskIds) => {
  const tasks = [];

  projects.forEach(project => {
    project.tasks.forEach(task => {
      if (taskIds.includes(task.id)) {
        tasks.push({
          ...task,
          projectId: project.id,
          projectName: project.name
        });
      }
    });
  });

  return tasks;
};

/**
 * プロジェクトごとの選択タスク数を取得
 */
export const getSelectedTasksByProject = (projects, taskIds) => {
  const result = {};

  projects.forEach(project => {
    const selectedCount = project.tasks.filter(task =>
      taskIds.includes(task.id)
    ).length;

    if (selectedCount > 0) {
      result[project.id] = {
        projectName: project.name,
        count: selectedCount
      };
    }
  });

  return result;
};
