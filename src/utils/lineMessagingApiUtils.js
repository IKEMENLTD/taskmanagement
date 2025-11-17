/**
 * LINE Messaging API ユーティリティ
 */

import { supabase } from '../lib/supabase';

// Vercel Functionsのエンドポイント
// ローカル開発時は 'http://localhost:3000/api/send-line-message'
// 本番環境では '/api/send-line-message'（相対パス）
const API_ENDPOINT = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api/send-line-message'
  : '/api/send-line-message';

/**
 * LINE Messaging APIでメッセージを送信（サーバーレス関数経由）
 */
export const sendLineMessage = async (channelAccessToken, groupId, message) => {
  if (!channelAccessToken || !groupId || !message) {
    throw new Error('Channel Access Token、Group ID、メッセージは必須です');
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelAccessToken,
        groupId,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'LINE メッセージ送信に失敗しました');
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('LINE Messaging API送信エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * メンバー別の日報を生成（プロジェクトベース）
 */
export const generateMemberReport = (member, projects, routineTasks, date) => {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const today = new Date(dateStr);
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // プロジェクトごとにメンバーのタスクを整理
  const projectTasksMap = {};
  let totalCompleted = 0;
  let totalActive = 0;
  let totalBlocked = 0;

  projects.forEach(project => {
    const memberTasksInProject = project.tasks.filter(task => task.assignee === member);

    if (memberTasksInProject.length > 0) {
      const completed = memberTasksInProject.filter(t =>
        t.status === 'completed' && t.completedDate === dateStr
      );
      const active = memberTasksInProject.filter(t => t.status === 'active');
      const blocked = memberTasksInProject.filter(t => t.status === 'blocked');

      totalCompleted += completed.length;
      totalActive += active.length;
      totalBlocked += blocked.length;

      projectTasksMap[project.id] = {
        projectName: project.name,
        projectProgress: project.progress,
        projectColor: project.color,
        completed,
        active,
        blocked
      };
    }
  });

  // ルーティンの完了状況
  const todayRoutines = routineTasks[dateStr] || [];
  const memberRoutines = todayRoutines.filter(r => r.assignee === member);
  const completedRoutines = memberRoutines.filter(r => r.completed);
  const routineRate = memberRoutines.length > 0
    ? Math.round((completedRoutines.length / memberRoutines.length) * 100)
    : 0;

  // タスクが全くない場合は簡潔に表示
  if (Object.keys(projectTasksMap).length === 0 && memberRoutines.length === 0) {
    return `\n【${member}さん】\n担当タスクなし\n`;
  }

  // レポート生成
  let report = `\n【${member}さん】\n`;

  // プロジェクトごとにタスクを表示
  Object.values(projectTasksMap).forEach(projectData => {
    report += `\n📁 ${projectData.projectName} (進捗 ${projectData.projectProgress}%)\n`;

    // 本日完了
    if (projectData.completed.length > 0) {
      report += `  ✅ 本日完了:\n`;
      projectData.completed.forEach(task => {
        report += `    - ${task.name}`;
        // 最新のコメントがあれば追加
        if (task.comments && task.comments.length > 0) {
          const latestComment = task.comments[task.comments.length - 1];
          report += ` [コメント: ${latestComment.text}]`;
        }
        report += `\n`;
      });
    }

    // 進行中
    if (projectData.active.length > 0) {
      report += `  🔄 進行中:\n`;
      projectData.active.forEach(task => {
        const priority = task.priority === 'urgent' ? '🔴' :
                         task.priority === 'high' ? '🟠' :
                         task.priority === 'medium' ? '🟡' : '🟢';
        report += `    ${priority} ${task.name} (${task.progress}%)`;
        if (task.dueDate) {
          report += ` 期限:${task.dueDate}`;
        }
        // 最新のコメントがあれば追加
        if (task.comments && task.comments.length > 0) {
          const latestComment = task.comments[task.comments.length - 1];
          report += ` [コメント: ${latestComment.text}]`;
        }
        report += `\n`;
      });
    }

    // ブロック中
    if (projectData.blocked.length > 0) {
      report += `  ⚠️ ブロック中:\n`;
      projectData.blocked.forEach(task => {
        report += `    - ${task.name}`;
        // 最新のコメントがあれば追加
        if (task.comments && task.comments.length > 0) {
          const latestComment = task.comments[task.comments.length - 1];
          report += ` [コメント: ${latestComment.text}]`;
        }
        report += `\n`;
      });
    }
  });

  // ルーティン達成率
  if (memberRoutines.length > 0) {
    const emoji = routineRate >= 80 ? '🎉' : routineRate >= 50 ? '👍' : '💪';
    report += `\n${emoji} ルーティン達成率: ${routineRate}%`;
    report += ` (${completedRoutines.length}/${memberRoutines.length}件)\n`;
  }

  // サマリー
  const totalTasks = totalCompleted + totalActive + totalBlocked;
  const completedRate = totalTasks > 0
    ? Math.round((totalCompleted / totalTasks) * 100)
    : 0;

  report += `\n📈 サマリー\n`;
  report += `タスク総数: ${totalTasks}件\n`;
  report += `本日完了: ${totalCompleted}件 | 進行中: ${totalActive}件`;
  if (totalBlocked > 0) {
    report += ` | ブロック: ${totalBlocked}件`;
  }
  report += `\n`;

  return report;
};

/**
 * チーム全体の日報を生成
 */
export const generateTeamReport = (selectedMembers, projects, routineTasks, date) => {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const today = new Date(dateStr);
  const todayStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

  let report = `📊 日報 ${todayStr}\n`;
  report += `━━━━━━━━━━━\n`;

  // 各メンバーのレポートを追加
  selectedMembers.forEach((member, index) => {
    report += generateMemberReport(member, projects, routineTasks, dateStr);
    if (index < selectedMembers.length - 1) {
      report += `\n━━━━━━━━━━━\n`;
    }
  });

  // フッター
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  report += `\n━━━━━━━━━━━\n`;
  report += `🤖 4次元PM | ${timeStr}\n`;

  return report;
};

/**
 * LINE Messaging API設定を保存（Supabase）
 */
export const saveLineSettings = async (organizationId, settings) => {
  try {
    // デバッグ情報
    console.log('[saveLineSettings] organizationId:', organizationId);
    console.log('[saveLineSettings] settings:', settings);

    if (!organizationId) {
      throw new Error('organizationIdが指定されていません。ユーザーが組織に所属していない可能性があります。');
    }

    const { data: existingSettings, error: selectError } = await supabase
      .from('line_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    // PGRST116 = データが見つからない（正常）、それ以外はエラー
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[saveLineSettings] 既存設定の取得エラー:', selectError);
      throw new Error(`既存設定の取得に失敗: ${selectError.message} (code: ${selectError.code})`);
    }

    const settingsData = {
      organization_id: organizationId,
      enabled: settings.enabled || false,
      channel_access_token: settings.channelAccessToken || '',
      group_id: settings.groupId || '',
      scheduled_time: settings.scheduledTime || '18:30',
      selected_members: settings.selectedMembers || [],
      last_sent_date: settings.lastSentDate || null
    };

    console.log('[saveLineSettings] settingsData:', settingsData);

    let result;
    if (existingSettings) {
      // 更新
      console.log('[saveLineSettings] 既存設定を更新します');
      result = await supabase
        .from('line_settings')
        .update(settingsData)
        .eq('organization_id', organizationId);
    } else {
      // 新規作成
      console.log('[saveLineSettings] 新規設定を作成します');
      result = await supabase
        .from('line_settings')
        .insert([settingsData]);
    }

    console.log('[saveLineSettings] result:', result);

    if (result.error) {
      console.error('[saveLineSettings] 保存エラー:', result.error);
      throw new Error(`保存エラー: ${result.error.message} (code: ${result.error.code})`);
    }

    console.log('[saveLineSettings] 保存成功（Supabaseのみに保存）');
    return { success: true };
  } catch (error) {
    console.error('[saveLineSettings] エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * LINE Messaging API設定を取得（Supabase）
 */
export const getLineSettings = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('line_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = データが見つからない
      throw error;
    }

    if (data) {
      return {
        enabled: data.enabled || false,
        channelAccessToken: data.channel_access_token || '',
        groupId: data.group_id || '',
        scheduledTime: data.scheduled_time || '18:30',
        selectedMembers: data.selected_members || [],
        lastSentDate: data.last_sent_date || null
      };
    }

    // データがない場合はlocalStorageから取得を試みる（マイグレーション用・初回のみ）
    const localSettings = localStorage.getItem('lineMessagingApiSettings');
    if (localSettings) {
      console.log('[getLineSettings] localStorageからSupabaseへマイグレーション中...');
      const parsed = JSON.parse(localSettings);
      // localStorageからSupabaseに移行
      await saveLineSettings(organizationId, parsed);
      // マイグレーション完了後、localStorageから削除
      localStorage.removeItem('lineMessagingApiSettings');
      console.log('[getLineSettings] マイグレーション完了、localStorageを削除しました');
      return parsed;
    }

    // デフォルト値
    return {
      enabled: false,
      channelAccessToken: '',
      groupId: '',
      scheduledTime: '18:30',
      selectedMembers: [],
      lastSentDate: null
    };
  } catch (error) {
    console.error('LINE設定の取得に失敗しました:', error);

    // デフォルト値を返す
    return {
      enabled: false,
      channelAccessToken: '',
      groupId: '',
      scheduledTime: '18:30',
      selectedMembers: [],
      lastSentDate: null
    };
  }
};

/**
 * テスト送信
 */
export const sendTestMessage = async (channelAccessToken, groupId, memberName) => {
  const message = `\n━━━━━━━━━━━━━━━━\n✅ テスト送信成功！\n━━━━━━━━━━━━━━━━\n\n4次元プロジェクト管理システムからのLINE通知が正常に設定されました。\n\n毎日指定された時刻に${memberName || '選択されたメンバー'}の日報が自動送信されます。\n\n🔔 無料枠: 月200通まで\n現在の送信数は LINE Developers で確認できます。`;

  return await sendLineMessage(channelAccessToken, groupId, message);
};

/**
 * 送信時刻をチェック
 */
export const shouldSendReport = (scheduledTime, lastSentDate) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // 今日既に送信済みの場合はスキップ
  if (lastSentDate === today) {
    console.log('[LINE通知] 今日は既に送信済みです');
    return false;
  }

  // 現在時刻と設定時刻を分単位で比較
  const [schedHour, schedMin] = scheduledTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  // 設定時刻を分に変換
  const scheduledMinutes = schedHour * 60 + schedMin;
  const currentMinutes = currentHour * 60 + currentMin;

  // 設定時刻を過ぎていて、まだ送信していない場合に送信
  const shouldSend = currentMinutes >= scheduledMinutes;

  if (shouldSend) {
    console.log(`[LINE通知] 送信時刻になりました (設定: ${scheduledTime}, 現在: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')})`);
  }

  return shouldSend;
};
