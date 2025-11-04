import { useEffect, useRef } from 'react';
import {
  getLineSettings,
  saveLineSettings,
  shouldSendReport,
  generateTeamReport,
  sendLineMessage
} from '../utils/lineMessagingApiUtils';

/**
 * LINE通知スケジューラーフック
 *
 * 指定された時刻に自動でLINE通知を送信する
 */
export const useLineNotifyScheduler = (projects, routineTasks) => {
  const lastCheckRef = useRef(null);

  useEffect(() => {
    // 設定を取得
    const checkAndSend = async () => {
      const settings = getLineSettings();

      // 無効化されている場合はスキップ
      if (!settings.enabled) {
        return;
      }

      // トークンまたはメンバーが設定されていない場合はスキップ
      if (!settings.channelAccessToken || !settings.groupId || settings.selectedMembers.length === 0) {
        console.warn('LINE Messaging API: トークン、グループID、またはメンバーが設定されていません');
        return;
      }

      // 送信すべき時刻かチェック
      if (!shouldSendReport(settings.scheduledTime, settings.lastSentDate)) {
        return;
      }

      // 重複送信を防ぐため、最後のチェック時刻を確認
      const now = new Date();
      const currentMinute = `${now.getHours()}:${now.getMinutes()}`;

      if (lastCheckRef.current === currentMinute) {
        return; // 同じ分には1回だけ実行
      }
      lastCheckRef.current = currentMinute;

      console.log('LINE Messaging API: 日報を送信中...');

      try {
        // 日報を生成
        const report = generateTeamReport(
          settings.selectedMembers,
          projects,
          routineTasks,
          null // 今日の日付
        );

        // LINE Messaging APIで送信
        const result = await sendLineMessage(settings.channelAccessToken, settings.groupId, report);

        if (result.success) {
          console.log('LINE Messaging API: 日報送信成功');

          // 最終送信日時を更新
          const now = new Date();
          const dateTimeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const updatedSettings = {
            ...settings,
            lastSentDate: now.toISOString().split('T')[0],
            lastSentDateTime: dateTimeString
          };
          saveLineSettings(updatedSettings);
        } else {
          console.error('LINE Messaging API: 日報送信失敗', result.error);
        }
      } catch (error) {
        console.error('LINE Messaging API: エラーが発生しました', error);
      }
    };

    // 1分ごとにチェック
    const interval = setInterval(checkAndSend, 60000);

    // 初回チェック
    checkAndSend();

    return () => clearInterval(interval);
  }, [projects, routineTasks]);
};
