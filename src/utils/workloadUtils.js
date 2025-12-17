/**
 * チームメンバーの負荷率計算ユーティリティ
 */

/**
 * 今日の日付を YYYY-MM-DD 形式で取得
 * @returns {string}
 */
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * メンバーが担当しているタスクを取得
 * @param {string} memberName - メンバー名
 * @param {Array} projects - プロジェクト一覧
 * @returns {Array} 担当タスク一覧
 */
export const getMemberTasks = (memberName, projects, excludePending = true) => {
  const tasks = [];
  projects.forEach(project => {
    // 保留中のプロジェクトは除外
    if (excludePending && project.status === 'pending') return;

    (project.tasks || []).forEach(task => {
      // 保留中タスクは除外
      if (excludePending && task.status === 'pending') return;

      if (task.assignee === memberName) {
        tasks.push({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        });
      }
    });
  });
  return tasks;
};

/**
 * メンバーが担当しているプロジェクトを取得
 * @param {string} memberName - メンバー名
 * @param {Array} projects - プロジェクト一覧
 * @returns {Array} 担当プロジェクト一覧（重複なし）
 */
export const getMemberProjects = (memberName, projects) => {
  const projectMap = new Map();

  projects.forEach(project => {
    const hasMemberTask = (project.tasks || []).some(
      task => task.assignee === memberName
    );
    if (hasMemberTask && !projectMap.has(project.id)) {
      projectMap.set(project.id, {
        id: project.id,
        name: project.name,
        color: project.color,
        status: project.status
      });
    }
  });

  return Array.from(projectMap.values());
};

/**
 * メンバーが担当しているルーティンを取得（今日実行するもの）
 * @param {string} memberName - メンバー名
 * @param {Array} routines - ルーティン一覧
 * @returns {Array} 担当ルーティン一覧
 */
export const getMemberRoutines = (memberName, routines) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=日, 1=月, ..., 6=土

  return (routines || []).filter(routine => {
    if (routine.assignee !== memberName) return false;

    // 繰り返し設定に基づいて今日実行するかを判定
    switch (routine.repeat) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekend':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'custom':
        return (routine.selectedDays || []).includes(dayOfWeek);
      default:
        return true;
    }
  });
};

/**
 * スケジュールの重複を検出
 * @param {Array} tasks - タスク一覧
 * @returns {Object} { overlappingDates: 重複日付マップ, maxOverlap: 最大重複数 }
 */
export const detectScheduleOverlaps = (tasks) => {
  const today = getTodayString();
  const dueDateMap = new Map();

  // 未完了タスクの期限日をカウント
  tasks
    .filter(task => task.status !== 'completed' && task.dueDate)
    .forEach(task => {
      const dueDate = task.dueDate;
      if (!dueDateMap.has(dueDate)) {
        dueDateMap.set(dueDate, []);
      }
      dueDateMap.get(dueDate).push(task);
    });

  // 2件以上重複している日付を抽出
  const overlappingDates = new Map();
  let maxOverlap = 0;

  dueDateMap.forEach((tasksOnDate, date) => {
    if (tasksOnDate.length >= 2) {
      overlappingDates.set(date, tasksOnDate);
      maxOverlap = Math.max(maxOverlap, tasksOnDate.length);
    }
  });

  return { overlappingDates, maxOverlap };
};

/**
 * 期限切れタスクを取得
 * @param {Array} tasks - タスク一覧
 * @returns {Array} 期限切れタスク一覧
 */
export const getOverdueTasks = (tasks) => {
  const today = getTodayString();

  return tasks.filter(task =>
    task.status !== 'completed' &&
    task.dueDate &&
    task.dueDate < today
  );
};

/**
 * 本日期限のタスクを取得
 * @param {Array} tasks - タスク一覧
 * @returns {Array} 本日期限のタスク一覧
 */
export const getTodayDueTasks = (tasks) => {
  const today = getTodayString();

  return tasks.filter(task =>
    task.status !== 'completed' &&
    task.dueDate === today
  );
};

/**
 * メンバーの負荷率を計算
 * @param {string} memberName - メンバー名
 * @param {Array} projects - プロジェクト一覧
 * @param {Array} routines - ルーティン一覧
 * @returns {Object} 負荷情報
 */
export const calculateMemberWorkload = (memberName, projects, routines) => {
  // 担当タスク・プロジェクト・ルーティンを取得
  const memberTasks = getMemberTasks(memberName, projects);
  const memberProjects = getMemberProjects(memberName, projects);
  const memberRoutines = getMemberRoutines(memberName, routines);

  // 未完了タスクのみをカウント
  const activeTasks = memberTasks.filter(task => task.status !== 'completed');

  // スケジュール重複を検出
  const { overlappingDates, maxOverlap } = detectScheduleOverlaps(memberTasks);

  // 期限切れ・本日期限を取得
  const overdueTasks = getOverdueTasks(memberTasks);
  const todayDueTasks = getTodayDueTasks(memberTasks);

  // 負荷率計算
  // 基礎負荷: タスク数 × 10 + ルーティン数 × 5
  const baseLoad = (activeTasks.length * 10) + (memberRoutines.length * 5);

  // 本日期限ペナルティ: 本日期限タスク × 10
  const todayDuePenalty = todayDueTasks.length * 10;

  // 合計（最大100%）
  const totalLoad = Math.min(100, baseLoad + todayDuePenalty);

  // 稼働状態を自動判定
  let availability = 'available';
  if (totalLoad >= 80) {
    availability = 'busy';
  }

  return {
    // 集計数
    projectCount: memberProjects.length,
    taskCount: activeTasks.length,
    routineCount: memberRoutines.length,

    // 詳細データ
    projects: memberProjects,
    tasks: memberTasks,
    activeTasks,
    routines: memberRoutines,

    // 問題検出
    overdueTasks,
    todayDueTasks,
    overlappingDates: Array.from(overlappingDates.entries()).map(([date, tasks]) => ({
      date,
      tasks,
      count: tasks.length
    })),
    maxOverlap,

    // 負荷計算の内訳
    loadBreakdown: {
      baseLoad,
      todayDuePenalty
    },

    // 最終結果
    load: totalLoad,
    availability
  };
};

/**
 * 全メンバーの負荷情報を計算
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {Array} projects - プロジェクト一覧
 * @param {Array} routines - ルーティン一覧
 * @returns {Array} メンバーごとの負荷情報
 */
export const calculateTeamWorkload = (teamMembers, projects, routines) => {
  return teamMembers.map(member => ({
    ...member,
    workload: calculateMemberWorkload(member.name, projects, routines)
  }));
};

/**
 * 負荷率に応じた色を取得
 * @param {number} load - 負荷率
 * @param {boolean} darkMode - ダークモードフラグ
 * @returns {string} Tailwind CSSクラス
 */
export const getLoadColor = (load, darkMode = false) => {
  if (load >= 80) return darkMode ? 'text-red-400' : 'text-red-500';
  if (load >= 60) return darkMode ? 'text-orange-400' : 'text-orange-500';
  if (load >= 40) return darkMode ? 'text-yellow-400' : 'text-yellow-500';
  return darkMode ? 'text-green-400' : 'text-green-500';
};

/**
 * 負荷率に応じた背景色を取得
 * @param {number} load - 負荷率
 * @returns {string} Tailwind CSSクラス
 */
export const getLoadBgColor = (load) => {
  if (load >= 80) return 'bg-red-500';
  if (load >= 60) return 'bg-orange-500';
  if (load >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * 負荷状態のラベルを取得
 * @param {number} load - 負荷率
 * @returns {string} ラベル
 */
export const getLoadLabel = (load) => {
  if (load >= 80) return '高負荷';
  if (load >= 60) return 'やや高負荷';
  if (load >= 40) return '適正';
  return '余裕あり';
};
