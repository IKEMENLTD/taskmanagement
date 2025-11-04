import React, { useState, useEffect, useRef } from 'react';
import { Search, X, History, Clock, Bookmark, Filter as FilterIcon } from 'lucide-react';
import {
  globalSearch,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  getSavedSearches,
  deleteSavedSearch
} from '../../utils/searchUtils';

/**
 * グローバル検索コンポーネント
 */
export const GlobalSearch = ({
  projects,
  routineTasks,
  teamMembers,
  onResultClick,
  darkMode = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [includeCompleted, setIncludeCompleted] = useState(true);

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  // 検索履歴と保存済み検索を読み込み
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    setSavedSearches(getSavedSearches());
  }, []);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 検索実行
  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    const searchResults = globalSearch(
      { projects, routineTasks, teamMembers },
      searchQuery,
      { fuzzy: fuzzySearch, includeCompleted }
    );

    setResults(searchResults);
    saveSearchHistory(searchQuery);
    setSearchHistory(getSearchHistory());
    setShowDropdown(true);
  };

  // 検索クエリ変更
  const handleQueryChange = (value) => {
    setQuery(value);
    if (value.trim()) {
      handleSearch(value);
    } else {
      setResults(null);
    }
  };

  // 検索履歴をクリック
  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
    inputRef.current?.focus();
  };

  // 履歴をクリア
  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  // 結果をクリック
  const handleResultItemClick = (item, type) => {
    setShowDropdown(false);
    if (onResultClick) {
      onResultClick(item, type);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* 検索バー */}
      <div className={`relative ${cardBg} rounded-lg border shadow-sm`}>
        <div className="flex items-center px-4 py-3">
          <Search size={20} className={textSecondary} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="プロジェクト、タスク、ルーティン、メンバーを検索..."
            className={`flex-1 ml-3 bg-transparent border-none outline-none ${textColor} placeholder-gray-400`}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
                inputRef.current?.focus();
              }}
              className={`p-1 rounded ${hoverBg}`}
            >
              <X size={16} className={textSecondary} />
            </button>
          )}
        </div>

        {/* オプション */}
        <div className={`flex items-center gap-4 px-4 pb-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fuzzySearch}
              onChange={(e) => setFuzzySearch(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className={`text-xs ${textSecondary}`}>あいまい検索</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className={`text-xs ${textSecondary}`}>完了済みを含む</span>
          </label>
        </div>
      </div>

      {/* 検索結果ドロップダウン */}
      {showDropdown && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 ${cardBg} rounded-lg border shadow-xl max-h-96 overflow-y-auto z-50`}
        >
          {/* 検索結果 */}
          {results && results.totalCount > 0 ? (
            <div className="p-2">
              {/* 結果サマリー */}
              <div className={`px-3 py-2 ${textSecondary} text-sm`}>
                {results.totalCount}件の結果
              </div>

              {/* プロジェクト */}
              {results.projects.length > 0 && (
                <div className="mb-4">
                  <div className={`px-3 py-1 text-xs font-semibold ${textSecondary}`}>
                    プロジェクト ({results.projects.length})
                  </div>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleResultItemClick(project, 'project')}
                      className={`w-full text-left px-3 py-2 rounded ${hoverBg} transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className={`font-medium ${textColor}`}>{project.name}</span>
                      </div>
                      <div className={`text-xs ${textSecondary} mt-1`}>
                        {project.status} • {project.progress}%
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* タスク */}
              {results.tasks.length > 0 && (
                <div className="mb-4">
                  <div className={`px-3 py-1 text-xs font-semibold ${textSecondary}`}>
                    タスク ({results.tasks.length})
                  </div>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleResultItemClick(task, 'task')}
                      className={`w-full text-left px-3 py-2 rounded ${hoverBg} transition-colors`}
                    >
                      <div className={`font-medium ${textColor}`}>{task.name}</div>
                      <div className={`text-xs ${textSecondary} mt-1 flex items-center gap-2`}>
                        <span>{task.projectName}</span>
                        <span>•</span>
                        <span>{task.assignee}</span>
                        <span>•</span>
                        <span>{task.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* ルーティン */}
              {results.routines.length > 0 && (
                <div className="mb-4">
                  <div className={`px-3 py-1 text-xs font-semibold ${textSecondary}`}>
                    ルーティン ({results.routines.length})
                  </div>
                  {results.routines.map((routine, idx) => (
                    <button
                      key={`${routine.id}-${idx}`}
                      onClick={() => handleResultItemClick(routine, 'routine')}
                      className={`w-full text-left px-3 py-2 rounded ${hoverBg} transition-colors`}
                    >
                      <div className={`font-medium ${textColor}`}>{routine.title}</div>
                      <div className={`text-xs ${textSecondary} mt-1`}>
                        {routine.category} • {routine.time} • {routine.date}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* チームメンバー */}
              {results.teamMembers.length > 0 && (
                <div>
                  <div className={`px-3 py-1 text-xs font-semibold ${textSecondary}`}>
                    チームメンバー ({results.teamMembers.length})
                  </div>
                  {results.teamMembers.map((member, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultItemClick(member, 'member')}
                      className={`w-full text-left px-3 py-2 rounded ${hoverBg} transition-colors`}
                    >
                      <div className={`font-medium ${textColor}`}>{member.name}</div>
                      <div className={`text-xs ${textSecondary} mt-1`}>{member.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : results && results.totalCount === 0 ? (
            <div className={`p-8 text-center ${textSecondary}`}>
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>結果が見つかりませんでした</p>
            </div>
          ) : (
            /* 検索履歴 */
            <div className="p-2">
              {searchHistory.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className={`text-xs font-semibold ${textSecondary} flex items-center gap-1`}>
                      <History size={14} />
                      最近の検索
                    </div>
                    <button
                      onClick={handleClearHistory}
                      className={`text-xs ${textSecondary} hover:text-red-500`}
                    >
                      クリア
                    </button>
                  </div>
                  {searchHistory.slice(0, 5).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(item.query)}
                      className={`w-full text-left px-3 py-2 rounded ${hoverBg} transition-colors flex items-center gap-2`}
                    >
                      <Clock size={14} className={textSecondary} />
                      <span className={textColor}>{item.query}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 保存済み検索 */}
              {savedSearches.length > 0 && (
                <div>
                  <div className={`px-3 py-2 text-xs font-semibold ${textSecondary} flex items-center gap-1`}>
                    <Bookmark size={14} />
                    保存済み検索
                  </div>
                  {savedSearches.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-3 py-2 rounded ${hoverBg}`}
                    >
                      <button
                        onClick={() => handleHistoryClick(item.name)}
                        className={`flex-1 text-left ${textColor}`}
                      >
                        {item.name}
                      </button>
                      <button
                        onClick={() => {
                          deleteSavedSearch(item.id);
                          setSavedSearches(getSavedSearches());
                        }}
                        className={`p-1 ${textSecondary} hover:text-red-500`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchHistory.length === 0 && savedSearches.length === 0 && (
                <div className={`p-8 text-center ${textSecondary}`}>
                  <Search size={48} className="mx-auto mb-3 opacity-50" />
                  <p>検索してください</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
