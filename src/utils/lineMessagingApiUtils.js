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
      report += `  ✅ 本日完了: `;
      report += projectData.completed.map(t => t.name).join(', ');
      report += `\n`;
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
        report += `\n`;
      });
    }

    // ブロック中
    if (projectData.blocked.length > 0) {
      report += `  ⚠️ ブロック中: `;
      report += projectData.blocked.map(t => t.name).join(', ');
      report += `\n`;
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
