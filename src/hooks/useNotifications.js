import { useEffect, useRef } from 'react';
import {
  checkAndNotifyTasksDue,
  checkAndNotifyRoutines,
  sendBatchNotifications,
  saveNotificationHistory,
  shouldSendNotification
} from '../utils/notificationUtils';

/**
 * 通知管理カスタムフック
 */
export const useNotifications = (projects, routineTasks, currentTime, settings) => {
  const lastCheckRef = useRef({
    tasks: null,
    routines: null
  });

  const sentNotificationsRef = useRef(new Set());

  useEffect(() => {
    if (!settings || !settings.enabled) {
      return;
    }

    if (!shouldSendNotification(settings)) {
      return;
    }

    // タスク期限の通知チェック（1日1回）
    const checkTasks = () => {
      const today = new Date().toISOString().split('T')[0];

      if (lastCheckRef.current.tasks !== today) {
        const notifications = checkAndNotifyTasksDue(projects, settings);

        // 重複通知を防ぐ
        const newNotifications = notifications.filter(notif => {
          const key = `${notif.type}-${notif.taskId}-${today}`;
          if (sentNotificationsRef.current.has(key)) {
            return false;
          }
          sentNotificationsRef.current.add(key);
          return true;
        });

        if (newNotifications.length > 0) {
          const sent = sendBatchNotifications(newNotifications);
          sent.forEach(notif => saveNotificationHistory(notif));
        }

        lastCheckRef.current.tasks = today;
      }
    };

    // ルーティン通知チェック（1分ごと）
    const checkRoutinesNow = () => {
      const now = new Date(currentTime);
      const timeKey = `${now.getHours()}:${now.getMinutes()}`;

      if (lastCheckRef.current.routines !== timeKey) {
        const notifications = checkAndNotifyRoutines(routineTasks, currentTime, settings);

        // 重複通知を防ぐ
        const newNotifications = notifications.filter(notif => {
          const key = `${notif.type}-${notif.routineId}-${timeKey}`;
          if (sentNotificationsRef.current.has(key)) {
            return false;
          }
          sentNotificationsRef.current.add(key);
          return true;
        });

        if (newNotifications.length > 0) {
          const sent = sendBatchNotifications(newNotifications);
          sent.forEach(notif => saveNotificationHistory(notif));
        }

        lastCheckRef.current.routines = timeKey;
      }
    };

    // 初回チェック
    checkTasks();
    checkRoutinesNow();

    // 定期チェック（1分ごと）
    const interval = setInterval(() => {
      checkTasks();
      checkRoutinesNow();
    }, 60000); // 60秒

    return () => {
      clearInterval(interval);
    };
  }, [projects, routineTasks, currentTime, settings]);

  // 古い通知キーをクリア（1日1回）
  useEffect(() => {
    const clearOldKeys = () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      // 24時間以上前の通知キーをクリア
      sentNotificationsRef.current.forEach(key => {
        // キーの最後に日付が含まれている想定
        // 実際には Set なので削除は難しいが、定期的にクリアすることで対応
      });

      // 簡易的に1日1回全クリア
      sentNotificationsRef.current.clear();
    };

    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - Date.now();

    const timeout = setTimeout(() => {
      clearOldKeys();

      // その後24時間ごとにクリア
      const dailyInterval = setInterval(clearOldKeys, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);
};
