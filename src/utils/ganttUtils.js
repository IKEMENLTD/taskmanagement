/**
 * ガントチャートユーティリティ
 */

/**
 * 日付範囲を生成
 */
export const generateDateRange = (startDate, endDate, viewMode = 'month') => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  if (viewMode === 'week') {
    // 週表示：7日間
    const current = new Date(start);
    const endTime = new Date(end).getTime();

    while (current.getTime() <= endTime) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (viewMode === 'month') {
    // 月表示：日ごと
    const current = new Date(start);
    const endTime = new Date(end).getTime();

    while (current.getTime() <= endTime) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (viewMode === 'quarter') {
    // 四半期表示：週ごと
    const current = new Date(start);
    const endTime = new Date(end).getTime();

    while (current.getTime() <= endTime) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  } else if (viewMode === 'year') {
    // 年表示：月ごと（各月の1日を表示）
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();

    for (let year = startYear; year <= endYear; year++) {
      const startMonth = (year === startYear) ? start.getMonth() : 0;
      const lastMonth = (year === endYear) ? endMonth : 11;

      for (let month = startMonth; month <= lastMonth; month++) {
        dates.push(new Date(year, month, 1));
      }
    }
  }

  return dates;
};

/**
 * タスクの表示位置を計算
 */
export const calculateTaskPosition = (task, startDate, endDate, totalWidth) => {
  const chartStart = new Date(startDate).getTime();
  const chartEnd = new Date(endDate).getTime();
  const taskStart = new Date(task.startDate).getTime();
  const taskEnd = new Date(task.dueDate).getTime();

  // チャート範囲外の場合は調整
  const adjustedTaskStart = Math.max(taskStart, chartStart);
  const adjustedTaskEnd = Math.min(taskEnd, chartEnd);

  const chartDuration = chartEnd - chartStart;
  const left = ((adjustedTaskStart - chartStart) / chartDuration) * totalWidth;
  const width = ((adjustedTaskEnd - adjustedTaskStart) / chartDuration) * totalWidth;

  return {
    left: Math.max(0, left),
    width: Math.max(10, width), // 最小幅を確保
    isOutOfRange: taskStart < chartStart || taskEnd > chartEnd
  };
};

/**
 * 今日の位置を計算
 */
export const calculateTodayPosition = (startDate, endDate, totalWidth) => {
  const chartStart = new Date(startDate).getTime();
  const chartEnd = new Date(endDate).getTime();
  const today = new Date().getTime();

  if (today < chartStart || today > chartEnd) {
    return null;
  }

  const chartDuration = chartEnd - chartStart;
  const left = ((today - chartStart) / chartDuration) * totalWidth;

  return left;
};

/**
 * 日付をフォーマット
 */
export const formatDateForGantt = (date, viewMode) => {
  const d = new Date(date);

  if (viewMode === 'week' || viewMode === 'month') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } else if (viewMode === 'quarter') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } else if (viewMode === 'year') {
    return `${d.getFullYear()}/${d.getMonth() + 1}`;
  }

  return date;
};

/**
 * 日付をローカル時間でYYYY-MM-DD形式に変換
 */
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 表示期間の開始日・終了日を取得
 */
export const getViewRange = (viewMode, baseDate = new Date()) => {
  const today = new Date(baseDate);
  let startDate, endDate;

  if (viewMode === 'week') {
    // 今週の月曜日から日曜日
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(today.getFullYear(), today.getMonth(), diff);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
  } else if (viewMode === 'month') {
    // 今月の1日から末日
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    // 翌月の0日 = 今月の最終日
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    console.log('🗓️ Month View Range Debug:');
    console.log('  baseDate:', formatLocalDate(today));
    console.log('  year:', today.getFullYear());
    console.log('  month (0-indexed):', today.getMonth());
    console.log('  startDate:', formatLocalDate(startDate));
    console.log('  endDate:', formatLocalDate(endDate));
  } else if (viewMode === 'quarter') {
    // 今四半期
    const quarter = Math.floor(today.getMonth() / 3);
    startDate = new Date(today.getFullYear(), quarter * 3, 1);
    endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
  } else if (viewMode === 'year') {
    // 今年
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today.getFullYear(), 11, 31);
  }

  const result = {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate)
  };

  console.log('📅 Final Range:', result);

  return result;
};

/**
 * タスクが遅延しているか判定
 */
export const isTaskDelayed = (task) => {
  const today = new Date();
  const todayStr = formatLocalDate(today);
  return task.dueDate < todayStr && task.status !== 'completed';
};

/**
 * プロジェクトの全期間を取得
 */
export const getProjectDateRange = (projects) => {
  let minDate = null;
  let maxDate = null;

  projects.forEach(project => {
    const projectStart = new Date(project.timeline.start);
    const projectEnd = new Date(project.timeline.end);

    if (!minDate || projectStart < minDate) {
      minDate = projectStart;
    }
    if (!maxDate || projectEnd > maxDate) {
      maxDate = projectEnd;
    }

    // タスクの日付もチェック
    if (project.tasks) {
      project.tasks.forEach(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.dueDate);

        if (!minDate || taskStart < minDate) {
          minDate = taskStart;
        }
        if (!maxDate || taskEnd > maxDate) {
          maxDate = taskEnd;
        }
      });
    }
  });

  const today = new Date();
  return {
    startDate: minDate ? formatLocalDate(minDate) : formatLocalDate(today),
    endDate: maxDate ? formatLocalDate(maxDate) : formatLocalDate(today)
  };
};

/**
 * 週末かどうか判定
 */
export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
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
