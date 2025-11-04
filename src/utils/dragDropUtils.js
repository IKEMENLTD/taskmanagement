/**
 * ドラッグ&ドロップユーティリティ
 */

/**
 * ドラッグ開始時のデータを設定
 */
export const handleDragStart = (event, data) => {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/json', JSON.stringify(data));

  // ドラッグ中の要素に視覚的フィードバック
  if (event.target) {
    event.target.style.opacity = '0.5';
  }
};

/**
 * ドラッグ終了時の処理
 */
export const handleDragEnd = (event) => {
  if (event.target) {
    event.target.style.opacity = '1';
  }
};

/**
 * ドラッグオーバー時の処理
 */
export const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

/**
 * ドロップ時のデータを取得
 */
export const handleDrop = (event) => {
  event.preventDefault();

  try {
    const data = event.dataTransfer.getData('application/json');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('ドロップデータの解析に失敗しました:', error);
    return null;
  }
};

/**
 * タスクを別のプロジェクトに移動
 */
export const moveTaskToProject = (projects, taskId, sourceProjectId, targetProjectId) => {
  // 同じプロジェクトの場合は何もしない
  if (sourceProjectId === targetProjectId) {
    return projects;
  }

  // 移動するタスクを見つける
  const sourceProject = projects.find(p => p.id === sourceProjectId);
  if (!sourceProject) return projects;

  const taskToMove = sourceProject.tasks.find(t => t.id === taskId);
  if (!taskToMove) return projects;

  // 新しいプロジェクト配列を作成
  return projects.map(project => {
    if (project.id === sourceProjectId) {
      // ソースプロジェクトからタスクを削除
      return {
        ...project,
        tasks: project.tasks.filter(t => t.id !== taskId)
      };
    } else if (project.id === targetProjectId) {
      // ターゲットプロジェクトにタスクを追加
      return {
        ...project,
        tasks: [...project.tasks, taskToMove]
      };
    }
    return project;
  });
};

/**
 * タスクの順序を変更
 */
export const reorderTasks = (projects, projectId, taskId, newIndex) => {
  return projects.map(project => {
    if (project.id === projectId) {
      const tasks = [...project.tasks];
      const currentIndex = tasks.findIndex(t => t.id === taskId);

      if (currentIndex === -1) return project;

      // タスクを削除
      const [movedTask] = tasks.splice(currentIndex, 1);

      // 新しい位置に挿入
      tasks.splice(newIndex, 0, movedTask);

      return {
        ...project,
        tasks
      };
    }
    return project;
  });
};

/**
 * プロジェクトの順序を変更
 */
export const reorderProjects = (projects, projectId, newIndex) => {
  const currentIndex = projects.findIndex(p => p.id === projectId);

  if (currentIndex === -1) return projects;

  const newProjects = [...projects];
  const [movedProject] = newProjects.splice(currentIndex, 1);
  newProjects.splice(newIndex, 0, movedProject);

  return newProjects;
};

/**
 * ドラッグ可能な要素のスタイルを取得
 */
export const getDraggableStyle = (isDragging, darkMode) => {
  return {
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    transition: 'opacity 0.2s ease'
  };
};

/**
 * ドロップターゲットのスタイルを取得
 */
export const getDropTargetStyle = (isOver, darkMode) => {
  if (!isOver) return {};

  return {
    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
    borderColor: darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)',
    transition: 'all 0.2s ease'
  };
};

/**
 * ドラッグ中のプレースホルダーを表示するか判定
 */
export const shouldShowPlaceholder = (draggedItem, targetItem) => {
  return draggedItem && draggedItem.id !== targetItem.id;
};
