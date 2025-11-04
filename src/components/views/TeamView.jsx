import React, { useState } from 'react';
import { Users, Plus, X, Edit, Trash2 } from 'lucide-react';
import { MemberCard } from '../cards/MemberCard';

/**
 * チームビューコンポーネント
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {Function} onMemberClick - メンバークリックハンドラー
 * @param {Function} setTeamMembers - チームメンバー更新関数
 * @param {boolean} darkMode - ダークモードフラグ
 * @param {Array} projects - プロジェクト一覧
 * @param {Object} routineTasks - ルーティンタスク
 */
export const TeamView = ({ teamMembers, onMemberClick, setTeamMembers, darkMode = false, projects = [], routineTasks = {} }) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // モーダル管理
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    load: 0,
    availability: 'available',
    avatar: '👤',
    skills: []
  });

  // スキル入力用
  const [skillInput, setSkillInput] = useState('');

  // モーダル操作
  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      role: '',
      load: 0,
      availability: 'available',
      avatar: '👤',
      skills: []
    });
    setSkillInput('');
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      load: member.load,
      availability: member.availability,
      avatar: member.avatar || '👤',
      skills: member.skills || []
    });
    setSkillInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
  };

  const openDetailModal = (member) => {
    setSelectedMember(member);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMember(null);
  };

  const handleEditFromDetail = (member) => {
    closeDetailModal();
    openEditModal(member);
  };

  // スキル追加
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  // アバターバリデーション
  const validateAvatar = (avatar) => {
    if (!avatar || !avatar.trim()) {
      return { valid: true, message: '' }; // 空の場合はデフォルトを使用
    }

    const trimmed = avatar.trim();

    // URLの場合
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        // 画像ファイルの拡張子をチェック
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
        const hasValidExtension = validExtensions.some(ext =>
          url.pathname.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
          return {
            valid: false,
            message: '⚠️ 画像URL は .jpg, .jpeg, .png, .gif, .svg, .webp のいずれかで終わる必要があります。'
          };
        }

        return { valid: true, message: '' };
      } catch (e) {
        return {
          valid: false,
          message: '⚠️ 無効なURLです。正しい形式: https://example.com/image.jpg'
        };
      }
    }

    // 絵文字の場合（1-4文字程度の短い文字列）
    if (trimmed.length <= 10) {
      return { valid: true, message: '' };
    }

    // それ以外（長すぎる、URLでもない）
    return {
      valid: false,
      message: '⚠️ アバターは絵文字（例: 👨‍💻）または画像URL（https://...）を指定してください。'
    };
  };

  // 保存
  const handleSave = () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      alert('必須項目を入力してください。');
      return;
    }

    // アバターバリデーション
    const avatarValidation = validateAvatar(formData.avatar);
    if (!avatarValidation.valid) {
      alert(avatarValidation.message);
      return;
    }

    const trimmedName = formData.name.trim();

    // 重複チェック
    if (editingMember) {
      // 編集の場合：自分以外に同じ名前がいないかチェック
      const isDuplicate = teamMembers.some(m =>
        m.name !== editingMember.name && m.name === trimmedName
      );
      if (isDuplicate) {
        alert(`⚠️ 「${trimmedName}」という名前のメンバーは既に存在します。`);
        return;
      }

      const updatedMembers = teamMembers.map(m =>
        m.name === editingMember.name
          ? {
              ...m,
              ...formData,
              name: trimmedName,
              role: formData.role.trim(),
              load: formData.load || 0,
              availability: formData.availability || 'available'
            }
          : m
      );
      setTeamMembers(updatedMembers);
    } else {
      // 新規追加の場合：同じ名前がいないかチェック
      const isDuplicate = teamMembers.some(m => m.name === trimmedName);
      if (isDuplicate) {
        alert(`⚠️ 「${trimmedName}」という名前のメンバーは既に存在します。`);
        return;
      }

      const newMember = {
        ...formData,
        name: trimmedName,
        role: formData.role.trim(),
        load: formData.load || 0,
        availability: formData.availability || 'available',
        currentTasks: []
      };
      setTeamMembers([...teamMembers, newMember]);
    }

    closeModal();
  };

  // メンバーの割り当てをチェック
  const checkMemberAssignments = (memberName) => {
    // タスクの割り当てをチェック
    const assignedTasks = [];
    projects.forEach(project => {
      project.tasks?.forEach(task => {
        if (task.assignee === memberName) {
          assignedTasks.push({ projectName: project.name, taskName: task.name });
        }
      });
    });

    // ルーティンの割り当てをチェック
    const assignedRoutines = [];
    Object.values(routineTasks).forEach(dayRoutines => {
      if (Array.isArray(dayRoutines)) {
        dayRoutines.forEach(routine => {
          if (routine.assignee === memberName) {
            assignedRoutines.push(routine.title);
          }
        });
      }
    });

    return { assignedTasks, assignedRoutines };
  };

  // 削除
  const handleDelete = (memberName) => {
    const { assignedTasks, assignedRoutines } = checkMemberAssignments(memberName);
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

    setTeamMembers(teamMembers.filter(m => m.name !== memberName));
    closeDetailModal();
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textColor} flex items-center gap-2`}>
            <Users size={28} />
            チームメンバー
          </h2>
          <p className={`${textSecondary} mt-1`}>
            チーム全体の稼働状況と負荷を確認できます
          </p>
        </div>
        <button
          onClick={openAddModal}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          <Plus size={18} />
          メンバー追加
        </button>
      </div>

      {/* メンバーカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => (
          <MemberCard
            key={index}
            member={member}
            onClick={() => openDetailModal(member)}
            darkMode={darkMode}
          />
        ))}
      </div>

      {/* チーム統計サマリー */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4`}>チーム統計</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className={`text-sm ${textSecondary} mb-1`}>総メンバー数</div>
            <div className={`text-3xl font-bold ${textColor}`}>{teamMembers.length}</div>
          </div>
          <div>
            <div className={`text-sm ${textSecondary} mb-1`}>サポート可能</div>
            <div className={`text-3xl font-bold text-green-500`}>
              {teamMembers.filter(m => m.availability === 'available').length}
            </div>
          </div>
          <div>
            <div className={`text-sm ${textSecondary} mb-1`}>手いっぱい</div>
            <div className={`text-3xl font-bold text-red-500`}>
              {teamMembers.filter(m => m.availability === 'busy').length}
            </div>
          </div>
          <div>
            <div className={`text-sm ${textSecondary} mb-1`}>平均負荷率</div>
            <div className={`text-3xl font-bold ${textColor}`}>
              {teamMembers.length > 0
                ? Math.round(teamMembers.reduce((sum, m) => sum + (m.load || 0), 0) / teamMembers.length)
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* メンバー追加・編集モーダル */}
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
                  {editingMember ? 'メンバーを編集' : '新しいメンバーを追加'}
                </h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  {editingMember ? 'メンバーの情報を更新します' : 'チームに新しいメンバーを追加します'}
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
                  {/* 名前と役職 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        👤 名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="例: 田中"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        💼 役職 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="例: フロントエンドエンジニア"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </div>

                  {/* アバター */}
                  <div>
                    <label className={`block text-sm font-medium ${textColor} mb-1`}>
                      😊 アバター（絵文字またはURL）
                    </label>
                    <input
                      type="text"
                      placeholder="例: 👨‍💻 または https://example.com/avatar.jpg"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <p className={`text-xs ${textSecondary} mt-1`}>絵文字 (👨‍💻) または画像URL (https://...) が使えます</p>
                  </div>

                  {/* 負荷率と稼働状態 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        📊 負荷率 (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={formData.load}
                        onChange={(e) => setFormData({ ...formData, load: parseInt(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-1`}>
                        🟢 稼働状態
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="available">サポート可能</option>
                        <option value="busy">手いっぱい</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* スキル */}
              <div>
                <h4 className={`text-lg font-semibold ${textColor} mb-4`}>🛠️ スキル</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="スキルを入力してEnterで追加"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <button
                      onClick={handleAddSkill}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all`}
                    >
                      追加
                    </button>
                  </div>

                  {/* スキルタグ一覧 */}
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} flex items-center gap-2`}
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
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
                  disabled={!formData.name.trim() || !formData.role.trim()}
                  className={`flex-1 px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                  {editingMember ? '✓ 更新する' : '✓ 追加する'}
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

      {/* メンバー詳細モーダル */}
      {showDetailModal && selectedMember && (() => {
        const memberLoad = selectedMember.load || 0;
        const memberAvailability = selectedMember.availability || 'available';

        return (
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
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">
                      {selectedMember.avatar && (selectedMember.avatar.startsWith('http://') || selectedMember.avatar.startsWith('https://')) ? (
                        <img
                          src={selectedMember.avatar}
                          alt={selectedMember.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span>{selectedMember.avatar || '👤'}</span>
                      )}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${textColor}`}>{selectedMember.name}</h2>
                      <p className={`text-sm ${textSecondary}`}>{selectedMember.role}</p>
                    </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className={`text-sm ${textSecondary} mb-1`}>負荷率</div>
                    <div className={`text-3xl font-bold ${
                      memberLoad >= 85 ? 'text-red-500' :
                      memberLoad >= 70 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>{memberLoad}%</div>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className={`text-sm ${textSecondary} mb-1`}>稼働状態</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-3 h-3 rounded-full ${memberAvailability === 'available' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-lg font-bold ${textColor}`}>
                        {memberAvailability === 'available' ? 'サポート可能' : '手いっぱい'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* スキル */}
                {selectedMember.skills && selectedMember.skills.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-semibold ${textColor} mb-3`}>スキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.skills.map((skill, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* フッター */}
              <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <button
                  onClick={() => handleDelete(selectedMember.name)}
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
                    onClick={() => handleEditFromDetail(selectedMember)}
                    className={`${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2`}
                  >
                    <Edit size={16} />
                    編集
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
