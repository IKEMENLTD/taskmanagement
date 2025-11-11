import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, AlertCircle, CheckCircle, TrendingUp, Download, Edit, Trash2,
  MessageSquare, Paperclip, Tag, History, Link2, FileText, User, Target, ChevronRight, Plus, X, GitBranch
} from 'lucide-react';
import { getStatusColor, getPriorityColor } from '../../utils/colorUtils';
import {
  validateDependencies,
  canStartTask,
  getAllTasksFromProjects,
  getDependentTasks,
  getDependencyTasks,
  calculateRecommendedStartDate
} from '../../utils/dependencyUtils';
import {
  uploadFile,
  deleteFile,
  downloadFile,
  formatFileSize as formatFileSizeUtil
} from '../../utils/fileStorageUtils';

/**
 * タスク詳細モーダルコンポーネント
 * @param {Object} task - タスクオブジェクト
 * @param {Function} onClose - モーダルを閉じるハンドラー
 * @param {string} activeTab - アクティブなタブID
 * @param {Function} onTabChange - タブ切り替えハンドラー
 * @param {Array} projects - プロジェクト一覧
 * @param {boolean} darkMode - ダークモードフラグ
 * @param {Function} onUpdateTask - タスク更新ハンドラー
 * @param {Function} onDeleteTask - タスク削除ハンドラー
 * @param {Array} teamMembers - チームメンバー一覧
 */
export const TaskDetailModal = ({
  task,
  onClose,
  activeTab = 'overview',
  onTabChange,
  projects,
  darkMode = false,
  onUpdateTask,
  onDeleteTask,
  teamMembers = []
}) => {
  if (!task) return null;

  // 編集モード
  const [isEditing, setIsEditing] = useState(false);

  // 編集フォームデータ
  const [editedTask, setEditedTask] = useState({
    ...task
  });

  // コメント入力
  const [commentText, setCommentText] = useState('');

  // サブタスク入力
  const [newSubtaskName, setNewSubtaskName] = useState('');

  // 依存関係追加用の選択タスクID
  const [selectedDependencyId, setSelectedDependencyId] = useState('');

  // ファイルアップロード用の参照
  const fileInputRef = React.useRef(null);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  const getStatusText = (status) => {
    const statusMap = {
      completed: '完了',
      active: '進行中',
      blocked: 'ブロック中',
      pending: '未着手',
      warning: '警告'
    };
    return statusMap[status] || status;
  };

  const getRelatedTaskName = (taskId) => {
    for (const project of projects) {
      const relatedTask = project.tasks.find(t => t.id === taskId);
      if (relatedTask) return relatedTask.name;
    }
    return 'Unknown Task';
  };

  // 編集モードを開始
  const handleStartEdit = () => {
    setEditedTask({ ...task });
    setIsEditing(true);
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setEditedTask({ ...task });
    setIsEditing(false);
  };

  // 変更を保存
  const handleSave = () => {
    if (!editedTask.name.trim()) {
      alert('タスク名を入力してください');
      return;
    }

    // 日付バリデーション
    if (editedTask.startDate && editedTask.dueDate) {
      if (new Date(editedTask.startDate) > new Date(editedTask.dueDate)) {
        alert('⚠️ 開始日は期限より前でなければなりません。');
        return;
      }
    }

    onUpdateTask(editedTask);
    setIsEditing(false);
  };

  // タスクを削除
  const handleDelete = () => {
    onDeleteTask(task.id, task.projectId);
  };

  // サブタスクを追加
  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;

    const newSubtask = {
      id: Date.now(),
      name: newSubtaskName.trim(),
      completed: false
    };

    const updatedTask = {
      ...editedTask,
      subTasks: [...(editedTask.subTasks || []), newSubtask]
    };

    setEditedTask(updatedTask);
    onUpdateTask(updatedTask);
    setNewSubtaskName('');
  };

  // サブタスクの完了状態をトグル
  const handleToggleSubtask = (subtaskId) => {
    const updatedTask = {
      ...editedTask,
      subTasks: editedTask.subTasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    };

    setEditedTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  // コメントを追加
  const handleAddComment = () => {
    if (!commentText.trim()) return;

    const now = new Date();
    const newComment = {
      author: 'ユーザー', // 実際のユーザー名を使用
      text: commentText.trim(),
      date: now.toLocaleDateString('ja-JP'),
      time: now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTask = {
      ...editedTask,
      comments: [...(editedTask.comments || []), newComment]
    };

    setEditedTask(updatedTask);
    onUpdateTask(updatedTask);
    setCommentText('');
  };

  // ファイル選択ダイアログを開く
  const handleClickAddFile = () => {
    fileInputRef.current?.click();
  };

  // アップロード状態
  const [isUploading, setIsUploading] = useState(false);

  // ファイルが選択されたときの処理
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const newAttachments = [];

      for (const file of files) {
        // Supabase Storageにアップロード
        const result = await uploadFile(file, task.id);

        if (result.success) {
          newAttachments.push({
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSizeUtil(file.size),
            type: file.type || 'application/octet-stream',
            uploadDate: new Date().toLocaleDateString('ja-JP'),
            uploadTime: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            url: result.url,
            path: result.path
          });
        } else {
          alert(`ファイル "${file.name}" のアップロードに失敗しました: ${result.error}`);
        }
      }

      if (newAttachments.length > 0) {
        const updatedTask = {
          ...editedTask,
          attachments: [...(editedTask.attachments || []), ...newAttachments]
        };

        setEditedTask(updatedTask);
        onUpdateTask(updatedTask);
      }
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      alert('ファイルのアップロードに失敗しました');
    } finally {
      setIsUploading(false);
      // ファイル入力をリセット
      e.target.value = '';
    }
  };

  // ファイルを削除
  const handleRemoveAttachment = async (attachmentId) => {
    if (!window.confirm('この添付ファイルを削除しますか？')) return;

    const attachment = editedTask.attachments.find(att => att.id === attachmentId);

    // Supabase Storageからも削除
    if (attachment && attachment.path) {
      const result = await deleteFile(attachment.path);
      if (!result.success) {
        console.error('ファイル削除エラー:', result.error);
        // エラーでも続行（メタデータは削除）
      }
    }

    const updatedTask = {
      ...editedTask,
      attachments: editedTask.attachments.filter(att => att.id !== attachmentId)
    };

    setEditedTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${cardBg} rounded-2xl max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-hidden border flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-2xl font-bold ${textColor}`}>{task.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs text-white ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
              </div>
              <div className={`text-sm ${textSecondary} flex items-center gap-4 flex-wrap`}>
                <span className="flex items-center gap-1">
                  <Target size={14} />
                  {task.projectName}
                </span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {task.assignee}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  期限: {task.dueDate}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${textSecondary} hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2`}
            >
              <X size={24} />
            </button>
          </div>

          {/* タブナビゲーション */}
          <div className="flex gap-1 mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'overview', label: '概要', icon: FileText },
              { id: 'subtasks', label: 'サブタスク', icon: CheckCircle },
              { id: 'dependencies', label: '依存関係', icon: GitBranch },
              { id: 'comments', label: 'コメント', icon: MessageSquare },
              { id: 'attachments', label: '添付', icon: Paperclip },
              { id: 'activity', label: '履歴', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'comments' && task.comments && task.comments.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {task.comments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 進捗情報 */}
              <div>
                <h3 className={`text-lg font-semibold ${textColor} mb-4`}>進捗状況</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className={`text-sm ${textSecondary} mb-1`}>完了率</div>
                    <div className="flex items-end gap-2">
                      <div className={`text-3xl font-bold ${textColor}`}>{task.progress}%</div>
                      <div className={`w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-2 mb-2`}>
                        <div
                          className={`h-2 rounded-full ${getStatusColor(task.status)} transition-all`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className={`text-sm ${textSecondary} mb-1`}>作業時間</div>
                    <div className={`text-3xl font-bold ${textColor}`}>
                      {task.actualHours}
                      <span className="text-lg font-normal text-gray-500">/{task.estimatedHours}h</span>
                    </div>
                    <div className={`text-xs ${textSecondary} mt-1`}>
                      残り: {task.estimatedHours - task.actualHours}時間
                    </div>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className={`text-sm ${textSecondary} mb-1`}>
                      {task.status === 'completed' ? '期間' : '期日まで'}
                    </div>
                    {task.status === 'completed' ? (
                      <div>
                        <div className={`text-2xl font-bold ${textColor}`}>完了</div>
                        <div className={`text-xs ${textSecondary} mt-1`}>
                          {task.completedDate}に完了
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className={`text-3xl font-bold ${textColor}`}>
                          {Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))}
                          <span className="text-lg font-normal text-gray-500">日</span>
                        </div>
                        <div className={`text-xs ${textSecondary} mt-1`}>
                          期限: {task.dueDate}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 説明 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${textColor}`}>タスク詳細</h3>
                  {!isEditing && (
                    <button
                      onClick={handleStartEdit}
                      className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1`}
                    >
                      <Edit size={14} />
                      編集
                    </button>
                  )}
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-sm font-medium ${textColor} mb-1`}>タスク名</label>
                        <input
                          type="text"
                          value={editedTask.name}
                          onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${textColor} mb-1`}>説明</label>
                        <textarea
                          rows="4"
                          value={editedTask.description}
                          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-sm font-medium ${textColor} mb-1`}>担当者</label>
                          <select
                            value={editedTask.assignee}
                            onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            {teamMembers.map(member => (
                              <option key={member.name} value={member.name}>{member.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textColor} mb-1`}>ステータス</label>
                          <select
                            value={editedTask.status}
                            onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="active">進行中</option>
                            <option value="pending">未着手</option>
                            <option value="blocked">ブロック中</option>
                            <option value="completed">完了</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-sm font-medium ${textColor} mb-1`}>開始日</label>
                          <input
                            type="date"
                            value={editedTask.startDate}
                            onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textColor} mb-1`}>期限</label>
                          <input
                            type="date"
                            value={editedTask.dueDate}
                            onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${textColor} mb-1`}>進捗率 (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editedTask.progress}
                          onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className={`${textColor} leading-relaxed`}>{task.description}</p>
                  )}
                </div>
              </div>

              {/* タグ */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${textColor} mb-3`}>タグ</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} flex items-center gap-1`}
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ブロッカー */}
              {task.blockers && task.blockers.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${textColor} mb-3`}>ブロッカー</h3>
                  <div className="space-y-2">
                    {task.blockers.map((blocker, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500 flex items-start gap-2"
                      >
                        <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-red-700 dark:text-red-300">{blocker}</div>
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            このブロッカーを解決する必要があります
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 関連タスク */}
              {task.relatedTasks && task.relatedTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${textColor} mb-3`}>関連タスク</h3>
                  <div className="space-y-2">
                    {task.relatedTasks.map((relatedId, idx) => (
                      <div
                        key={idx}
                        className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex items-center justify-between ${hoverBg} cursor-pointer transition-all`}
                      >
                        <div className="flex items-center gap-2">
                          <Link2 size={16} className={textSecondary} />
                          <span className={textColor}>{getRelatedTaskName(relatedId)}</span>
                        </div>
                        <ChevronRight size={16} className={textSecondary} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* サブタスクタブ */}
          {activeTab === 'subtasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${textColor}`}>
                  サブタスク ({(editedTask.subTasks || []).filter(st => st.completed).length}/{(editedTask.subTasks || []).length})
                </h3>
              </div>

              {/* サブタスク追加フォーム */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="新しいサブタスクを入力..."
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                    className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    onClick={handleAddSubtask}
                    className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1`}
                  >
                    <Plus size={14} />
                    追加
                  </button>
                </div>
              </div>

              {/* サブタスク一覧 */}
              {(editedTask.subTasks || []).map((subtask) => (
                <div
                  key={subtask.id}
                  className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-center gap-3 ${hoverBg} transition-all`}
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className={`flex-1 ${subtask.completed ? `${textSecondary} line-through` : textColor}`}>
                    {subtask.name}
                  </span>
                  {subtask.completed && (
                    <CheckCircle size={18} className="text-green-500" />
                  )}
                </div>
              ))}

              {(!editedTask.subTasks || editedTask.subTasks.length === 0) && (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-8 text-center`}>
                  <p className={textSecondary}>サブタスクはありません。上のフォームから追加してください。</p>
                </div>
              )}
            </div>
          )}

          {/* コメントタブ */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${textColor}`}>
                  コメント ({editedTask.comments?.length || 0})
                </h3>
              </div>

              {/* コメント入力 */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <textarea
                  placeholder="コメントを追加..."
                  rows="3"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    投稿
                  </button>
                </div>
              </div>

              {/* コメント一覧 */}
              <div className="space-y-3">
                {editedTask.comments?.map((comment, idx) => (
                  <div
                    key={idx}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {comment.author[0]}
                        </div>
                        <div>
                          <div className={`font-semibold ${textColor}`}>{comment.author}</div>
                          <div className={`text-xs ${textSecondary}`}>{comment.date} {comment.time}</div>
                        </div>
                      </div>
                    </div>
                    <p className={`${textColor} ml-10`}>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添付ファイルタブ */}
          {activeTab === 'attachments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${textColor}`}>
                  添付ファイル ({editedTask.attachments?.length || 0})
                </h3>
                <button
                  onClick={handleClickAddFile}
                  className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1`}
                >
                  <Paperclip size={14} />
                  追加
                </button>
              </div>

              {/* 隠しファイル入力 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* 注意書き */}
              <div className={`${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-lg p-3 border text-sm`}>
                <p className={darkMode ? 'text-blue-300' : 'text-blue-700'}>
                  📎 ファイルはSupabase Storageに安全に保存されます。ダウンロード・削除が可能です。
                </p>
              </div>

              {!editedTask.attachments || editedTask.attachments.length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-12 text-center`}>
                  <Paperclip className={`mx-auto mb-3 ${textSecondary}`} size={48} />
                  <p className={textSecondary}>添付ファイルはありません</p>
                  <button
                    onClick={handleClickAddFile}
                    className={`mt-4 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} text-sm`}
                  >
                    ファイルを追加
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {editedTask.attachments.map((file) => (
                    <div
                      key={file.id}
                      className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between ${hoverBg} transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center`}>
                          <Paperclip className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
                        </div>
                        <div>
                          <div className={`font-semibold ${textColor}`}>{file.name}</div>
                          <div className={`text-xs ${textSecondary}`}>
                            {file.size} • {file.type}
                            {file.uploadDate && ` • ${file.uploadDate}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => await downloadFile(file.path, file.name)}
                          className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} p-2 transition-colors`}
                          title="ダウンロード"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveAttachment(file.id)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} p-2 transition-colors`}
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 依存関係タブ */}
          {activeTab === 'dependencies' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
                タスクの依存関係
              </h3>

              {(() => {
                const allTasks = getAllTasksFromProjects(projects);
                const currentTask = allTasks.find(t => t.id === task.id) || { ...task, dependencies: task.dependencies || [] };
                const validation = validateDependencies(currentTask, allTasks);
                const { canStart, blockedBy } = canStartTask(currentTask, allTasks);
                const dependencyTasks = getDependencyTasks(currentTask, allTasks);
                const dependentTasks = getDependentTasks(task.id, allTasks);
                const recommendedDate = calculateRecommendedStartDate(currentTask, allTasks);

                return (
                  <>
                    {/* 検証結果 */}
                    {validation.errors.length > 0 && (
                      <div className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} rounded-lg p-4 border`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                          <div>
                            <h4 className={`font-semibold ${darkMode ? 'text-red-300' : 'text-red-700'} mb-2`}>エラー</h4>
                            <ul className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'} space-y-1`}>
                              {validation.errors.map((error, idx) => (
                                <li key={idx}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div className={`${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} rounded-lg p-4 border`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                          <div>
                            <h4 className={`font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>警告</h4>
                            <ul className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'} space-y-1`}>
                              {validation.warnings.map((warning, idx) => (
                                <li key={idx}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 開始可能状態 */}
                    <div className={`${cardBg} rounded-lg p-4 border`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {canStart ? (
                            <>
                              <CheckCircle className="text-green-500" size={24} />
                              <div>
                                <div className={`font-semibold ${textColor}`}>開始可能</div>
                                <div className={`text-sm ${textSecondary}`}>
                                  すべての依存タスクが完了しています
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="text-red-500" size={24} />
                              <div>
                                <div className={`font-semibold ${textColor}`}>ブロック中</div>
                                <div className={`text-sm ${textSecondary}`}>
                                  {blockedBy.length}個の依存タスクが未完了です
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {recommendedDate && (
                          <div className={`text-sm ${textSecondary}`}>
                            推奨開始日: <span className={`font-semibold ${textColor}`}>{recommendedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 依存元タスク（このタスクが依存しているタスク） */}
                    <div>
                      <h4 className={`font-semibold ${textColor} mb-3`}>依存元タスク ({dependencyTasks.length})</h4>

                      {/* 依存タスク追加フォーム */}
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-3`}>
                        <div className="flex gap-2">
                          <select
                            value={selectedDependencyId}
                            onChange={(e) => setSelectedDependencyId(e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="">依存元タスクを選択...</option>
                            {allTasks
                              .filter(t =>
                                t.id !== task.id && // 自分自身は除外
                                !(editedTask.dependencies || []).includes(t.id) // 既に依存関係にあるタスクは除外
                              )
                              .map(t => (
                                <option key={t.id} value={t.id}>
                                  [{t.projectName}] {t.name}
                                </option>
                              ))
                            }
                          </select>
                          <button
                            onClick={() => {
                              if (!selectedDependencyId) {
                                alert('タスクを選択してください');
                                return;
                              }
                              const numId = parseInt(selectedDependencyId);
                              const newDeps = [...(editedTask.dependencies || []), numId];
                              const updatedTask = { ...editedTask, dependencies: newDeps };
                              setEditedTask(updatedTask);
                              onUpdateTask(updatedTask);
                              setSelectedDependencyId('');
                            }}
                            disabled={!selectedDependencyId}
                            className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Plus size={14} />
                            追加
                          </button>
                        </div>
                      </div>

                      {dependencyTasks.length === 0 ? (
                        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-8 text-center`}>
                          <GitBranch className={`mx-auto mb-3 ${textSecondary}`} size={36} />
                          <p className={textSecondary}>依存元タスクはありません</p>
                          <p className={`text-xs ${textSecondary} mt-2`}>
                            このタスクは他のタスクの完了を待たずに開始できます
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dependencyTasks.map((depTask) => (
                            <div
                              key={depTask.id}
                              className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 ${hoverBg} transition-all`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: depTask.projectColor }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-semibold ${textColor} truncate`}>
                                      {depTask.name}
                                    </div>
                                    <div className={`text-xs ${textSecondary} flex items-center gap-2`}>
                                      <span>{depTask.projectName}</span>
                                      <span>•</span>
                                      <span className={`px-2 py-0.5 rounded ${getStatusColor(depTask.status)} text-white`}>
                                        {depTask.status === 'completed' ? '完了' : '進行中'}
                                      </span>
                                      {depTask.dueDate && (
                                        <>
                                          <span>•</span>
                                          <span>期限: {depTask.dueDate}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const newDeps = editedTask.dependencies.filter(id => id !== depTask.id);
                                    const updatedTask = { ...editedTask, dependencies: newDeps };
                                    setEditedTask(updatedTask);
                                    onUpdateTask(updatedTask);
                                  }}
                                  className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} p-2 transition-colors flex-shrink-0`}
                                  title="削除"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 依存先タスク（このタスクに依存しているタスク） */}
                    <div>
                      <h4 className={`font-semibold ${textColor} mb-3`}>
                        依存先タスク ({dependentTasks.length})
                      </h4>

                      {dependentTasks.length === 0 ? (
                        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-8 text-center`}>
                          <GitBranch className={`mx-auto mb-3 ${textSecondary}`} size={36} />
                          <p className={textSecondary}>依存先タスクはありません</p>
                          <p className={`text-xs ${textSecondary} mt-2`}>
                            このタスクに依存している他のタスクはありません
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dependentTasks.map((depTask) => (
                            <div
                              key={depTask.id}
                              className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 ${hoverBg} transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: depTask.projectColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-semibold ${textColor} truncate`}>
                                    {depTask.name}
                                  </div>
                                  <div className={`text-xs ${textSecondary} flex items-center gap-2`}>
                                    <span>{depTask.projectName}</span>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded ${getStatusColor(depTask.status)} text-white`}>
                                      {depTask.status === 'completed' ? '完了' : '進行中'}
                                    </span>
                                    {depTask.dueDate && (
                                      <>
                                        <span>•</span>
                                        <span>期限: {depTask.dueDate}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className={`text-xs ${textSecondary} flex-shrink-0`}>
                                  このタスクの完了を待っています
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 説明 */}
                    <div className={`${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-lg p-4 border text-sm`}>
                      <h4 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>
                        💡 依存関係について
                      </h4>
                      <ul className={`${darkMode ? 'text-blue-300' : 'text-blue-600'} space-y-1 text-sm`}>
                        <li>• <strong>依存元タスク</strong>: このタスクを開始する前に完了しておく必要があるタスク</li>
                        <li>• <strong>依存先タスク</strong>: このタスクの完了を待っているタスク</li>
                        <li>• 依存元タスクがすべて完了するまで、このタスクは開始できません</li>
                        <li>• 循環依存（A→B→A）は禁止されています</li>
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* アクティビティタブ */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
                アクティビティ履歴
              </h3>
              {!task.activities || task.activities.length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-12 text-center`}>
                  <History className={`mx-auto mb-3 ${textSecondary}`} size={48} />
                  <p className={textSecondary}>アクティビティ履歴はありません</p>
                </div>
              ) : (
                <div className="relative">
                  <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className="space-y-4">
                    {task.activities.map((activity, idx) => (
                      <div key={idx} className="relative flex gap-4">
                        <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center z-10`}>
                          {activity.type === 'status' && <Target size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />}
                          {activity.type === 'progress' && <TrendingUp size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />}
                          {activity.type === 'comment' && <MessageSquare size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />}
                          {activity.type === 'blocker' && <AlertCircle size={14} className="text-red-500" />}
                          {activity.type === 'attachment' && <Paperclip size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className={`font-medium ${textColor}`}>{activity.message}</div>
                          <div className={`text-sm ${textSecondary} mt-1`}>
                            {activity.user} • {activity.date} {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col gap-4`}>
          {/* 優先度表示 */}
          {task.priority && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${textSecondary}`}>優先度:</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {task.priority === 'urgent' ? '🔴 緊急' :
                 task.priority === 'high' ? '🟠 高' :
                 task.priority === 'medium' ? '🟡 中' : '🟢 低'}
              </span>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={handleDelete}
                  className={`${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm`}
                >
                  <Trash2 size={16} />
                  削除
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className={`px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} py-2 rounded-lg transition-colors font-medium`}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2`}
                  >
                    <CheckCircle size={16} />
                    変更を保存
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} py-2 rounded-lg transition-colors font-medium`}
                >
                  閉じる
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
