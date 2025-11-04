/**
 * 通知ユーティリティ
 */

/**
 * 通知権限をリクエスト
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * 通知権限の状態を取得
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * ブラウザ通知を送信
 */
export const sendNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('通知権限が許可されていません');
    return null;
  }

  const defaultOptions = {
    icon: '/icon-192x192.png', // アプリアイコン
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);

    // 通知クリック時の処理
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();

      if (options.onClick) {
        options.onClick();
      }
    };

    return notification;
  } catch (error) {
    console.error('通知の送信に失敗しました:', error);
    return null;
  }
};

/**
 * タスク期限の通知を作成
 */
export const createTaskDueNotification = (task, projectName) => {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = task.dueDate;

  if (!dueDate || task.status === 'completed') {
    return null;
  }

  // 期限当日
  if (dueDate === today) {
    return {
      title: '📅 タスク期限：今日',
      body: `「${task.name}」の期限は今日です！\nプロジェクト: ${projectName}`,
      tag: `task-due-${task.id}`,
      data: { taskId: task.id, type: 'task-due' }
    };
  }

  // 期限超過
  if (dueDate < today) {
    const daysOverdue = Math.floor((new Date(today) - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return {
      title: '⚠️ タスク期限超過',
      body: `「${task.name}」は${daysOverdue}日超過しています\nプロジェクト: ${projectName}`,
      tag: `task-overdue-${task.id}`,
      data: { taskId: task.id, type: 'task-overdue' }
    };
  }

  // 期限1日前
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dueDate === tomorrowStr) {
    return {
      title: '⏰ タスク期限：明日',
      body: `「${task.name}」の期限は明日です\nプロジェクト: ${projectName}`,
      tag: `task-tomorrow-${task.id}`,
      data: { taskId: task.id, type: 'task-tomorrow' }
    };
  }

  return null;
};

/**
 * ルーティン通知を作成
 */
export const createRoutineNotification = (routine, time) => {
  if (routine.completed) {
    return null;
  }

  return {
    title: '📋 ルーティンタスク',
    body: `「${routine.title}」の時間です\n時刻: ${time || '未設定'}`,
    tag: `routine-${routine.id}`,
    data: { routineId: routine.id, type: 'routine' }
  };
};

/**
 * プロジェクトの進捗通知を作成
 */
export const createProjectProgressNotification = (project) => {
  if (project.progress === 100) {
    return {
      title: '🎉 プロジェクト完了',
      body: `「${project.name}」が完了しました！`,
      tag: `project-complete-${project.id}`,
      data: { projectId: project.id, type: 'project-complete' }
    };
  }

  // マイルストーン通知（25%, 50%, 75%）
  const milestones = [25, 50, 75];
  if (milestones.includes(project.progress)) {
    return {
      title: `📊 プロジェクト進捗: ${project.progress}%`,
      body: `「${project.name}」が${project.progress}%完了しました`,
      tag: `project-progress-${project.id}-${project.progress}`,
      data: { projectId: project.id, type: 'project-progress' }
    };
  }

  return null;
};

/**
 * 全タスクの期限チェックと通知
 */
export const checkAndNotifyTasksDue = (projects, settings = {}) => {
  if (!settings.enableTaskReminders) {
    return [];
  }

  const notifications = [];

  projects.forEach(project => {
    if (!project.tasks) return;

    project.tasks.forEach(task => {
      const notification = createTaskDueNotification(task, project.name);
      if (notification) {
        notifications.push({
          ...notification,
          projectId: project.id,
          projectName: project.name,
          taskId: task.id
        });
      }
    });
  });

  return notifications;
};

/**
 * ルーティンの時刻チェックと通知
 */
export const checkAndNotifyRoutines = (routineTasks, currentTime, settings = {}) => {
  if (!settings.enableRoutineReminders) {
    return [];
  }

  const now = new Date(currentTime);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = now.toISOString().split('T')[0];

  const todayRoutines = routineTasks[todayStr] || [];
  const notifications = [];

  todayRoutines.forEach(routine => {
    if (routine.time && !routine.completed) {
      const [hour, minute] = routine.time.split(':').map(Number);

      // 開始時刻の前後5分以内
      const minutesDiff = (currentHour * 60 + currentMinute) - (hour * 60 + minute);

      if (minutesDiff >= -5 && minutesDiff <= 5) {
        const notification = createRoutineNotification(routine, routine.time);
        if (notification) {
          notifications.push({
            ...notification,
            routineId: routine.id,
            time: routine.time
          });
        }
      }
    }
  });

  return notifications;
};

/**
 * 通知を一括送信
 */
export const sendBatchNotifications = (notifications) => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('通知権限が許可されていません');
    return [];
  }

  const sentNotifications = [];

  notifications.forEach(notif => {
    const sent = sendNotification(notif.title, {
      body: notif.body,
      tag: notif.tag,
      data: notif.data
    });

    if (sent) {
      sentNotifications.push({
        ...notif,
        sentAt: new Date().toISOString()
      });
    }
  });

  return sentNotifications;
};

/**
 * 通知履歴を管理（LocalStorage）
 */
export const saveNotificationHistory = (notification) => {
  try {
    const history = getNotificationHistory();
    history.unshift({
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });

    // 最新100件のみ保持
    const trimmed = history.slice(0, 100);
    localStorage.setItem('notificationHistory', JSON.stringify(trimmed));
  } catch (error) {
    console.error('通知履歴の保存に失敗しました:', error);
  }
};

/**
 * 通知履歴を取得
 */
export const getNotificationHistory = () => {
  try {
    const history = localStorage.getItem('notificationHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('通知履歴の取得に失敗しました:', error);
    return [];
  }
};

/**
 * 通知履歴をクリア
 */
export const clearNotificationHistory = () => {
  try {
    localStorage.removeItem('notificationHistory');
  } catch (error) {
    console.error('通知履歴のクリアに失敗しました:', error);
  }
};

/**
 * デフォルト通知設定
 */
export const defaultNotificationSettings = {
  enabled: false,
  enableTaskReminders: true,
  enableRoutineReminders: true,
  enableProjectMilestones: true,
  taskReminderTiming: 'day-of', // 'day-before', 'day-of', 'both'
  routineReminderAdvance: 5, // 分前
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
};

/**
 * サイレント時間帯かチェック
 */
export const isQuietHours = (settings) => {
  if (!settings.quietHoursEnabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const start = settings.quietHoursStart;
  const end = settings.quietHoursEnd;

  // 日をまたぐ場合の処理
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  return currentTime >= start && currentTime <= end;
};

/**
 * 通知を送信すべきかチェック
 */
export const shouldSendNotification = (settings) => {
  if (!settings.enabled) {
    return false;
  }

  if (getNotificationPermission() !== 'granted') {
    return false;
  }

  if (isQuietHours(settings)) {
    return false;
  }

  return true;
};
