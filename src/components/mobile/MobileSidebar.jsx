import React from 'react';
import { X, Award, Target, CheckCircle, TrendingUp } from 'lucide-react';

/**
 * モバイル用サイドバー（スライドメニュー）
 */
export const MobileSidebar = ({
  isOpen,
  onClose,
  darkMode,
  projects,
  completionRate,
  teamMembers
}) => {
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-bold ${textColor}`}>メニュー</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            } transition-colors`}
          >
            <X size={24} className={textSecondary} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-4">
          {/* 今日の統計 */}
          <div className={`${cardBg} rounded-xl p-4 border`}>
            <h3 className={`font-semibold mb-3 ${textColor} text-sm flex items-center gap-2`}>
              <Award size={18} />
              今日の統計
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textSecondary}`}>プロジェクト</span>
                <span className={`text-sm font-bold ${textColor}`}>{projects?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textSecondary}`}>チームメンバー</span>
                <span className={`text-sm font-bold ${textColor}`}>{teamMembers?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textSecondary}`}>ルーティン達成率</span>
                <span className={`text-sm font-bold ${textColor}`}>{completionRate}%</span>
              </div>
            </div>
          </div>

          {/* プロジェクト一覧 */}
          <div className={`${cardBg} rounded-xl p-4 border`}>
            <h3 className={`font-semibold mb-3 ${textColor} text-sm flex items-center gap-2`}>
              <Target size={18} />
              進行中のプロジェクト
            </h3>
            <div className="space-y-2">
              {projects?.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className={`text-sm ${textSecondary} truncate`}>{project.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${textColor} ml-2`}>{project.progress}%</span>
                </div>
              ))}
              {(!projects || projects.length === 0) && (
                <p className={`text-sm ${textSecondary} text-center py-2`}>
                  プロジェクトがありません
                </p>
              )}
            </div>
          </div>

          {/* 情報 */}
          <div className={`${cardBg} rounded-xl p-4 border`}>
            <p className={`text-xs ${textSecondary} text-center`}>
              4次元プロジェクト管理
              <br />
              v1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
