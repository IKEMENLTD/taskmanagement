import { useEffect, useRef, useMemo } from 'react';
import {
  getLineSettings,
  saveLineSettings,
  shouldSendReport,
  generateTeamReport,
  sendLineMessage
} from '../utils/lineMessagingApiUtils';
import { useAuth } from '../contexts/AuthContext';

/**
 * LINE通知スケジューラーフック
 *
 * 指定された時刻に自動でLINE通知を送信する
 */
export const useLineNotifyScheduler = (projects, routineTasks) => {
  const lastCheckRef = useRef(null);
  const { user } = useAuth();

  // プロジェクトまたはユーザーIDから組織IDを取得
  const organizationId = useMemo(() => {
    // プロジェクトから組織IDを取得
    if (projects && projects.length > 0 && projects[0].organization_id) {
      return projects[0].organization_id;
    }
    // プロジェクトがない、または組織IDがない場合はユーザーIDを使用
    return user?.id || null;
  }, [projects, user]);

  useEffect(() => {
    // organizationIdがない場合は処理をスキップ
    if (!organizationId) {
      return;
    }

    // 設定を取得
    const checkAndSend = async () => {
      const settings = await getLineSettings(organizationId);

      // 無効化されている場合はスキップ
      if (!settings.enabled) {
        return;
      }

      // トークンまたはメンバーが設定されていない場合はスキップ
      if (!settings.channelAccessToken || !settings.groupId || settings.selectedMembers.length === 0) {
        console.warn('[LINE通知] トークン、グループID、またはメンバーが設定されていません');
        return;
      }

      console.log(`[LINE通知] チェック実行 - 設定時刻: ${settings.scheduledTime}, 最終送信日: ${settings.lastSentDate || 'なし'}`);

      // 送信すべき時刻かチェック
      if (!shouldSendReport(settings.scheduledTime, settings.lastSentDate)) {
        return;
      }

      // 重複送信を防ぐため、最後のチェック時刻を確認
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentMinute = `${today}_${now.getHours()}:${now.getMinutes()}`;

      if (lastCheckRef.current === currentMinute) {
        console.log('[LINE通知] 同じ分で既にチェック済みのためスキップ');
        return; // 同じ分には1回だけ実行
      }
      lastCheckRef.current = currentMinute;

      console.log('[LINE通知] 日報を送信中...');

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
          console.log('[LINE通知] ✅ 日報送信成功');

          // 最終送信日時を更新
          const now = new Date();
          const dateTimeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const updatedSettings = {
            ...settings,
            lastSentDate: now.toISOString().split('T')[0],
            lastSentDateTime: dateTimeString
          };
          await saveLineSettings(organizationId, updatedSettings);
          console.log(`[LINE通知] 最終送信日時を更新: ${dateTimeString}`);
        } else {
          console.error('[LINE通知] ❌ 日報送信失敗:', result.error);
        }
      } catch (error) {
        console.error('[LINE通知] ❌ エラーが発生しました:', error);
      }
    };

    // 1分ごとにチェック
    const interval = setInterval(checkAndSend, 60000);

    // 初回チェック
    console.log('[LINE通知] スケジューラー起動 - 1分ごとにチェックを開始');
    checkAndSend();

    return () => {
      console.log('[LINE通知] スケジューラー停止');
      clearInterval(interval);
    };
  }, [projects, routineTasks, organizationId]);
};
