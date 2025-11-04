import React, { useState, useEffect } from 'react';
import { X, Download, Upload, Trash2, Info, Cloud, RefreshCw, Bell, Database } from 'lucide-react';
import { clearAllData, clearRoutineData, clearSettings, exportData, importData, getStorageInfo } from '../../utils/storageUtils';
import { isGoogleSheetsEnabled } from '../../config';
import { syncToGoogleSheets, syncFromGoogleSheets, setScriptUrl, testConnection } from '../../utils/googleSheetsApi';
import { GOOGLE_APPS_SCRIPT_URL } from '../../config';
import { DataManagementPanel } from './DataManagementPanel';
import { NotificationSettings } from '../settings/NotificationSettings';
import { LineNotifySettings } from '../settings/LineNotifySettings';

/**
 * 設定パネルコンポーネント
 * @param {Function} onClose - パネルを閉じるハンドラー
 * @param {boolean} darkMode - ダークモードフラグ
 * @param {Array} projects - プロジェクト一覧
 * @param {Function} setProjects - プロジェクト更新関数
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {Function} setTeamMembers - チームメンバー更新関数
 * @param {Object} routineTasks - ルーティンタスク一覧
 * @param {Function} setRoutineTasks - ルーティンタスク更新関数
 * @param {Array} routineCategories - ルーティンカテゴリー一覧
 * @param {Function} setRoutineCategories - ルーティンカテゴリー更新関数
 * @param {Date} currentTime - 現在時刻
 */
export const SettingsPanel = ({
  onClose,
  darkMode = false,
  projects = [],
  setProjects,
  teamMembers = [],
  setTeamMembers,
  routineTasks = {},
  setRoutineTasks,
  routineCategories = [],
  setRoutineCategories,
  currentTime = new Date()
}) => {
  // タブ管理
  const [activeTab, setActiveTab] = useState('data'); // data, settings, line

  const [storageInfo, setStorageInfo] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Google Sheets URL設定
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(() => {
    return localStorage.getItem('googleSheetsUrl') || GOOGLE_APPS_SCRIPT_URL || '';
  });
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      taskDueReminder: true,
      routineReminder: true,
      projectDeadline: true,
      reminderTime: 60 // 分前
    };
  });

  // 通知設定を保存
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // プロジェクト管理
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);

  // チームメンバー管理
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  // ルーティン管理
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('09:00');
  const [newRoutineCategory, setNewRoutineCategory] = useState('work');
  const [newRoutineAssignee, setNewRoutineAssignee] = useState('');
  const [newRoutineDescription, setNewRoutineDescription] = useState('');
  const [newRoutineRepeat, setNewRoutineRepeat] = useState('daily');
  const [newRoutineDuration, setNewRoutineDuration] = useState(30);
  const [newRoutineProjectId, setNewRoutineProjectId] = useState(null);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // Google Sheets連携が有効かチェック
  const googleSheetsEnabled = googleSheetsUrl && googleSheetsUrl.length > 0;

  // Google Apps Script URLを設定
  React.useEffect(() => {
    if (googleSheetsUrl) {
      setScriptUrl(googleSheetsUrl);
    }
  }, [googleSheetsUrl]);

  // Google Sheets URLを保存
  const handleSaveGoogleSheetsUrl = () => {
    const trimmedUrl = tempUrl.trim();
    if (!trimmedUrl) {
      alert('URLを入力してください。');
      return;
    }

    // URLの形式を簡易チェック
    if (!trimmedUrl.startsWith('https://script.google.com/')) {
      alert('⚠️ Google Apps Script のURLは "https://script.google.com/" で始まる必要があります。');
      return;
    }

    localStorage.setItem('googleSheetsUrl', trimmedUrl);
    setGoogleSheetsUrl(trimmedUrl);
    setScriptUrl(trimmedUrl);
    setIsEditingUrl(false);
    setTempUrl('');
    alert('✓ URLを保存しました！');
  };

  // URL編集開始
  const handleEditUrl = () => {
    setTempUrl(googleSheetsUrl);
    setIsEditingUrl(true);
  };

  // URL編集キャンセル
  const handleCancelEditUrl = () => {
    setTempUrl('');
    setIsEditingUrl(false);
  };

  // URL削除
  const handleDeleteUrl = () => {
    if (window.confirm('⚠️ Google Sheets連携のURLを削除しますか？\n\n削除すると、スプレッドシートとの同期ができなくなります。')) {
      localStorage.removeItem('googleSheetsUrl');
      setGoogleSheetsUrl('');
      setScriptUrl('');
      alert('✓ URLを削除しました。');
    }
  };

  const handleShowInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
  };

  const handleClearAll = () => {
    if (showConfirm === 'all') {
      clearAllData();
      setShowConfirm(null);
      window.location.reload();
    } else {
      setShowConfirm('all');
    }
  };

  const handleClearRoutines = () => {
    if (showConfirm === 'routines') {
      clearRoutineData();
      setShowConfirm(null);
      window.location.reload();
    } else {
      setShowConfirm('routines');
    }
  };

  const handleClearSettings = () => {
    if (showConfirm === 'settings') {
      clearSettings();
      setShowConfirm(null);
      window.location.reload();
    } else {
      setShowConfirm('settings');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = importData(e.target.result);
        if (success) {
          alert('データをインポートしました。ページを更新します。');
          window.location.reload();
        } else {
          alert('データのインポートに失敗しました。');
        }
      };
      reader.readAsText(file);
    }
  };

  // Google Sheetsへアップロード
  const handleSyncToGoogleSheets = async () => {
    if (!googleSheetsEnabled) {
      alert('Google Sheets連携が有効になっていません。\nsrc/config.js で設定してください。');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('アップロード中...');

    try {
      // LocalStorageからデータを取得
      const localData = {};
      const keys = [
        'routineTasks',
        'projects',
        'teamMembers',
        'selectedView',
        'darkMode',
        'sidebarOpen',
        'filterProject',
        'filterMember',
        'routineViewMode',
        'routineCategories',
        'notificationSettings'
      ];
      keys.forEach(key => {
        const item = window.localStorage.getItem(key);
        if (item) {
          localData[key] = JSON.parse(item);
        }
      });

      await syncToGoogleSheets(localData);
      setSyncStatus('✓ アップロード完了！');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setSyncStatus('❌ アップロード失敗');
      alert('Google Sheetsへのアップロードに失敗しました。\n' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheetsからダウンロード
  const handleSyncFromGoogleSheets = async () => {
    if (!googleSheetsEnabled) {
      alert('Google Sheets連携が有効になっていません。\nsrc/config.js で設定してください。');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('ダウンロード中...');

    try {
      const data = await syncFromGoogleSheets();

      // LocalStorageに保存
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          window.localStorage.setItem(key, JSON.stringify(data[key]));
        }
      });

      setSyncStatus('✓ ダウンロード完了！');
      alert('Google Sheetsからデータを取得しました。\nページを更新します。');
      window.location.reload();
    } catch (error) {
      console.error(error);
      setSyncStatus('❌ ダウンロード失敗');
      alert('Google Sheetsからのダウンロードに失敗しました。\n' + error.message);
      setIsSyncing(false);
    }
  };

  // 接続テスト
  const handleTestConnection = async () => {
    if (!googleSheetsEnabled) {
      alert('Google Sheets連携が有効になっていません。\nsrc/config.js で設定してください。');
      return;
    }

    setSyncStatus('接続確認中...');
    try {
      const success = await testConnection();
      if (success) {
        setSyncStatus('✓ 接続成功！');
        alert('Google Sheetsへの接続に成功しました！');
      } else {
        setSyncStatus('❌ 接続失敗');
        alert('Google Sheetsへの接続に失敗しました。');
      }
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      setSyncStatus('❌ 接続失敗');
      alert('接続エラー: ' + error.message);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  // プロジェクト管理関数
  const handleAddProject = () => {
    if (!newProjectName.trim()) return;

    const newProject = {
      id: Date.now(),
      name: newProjectName.trim(),
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    setProjects([...projects, newProject]);
    setNewProjectName('');
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const taskCount = project.tasks?.length || 0;
    let message = 'このプロジェクトを削除しますか？';

    if (taskCount > 0) {
      message = `⚠️ このプロジェクトには ${taskCount} 件のタスクがあります。\n\nプロジェクトを削除すると、すべてのタスクも削除されます。\n本当に削除しますか？`;
    }

    if (window.confirm(message)) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
  };

  const handleUpdateProject = () => {
    if (!newProjectName.trim() || !editingProject) return;

    setProjects(projects.map(p =>
      p.id === editingProject.id
        ? { ...p, name: newProjectName.trim() }
        : p
    ));
    setEditingProject(null);
    setNewProjectName('');
  };

  const handleCancelEditProject = () => {
    setEditingProject(null);
    setNewProjectName('');
  };

  // チームメンバー管理関数
  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      alert('メンバー名を入力してください。');
      return;
    }

    const trimmedName = newMemberName.trim();

    // 重複チェック
    const isDuplicate = teamMembers.some(m => m.name === trimmedName);
    if (isDuplicate) {
      alert(`⚠️ 「${trimmedName}」という名前のメンバーは既に存在します。`);
      return;
    }

    const newMember = {
      id: Date.now(),
      name: trimmedName,
      role: newMemberRole.trim() || 'メンバー',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=random`
    };

    setTeamMembers([...teamMembers, newMember]);
    setNewMemberName('');
    setNewMemberRole('');
  };

  const handleDeleteMember = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    // タスクの割り当てをチェック
    const assignedTasks = [];
    projects.forEach(project => {
      project.tasks?.forEach(task => {
        if (task.assignee === member.name) {
          assignedTasks.push({ projectName: project.name, taskName: task.name });
        }
      });
    });

    // ルーティンの割り当てをチェック
    const assignedRoutines = [];
    Object.values(routineTasks).forEach(dayRoutines => {
      if (Array.isArray(dayRoutines)) {
        dayRoutines.forEach(routine => {
          if (routine.assignee === member.name) {
            assignedRoutines.push(routine.title);
          }
        });
      }
    });

    const taskCount = assignedTasks.length;
    const routineCount = assignedRoutines.length;

    if (taskCount > 0 || routineCount > 0) {
      // 割り当てがある場合、詳細を表示
      let message = `⚠️ このメンバーには以下の割り当てがあります：\n\n`;

      if (taskCount > 0) {
        message += `📋 タスク (${taskCount}件):\n`;
        assignedTasks.slice(0, 5).forEach(({ projectName, taskName }) => {
          message += `  • ${projectName} - ${taskName}\n`;
        });
        if (taskCount > 5) {
          message += `  ... 他 ${taskCount - 5} 件\n`;
        }
        message += '\n';
      }

      if (routineCount > 0) {
        message += `🔁 ルーティン (${routineCount}件):\n`;
        assignedRoutines.slice(0, 5).forEach(title => {
          message += `  • ${title}\n`;
        });
        if (routineCount > 5) {
          message += `  ... 他 ${routineCount - 5} 件\n`;
        }
        message += '\n';
      }

      message += `\nこのメンバーを削除すると、これらのタスクやルーティンの担当者が空になります。\n本当に削除しますか？`;

      if (!window.confirm(message)) return;
    } else {
      // 割り当てがない場合、通常の確認
      if (!window.confirm('このメンバーを削除しますか？')) return;
    }

    setTeamMembers(teamMembers.filter(m => m.id !== memberId));
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setNewMemberName(member.name);
    setNewMemberRole(member.role);
  };

  const handleUpdateMember = () => {
    if (!newMemberName.trim() || !editingMember) {
      alert('メンバー名を入力してください。');
      return;
    }

    const trimmedName = newMemberName.trim();

    // 重複チェック（自分以外に同じ名前がいないかチェック）
    const isDuplicate = teamMembers.some(m =>
      m.id !== editingMember.id && m.name === trimmedName
    );
    if (isDuplicate) {
      alert(`⚠️ 「${trimmedName}」という名前のメンバーは既に存在します。`);
      return;
    }

    setTeamMembers(teamMembers.map(m =>
      m.id === editingMember.id
        ? { ...m, name: trimmedName, role: newMemberRole.trim() || 'メンバー' }
        : m
    ));
    setEditingMember(null);
    setNewMemberName('');
    setNewMemberRole('');
  };

  const handleCancelEditMember = () => {
    setEditingMember(null);
    setNewMemberName('');
    setNewMemberRole('');
  };

  // ルーティン管理関数
  const getTodayDateString = () => {
    return currentTime.toISOString().split('T')[0];
  };

  const getTodayRoutines = () => {
    const today = getTodayDateString();
    return routineTasks[today] || [];
  };

  const handleAddRoutine = () => {
    if (!newRoutineName.trim() || !newRoutineAssignee) return;

    const today = getTodayDateString();
    const newRoutine = {
      id: `r${Date.now()}`,
      name: newRoutineName.trim(),
      completed: false,
      time: newRoutineTime,
      category: newRoutineCategory,
      projectId: newRoutineProjectId,
      assignee: newRoutineAssignee,
      description: newRoutineDescription.trim(),
      repeat: newRoutineRepeat,
      duration: newRoutineDuration,
      notes: '',
      streak: 0,
      completedDates: []
    };

    const todayRoutines = getTodayRoutines();
    setRoutineTasks({
      ...routineTasks,
      [today]: [...todayRoutines, newRoutine]
    });

    // フォームをリセット
    setNewRoutineName('');
    setNewRoutineDescription('');
    setNewRoutineTime('09:00');
    setNewRoutineCategory('work');
    setNewRoutineAssignee('');
    setNewRoutineDuration(30);
    setNewRoutineRepeat('daily');
    setNewRoutineProjectId(null);
  };

  const handleDeleteRoutine = (routineId) => {
    if (!window.confirm('このルーティンを削除しますか？')) return;

    const today = getTodayDateString();
    const todayRoutines = getTodayRoutines();
    const updatedRoutines = todayRoutines.filter(r => r.id !== routineId);

    setRoutineTasks({
      ...routineTasks,
      [today]: updatedRoutines
    });
  };

  const handleEditRoutine = (routine) => {
    setEditingRoutine(routine);
    setNewRoutineName(routine.name);
    setNewRoutineTime(routine.time);
    setNewRoutineCategory(routine.category);
    setNewRoutineAssignee(routine.assignee);
    setNewRoutineDescription(routine.description);
    setNewRoutineRepeat(routine.repeat);
    setNewRoutineDuration(routine.duration);
    setNewRoutineProjectId(routine.projectId);
  };

  const handleUpdateRoutine = () => {
    if (!newRoutineName.trim() || !newRoutineAssignee || !editingRoutine) return;

    const today = getTodayDateString();
    const todayRoutines = getTodayRoutines();
    const updatedRoutines = todayRoutines.map(r =>
      r.id === editingRoutine.id
        ? {
            ...r,
            name: newRoutineName.trim(),
            time: newRoutineTime,
            category: newRoutineCategory,
            assignee: newRoutineAssignee,
            description: newRoutineDescription.trim(),
            repeat: newRoutineRepeat,
            duration: newRoutineDuration,
            projectId: newRoutineProjectId
          }
        : r
    );

    setRoutineTasks({
      ...routineTasks,
      [today]: updatedRoutines
    });

    // 編集モードを終了
    setEditingRoutine(null);
    setNewRoutineName('');
    setNewRoutineDescription('');
    setNewRoutineTime('09:00');
    setNewRoutineCategory('work');
    setNewRoutineAssignee('');
    setNewRoutineDuration(30);
    setNewRoutineRepeat('daily');
    setNewRoutineProjectId(null);
  };

  const handleCancelEditRoutine = () => {
    setEditingRoutine(null);
    setNewRoutineName('');
    setNewRoutineDescription('');
    setNewRoutineTime('09:00');
    setNewRoutineCategory('work');
    setNewRoutineAssignee('');
    setNewRoutineDuration(30);
    setNewRoutineRepeat('daily');
    setNewRoutineProjectId(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${cardBg} rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden border flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${textColor}`}>設定</h2>
            <button
              onClick={onClose}
              className={`${textSecondary} hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 flex gap-1`}>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            <Database size={18} className="inline mr-2" />
            データ管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            <Bell size={18} className="inline mr-2" />
            その他設定
          </button>
          <button
            onClick={() => setActiveTab('line')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'line'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            <Bell size={18} className="inline mr-2" />
            LINE通知
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'data' && (
            <DataManagementPanel
              projects={projects}
              setProjects={setProjects}
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
              routineTasks={routineTasks}
              setRoutineTasks={setRoutineTasks}
              routineCategories={routineCategories}
              setRoutineCategories={setRoutineCategories}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'settings' && (
            <>
          {/* 通知設定 */}
          <NotificationSettings
            settings={notificationSettings}
            onSettingsChange={setNotificationSettings}
            darkMode={darkMode}
          />

          {/* データ管理 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>データ管理</h3>
            <div className="space-y-3">
              {/* エクスポート */}
              <button
                onClick={exportData}
                className={`w-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all`}
              >
                <Download size={18} />
                データをエクスポート
              </button>

              {/* インポート */}
              <label className={`w-full ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer`}>
                <Upload size={18} />
                データをインポート
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              {/* ストレージ情報 */}
              <button
                onClick={handleShowInfo}
                className={`w-full ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all`}
              >
                <Info size={18} />
                ストレージ情報を表示
              </button>
            </div>
          </div>

          {/* ストレージ情報表示 */}
          {storageInfo && (
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
              <h4 className={`font-semibold ${textColor} mb-2`}>保存されているデータ</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(storageInfo).map(([key, data]) => (
                  <div key={key} className={`flex justify-between ${textSecondary}`}>
                    <span>{key}</span>
                    <span>{data.size} bytes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Sheets連携 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-2 flex items-center gap-2`}>
              <Cloud size={20} />
              Google Sheets連携
              {!googleSheetsEnabled && (
                <span className="text-xs px-2 py-1 bg-yellow-500 text-white rounded">未設定</span>
              )}
            </h3>

            {/* Google Apps Script URL設定 */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Google Apps Script URL
              </label>

              {!googleSheetsEnabled || isEditingUrl ? (
                // URLが未設定 or 編集中の場合
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/..."
                    value={isEditingUrl ? tempUrl : googleSheetsUrl}
                    onChange={(e) => isEditingUrl ? setTempUrl(e.target.value) : setGoogleSheetsUrl(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'} text-sm font-mono`}
                  />
                  {isEditingUrl ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveGoogleSheetsUrl}
                        className={`flex-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-all`}
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEditUrl}
                        className={`flex-1 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white px-4 py-2 rounded transition-all`}
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveGoogleSheetsUrl}
                      className={`w-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-all`}
                    >
                      URLを保存
                    </button>
                  )}
                </div>
              ) : (
                // URLが設定済みで閲覧中の場合
                <div className="space-y-2">
                  <div className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-sm font-mono ${textSecondary} flex items-center justify-between`}>
                    <span>●●●●●●●●●●●●●●●●●●●●</span>
                    <span className="text-xs px-2 py-1 bg-green-500 text-white rounded">設定済み</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditUrl}
                      className={`flex-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-all`}
                    >
                      編集
                    </button>
                    <button
                      onClick={handleDeleteUrl}
                      className={`flex-1 ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded transition-all`}
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}

              {!googleSheetsEnabled && !isEditingUrl && (
                <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg p-3 border-l-4 border-blue-500 mt-3`}>
                  <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>
                    📚 まだURLを取得していない場合：
                  </p>
                  <ol className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'} list-decimal list-inside space-y-1`}>
                    <li>GOOGLE_SHEETS_SETUP.md を開く</li>
                    <li>手順に従ってGoogle Apps Scriptを設定</li>
                    <li>デプロイして取得したウェブアプリURLを上記に貼り付け</li>
                    <li>「URLを保存」ボタンをクリック</li>
                  </ol>
                </div>
              )}
            </div>

            {googleSheetsEnabled && (
              <div className="space-y-3 mb-4">
                {/* 同期ステータス */}
                {syncStatus && (
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                    <p className={`text-sm font-medium ${textColor}`}>{syncStatus}</p>
                  </div>
                )}

                {/* アップロード */}
                <button
                  onClick={handleSyncToGoogleSheets}
                  disabled={isSyncing}
                  className={`w-full ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Upload size={18} />
                  {isSyncing ? '処理中...' : 'Google Sheetsにアップロード'}
                </button>

                {/* ダウンロード */}
                <button
                  onClick={handleSyncFromGoogleSheets}
                  disabled={isSyncing}
                  className={`w-full ${darkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Download size={18} />
                  {isSyncing ? '処理中...' : 'Google Sheetsからダウンロード'}
                </button>

                {/* 接続テスト */}
                <button
                  onClick={handleTestConnection}
                  disabled={isSyncing}
                  className={`w-full ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <RefreshCw size={18} />
                  接続テスト
                </button>
              </div>
            )}

            {googleSheetsEnabled && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className={`font-semibold ${textColor} mb-2 text-sm`}>使い方</h4>
                <ul className={`text-xs ${textSecondary} space-y-1 list-disc list-inside`}>
                  <li>アップロード：ローカルのデータをスプレッドシートに保存</li>
                  <li>ダウンロード：スプレッドシートのデータを取得</li>
                  <li>チーム全員が同じスプレッドシートを使えます</li>
                </ul>
              </div>
            )}
          </div>

          {/* プロジェクト管理 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>プロジェクト管理</h3>

            {/* 新規追加 / 編集フォーム */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="プロジェクト名"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (editingProject ? handleUpdateProject() : handleAddProject())}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />
                {editingProject ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProject}
                      className={`flex-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-all`}
                    >
                      更新
                    </button>
                    <button
                      onClick={handleCancelEditProject}
                      className={`flex-1 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white px-4 py-2 rounded transition-all`}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddProject}
                    className={`w-full ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded transition-all`}
                  >
                    + プロジェクトを追加
                  </button>
                )}
              </div>
            </div>

            {/* プロジェクト一覧 */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }}></div>
                    <span className={textColor}>{project.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm`}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white text-sm`}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* チームメンバー管理 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>チームメンバー管理</h3>

            {/* 新規追加 / 編集フォーム */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="メンバー名"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />
                <input
                  type="text"
                  placeholder="役割（例: デザイナー、エンジニアなど）"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (editingMember ? handleUpdateMember() : handleAddMember())}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />
                {editingMember ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateMember}
                      className={`flex-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-all`}
                    >
                      更新
                    </button>
                    <button
                      onClick={handleCancelEditMember}
                      className={`flex-1 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white px-4 py-2 rounded transition-all`}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddMember}
                    className={`w-full ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded transition-all`}
                  >
                    + メンバーを追加
                  </button>
                )}
              </div>
            </div>

            {/* メンバー一覧 */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamMembers.map(member => (
                <div key={member.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className={textColor}>{member.name}</div>
                      <div className={`text-xs ${textSecondary}`}>{member.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm`}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white text-sm`}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ルーティン管理 */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>ルーティン管理</h3>

            {/* 新規追加 / 編集フォーム */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              <div className="space-y-3">
                {/* ルーティン名 */}
                <input
                  type="text"
                  placeholder="ルーティン名（例: 朝のストレッチ）"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />

                {/* 時刻 */}
                <input
                  type="time"
                  value={newRoutineTime}
                  onChange={(e) => setNewRoutineTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />

                {/* 担当者 */}
                <select
                  value={newRoutineAssignee}
                  onChange={(e) => setNewRoutineAssignee(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                >
                  <option value="">担当者を選択</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>

                {/* カテゴリー */}
                <select
                  value={newRoutineCategory}
                  onChange={(e) => setNewRoutineCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                >
                  <option value="work">仕事</option>
                  <option value="health">健康</option>
                  <option value="personal">個人</option>
                </select>

                {/* プロジェクト（任意） */}
                <select
                  value={newRoutineProjectId || ''}
                  onChange={(e) => setNewRoutineProjectId(e.target.value ? parseInt(e.target.value) : null)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                >
                  <option value="">プロジェクトなし</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>

                {/* 繰り返し */}
                <select
                  value={newRoutineRepeat}
                  onChange={(e) => setNewRoutineRepeat(e.target.value)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                >
                  <option value="daily">毎日</option>
                  <option value="weekdays">平日</option>
                  <option value="custom">カスタム</option>
                </select>

                {/* 所要時間（分） */}
                <input
                  type="number"
                  placeholder="所要時間（分）"
                  value={newRoutineDuration}
                  onChange={(e) => setNewRoutineDuration(parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />

                {/* 説明 */}
                <textarea
                  placeholder="説明（任意）"
                  value={newRoutineDescription}
                  onChange={(e) => setNewRoutineDescription(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
                />

                {/* 追加/更新ボタン */}
                {editingRoutine ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateRoutine}
                      className={`flex-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-all`}
                    >
                      更新
                    </button>
                    <button
                      onClick={handleCancelEditRoutine}
                      className={`flex-1 ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white px-4 py-2 rounded transition-all`}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddRoutine}
                    disabled={!newRoutineName.trim() || !newRoutineAssignee}
                    className={`w-full ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    + ルーティンを追加
                  </button>
                )}
              </div>
            </div>

            {/* 今日のルーティン一覧 */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 mb-4`}>
              <h4 className={`font-semibold ${textColor} mb-2 text-sm`}>今日のルーティン</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getTodayRoutines().length === 0 ? (
                  <p className={`text-sm ${textSecondary} text-center py-4`}>ルーティンが登録されていません</p>
                ) : (
                  getTodayRoutines().map(routine => (
                    <div key={routine.id} className={`${darkMode ? 'bg-gray-600' : 'bg-white'} rounded-lg p-3 border ${darkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${textColor}`}>{routine.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${routine.category === 'work' ? 'bg-blue-500' : routine.category === 'health' ? 'bg-green-500' : 'bg-purple-500'} text-white`}>
                              {routine.category === 'work' ? '仕事' : routine.category === 'health' ? '健康' : '個人'}
                            </span>
                          </div>
                          <div className={`text-xs ${textSecondary} space-y-1`}>
                            <div>⏰ {routine.time} ({routine.duration}分)</div>
                            <div>👤 {routine.assignee}</div>
                            {routine.description && <div>📝 {routine.description}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditRoutine(routine)}
                            className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteRoutine(routine.id)}
                            className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* データクリア */}
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>データのクリア</h3>
            <div className="space-y-3">
              {/* ルーティンデータのみクリア */}
              <button
                onClick={handleClearRoutines}
                className={`w-full ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all`}
              >
                <Trash2 size={18} />
                {showConfirm === 'routines' ? '本当に削除しますか？もう一度クリック' : 'ルーティンデータをクリア'}
              </button>

              {/* 設定のみクリア */}
              <button
                onClick={handleClearSettings}
                className={`w-full ${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all`}
              >
                <Trash2 size={18} />
                {showConfirm === 'settings' ? '本当に削除しますか？もう一度クリック' : '設定をクリア'}
              </button>

              {/* 全データクリア */}
              <button
                onClick={handleClearAll}
                className={`w-full ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all`}
              >
                <Trash2 size={18} />
                {showConfirm === 'all' ? '本当に削除しますか？もう一度クリック' : 'すべてのデータをクリア'}
              </button>
            </div>
          </div>

          {/* 注意事項 */}
          <div className={`${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} rounded-lg p-4 border-l-4 border-yellow-500`}>
            <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              ⚠️ データをクリアすると元に戻せません。重要なデータは事前にエクスポートしてください。
            </p>
          </div>
            </>
          )}

          {activeTab === 'line' && (
            <LineNotifySettings
              darkMode={darkMode}
              teamMembers={teamMembers}
              projects={projects}
              routineTasks={routineTasks}
            />
          )}
        </div>

        {/* フッター */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} py-2 rounded-lg transition-colors font-medium`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
