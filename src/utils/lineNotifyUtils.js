/**
 * LINE Notify API ユーティリティ
 */

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

/**
 * LINE Notifyにメッセージを送信
 */
export const sendLineNotify = async (token, message) => {
  if (!token || !message) {
    throw new Error('トークンとメッセージは必須です');
  }

  try {
    const formData = new URLSearchParams();
    formData.append('message', message);

    const response = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'LINE Notify送信に失敗しました');
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('LINE Notify送信エラー:', error);
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

  // レポート生成
  let report = `\n━━━━━━━━━━━━━━━━\n`;
  report += `📊 ${member}さんの進捗報告\n`;
  report += `📅 ${todayStr}\n`;
  report += `━━━━━━━━━━━━━━━━\n\n`;

  // 完了したタスク
  if (completedTasks.length > 0) {
    report += `✅ 本日完了したタスク (${completedTasks.length}件)\n`;
    completedTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.name}\n`;
      report += `   └ ${task.projectName}\n`;
    });
    report += `\n`;
  }

  // 進行中のタスク
  if (activeTasks.length > 0) {
    report += `🔄 進行中のタスク (${activeTasks.length}件)\n`;
    activeTasks.slice(0, 5).forEach((task, index) => {
      const priority = task.priority === 'urgent' ? '🔴' :
                       task.priority === 'high' ? '🟠' :
                       task.priority === 'medium' ? '🟡' : '🟢';
      report += `${index + 1}. ${priority} ${task.name}\n`;
      report += `   └ ${task.projectName} (進捗: ${task.progress}%)\n`;
      if (task.dueDate) {
        report += `   └ 期限: ${task.dueDate}\n`;
      }
    });
    if (activeTasks.length > 5) {
      report += `   ... 他${activeTasks.length - 5}件\n`;
    }
    report += `\n`;
  }

  // ブロック中のタスク
  if (blockedTasks.length > 0) {
    report += `⚠️ ブロック中のタスク (${blockedTasks.length}件)\n`;
    blockedTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.name}\n`;
      report += `   └ ${task.projectName}\n`;
    });
    report += `\n`;
  }

  // ルーティン達成率
  if (memberRoutines.length > 0) {
    const emoji = routineRate >= 80 ? '🎉' : routineRate >= 50 ? '👍' : '💪';
    report += `${emoji} ルーティン達成率: ${routineRate}%\n`;
    report += `   完了: ${completedRoutines.length}/${memberRoutines.length}件\n\n`;
  }

  // サマリー
  const totalTasks = memberTasks.length;
  const completedRate = totalTasks > 0
    ? Math.round((completedTasks.length / totalTasks) * 100)
    : 0;

  report += `━━━━━━━━━━━━━━━━\n`;
  report += `📈 サマリー\n`;
  report += `・タスク総数: ${totalTasks}件\n`;
  report += `・本日完了: ${completedTasks.length}件\n`;
  report += `・進行中: ${activeTasks.length}件\n`;
  if (blockedTasks.length > 0) {
    report += `・ブロック中: ${blockedTasks.length}件\n`;
  }
  report += `━━━━━━━━━━━━━━━━\n`;

  return report;
};

/**
 * チーム全体の日報を生成
 */
export const generateTeamReport = (selectedMembers, projects, routineTasks, date) => {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const today = new Date(dateStr);
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  let report = `\n╔════════════════════╗\n`;
  report += `║  📊 日報 - ${todayStr}  ║\n`;
  report += `╚════════════════════╝\n`;

  // 各メンバーのレポートを追加
  selectedMembers.forEach((member, index) => {
    report += generateMemberReport(member, projects, routineTasks, dateStr);
    if (index < selectedMembers.length - 1) {
      report += `\n`;
    }
  });

  // フッター
  report += `\n🤖 4次元プロジェクト管理システム\n`;
  report += `自動送信時刻: ${new Date().toLocaleTimeString('ja-JP')}\n`;

  return report;
};

/**
 * LINE Notify設定を保存
 */
export const saveLineNotifySettings = (settings) => {
  try {
    localStorage.setItem('lineNotifySettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('LINE Notify設定の保存に失敗しました:', error);
    return false;
  }
};

/**
 * LINE Notify設定を取得
 */
export const getLineNotifySettings = () => {
  try {
    const settings = localStorage.getItem('lineNotifySettings');
    return settings ? JSON.parse(settings) : {
      enabled: false,
      token: '',
      scheduledTime: '18:30',
      selectedMembers: [],
      lastSentDate: null
    };
  } catch (error) {
    console.error('LINE Notify設定の取得に失敗しました:', error);
    return {
      enabled: false,
      token: '',
      scheduledTime: '18:30',
      selectedMembers: [],
      lastSentDate: null
    };
  }
};

/**
 * テスト送信
 */
export const sendTestNotification = async (token, memberName) => {
  const message = `\n━━━━━━━━━━━━━━━━\n✅ テスト送信成功！\n━━━━━━━━━━━━━━━━\n\n4次元プロジェクト管理システムからのLINE通知が正常に設定されました。\n\n毎日指定された時刻に${memberName || '選択されたメンバー'}の日報が自動送信されます。`;

  return await sendLineNotify(token, message);
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
