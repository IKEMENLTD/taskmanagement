/**
 * カレンダーユーティリティ
 */

/**
 * 月のカレンダーグリッドを生成（週の開始日を含む）
 */
export const generateMonthCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay(); // 0 = 日曜日
  const daysInMonth = lastDay.getDate();

  const calendar = [];
  let week = [];

  // 前月の日付で埋める
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    week.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
      isPrevMonth: true
    });
  }

  // 当月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    week.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
      isPrevMonth: false
    });

    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  // 次月の日付で埋める
  if (week.length > 0) {
    let nextMonthDay = 1;
    while (week.length < 7) {
      week.push({
        date: new Date(year, month + 1, nextMonthDay),
        isCurrentMonth: false,
        isPrevMonth: false
      });
      nextMonthDay++;
    }
    calendar.push(week);
  }

  return calendar;
};

/**
 * 週のカレンダーを生成
 */
export const generateWeekCalendar = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day; // 週の日曜日

  const week = [];
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(current);
    weekDate.setDate(diff + i);
    week.push({
      date: weekDate,
      isCurrentMonth: true,
      isPrevMonth: false
    });
  }

  return week;
};

/**
 * 日付の文字列を取得
 */
export const getDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * 今日かどうか判定
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return today.getFullYear() === checkDate.getFullYear() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getDate() === checkDate.getDate();
};

/**
 * 週末かどうか判定
 */
export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

/**
 * 日付のタスクとルーティンを取得
 */
export const getEventsForDate = (date, projects, routineTasks) => {
  const dateStr = getDateString(date);

  // タスク
  const tasks = [];
  projects.forEach(project => {
    if (project.tasks) {
      project.tasks.forEach(task => {
        // 開始日、期限、完了日が該当日の場合
        if (task.startDate === dateStr || task.dueDate === dateStr || task.completedDate === dateStr) {
          tasks.push({
            ...task,
            projectName: project.name,
            projectColor: project.color,
            type: 'task'
          });
        }
      });
    }
  });

  // ルーティン
  const routines = routineTasks[dateStr] || [];
  const routineEvents = routines.map(routine => ({
    ...routine,
    type: 'routine'
  }));

  return [...tasks, ...routineEvents];
};

/**
 * 月の名前を取得
 */
export const getMonthName = (year, month) => {
  const date = new Date(year, month);
  return `${year}年${month + 1}月`;
};

/**
 * 週の範囲を取得
 */
export const getWeekRange = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day;

  const start = new Date(current);
  start.setDate(diff);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: getDateString(start),
    end: getDateString(end)
  };
};

/**
 * 曜日の名前を取得
 */
export const getDayName = (dayIndex) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayIndex];
};

/**
 * イベントの色を取得
 */
export const getEventColor = (event) => {
  if (event.type === 'task') {
    return event.projectColor || '#3b82f6';
  } else if (event.type === 'routine') {
    if (event.completed) return '#10b981'; // 緑
    if (event.category === 'work') return '#3b82f6'; // 青
    if (event.category === 'health') return '#f59e0b'; // オレンジ
    return '#8b5cf6'; // 紫
  }
  return '#6b7280'; // グレー
};

/**
 * イベントの優先度で並べ替え
 */
export const sortEventsByPriority = (events) => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  return events.sort((a, b) => {
    // ルーティンは時刻順
    if (a.type === 'routine' && b.type === 'routine') {
      return (a.time || '').localeCompare(b.time || '');
    }

    // タスクは優先度順
    if (a.type === 'task' && b.type === 'task') {
      const aPriority = priorityOrder[a.priority] ?? 4;
      const bPriority = priorityOrder[b.priority] ?? 4;
      return aPriority - bPriority;
    }

    // ルーティンをタスクの前に
    if (a.type === 'routine') return -1;
    if (b.type === 'routine') return 1;

    return 0;
  });
};

/**
 * 月を移動
 */
export const navigateMonth = (year, month, direction) => {
  if (direction === 'next') {
    if (month === 11) {
      return { year: year + 1, month: 0 };
    }
    return { year, month: month + 1 };
  } else {
    if (month === 0) {
      return { year: year - 1, month: 11 };
    }
    return { year, month: month - 1 };
  }
};

/**
 * 週を移動
 */
export const navigateWeek = (date, direction) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
  return newDate;
};
