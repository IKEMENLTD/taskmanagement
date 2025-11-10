import React, { useState } from 'react';
import { Users, Calendar, CheckCircle, AlertCircle, Plus, X, Edit, Trash2, Search, GitBranch, GripVertical, CheckSquare } from 'lucide-react';
import { getStatusColor } from '../../utils/colorUtils';
import { canStartTask, getAllTasksFromProjects } from '../../utils/dependencyUtils';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { moveTaskToProject } from '../../utils/dragDropUtils';
import { BulkActionsToolbar } from '../bulk/BulkActionsToolbar';
import {
  bulkUpdateStatus,
  bulkUpdateAssignee,
  bulkUpdatePriority,
  bulkDeleteTasks,
  bulkMoveTasksToProject
} from '../../utils/bulkOperationsUtils';
import { useAuth } from '../../contexts/AuthContext';
import {
  canCreateProject,
  canCreateTask,
  canEditTask,
  canDeleteTask
} from '../../utils/permissionUtils';
import { createProject, updateProject, deleteProject, createTask, updateTask, deleteTask } from '../../utils/projectUtils';

/**
 * タイムラインビューコンポーネント
 * @param {Array} projects - プロジェクト一覧
 * @param {Function} onTaskClick - タスククリックハンドラー
 * @param {Function} setProjects - プロジェクト更新関数
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {boolean} darkMode - ダークモードフラグ
 */
export const TimelineView = ({ projects, onTaskClick, setProjects, teamMembers = [], darkMode = false }) => {
  // 認証情報
  const { user, role } = useAuth();

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  // フィルター管理
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // モーダル管理
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    timeline: { start: '', end: '' },
    team: [],
    progress: 0,
    color: '#3b82f6' // デフォルト: 青色
  });

  // タスクフォーム状態
  const [taskFormData, setTaskFormData] = useState({
    name: '',
    assignee: '',
    status: 'active',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    description: '',
    progress: 0
  });

  // チームメンバー選択用
  const [memberInput, setMemberInput] = useState('');

  // 一括操作
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // ドラッグ&ドロップ
  const {
    draggedItem,
    dragOverItem,
    getDraggableProps,
    getDropZoneStyle,
    reorderItems
  } = useDragAndDrop();

  // タスクドロップハンドラー
  const handleTaskDrop = (draggedTask, targetTask) => {
    if (!draggedTask || !targetTask) return;

    const sourceProject = projects.find(p =>
      p.tasks.some(t => t.id === draggedTask.id)
    );
    const targetProject = projects.find(p =>
      p.tasks.some(t => t.id === targetTask.id)
    );

    if (!sourceProject || !targetProject) return;

    if (sourceProject.id === targetProject.id) {
      // 同じプロジェクト内での順序変更
      const updatedProjects = projects.map(project => {
        if (project.id === sourceProject.id) {
          const reorderedTasks = reorderItems(project.tasks, draggedTask, targetTask);
          return { ...project, tasks: reorderedTasks };
        }
        return project;
      });
      setProjects(updatedProjects);
    } else {
      // プロジェクト間でのタスク移動
      const updatedProjects = moveTaskToProject(
        projects,
        draggedTask.id,
        sourceProject.id,
        targetProject.id
      );
      setProjects(updatedProjects);
    }
  };

  // プロジェクトドロップゾーンハンドラー
  const handleProjectDrop = (draggedTask, targetProjectId) => {
    if (!draggedTask || !targetProjectId) return;

    const sourceProject = projects.find(p =>
      p.tasks.some(t => t.id === draggedTask.id)
    );

    if (!sourceProject) return;

    // プロジェクト間でのタスク移動
    const updatedProjects = moveTaskToProject(
      projects,
      draggedTask.id,
      sourceProject.id,
      targetProjectId
    );
    setProjects(updatedProjects);
  };

  // 一括操作ハンドラー
  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    const allTaskIds = projects.flatMap(p => p.tasks.map(t => t.id));
    setSelectedTasks(allTaskIds);
  };

  const handleClearSelection = () => {
    setSelectedTasks([]);
    setSelectionMode(false);
  };

  const handleBulkUpdateStatus = (status) => {
    const updatedProjects = bulkUpdateStatus(projects, selectedTasks, status);
    setProjects(updatedProjects);
    handleClearSelection();
  };

  const handleBulkUpdateAssignee = (assignee) => {
    const updatedProjects = bulkUpdateAssignee(projects, selectedTasks, assignee);
    setProjects(updatedProjects);
    handleClearSelection();
  };

  const handleBulkUpdatePriority = (priority) => {
    const updatedProjects = bulkUpdatePriority(projects, selectedTasks, priority);
    setProjects(updatedProjects);
    handleClearSelection();
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`選択した${selectedTasks.length}件のタスクを削除しますか？`)) return;

    const updatedProjects = bulkDeleteTasks(projects, selectedTasks);
    setProjects(updatedProjects);
    handleClearSelection();
  };

  const handleBulkMoveToProject = (targetProjectId) => {
    const updatedProjects = bulkMoveTasksToProject(projects, selectedTasks, targetProjectId);
    setProjects(updatedProjects);
    handleClearSelection();
  };

  // モーダル操作
  const openAddModal = () => {
    setEditingProject(null);
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];

    setFormData({
      name: '',
      status: 'active',
      timeline: { start: today, end: endDate },
      team: [],
      progress: 0,
      color: '#3b82f6' // デフォルト: 青色
    });
    setMemberInput('');
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      status: project.status,
      timeline: { ...project.timeline },
      team: project.team ? [...project.team] : [],
      color: project.color || '#3b82f6', // 既存の色またはデフォルト
      progress: project.progress
    });
    setMemberInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
  };

  const openDetailModal = (project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProject(null);
  };

  const handleEditFromDetail = (project) => {
    closeDetailModal();
    openEditModal(project);
  };

  // チームメンバー追加
  const handleAddMember = (memberName) => {
    if (memberName && !formData.team.includes(memberName)) {
      setFormData({ ...formData, team: [...formData.team, memberName] });
    }
    setMemberInput('');
  };

  const handleRemoveMember = (memberToRemove) => {
    setFormData({ ...formData, team: formData.team.filter(m => m !== memberToRemove) });
  };

  // 保存
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.timeline.start || !formData.timeline.end) {
      alert('必須項目を入力してください。');
      return;
    }

    // 日付バリデーション
    if (new Date(formData.timeline.start) > new Date(formData.timeline.end)) {
      alert('⚠️ 開始日は終了日より前でなければなりません。');
      return;
    }

    if (editingProject) {
      // 編集
      const { data, error } = await updateProject(editingProject.id, {
        name: formData.name.trim(),
        color: formData.color,
        status: formData.status,
        progress: formData.progress,
        timeline: formData.timeline,
        team: formData.team
      });

      if (error) {
        console.error('プロジェクト更新エラー:', error);
        alert('プロジェクトの更新に失敗しました');
        return;
      }

      // ローカルステートを更新
      const updatedProjects = projects.map(p =>
        p.id === editingProject.id
          ? { ...p, ...formData, name: formData.name.trim() }
          : p
      );
      setProjects(updatedProjects);
    } else {
      // 新規追加
      const { data, error } = await createProject({
        name: formData.name.trim(),
        color: formData.color,
        status: formData.status,
        progress: formData.progress,
        timeline: formData.timeline,
        team: formData.team
      });

      if (error) {
        console.error('プロジェクト作成エラー:', error);
        alert('プロジェクトの作成に失敗しました');
        return;
      }

      // ローカルステートを更新
      if (data) {
        setProjects([...projects, { ...data, team: formData.team }]);
      }
    }

    closeModal();
  };

  // 削除
  const handleDelete = async (projectId) => {
    if (!window.confirm('このプロジェクトを削除しますか？')) return;

    const { error } = await deleteProject(projectId);

    if (error) {
      console.error('プロジェクト削除エラー:', error);
      alert('プロジェクトの削除に失敗しました');
      return;
    }

    setProjects(projects.filter(p => p.id !== projectId));
    closeDetailModal();
  };

  // タスクモーダル操作
  const openAddTaskModal = (projectId) => {
    setCurrentProjectId(projectId);
    setEditingTask(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dueDate = nextWeek.toISOString().split('T')[0];

    setTaskFormData({
      name: '',
      assignee: '',
      status: 'active',
      priority: 'medium',
      startDate: today,
      dueDate: dueDate,
      description: '',
      progress: 0
    });
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task, projectId) => {
    setCurrentProjectId(projectId);
    setEditingTask(task);
    setTaskFormData({
      name: task.name,
      assignee: task.assignee,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      description: task.description,
      progress: task.progress
    });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setCurrentProjectId(null);
  };

  // タスク保存
  const handleSaveTask = async () => {
    if (!taskFormData.name.trim() || !taskFormData.assignee) {
      alert('必須項目を入力してください。');
      return;
    }

    // 日付バリデーション
    if (taskFormData.startDate && taskFormData.dueDate) {
      if (new Date(taskFormData.startDate) > new Date(taskFormData.dueDate)) {
        alert('⚠️ 開始日は期限より前でなければなりません。');
        return;
      }
    }

    if (editingTask) {
      // 編集
      const { data, error } = await updateTask(editingTask.id, {
        name: taskFormData.name?.trim() || taskFormData.name,
        description: taskFormData.description?.trim() || taskFormData.description || null,
        assignee: taskFormData.assignee,
        status: taskFormData.status,
        priority: taskFormData.priority,
        progress: taskFormData.progress,
        startDate: taskFormData.startDate,
        dueDate: taskFormData.dueDate,
        completedDate: taskFormData.status === 'completed' ? new Date().toISOString().split('T')[0] : null
      });

      if (error) {
        console.error('タスク更新エラー:', error);
        alert('タスクの更新に失敗しました');
        return;
      }

      // ローカルステートを更新
      const updatedProjects = projects.map(p => {
        if (p.id === currentProjectId) {
          const updatedTasks = p.tasks.map(t =>
            t.id === editingTask.id
              ? {
                  ...t,
                  ...taskFormData,
                  name: taskFormData.name?.trim() || taskFormData.name,
                  description: taskFormData.description?.trim() || taskFormData.description || null,
                  completedDate: taskFormData.status === 'completed' ? new Date().toISOString().split('T')[0] : null
                }
              : t
          );
          return { ...p, tasks: updatedTasks };
        }
        return p;
      });
      setProjects(updatedProjects);
    } else {
      // 新規追加
      const { data, error } = await createTask(currentProjectId, {
        name: taskFormData.name?.trim() || taskFormData.name,
        description: taskFormData.description?.trim() || taskFormData.description || null,
        assignee: taskFormData.assignee,
        status: taskFormData.status,
        priority: taskFormData.priority,
        progress: taskFormData.progress,
        startDate: taskFormData.startDate,
        dueDate: taskFormData.dueDate
      });

      if (error) {
        console.error('タスク作成エラー:', error);
        alert('タスクの作成に失敗しました');
        return;
      }

      // ローカルステートを更新
      if (data) {
        const updatedProjects = projects.map(p => {
          if (p.id === currentProjectId) {
            const newTask = {
              ...data,
              projectId: currentProjectId,
              blockers: [],
              tags: [],
              estimatedHours: 0,
              actualHours: 0,
              subTasks: [],
              attachments: [],
              comments: [],
              activities: [],
              dependencies: [],
              relatedTasks: []
            };
            return { ...p, tasks: [...p.tasks, newTask] };
          }
          return p;
        });
        setProjects(updatedProjects);
      }
    }

    closeTaskModal();
  };

  // タスク削除
  const handleDeleteTask = async (taskId, projectId) => {
    if (!window.confirm('このタスクを削除しますか？')) return;

    const { error } = await deleteTask(taskId);

    if (error) {
      console.error('タスク削除エラー:', error);
      alert('タスクの削除に失敗しました');
      return;
    }

    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
      }
      return p;
    });

    setProjects(updatedProjects);
  };

  // プロジェクトをフィルター
  const filteredProjects = projects.filter(p => {
    // プロジェクトフィルター
    if (filterProject !== 'all' && p.id !== parseInt(filterProject)) {
      return false;
    }
    // 検索クエリ
    if (searchQuery === '') return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team.some(member => member.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textColor}`}>プロジェクト一覧</h2>
          <p className={`${textSecondary} mt-1`}>すべてのプロジェクトと進捗を確認できます</p>
        </div>
        {canCreateProject(role) && (
          <button
            onClick={openAddModal}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <Plus size={18} />
            プロジェクト追加
          </button>
        )}
      </div>

      {/* フィルター */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* 検索窓 */}
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary}`} />
            <input
              type="text"
              placeholder="プロジェクト名やメンバーで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* フィルター */}
          <div className="flex flex-wrap items-center gap-2">
            <label className={`text-sm ${textSecondary}`}>プロジェクト:</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${textColor} text-sm`}
            >
              <option value="all">全て</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <label className={`text-sm ${textSecondary} ml-2`}>優先度:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${textColor} text-sm`}
            >
              <option value="all">全て</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">緊急</option>
            </select>

            {/* 一括操作モード切り替え */}
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) {
                  setSelectedTasks([]);
                }
              }}
              className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                selectionMode
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor}`
              }`}
            >
              <CheckSquare size={16} />
              {selectionMode ? '選択モード終了' : '一括操作'}
            </button>

            {selectionMode && (
              <button
                onClick={handleSelectAll}
                className={`ml-2 px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} transition-colors`}
              >
                全て選択
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredProjects.map(project => (
        <div
          key={project.id}
          className={`${cardBg} rounded-xl p-4 border ${hoverBg} transition-all border-l-4 ${
            draggedItem && draggedItem.id !== project.id ? 'drop-zone' : ''
          }`}
          style={{ borderLeftColor: project.color || '#3b82f6' }}
          onDragOver={(e) => {
            if (draggedItem && draggedItem.id !== project.id) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedItem) {
              handleProjectDrop(draggedItem, project.id);
            }
          }}
        >
          {/* プロジェクトヘッダー */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-bold ${textColor}`}>{project.name}</h3>
                {canCreateProject(role) && (
                  <button
                    onClick={() => openDetailModal(project)}
                    className={`${textSecondary} hover:${textColor} transition-colors p-1`}
                  >
                    <Edit size={14} />
                  </button>
                )}
              </div>
              <div className={`text-xs ${textSecondary} mt-1 flex items-center gap-3`}>
                {project.team && project.team.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {Array.isArray(project.team) ? project.team.join(', ') : project.team}
                  </span>
                )}
                {project.timeline_end && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {project.timeline_end}まで
                  </span>
                )}
              </div>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs text-white"
              style={{ backgroundColor: project.color || getStatusColor(project.status).replace('bg-', '#') }}
            >
              {project.progress}%
            </div>
          </div>

          {/* プロジェクト進捗バー */}
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute h-full transition-all duration-500"
              style={{
                width: `${project.progress}%`,
                backgroundColor: project.color || '#3b82f6'
              }}
            >
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>

          {/* タスク追加ボタン */}
          {canCreateTask(role) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => openAddTaskModal(project.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-1 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              >
                <Plus size={14} />
                タスク追加
              </button>
            </div>
          )}

          {/* タスク一覧 */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...project.tasks]
              .filter(task => {
                // 優先度フィルター
                if (filterPriority !== 'all' && task.priority !== filterPriority) {
                  return false;
                }
                return true;
              })
              .sort((a, b) => {
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;
                return 0;
              }).map(task => (
              <div
                key={task.id}
                {...getDraggableProps(task, handleTaskDrop)}
                className={`p-3 rounded-lg ${task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                  task.status === 'blocked' ? 'bg-red-50 dark:bg-red-900/20' :
                    'bg-blue-50 dark:bg-blue-900/20'
                  } transition-all group cursor-move ${getDropZoneStyle(task, darkMode)} ${
                  selectedTasks.includes(task.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1 flex-1">
                    {selectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleTaskSelection(task.id);
                        }}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    )}
                    <GripVertical size={14} className={`${textSecondary} flex-shrink-0 ${selectionMode ? 'hidden' : ''}`} />
                    <button
                      onClick={() => onTaskClick({ ...task, projectName: project.name, projectId: project.id })}
                      className={`text-sm font-medium hover:underline text-left ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                        task.status === 'blocked' ? 'text-red-700 dark:text-red-300' :
                          'text-blue-700 dark:text-blue-300'
                        }`}
                    >
                      {task.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {task.status === 'completed' && <CheckCircle size={14} className="text-green-500" />}
                    {task.status === 'blocked' && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                    {canEditTask(role, task.assignee, user?.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTaskModal(task, project.id);
                        }}
                        className={`${textSecondary} hover:text-blue-500 transition-colors p-1`}
                        title="編集"
                      >
                        <Edit size={12} />
                      </button>
                    )}
                    {canDeleteTask(role) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id, project.id);
                        }}
                        className={`${textSecondary} hover:text-red-500 transition-colors p-1`}
                        title="削除"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className={`text-xs ${textSecondary} mb-1`}>{task.assignee}</div>
                <div className={`text-xs ${textSecondary} mb-2`}>
                  {task.status === 'completed'
                    ? `${task.startDate} → ${task.completedDate}`
                    : `${task.startDate} → ${task.dueDate}`}
                </div>

                {/* 依存関係の警告 */}
                {(() => {
                  const allTasks = getAllTasksFromProjects(projects);
                  const { canStart, blockedBy } = canStartTask({ ...task, dependencies: task.dependencies || [] }, allTasks);

                  if (!canStart && blockedBy.length > 0) {
                    return (
                      <div className={`text-xs ${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded p-2 mb-2 flex items-start gap-1`}>
                        <GitBranch size={12} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>
                          <div className="font-semibold">ブロック中</div>
                          <div>{blockedBy.length}個の依存タスクが未完了です</div>
                        </div>
                      </div>
                    );
                  }

                  if (task.dependencies && task.dependencies.length > 0) {
                    return (
                      <div className={`text-xs ${textSecondary} mb-1 flex items-center gap-1`}>
                        <GitBranch size={12} />
                        <span>{task.dependencies.length}個の依存関係</span>
                      </div>
                    );
                  }

                  return null;
                })()}

                <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-full h-1.5`}>
                  <div
                    className={`h-1.5 rounded-full ${getStatusColor(task.status)} transition-all`}
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* プロジェクトが0件の場合 */}
      {filteredProjects.length === 0 && (
        <div className={`${cardBg} rounded-xl p-12 border text-center`}>
          <Calendar size={48} className={`mx-auto mb-4 ${textSecondary}`} />
          <p className={`${textColor} text-lg font-semibold mb-2`}>
            {searchQuery ? 'プロジェクトが見つかりませんでした' : 'プロジェクトがありません'}
          </p>
          <p className={textSecondary}>
            {searchQuery ? '検索条件を変更してください' : '新しいプロジェクトを作成しましょう'}
          </p>
        </div>
      )}

      {/* プロジェクト追加・編集モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className={`${cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className={`sticky top-0 ${cardBg} p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {editingProject ? 'プロジェクトを編集' : '新しいプロジェクトを追加'}
                </h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  {editingProject ? 'プロジェクトの情報を更新します' : '新しいプロジェクトを作成します'}
                </p>
              </div>
              <button onClick={closeModal} className={`${textSecondary} hover:${textColor} transition-colors`}>
                <X size={24} />
              </button>
            </div>

            {/* フォーム */}
            <div className="p-6 space-y-6">
              {/* 基本情報 */}
              <div>
                <h4 className={`text-lg font-semibold ${textColor} mb-4`}>📋 基本情報</h4>
                <div className="space-y-4">
                  {/* プロジェクト名 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      📁 プロジェクト名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例: 新製品開発プロジェクト"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>

                  {/* 期間 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        📅 開始日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.timeline.start}
                        onChange={(e) => setFormData({ ...formData, timeline: { ...formData.timeline, start: e.target.value } })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        📅 終了日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.timeline.end}
                        onChange={(e) => setFormData({ ...formData, timeline: { ...formData.timeline, end: e.target.value } })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </div>

                  {/* ステータスと進捗 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        🚦 ステータス
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="active">進行中</option>
                        <option value="warning">注意</option>
                        <option value="completed">完了</option>
                        <option value="pending">保留中</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        📊 進捗率 (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </div>

                  {/* プロジェクトカラー */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      🎨 プロジェクトカラー
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-10 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#3b82f6"
                        className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      <div className="flex gap-2">
                        {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    <p className={`text-xs ${textSecondary} mt-1`}>プロジェクトの識別色を設定します</p>
                  </div>
                </div>
              </div>

              {/* チームメンバー */}
              <div>
                <h4 className={`text-lg font-semibold ${textColor} mb-4`}>👥 チームメンバー</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                      className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">メンバーを選択してください</option>
                      {teamMembers.filter(m => !formData.team.includes(m.name)).map(member => (
                        <option key={member.name} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddMember(memberInput)}
                      disabled={!memberInput}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      追加
                    </button>
                  </div>

                  {/* チームメンバータグ一覧 */}
                  {formData.team.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.team.map((member, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} flex items-center gap-2`}
                        >
                          {member}
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className={`${textSecondary} hover:text-red-500 transition-colors`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim() || !formData.timeline.start || !formData.timeline.end}
                  className={`flex-1 px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                  {editingProject ? '✓ 更新する' : '✓ 追加する'}
                </button>
                <button
                  onClick={closeModal}
                  className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} font-semibold transition-all`}
                >
                  キャンセル
                </button>
              </div>

              {/* 必須項目の説明 */}
              <p className={`text-xs ${textSecondary} text-center pt-2`}>
                <span className="text-red-500">*</span> は必須項目です
              </p>
            </div>
          </div>
        </div>
      )}

      {/* プロジェクト詳細モーダル */}
      {showDetailModal && selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={closeDetailModal}
        >
          <div
            className={`${cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${textColor}`}>{selectedProject.name}</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>
                    {selectedProject.timeline.start} 〜 {selectedProject.timeline.end}
                  </p>
                </div>
                <button
                  onClick={closeDetailModal}
                  className={`${textSecondary} hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2`}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="p-6 space-y-6">
              {/* 統計情報 */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className={`text-sm ${textSecondary} mb-1`}>進捗率</div>
                  <div className={`text-3xl font-bold ${textColor}`}>{selectedProject.progress}%</div>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className={`text-sm ${textSecondary} mb-1`}>タスク数</div>
                  <div className={`text-3xl font-bold ${textColor}`}>{selectedProject.tasks?.length || 0}</div>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className={`text-sm ${textSecondary} mb-1`}>ステータス</div>
                  <div className={`text-lg font-bold mt-2 ${
                    selectedProject.status === 'completed' ? 'text-green-500' :
                    selectedProject.status === 'warning' ? 'text-yellow-500' :
                    selectedProject.status === 'pending' ? 'text-gray-500' :
                    'text-blue-500'
                  }`}>
                    {selectedProject.status === 'active' ? '進行中' :
                     selectedProject.status === 'warning' ? '注意' :
                     selectedProject.status === 'completed' ? '完了' : '保留中'}
                  </div>
                </div>
              </div>

              {/* チームメンバー */}
              {selectedProject.team && selectedProject.team.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${textColor} mb-3`}>チームメンバー</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.team.map((member, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <button
                onClick={() => handleDelete(selectedProject.id)}
                className={`${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all`}
              >
                <Trash2 size={16} />
                削除
              </button>
              <div className="flex gap-2">
                <button
                  onClick={closeDetailModal}
                  className={`px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} py-2 rounded-lg transition-colors font-medium`}
                >
                  閉じる
                </button>
                <button
                  onClick={() => handleEditFromDetail(selectedProject)}
                  className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2`}
                >
                  <Edit size={16} />
                  編集
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* タスク追加・編集モーダル */}
      {showTaskModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={closeTaskModal}
        >
          <div
            className={`${cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className={`sticky top-0 ${cardBg} p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {editingTask ? 'タスクを編集' : '新しいタスクを追加'}
                </h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  {editingTask ? 'タスクの情報を更新します' : '新しいタスクを作成します'}
                </p>
              </div>
              <button onClick={closeTaskModal} className={`${textSecondary} hover:${textColor} transition-colors`}>
                <X size={24} />
              </button>
            </div>

            {/* フォーム */}
            <div className="p-6 space-y-6">
              {/* 基本情報 */}
              <div>
                <h4 className={`text-lg font-semibold ${textColor} mb-4`}>📋 基本情報</h4>
                <div className="space-y-4">
                  {/* タスク名 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      ✏️ タスク名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例: 要件定義書を作成"
                      value={taskFormData.name}
                      onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>

                  {/* 担当者 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      👤 担当者 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={taskFormData.assignee}
                      onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">担当者を選択してください</option>
                      {teamMembers.map(member => (
                        <option key={member.name} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 期間 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        📅 開始日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={taskFormData.startDate}
                        onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        📅 期限 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={taskFormData.dueDate}
                        onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </div>

                  {/* ステータスと優先度 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        🚦 ステータス
                      </label>
                      <select
                        value={taskFormData.status}
                        onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="active">進行中</option>
                        <option value="pending">保留中</option>
                        <option value="blocked">ブロック</option>
                        <option value="completed">完了</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        ⚡ 優先度
                      </label>
                      <select
                        value={taskFormData.priority}
                        onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                        <option value="urgent">緊急</option>
                      </select>
                    </div>
                  </div>

                  {/* 進捗率 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      📊 進捗率 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={taskFormData.progress}
                      onChange={(e) => setTaskFormData({ ...taskFormData, progress: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>

                  {/* 説明 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      📝 説明
                    </label>
                    <textarea
                      rows="3"
                      placeholder="タスクの詳細を入力してください"
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveTask}
                  disabled={!taskFormData.name.trim() || !taskFormData.assignee || !taskFormData.startDate || !taskFormData.dueDate}
                  className={`flex-1 px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                  {editingTask ? '✓ 更新する' : '✓ 追加する'}
                </button>
                <button
                  onClick={closeTaskModal}
                  className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} font-semibold transition-all`}
                >
                  キャンセル
                </button>
              </div>

              {/* タスクを削除（編集時のみ） */}
              {editingTask && (
                <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
                  <button
                    onClick={() => {
                      closeTaskModal();
                      handleDeleteTask(editingTask.id, currentProjectId);
                    }}
                    className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-all flex items-center justify-center gap-2`}
                  >
                    <Trash2 size={16} />
                    タスクを削除
                  </button>
                </div>
              )}

              {/* 必須項目の説明 */}
              <p className={`text-xs ${textSecondary} text-center pt-2`}>
                <span className="text-red-500">*</span> は必須項目です
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 一括操作ツールバー */}
      {selectedTasks.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedTasks.length}
          onClearSelection={handleClearSelection}
          onUpdateStatus={handleBulkUpdateStatus}
          onUpdateAssignee={handleBulkUpdateAssignee}
          onUpdatePriority={handleBulkUpdatePriority}
          onDelete={handleBulkDelete}
          onMoveToProject={handleBulkMoveToProject}
          teamMembers={teamMembers}
          projects={projects}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
