import React, { useState, useMemo } from 'react';
import { Calendar, Copy, Download, FileText, CheckCircle, Target, Clock, User } from 'lucide-react';

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

  // 日付選択
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

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
          if (task.completedDate === dateStr) {
            completedTasks.push({
              ...task,
              projectName: project.name,
              projectColor: project.color
            });
          }
          // その日が期限内または開始日のタスク（進行中）
          else if (task.startDate <= dateStr && task.dueDate >= dateStr && task.status === 'active') {
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

  // 日報テキストを生成
  const generateReportText = () => {
    const date = new Date(selectedDate);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const memberStr = selectedMember === 'all' ? 'チーム全体' : selectedMember;

    let report = `# 日報 - ${dateStr} (${memberStr})\n\n`;

    // ルーティンタスク
    report += `## 📋 ルーティンタスク (達成率: ${reportData.routineCompletionRate}%)\n\n`;
    if (reportData.completedRoutines.length > 0) {
      report += `### ✅ 完了 (${reportData.completedRoutines.length}件)\n`;
      reportData.completedRoutines.forEach(routine => {
        report += `- ${routine.name} (${routine.assignee})`;
        if (routine.notes) {
          report += ` - ${routine.notes}`;
        }
        report += '\n';
      });
      report += '\n';
    }

    if (reportData.incompleteRoutines.length > 0) {
      report += `### ⚠️ 未完了 (${reportData.incompleteRoutines.length}件)\n`;
      reportData.incompleteRoutines.forEach(routine => {
        report += `- ${routine.name} (${routine.assignee})\n`;
      });
      report += '\n';
    }

    // 完了したタスク
    if (reportData.completedTasks.length > 0) {
      report += `## ✨ 完了したタスク (${reportData.completedTasks.length}件)\n\n`;
      reportData.completedTasks.forEach(task => {
        report += `- [${task.projectName}] ${task.name} (${task.assignee})`;
        if (task.description) {
          report += `\n  ${task.description}`;
        }
        report += '\n';
      });
      report += '\n';
    }

    // 進行中のタスク
    if (reportData.updatedTasks.length > 0) {
      report += `## 🔄 進行中のタスク (${reportData.updatedTasks.length}件)\n\n`;
      reportData.updatedTasks.forEach(task => {
        report += `- [${task.projectName}] ${task.name} (進捗: ${task.progress}%, ${task.assignee})\n`;
      });
      report += '\n';
    }

    // プロジェクト進捗
    report += `## 📊 プロジェクト進捗\n\n`;
    reportData.projectProgress.forEach(project => {
      if (project.totalTasks > 0) {
        report += `- ${project.name}: ${project.progress}% (${project.completedTasks}/${project.totalTasks}タスク完了)\n`;
      }
    });

    return report;
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
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
            >
              <Download size={18} />
              ダウンロード
            </button>
          </div>
        </div>
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
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg p-3`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${textColor}`}>{routine.name}</p>
                      <p className={`text-sm ${textSecondary}`}>{routine.assignee} - {routine.time}</p>
                      {routine.notes && (
                        <p className={`text-sm ${textSecondary} mt-1`}>メモ: {routine.notes}</p>
                      )}
                    </div>
                    <CheckCircle size={20} className="text-green-500" />
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
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} rounded-lg p-3`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${textColor}`}>{routine.name}</p>
                      <p className={`text-sm ${textSecondary}`}>{routine.assignee} - {routine.time}</p>
                    </div>
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
                  <p className={`font-medium ${textColor}`}>{task.name}</p>
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
