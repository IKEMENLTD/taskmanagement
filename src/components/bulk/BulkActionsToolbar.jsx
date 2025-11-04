import React, { useState } from 'react';
import { X, Check, User, Flag, Trash2, FolderInput, Calendar } from 'lucide-react';

/**
 * 一括操作ツールバー
 */
export const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onUpdateStatus,
  onUpdateAssignee,
  onUpdatePriority,
  onDelete,
  onMoveToProject,
  teamMembers,
  projects,
  darkMode
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const bgColor = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${bgColor} border-t shadow-xl z-50 p-4`}>
      <div className="container mx-auto flex items-center justify-between">
        {/* 左側：選択数とクリアボタン */}
        <div className="flex items-center gap-4">
          <div className={`font-semibold ${textColor}`}>
            {selectedCount}件選択中
          </div>
          <button
            onClick={onClearSelection}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg ${hoverBg} ${textSecondary} transition-colors text-sm`}
          >
            <X size={16} />
            選択解除
          </button>
        </div>

        {/* 右側：アクションボタン */}
        <div className="flex items-center gap-2">
          {/* ステータス変更 */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${hoverBg} ${textColor} transition-colors text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <Check size={16} />
              ステータス
            </button>
            {showStatusMenu && (
              <div className={`absolute bottom-full mb-2 right-0 ${bgColor} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg shadow-xl min-w-[150px] overflow-hidden`}>
                <button
                  onClick={() => {
                    onUpdateStatus('active');
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  進行中
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus('completed');
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  完了
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus('blocked');
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  ブロック中
                </button>
              </div>
            )}
          </div>

          {/* 担当者変更 */}
          <div className="relative">
            <button
              onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${hoverBg} ${textColor} transition-colors text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <User size={16} />
              担当者
            </button>
            {showAssigneeMenu && (
              <div className={`absolute bottom-full mb-2 right-0 ${bgColor} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg shadow-xl min-w-[150px] max-h-60 overflow-y-auto`}>
                {teamMembers.map(member => (
                  <button
                    key={member.name}
                    onClick={() => {
                      onUpdateAssignee(member.name);
                      setShowAssigneeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 優先度変更 */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${hoverBg} ${textColor} transition-colors text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <Flag size={16} />
              優先度
            </button>
            {showPriorityMenu && (
              <div className={`absolute bottom-full mb-2 right-0 ${bgColor} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg shadow-xl min-w-[150px] overflow-hidden`}>
                <button
                  onClick={() => {
                    onUpdatePriority('low');
                    setShowPriorityMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  低
                </button>
                <button
                  onClick={() => {
                    onUpdatePriority('medium');
                    setShowPriorityMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  中
                </button>
                <button
                  onClick={() => {
                    onUpdatePriority('high');
                    setShowPriorityMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  高
                </button>
                <button
                  onClick={() => {
                    onUpdatePriority('urgent');
                    setShowPriorityMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm`}
                >
                  緊急
                </button>
              </div>
            )}
          </div>

          {/* プロジェクト移動 */}
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${hoverBg} ${textColor} transition-colors text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <FolderInput size={16} />
              移動
            </button>
            {showProjectMenu && (
              <div className={`absolute bottom-full mb-2 right-0 ${bgColor} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg shadow-xl min-w-[200px] max-h-60 overflow-y-auto`}>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onMoveToProject(project.id);
                      setShowProjectMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 ${hoverBg} ${textColor} text-sm flex items-center gap-2`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#3b82f6' }}
                    />
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 削除 */}
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm"
          >
            <Trash2 size={16} />
            削除
          </button>
        </div>
      </div>
    </div>
  );
};
