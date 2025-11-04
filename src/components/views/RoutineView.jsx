import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Target, Plus, X } from 'lucide-react';
import { RoutineCard } from '../cards/RoutineCard';
import { StatsCard } from '../cards/StatsCard';
import { RoutineDetailModal } from '../modals/RoutineDetailModal';
import { getCategoryText } from '../../utils/colorUtils';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

/**
 * ルーティンビューコンポーネント
 * @param {Array} routines - ルーティン一覧
 * @param {Object} teamStats - チーム統計データ
 * @param {number} completionRate - 達成率
 * @param {string} viewMode - 表示モード（メンバー名 | 'team'）
 * @param {Function} onViewModeChange - ビューモード切り替えハンドラー
 * @param {Function} onToggleRoutine - ルーティン切り替えハンドラー
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {Array} projects - プロジェクト一覧
 * @param {boolean} darkMode - ダークモードフラグ
 * @param {Function} onReorderRoutines - ルーティン並び替えハンドラー（オプション）
 * @param {Object} routineTasks - ルーティンタスク全体
 * @param {Function} setRoutineTasks - ルーティンタスク更新関数
 * @param {Date} currentTime - 現在時刻
 * @param {Array} routineCategories - カテゴリー一覧
 * @param {Function} setRoutineCategories - カテゴリー更新関数
 * @param {Function} getFilteredRoutines - フィルター済みルーティン取得関数
 */
export const RoutineView = ({
  routines,
  teamStats,
  completionRate,
  viewMode,
  onViewModeChange,
  onToggleRoutine,
  teamMembers,
  projects,
  darkMode = false,
  onReorderRoutines,
  routineTasks = {},
  setRoutineTasks,
  currentTime = new Date(),
  routineCategories = [],
  setRoutineCategories,
  getFilteredRoutines
}) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // フィルター管理
  const [filterMember, setFilterMember] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  // モーダル管理
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    time: '09:00',
    category: '',
    assignee: '',
    description: '',
    repeat: 'daily',
    duration: 30,
    projectId: null,
    selectedDays: [] // 曜日指定用
  });

  // カテゴリー入力用
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // カテゴリー追加
  const handleAddCategory = () => {
    if (newCategoryInput.trim() && !routineCategories.includes(newCategoryInput.trim())) {
      setRoutineCategories([...routineCategories, newCategoryInput.trim()]);
      setNewCategoryInput('');
    }
  };

  // カテゴリー削除
  const handleRemoveCategory = (categoryToRemove) => {
    setRoutineCategories(routineCategories.filter(c => c !== categoryToRemove));
  };

  // ドラッグ&ドロップフック
  const { getDraggableProps, getDropZoneStyle, reorderItems } = useDragAndDrop();

  // フィルター済みルーティンを取得
  const filteredRoutines = useMemo(() => {
    if (!getFilteredRoutines) return routines;
    return getFilteredRoutines(currentTime, {
      member: viewMode === 'team' ? filterMember : viewMode,
      project: filterProject
    });
  }, [routines, currentTime, viewMode, filterMember, filterProject, getFilteredRoutines]);

  // ローカル状態でルーティンを管理（ドラッグ中の並び替えを反映）
  const [localRoutines, setLocalRoutines] = useState(filteredRoutines);

  // propsのroutinesが変更されたら更新
  useEffect(() => {
    setLocalRoutines(filteredRoutines);
  }, [filteredRoutines]);

  // プロジェクト紐付きとそうでないものに分ける
  const routinesWithProject = localRoutines.filter(r => r.projectId);
  const routinesWithoutProject = localRoutines.filter(r => !r.projectId);

  // カテゴリー別にグループ化
  const groupedRoutines = {
    work: routinesWithoutProject.filter(r => r.category === 'work'),
    health: routinesWithoutProject.filter(r => r.category === 'health'),
    personal: routinesWithoutProject.filter(r => r.category === 'personal'),
  };

  // ドロップ時のハンドラー（プロジェクト紐付きルーティン用）
  const handleDropProject = (draggedItem, targetItem) => {
    if (!draggedItem || !targetItem) return;

    const newRoutines = reorderItems(localRoutines, draggedItem, targetItem);
    setLocalRoutines(newRoutines);

    // 親コンポーネントに通知（オプション）
    if (onReorderRoutines) {
      onReorderRoutines(newRoutines);
    }
  };

  // ドロップ時のハンドラー（カテゴリー別ルーティン用）
  const handleDropCategory = (category) => (draggedItem, targetItem) => {
    if (!draggedItem || !targetItem || draggedItem.category !== category) return;

    const newRoutines = reorderItems(localRoutines, draggedItem, targetItem);
    setLocalRoutines(newRoutines);

    // 親コンポーネントに通知（オプション）
    if (onReorderRoutines) {
      onReorderRoutines(newRoutines);
    }
  };

  // ルーティン管理関数
  const getTodayDateString = () => {
    return currentTime.toISOString().split('T')[0];
  };

  const openAddModal = () => {
    setEditingRoutine(null);
    setFormData({
      name: '',
      time: '09:00',
      category: '',
      assignee: '',
      description: '',
      repeat: 'daily',
      duration: 30,
      projectId: null,
      selectedDays: []
    });
    setShowModal(true);
  };

  const openEditModal = (routine) => {
    setEditingRoutine(routine);
    setFormData({
      name: routine.name,
      time: routine.time,
      category: routine.category,
      assignee: routine.assignee,
      description: routine.description,
      repeat: routine.repeat,
      duration: routine.duration,
      projectId: routine.projectId,
      selectedDays: routine.selectedDays || []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoutine(null);
  };

  const openDetailModal = (routine) => {
    setSelectedRoutine(routine);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRoutine(null);
  };

  const handleEditFromDetail = (routine) => {
    closeDetailModal();
    openEditModal(routine);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.assignee) {
      alert('必須項目を入力してください。');
      return;
    }

    // 曜日指定の場合、曜日が選択されているか確認
    if (formData.repeat === 'custom' && (!formData.selectedDays || formData.selectedDays.length === 0)) {
      alert('実行する曜日を少なくとも1つ選択してください。');
      return;
    }

    const today = getTodayDateString();
    const todayRoutines = routineTasks[today] || [];

    if (editingRoutine) {
      // 編集
      const updatedRoutines = todayRoutines.map(r =>
        r.id === editingRoutine.id
          ? { ...r, ...formData, name: formData.name.trim(), description: formData.description.trim() }
          : r
      );
      setRoutineTasks({ ...routineTasks, [today]: updatedRoutines });
    } else {
      // 新規追加
      const newRoutine = {
        id: `r${Date.now()}`,
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        completed: false,
        notes: '',
        streak: 0,
        completedDates: []
      };
      setRoutineTasks({ ...routineTasks, [today]: [...todayRoutines, newRoutine] });
    }

    closeModal();
  };

  const handleDelete = (routineId) => {
    if (!window.confirm('このルーティンを削除しますか？')) return;

    const today = getTodayDateString();
    const todayRoutines = routineTasks[today] || [];
    const updatedRoutines = todayRoutines.filter(r => r.id !== routineId);
    setRoutineTasks({ ...routineTasks, [today]: updatedRoutines });
    closeDetailModal();
  };

  // ルーティン更新
  const handleUpdateRoutine = (updatedRoutine) => {
    const today = getTodayDateString();
    const todayRoutines = routineTasks[today] || [];
    const updatedRoutines = todayRoutines.map(r =>
      r.id === updatedRoutine.id ? updatedRoutine : r
    );
    setRoutineTasks({ ...routineTasks, [today]: updatedRoutines });
  };

  return (
    <div className="space-y-6">
      {/* ビュー切り替え */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-wrap gap-2">
          {/* 各メンバーのボタン */}
          {teamMembers.map(member => (
            <button
              key={member.id}
              onClick={() => onViewModeChange(member.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${viewMode === member.name
                ? 'bg-blue-500 text-white shadow-lg'
                : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
                }`}
            >
              {member.name}
            </button>
          ))}

          {/* チーム全体ボタン */}
          <button
            onClick={() => onViewModeChange('team')}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${viewMode === 'team'
              ? 'bg-green-500 text-white shadow-lg'
              : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
              }`}
          >
            チーム全体
          </button>

          {/* 追加ボタン */}
          <button
            onClick={openAddModal}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <Plus size={18} />
            ルーティン追加
          </button>
        </div>
      </div>

      {/* フィルター（チームビューの時のみ） */}
      {viewMode === 'team' && (
        <div className={`${cardBg} rounded-xl p-4 border`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className={`text-sm ${textSecondary}`}>メンバー:</label>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } ${textColor} text-sm`}
              >
                <option value="all">全員</option>
                {teamMembers.map(member => (
                  <option key={member.name} value={member.name}>{member.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className={`text-sm ${textSecondary}`}>プロジェクト:</label>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } ${textColor} text-sm`}
              >
                <option value="all">全て</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="今日の達成率"
          value={completionRate}
          unit="%"
          icon={Target}
          color="blue"
          darkMode={darkMode}
        />
        <StatsCard
          title="完了タスク"
          value={routines.filter(r => r.completed).length}
          unit={`/${routines.length}`}
          icon={Clock}
          color="green"
          darkMode={darkMode}
        />
        <StatsCard
          title="残りタスク"
          value={routines.filter(r => !r.completed).length}
          icon={Clock}
          color="purple"
          darkMode={darkMode}
        />
      </div>

      {/* チーム統計（チームビューの時のみ） */}
      {viewMode === 'team' && teamStats && (
        <div>
          <h3 className={`text-xl font-bold ${textColor} mb-4`}>チーム達成状況</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(teamStats).map(([memberName, stats]) => (
              <div
                key={memberName}
                className={`${cardBg} rounded-lg p-4 border hover:shadow-lg transition-all cursor-pointer`}
                onClick={() => onFilterMemberChange(memberName)}
              >
                <div className={`text-sm ${textSecondary} mb-1`}>{memberName}</div>
                <div className={`text-2xl font-bold ${textColor} mb-2`}>{stats.rate}%</div>
                <div className={`text-xs ${textSecondary}`}>
                  {stats.completed}/{stats.total} 完了
                </div>
                <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1.5 mt-2`}>
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${stats.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* プロジェクト紐付きルーティン */}
      {routinesWithProject.length > 0 && (
        <div>
          <h3 className={`text-xl font-bold ${textColor} mb-4 flex items-center gap-2`}>
            <Target size={20} />
            プロジェクト紐付きルーティン（ドラッグで並び替え可能）
          </h3>
          <div className="space-y-2">
            {routinesWithProject.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onToggle={onToggleRoutine}
                onClick={() => openDetailModal(routine)}
                showAssignee={viewMode === 'team'}
                darkMode={darkMode}
                isDraggable={true}
                draggableProps={getDraggableProps(routine, handleDropProject)}
                dropZoneStyle={getDropZoneStyle(routine, darkMode)}
              />
            ))}
          </div>
        </div>
      )}

      {/* デイリールーティン */}
      {routinesWithoutProject.length > 0 && (
        <div>
          <h3 className={`text-xl font-bold ${textColor} mb-4 flex items-center gap-2`}>
            <Clock size={20} />
            デイリールーティン（ドラッグで並び替え可能）
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(groupedRoutines).map(([category, tasks]) => {
              if (tasks.length === 0) return null;

              return (
                <div key={category} className={`${cardBg} rounded-xl p-5 border`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-bold ${textColor}`}>
                      {getCategoryText(category)}
                    </h4>
                    <span className={`text-sm ${textSecondary}`}>
                      {tasks.filter(t => t.completed).length}/{tasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tasks.map(routine => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        onToggle={onToggleRoutine}
                        onClick={() => openDetailModal(routine)}
                        showAssignee={viewMode === 'team'}
                        darkMode={darkMode}
                        isDraggable={true}
                        draggableProps={getDraggableProps(routine, handleDropCategory(category))}
                        dropZoneStyle={getDropZoneStyle(routine, darkMode)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ルーティンが0件の場合 */}
      {routines.length === 0 && (
        <div className={`${cardBg} rounded-xl p-12 border text-center`}>
          <Clock size={48} className={`mx-auto mb-4 ${textSecondary}`} />
          <p className={`${textColor} text-lg font-semibold mb-2`}>
            ルーティンがありません
          </p>
          <p className={textSecondary}>
            新しいルーティンを追加して、日々のタスクを管理しましょう
          </p>
        </div>
      )}

      {/* ルーティン追加・編集モーダル */}
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
                  {editingRoutine ? 'ルーティンを編集' : '新しいルーティンを追加'}
                </h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  {editingRoutine ? 'ルーティンの情報を更新します' : '毎日または定期的に実行するタスクを設定します'}
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
                  {/* ルーティン名 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      ルーティン名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例: 朝のストレッチ、メール確認"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>

                  {/* 時刻と所要時間 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        ⏰ 時刻 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        ⏱️ 所要時間（分）
                      </label>
                      <input
                        type="number"
                        placeholder="30"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </div>

                  {/* 担当者 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      👤 担当者 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.assignee}
                      onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">担当者を選択してください</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 詳細設定 */}
              <div>
                <h4 className={`text-lg font-semibold ${textColor} mb-4`}>⚙️ 詳細設定</h4>
                <div className="space-y-4">
                  {/* カテゴリー */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      🏷️ カテゴリー
                    </label>
                    <input
                      type="text"
                      list="category-suggestions"
                      placeholder="カテゴリーを入力または選択"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <datalist id="category-suggestions">
                      {routineCategories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </datalist>
                    <p className={`text-xs ${textSecondary} mt-1`}>自由に入力できます</p>
                  </div>

                  {/* 繰り返し */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      🔁 繰り返し
                    </label>
                    <select
                      value={formData.repeat}
                      onChange={(e) => {
                        const newRepeat = e.target.value;
                        setFormData({
                          ...formData,
                          repeat: newRepeat,
                          selectedDays: newRepeat === 'weekdays' ? [1, 2, 3, 4, 5] : newRepeat === 'custom' ? [] : []
                        });
                      }}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="daily">毎日</option>
                      <option value="weekdays">平日（月〜金）</option>
                      <option value="custom">曜日指定</option>
                    </select>
                  </div>

                  {/* 曜日指定（customの時のみ表示） */}
                  {formData.repeat === 'custom' && (
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-2`}>
                        📅 実行する曜日を選択
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 0, label: '日' },
                          { value: 1, label: '月' },
                          { value: 2, label: '火' },
                          { value: 3, label: '水' },
                          { value: 4, label: '木' },
                          { value: 5, label: '金' },
                          { value: 6, label: '土' }
                        ].map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const selectedDays = formData.selectedDays || [];
                              if (selectedDays.includes(day.value)) {
                                setFormData({
                                  ...formData,
                                  selectedDays: selectedDays.filter(d => d !== day.value)
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedDays: [...selectedDays, day.value].sort()
                                });
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              (formData.selectedDays || []).includes(day.value)
                                ? 'bg-blue-500 text-white'
                                : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <p className={`text-xs ${textSecondary} mt-2`}>
                        {formData.selectedDays && formData.selectedDays.length > 0
                          ? `${formData.selectedDays.length}曜日選択中`
                          : '曜日を選択してください'}
                      </p>
                    </div>
                  )}

                  {/* プロジェクト */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      📁 プロジェクト（任意）
                    </label>
                    <select
                      value={formData.projectId || ''}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : null })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">プロジェクトを選択（任意）</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 説明 */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      📝 説明（任意）
                    </label>
                    <textarea
                      placeholder="このルーティンについての説明や注意事項を入力..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>

              {/* カテゴリー管理 */}
              <div>
                <h4 className={`text-lg font-semibold ${textColor} mb-4`}>📂 カテゴリー管理</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="新しいカテゴリーを入力"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <button
                      onClick={handleAddCategory}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all`}
                    >
                      追加
                    </button>
                  </div>

                  {/* カテゴリータグ一覧 */}
                  {routineCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {routineCategories.map((category, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} flex items-center gap-2`}
                        >
                          {category}
                          <button
                            onClick={() => handleRemoveCategory(category)}
                            className={`${textSecondary} hover:text-red-500 transition-colors`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${textSecondary}`}>カテゴリーがありません。追加してください。</p>
                  )}
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={
                    !formData.name.trim() ||
                    !formData.assignee ||
                    (formData.repeat === 'custom' && (!formData.selectedDays || formData.selectedDays.length === 0))
                  }
                  className={`flex-1 px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                  {editingRoutine ? '✓ 更新する' : '✓ 追加する'}
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

      {/* ルーティン詳細モーダル */}
      {showDetailModal && selectedRoutine && (
        <RoutineDetailModal
          routine={selectedRoutine}
          onClose={closeDetailModal}
          onToggle={onToggleRoutine}
          onEdit={() => handleEditFromDetail(selectedRoutine)}
          onDelete={() => handleDelete(selectedRoutine.id)}
          onUpdateRoutine={handleUpdateRoutine}
          projects={projects}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
