/**
 * LINE Messaging API ユーティリティ
 */

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
 * メンバー別の日報を生成
 */
export const generateMemberReport = (member, projects, routineTasks, date) => {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const today = new Date(dateStr);
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // メンバーのタスクを抽出
  const memberTasks = [];
  projects.forEach(project => {
    project.tasks.forEach(task => {
      if (task.assignee === member) {
        memberTasks.push({
          ...task,
          projectName: project.name,
          projectColor: project.color
        });
      }
    });
  });

  // ステータス別に集計
  const activeTasks = memberTasks.filter(t => t.status === 'active');
  const completedTasks = memberTasks.filter(t => {
    if (t.status === 'completed' && t.completedDate) {
      return t.completedDate === dateStr;
    }
    return false;
  });
  const blockedTasks = memberTasks.filter(t => t.status === 'blocked');

  // ルーティンの完了状況
  const todayRoutines = routineTasks[dateStr] || [];
  const memberRoutines = todayRoutines.filter(r => r.assignee === member);
  const completedRoutines = memberRoutines.filter(r => r.completed);
  const routineRate = memberRoutines.length > 0
    ? Math.round((completedRoutines.length / memberRoutines.length) * 100)
    : 0;

  // タスクが全くない場合は簡潔に表示
  if (memberTasks.length === 0 && memberRoutines.length === 0) {
    return `\n【${member}さん】\n担当タスクなし\n`;
  }

  // レポート生成
  let report = `\n【${member}さん】\n`;

  // 完了したタスク
  if (completedTasks.length > 0) {
    report += `✅ 本日完了 (${completedTasks.length}件)\n`;
    completedTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.name}\n`;
      report += `  ${task.projectName}\n`;
    });
  }

  // 進行中のタスク
  if (activeTasks.length > 0) {
    report += `\n🔄 進行中 (${activeTasks.length}件)\n`;
    activeTasks.slice(0, 3).forEach((task, index) => {
      const priority = task.priority === 'urgent' ? '🔴' :
                       task.priority === 'high' ? '🟠' :
                       task.priority === 'medium' ? '🟡' : '🟢';
      report += `${index + 1}. ${priority} ${task.name}\n`;
      report += `  ${task.projectName} (${task.progress}%)`;
      if (task.dueDate) {
        report += ` 期限:${task.dueDate}`;
      }
      report += `\n`;
    });
    if (activeTasks.length > 3) {
      report += `  ...他${activeTasks.length - 3}件\n`;
    }
  }

  // ブロック中のタスク
  if (blockedTasks.length > 0) {
    report += `\n⚠️ ブロック中 (${blockedTasks.length}件)\n`;
    blockedTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.name}\n`;
      report += `  ${task.projectName}\n`;
    });
  }

  // ルーティン達成率
  if (memberRoutines.length > 0) {
    const emoji = routineRate >= 80 ? '🎉' : routineRate >= 50 ? '👍' : '💪';
    report += `\n${emoji} ルーティン達成率: ${routineRate}%`;
    report += ` (${completedRoutines.length}/${memberRoutines.length}件)\n`;
  }

  // サマリー
  const totalTasks = memberTasks.length;
  const completedRate = totalTasks > 0
    ? Math.round((completedTasks.length / totalTasks) * 100)
    : 0;

  report += `\n📈 サマリー\n`;
  report += `タスク総数: ${totalTasks}件\n`;
  report += `本日完了: ${completedTasks.length}件 | 進行中: ${activeTasks.length}件`;
  if (blockedTasks.length > 0) {
    report += ` | ブロック: ${blockedTasks.length}件`;
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
 * LINE Messaging API設定を保存
 */
export const saveLineSettings = (settings) => {
  try {
    localStorage.setItem('lineMessagingApiSettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('LINE設定の保存に失敗しました:', error);
    return false;
  }
};

/**
 * LINE Messaging API設定を取得
 */
export const getLineSettings = () => {
  try {
    const settings = localStorage.getItem('lineMessagingApiSettings');
    return settings ? JSON.parse(settings) : {
      enabled: false,
      channelAccessToken: '',
      groupId: '',
      scheduledTime: '18:30',
      selectedMembers: [],
      lastSentDate: null
    };
  } catch (error) {
    console.error('LINE設定の取得に失敗しました:', error);
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
    return false;
  }

  // 現在時刻を取得
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // スケジュール時刻と一致するかチェック（1分の誤差を許容）
  const [schedHour, schedMin] = scheduledTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  return schedHour === currentHour && Math.abs(schedMin - currentMin) <= 1;
};
