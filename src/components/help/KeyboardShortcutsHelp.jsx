import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { getShortcutsByCategory, formatShortcut } from '../../utils/keyboardShortcutUtils';

/**
 * キーボードショートカットヘルプモーダル
 */
export const KeyboardShortcutsHelp = ({ darkMode, onClose }) => {
  const shortcuts = getShortcutsByCategory();

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* モーダル */}
        <div
          className={`${bgColor} rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 bg-opacity-10 rounded-lg">
                <Keyboard size={24} className="text-blue-500" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${textColor}`}>
                  キーボードショートカット
                </h2>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  効率的な操作のための便利なショートカット
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${textSecondary} transition-colors`}
            >
              <X size={24} />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {Object.entries(shortcuts).map(([category, items]) => (
                <div key={category}>
                  <h3 className={`text-lg font-semibold ${textColor} mb-4 flex items-center gap-2`}>
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((shortcut, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          darkMode ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <span className={`${textColor}`}>{shortcut.description}</span>
                        <div className="flex gap-1">
                          {formatShortcut(shortcut)
                            .split(' + ')
                            .map((key, keyIndex, array) => (
                              <React.Fragment key={keyIndex}>
                                <kbd
                                  className={`px-3 py-1 text-sm font-mono rounded ${
                                    darkMode
                                      ? 'bg-gray-700 border border-gray-600 text-gray-200'
                                      : 'bg-white border border-gray-300 text-gray-800 shadow-sm'
                                  }`}
                                >
                                  {key}
                                </kbd>
                                {keyIndex < array.length - 1 && (
                                  <span className={`${textSecondary} mx-1`}>+</span>
                                )}
                              </React.Fragment>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* フッター */}
          <div className={`p-4 border-t ${borderColor} ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm ${textSecondary}`}>
                <kbd
                  className={`px-2 py-1 text-xs font-mono rounded mr-2 ${
                    darkMode
                      ? 'bg-gray-700 border border-gray-600 text-gray-200'
                      : 'bg-white border border-gray-300 text-gray-800'
                  }`}
                >
                  ?
                </kbd>
                または
                <kbd
                  className={`px-2 py-1 text-xs font-mono rounded mx-2 ${
                    darkMode
                      ? 'bg-gray-700 border border-gray-600 text-gray-200'
                      : 'bg-white border border-gray-300 text-gray-800'
                  }`}
                >
                  Esc
                </kbd>
                でこのヘルプを閉じる
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
