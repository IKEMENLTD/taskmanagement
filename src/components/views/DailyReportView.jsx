import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Copy, Download, FileText, CheckCircle, Target, Clock, User, Send } from 'lucide-react';
import { getLineSettings, generateMemberReport, generateTeamReport, sendLineMessage } from '../../utils/lineMessagingApiUtils';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 日報ビューコンポーネント
 * @param {Array} projects - プロジェクト一覧
 * @param {Object} routineTasks - ルーティンタスク
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {boolean} darkMode - ダークモードフラグ
 */
export const DailyReportView = ({ projects, routineTasks, teamMembers, darkMode = false }) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // 認証情報
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

  // 日付選択
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isSendingLine, setIsSendingLine] = useState(false);
  const [lineMessage, setLineMessage] = useState({ type: '', text: '' });

  // 自由記述欄（メンバー別）
  const [memberNotes, setMemberNotes] = useState({});

  // LINE設定
  const [lineSettings, setLineSettings] = useState({
    enabled: false,
    channelAccessToken: '',
    groupId: '',
    scheduledTime: '18:30',
    selectedMembers: [],
    lastSentDate: null
  });

  // LINE設定を読み込む
  useEffect(() => {
    const loadLineSettings = async () => {
      if (organizationId) {
        const settings = await getLineSettings(organizationId);
        setLineSettings(settings);
      }
    };
    loadLineSettings();
  }, [organizationId]);

  // メンバーの記述を更新
  const updateMemberNote = (member, note) => {
    const key = `daily_report_notes_${selectedDate}_${member}`;
    localStorage.setItem(key, note);
    setMemberNotes(prev => ({ ...prev, [member]: note }));
  };

  // 日報データを集計
  const reportData = useMemo(() => {
    const dateStr = selectedDate;

    // その日のルーティンタスクを取得
    const dailyRoutines = routineTasks[dateStr] || [];

    // 完了したルーティン
    const completedRoutines = dailyRoutines.filter(r => {
      if (selectedMember === 'all') return r.completed;
      return r.completed && r.assignee === selectedMember;
    });

    // 未完了のルーティン
    const incompleteRoutines = dailyRoutines.filter(r => {
      if (selectedMember === 'all') return !r.completed;
      return !r.completed && r.assignee === selectedMember;
    });

    // その日に更新されたタスクを取得
    const updatedTasks = [];
    const completedTasks = [];

    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          // メンバーフィルター
          if (selectedMember !== 'all' && task.assignee !== selectedMember) {
            return;
          }

          // 完了日がその日のタスク
          if (task.completedDate === dateStr || task.completed_date === dateStr) {
            completedTasks.push({
              ...task,
              projectName: project.name,
              projectColor: project.color
            });
          }
          // 進行中・ブロック中のタスクをすべて表示（completedは除外）
          else if (task.status !== 'completed') {
            updatedTasks.push({
              ...task,
              projectName: project.name,
              projectColor: project.color
            });
          }
        });
      }
    });

    // プロジェクト進捗
    const projectProgress = projects.map(project => ({
      name: project.name,
      progress: project.progress,
      status: project.status,
      color: project.color,
      totalTasks: project.tasks?.length || 0,
      completedTasks: project.tasks?.filter(t => t.status === 'completed').length || 0
    }));

    return {
      completedRoutines,
      incompleteRoutines,
      completedTasks,
      updatedTasks,
      projectProgress,
      routineCompletionRate: dailyRoutines.length > 0
        ? Math.round((completedRoutines.length / dailyRoutines.length) * 100)
        : 0
    };
  }, [selectedDate, selectedMember, projects, routineTasks]);

  // 日付変更時に全メンバーの記述をlocalStorageから読み込む
  useEffect(() => {
    const loadMemberNotes = () => {
      const notes = {};
      teamMembers.forEach(member => {
        const key = `daily_report_notes_${selectedDate}_${member.name}`;
        const savedNote = localStorage.getItem(key);
        if (savedNote) {
          notes[member.name] = savedNote;
        }
      });
      setMemberNotes(notes);
    };
    loadMemberNotes();
  }, [selectedDate, teamMembers]);

  // 日報テキストを生成（自動送信と同じフォーマット）
  const generateReportText = () => {
    const date = new Date(selectedDate);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    let report = `📊 日報 ${dateStr}\n`;
    report += `━━━━━━━━━━━\n`;

    // メンバー別にレポートを生成
    if (selectedMember === 'all') {
      // チーム全体の場合は、全メンバーのレポート
      const allMembers = [...new Set([
        ...reportData.completedRoutines.map(r => r.assignee),
        ...reportData.incompleteRoutines.map(r => r.assignee),
        ...reportData.completedTasks.map(t => t.assignee),
        ...reportData.updatedTasks.map(t => t.assignee)
      ])];

      allMembers.forEach((member, index) => {
        report += generateMemberReportSection(member);
        if (index < allMembers.length - 1) {
          report += `\n━━━━━━━━━━━\n`;
        }
      });
    } else {
      // 個人の場合
      report += generateMemberReportSection(selectedMember);
    }

    // フッター
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    report += `\n━━━━━━━━━━━\n`;
    report += `🤖 4次元PM | ${timeStr}\n`;

    return report;
  };

  // メンバー別のレポートセクションを生成（プロジェクトごとにグループ化）
  const generateMemberReportSection = (member) => {
    const memberCompletedTasks = reportData.completedTasks.filter(t => t.assignee === member);
    const memberActiveTasks = reportData.updatedTasks.filter(t => t.assignee === member);
    const memberBlockedTasks = memberActiveTasks.filter(t => t.status === 'blocked');
    const memberCompletedRoutines = reportData.completedRoutines.filter(r => r.assignee === member);
    const memberIncompleteRoutines = reportData.incompleteRoutines.filter(r => r.assignee === member);

    const memberRoutineTotal = memberCompletedRoutines.length + memberIncompleteRoutines.length;
    const memberRoutineRate = memberRoutineTotal > 0
      ? Math.round((memberCompletedRoutines.length / memberRoutineTotal) * 100)
      : 0;

    let section = `\n【${member}さん】\n`;

    // メンバーの全タスク（完了+進行中+ブロック中）
    const allMemberTasks = [...memberCompletedTasks, ...memberActiveTasks];

    // プロジェクトごとにタスクをグループ化
    const tasksByProject = {};
    allMemberTasks.forEach(task => {
      if (!tasksByProject[task.projectName]) {
        tasksByProject[task.projectName] = {
          name: task.projectName,
          color: task.projectColor,
          progress: 0,
          tasks: []
        };
      }
      tasksByProject[task.projectName].tasks.push(task);
    });

    // プロジェクト進捗を計算
    Object.keys(tasksByProject).forEach(projectName => {
      const project = reportData.projectProgress.find(p => p.name === projectName);
      if (project) {
        tasksByProject[projectName].progress = project.progress;
      }
    });

    // プロジェクトごとに表示
    if (Object.keys(tasksByProject).length > 0) {
      Object.values(tasksByProject).forEach(project => {
        section += `\n📁 ${project.name} (進捗 ${project.progress}%)\n`;

        // 完了したタスク
        const completedInProject = project.tasks.filter(t => memberCompletedTasks.includes(t));
        if (completedInProject.length > 0) {
          section += `  ✅ 本日完了:\n`;
          completedInProject.forEach(task => {
            const priority = task.priority === 'urgent' ? '🔴' :
                           task.priority === 'high' ? '🟠' :
                           task.priority === 'medium' ? '🟡' : '🟢';
            section += `    ${priority} ${task.name}\n`;
          });
        }

        // 進行中のタスク
        const activeInProject = project.tasks.filter(t => memberActiveTasks.includes(t) && t.status !== 'blocked');
        if (activeInProject.length > 0) {
          section += `  🔄 進行中:\n`;
          activeInProject.forEach(task => {
            const priority = task.priority === 'urgent' ? '🔴' :
                           task.priority === 'high' ? '🟠' :
                           task.priority === 'medium' ? '🟡' : '🟢';
            section += `    ${priority} ${task.name} (${task.progress}%)`;
            if (task.dueDate) {
              section += ` 期限:${task.dueDate}`;
            }
            section += `\n`;
          });
        }

        // ブロック中のタスク
        const blockedInProject = project.tasks.filter(t => memberBlockedTasks.includes(t));
        if (blockedInProject.length > 0) {
          section += `  ⚠️ ブロック中:\n`;
          blockedInProject.forEach(task => {
            section += `    ${task.name}\n`;
          });
        }
      });
    }

    // ルーティン詳細
    const emoji = memberRoutineRate >= 80 ? '🎉' : memberRoutineRate >= 50 ? '👍' : '💪';
    section += `\n${emoji} ルーティン達成率: ${memberRoutineRate}%`;
    section += ` (${memberCompletedRoutines.length}/${memberRoutineTotal}件)\n`;

    // 完了したルーティン
    if (memberCompletedRoutines.length > 0) {
      section += `  ✅ 完了:\n`;
      memberCompletedRoutines.forEach(routine => {
        section += `    ${routine.name}`;
        if (routine.category) {
          section += ` [${routine.category}]`;
        }
        if (routine.time) {
          section += ` ${routine.time}`;
        }
        if (routine.duration) {
          section += ` (${routine.duration}分)`;
        }
        if (routine.completed_at) {
          const completedTime = new Date(routine.completed_at);
          section += ` ✓${String(completedTime.getHours()).padStart(2, '0')}:${String(completedTime.getMinutes()).padStart(2, '0')}`;
        }
        section += `\n`;
      });
    }

    // 未完了のルーティン
    if (memberIncompleteRoutines.length > 0) {
      section += `  ⚠️ 未完了:\n`;
      memberIncompleteRoutines.forEach(routine => {
        section += `    ${routine.name}`;
        if (routine.category) {
          section += ` [${routine.category}]`;
        }
        if (routine.time) {
          section += ` ${routine.time}`;
        }
        if (routine.duration) {
          section += ` (${routine.duration}分)`;
        }
        if (routine.skip_reason) {
          section += ` ※${routine.skip_reason}`;
        }
        section += `\n`;
      });
    }

    // 自由記述（その他の活動）
    const memberNote = memberNotes[member];
    if (memberNote && memberNote.trim()) {
      section += `\n📝 その他の活動\n`;
      memberNote.trim().split('\n').forEach(line => {
        if (line.trim()) {
          section += `• ${line.trim()}\n`;
        }
      });
    }

    // サマリー
    const activeNonBlocked = memberActiveTasks.filter(t => t.status !== 'blocked');
    const totalTasks = memberCompletedTasks.length + memberActiveTasks.length;
    section += `\n📈 サマリー\n`;
    section += `タスク総数: ${totalTasks}件\n`;
    section += `本日完了: ${memberCompletedTasks.length}件 | 進行中: ${activeNonBlocked.length}件`;
    if (memberBlockedTasks.length > 0) {
      section += ` | ブロック: ${memberBlockedTasks.length}件`;
    }
    section += `\n`;

    return section;
  };

  // クリップボードにコピー
  const handleCopy = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text).then(() => {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    });
  };

  // テキストファイルとしてダウンロード
  const handleDownload = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `日報_${selectedDate}_${selectedMember === 'all' ? 'チーム全体' : selectedMember}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // LINEに送信
  const handleSendLine = async () => {
    // 既に送信中の場合は処理をスキップ（重複送信防止）
    if (isSendingLine) {
      console.log('[LINE送信] 送信処理が実行中のためスキップ');
      return;
    }

    if (!lineSettings.channelAccessToken || !lineSettings.groupId) {
      setLineMessage({ type: 'error', text: 'LINE設定が未設定です。設定画面から設定してください。' });
      setTimeout(() => setLineMessage({ type: '', text: '' }), 3000);
      return;
    }

    setIsSendingLine(true);
    setLineMessage({ type: 'info', text: '送信中...' });

    try {
      // 日報メッセージを生成
      let message = '';
      const date = new Date(selectedDate);
      const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

      if (selectedMember === 'all') {
        // チーム全体の日報
        message = generateTeamReport(teamMembers.map(m => m.name), projects, routineTasks, selectedDate);
      } else {
        // 個別メンバーの日報
        message = `📊 日報 ${dateStr}\n━━━━━━━━━━━`;
        message += generateMemberReport(selectedMember, projects, routineTasks, selectedDate);
      }

      // LINE送信
      const result = await sendLineMessage(
        lineSettings.channelAccessToken,
        lineSettings.groupId,
        message
      );

      if (result.success) {
        setLineMessage({ type: 'success', text: '日報を送信しました！' });
      } else {
        throw new Error(result.error || '送信に失敗しました');
      }
    } catch (error) {
      console.error('LINE送信エラー:', error);
      setLineMessage({ type: 'error', text: `送信エラー: ${error.message}` });
    } finally {
      setIsSendingLine(false);
      setTimeout(() => setLineMessage({ type: '', text: '' }), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textColor}`}>日報作成</h2>
          <p className={`${textSecondary} mt-1`}>その日の進捗から日報を自動生成します</p>
        </div>
      </div>

      {/* 日付とメンバー選択 */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className={textSecondary} />
            <label className={`text-sm ${textSecondary}`}>日付:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${textColor} text-sm`}
            />
          </div>

          <div className="flex items-center gap-2">
            <User size={20} className={textSecondary} />
            <label className={`text-sm ${textSecondary}`}>メンバー:</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${textColor} text-sm`}
            >
              <option value="all">チーム全体</option>
              {teamMembers.map(member => (
                <option key={member.name} value={member.name}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleSendLine}
              disabled={isSendingLine || !lineSettings.channelAccessToken}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!lineSettings.channelAccessToken ? 'LINE設定が必要です' : 'LINEに送信'}
            >
              <Send size={18} />
              {isSendingLine ? '送信中...' : 'LINE送信'}
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white relative`}
            >
              <Copy size={18} />
              コピー
              {showCopySuccess && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  コピーしました！
                </span>
              )}
            </button>
            <button
              onClick={handleDownload}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
            >
              <Download size={18} />
              ダウンロード
            </button>
          </div>
        </div>

        {/* ステータスメッセージ */}
        {lineMessage.text && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            lineMessage.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : lineMessage.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
          }`}>
            <span className="text-sm">{lineMessage.text}</span>
          </div>
        )}
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock size={24} className="text-blue-500" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>ルーティン達成率</p>
              <p className={`text-2xl font-bold ${textColor}`}>{reportData.routineCompletionRate}%</p>
            </div>
          </div>
        </div>

        <div className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>完了ルーティン</p>
              <p className={`text-2xl font-bold ${textColor}`}>{reportData.completedRoutines.length}</p>
            </div>
          </div>
        </div>

        <div className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target size={24} className="text-purple-500" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>完了タスク</p>
              <p className={`text-2xl font-bold ${textColor}`}>{reportData.completedTasks.length}</p>
            </div>
          </div>
        </div>

        <div className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FileText size={24} className="text-orange-500" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>進行中タスク</p>
              <p className={`text-2xl font-bold ${textColor}`}>{reportData.updatedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 自由記述欄（その他の活動） */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-xl font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <FileText size={20} />
          📝 その他の活動・自由記述
        </h3>
        <p className={`text-sm ${textSecondary} mb-3`}>
          タスクやルーティン以外で今日やったことを自由に記入してください（1行1項目）
        </p>

        {selectedMember === 'all' ? (
          /* チーム全体表示の場合：各メンバーの入力欄を表示 */
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.name} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  👤 {member.name}さん
                </label>
                <textarea
                  value={memberNotes[member.name] || ''}
                  onChange={(e) => updateMemberNote(member.name, e.target.value)}
                  placeholder={`例:\n・チームミーティングで○○について議論\n・○○さんからの相談対応\n・新しいツールの調査`}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                />
              </div>
            ))}
          </div>
        ) : (
          /* 個人表示の場合：選択中のメンバーの入力欄のみ表示 */
          <textarea
            value={memberNotes[selectedMember] || ''}
            onChange={(e) => updateMemberNote(selectedMember, e.target.value)}
            placeholder={`例:\n・チームミーティングで○○について議論\n・○○さんからの相談対応\n・新しいツールの調査`}
            rows={6}
            className={`w-full px-4 py-3 rounded-lg border ${
              darkMode
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
          />
        )}

        <p className={`text-xs ${textSecondary} mt-2`}>
          💾 入力内容は自動的に保存されます
        </p>
      </div>

      {/* 日報プレビュー */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-xl font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <FileText size={20} />
          日報プレビュー
        </h3>
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 font-mono text-sm whitespace-pre-wrap ${textColor}`}>
          {generateReportText()}
        </div>
      </div>

      {/* 詳細セクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 完了したルーティン */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-bold ${textColor} mb-4`}>✅ 完了したルーティン</h3>
          {reportData.completedRoutines.length > 0 ? (
            <div className="space-y-2">
              {reportData.completedRoutines.map((routine, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg p-4 border-l-4 border-green-500`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className={`font-semibold ${textColor}`}>{routine.name}</p>
                        {routine.category && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {routine.category}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${textSecondary} space-y-1`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {routine.assignee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {routine.time}
                            {routine.duration && ` (${routine.duration}分)`}
                          </span>
                          {routine.repeat && (
                            <span className="flex items-center gap-1">
                              <Target size={14} />
                              {routine.repeat === 'daily' ? '毎日' :
                               routine.repeat === 'weekday' ? '平日' :
                               routine.repeat === 'weekend' ? '週末' : 'カスタム'}
                            </span>
                          )}
                        </div>
                        {routine.description && (
                          <p className={`${textSecondary} mt-2 text-sm italic`}>{routine.description}</p>
                        )}
                        {routine.notes && (
                          <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <p className={`text-sm ${textColor}`}>📝 {routine.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={textSecondary}>完了したルーティンはありません</p>
          )}
        </div>

        {/* 未完了のルーティン */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-bold ${textColor} mb-4`}>⚠️ 未完了のルーティン</h3>
          {reportData.incompleteRoutines.length > 0 ? (
            <div className="space-y-2">
              {reportData.incompleteRoutines.map((routine, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} rounded-lg p-4 border-l-4 border-yellow-500`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className={`font-semibold ${textColor}`}>{routine.name}</p>
                        {routine.category && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {routine.category}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${textSecondary} space-y-1`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {routine.assignee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {routine.time}
                            {routine.duration && ` (${routine.duration}分)`}
                          </span>
                          {routine.repeat && (
                            <span className="flex items-center gap-1">
                              <Target size={14} />
                              {routine.repeat === 'daily' ? '毎日' :
                               routine.repeat === 'weekday' ? '平日' :
                               routine.repeat === 'weekend' ? '週末' : 'カスタム'}
                            </span>
                          )}
                        </div>
                        {routine.description && (
                          <p className={`${textSecondary} mt-2 text-sm italic`}>{routine.description}</p>
                        )}
                        {routine.notes && (
                          <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <p className={`text-sm ${textColor}`}>📝 {routine.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      未完了
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={textSecondary}>未完了のルーティンはありません</p>
          )}
        </div>

        {/* 完了したタスク */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-bold ${textColor} mb-4`}>✨ 完了したタスク</h3>
          {reportData.completedTasks.length > 0 ? (
            <div className="space-y-2">
              {reportData.completedTasks.map((task, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-3 border-l-4`} style={{ borderLeftColor: task.projectColor }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium ${textColor}`}>{task.name}</p>
                    {task.priority && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {task.priority === 'urgent' ? '🔴' :
                         task.priority === 'high' ? '🟠' :
                         task.priority === 'medium' ? '🟡' : '🟢'}
                        {task.priority === 'urgent' ? '緊急' :
                         task.priority === 'high' ? '高' :
                         task.priority === 'medium' ? '中' : '低'}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${textSecondary}`}>{task.projectName} - {task.assignee}</p>
                  {task.description && (
                    <p className={`text-sm ${textSecondary} mt-1`}>{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={textSecondary}>完了したタスクはありません</p>
          )}
        </div>

        {/* プロジェクト進捗 */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-bold ${textColor} mb-4`}>📊 プロジェクト進捗</h3>
          {reportData.projectProgress.length > 0 ? (
            <div className="space-y-3">
              {reportData.projectProgress.map((project, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium ${textColor}`}>{project.name}</p>
                    <p className={`text-sm ${textSecondary}`}>{project.progress}%</p>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                    ></div>
                  </div>
                  <p className={`text-xs ${textSecondary} mt-1`}>
                    {project.completedTasks}/{project.totalTasks} タスク完了
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={textSecondary}>プロジェクトがありません</p>
          )}
        </div>
      </div>
    </div>
  );
};
