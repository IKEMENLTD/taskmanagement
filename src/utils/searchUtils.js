/**
 * 検索ユーティリティ
 */

/**
 * シンプルな文字列マッチング
 */
export const simpleMatch = (text, query) => {
  if (!text || !query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
};

/**
 * ファジー検索（あいまい検索）
 */
export const fuzzyMatch = (text, query) => {
  if (!text || !query) return false;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  let queryIndex = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
};

/**
 * プロジェクトを検索
 */
export const searchProjects = (projects, query, options = {}) => {
  if (!query) return projects;

  const {
    fuzzy = false,
    fields = ['name', 'status'],
    caseSensitive = false
  } = options;

  const matchFn = fuzzy ? fuzzyMatch : simpleMatch;

  return projects.filter(project => {
    // 各フィールドで検索
    for (const field of fields) {
      if (project[field] && matchFn(String(project[field]), query)) {
        return true;
      }
    }

    // チームメンバーで検索
    if (project.team && Array.isArray(project.team)) {
      if (project.team.some(member => matchFn(member, query))) {
        return true;
      }
    }

    return false;
  });
};

/**
 * タスクを検索
 */
export const searchTasks = (projects, query, options = {}) => {
  if (!query) return [];

  const {
    fuzzy = false,
    fields = ['name', 'assignee', 'status', 'priority'],
    includeCompleted = true
  } = options;

  const matchFn = fuzzy ? fuzzyMatch : simpleMatch;
  const results = [];

  projects.forEach(project => {
    if (!project.tasks) return;

    project.tasks.forEach(task => {
      // 完了タスクを除外する場合
      if (!includeCompleted && task.status === 'completed') {
        return;
      }

      // 各フィールドで検索
      let matched = false;
      for (const field of fields) {
        if (task[field] && matchFn(String(task[field]), query)) {
          matched = true;
          break;
        }
      }

      if (matched) {
        results.push({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        });
      }
    });
  });

  return results;
};

/**
 * ルーティンを検索
 */
export const searchRoutines = (routineTasks, query, options = {}) => {
  if (!query) return [];

  const {
    fuzzy = false,
    fields = ['title', 'category', 'assignee'],
    date = null
  } = options;

  const matchFn = fuzzy ? fuzzyMatch : simpleMatch;
  const results = [];

  const dates = date ? [date] : Object.keys(routineTasks);

  dates.forEach(dateStr => {
    const routines = routineTasks[dateStr] || [];

    routines.forEach(routine => {
      let matched = false;
      for (const field of fields) {
        if (routine[field] && matchFn(String(routine[field]), query)) {
          matched = true;
          break;
        }
      }

      if (matched) {
        results.push({
          ...routine,
          date: dateStr
        });
      }
    });
  });

  return results;
};

/**
 * チームメンバーを検索
 */
export const searchTeamMembers = (teamMembers, query, options = {}) => {
  if (!query) return teamMembers;

  const {
    fuzzy = false,
    fields = ['name', 'role']
  } = options;

  const matchFn = fuzzy ? fuzzyMatch : simpleMatch;

  return teamMembers.filter(member => {
    for (const field of fields) {
      if (member[field] && matchFn(String(member[field]), query)) {
        return true;
      }
    }
    return false;
  });
};

/**
 * 全体検索（すべてのデータから検索）
 */
export const globalSearch = (data, query, options = {}) => {
  const { fuzzy = false, includeCompleted = true } = options;

  const results = {
    projects: searchProjects(data.projects, query, { fuzzy }),
    tasks: searchTasks(data.projects, query, { fuzzy, includeCompleted }),
    routines: searchRoutines(data.routineTasks, query, { fuzzy }),
    teamMembers: searchTeamMembers(data.teamMembers, query, { fuzzy })
  };

  // 総件数を計算
  results.totalCount =
    results.projects.length +
    results.tasks.length +
    results.routines.length +
    results.teamMembers.length;

  return results;
};

/**
 * 高度なフィルター
 */
export const advancedFilter = (items, filters) => {
  return items.filter(item => {
    // ステータスフィルター
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(item.status)) {
        return false;
      }
    }

    // 優先度フィルター
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(item.priority)) {
        return false;
      }
    }

    // 担当者フィルター
    if (filters.assignee && filters.assignee.length > 0) {
      if (!filters.assignee.includes(item.assignee)) {
        return false;
      }
    }

    // 日付範囲フィルター
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const itemDate = item.dueDate || item.startDate;

      if (itemDate) {
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
      }
    }

    // 進捗フィルター
    if (filters.progressRange) {
      const { min, max } = filters.progressRange;
      const progress = item.progress || 0;

      if (min !== undefined && progress < min) return false;
      if (max !== undefined && progress > max) return false;
    }

    // タグフィルター
    if (filters.tags && filters.tags.length > 0) {
      if (!item.tags || !filters.tags.some(tag => item.tags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
};

/**
 * 検索履歴を保存
 */
export const saveSearchHistory = (query) => {
  try {
    const history = getSearchHistory();

    // 重複を削除
    const filtered = history.filter(item => item.query !== query);

    // 新しい検索を先頭に追加
    filtered.unshift({
      query,
      timestamp: new Date().toISOString()
    });

    // 最新20件のみ保持
    const trimmed = filtered.slice(0, 20);

    localStorage.setItem('searchHistory', JSON.stringify(trimmed));
  } catch (error) {
    console.error('検索履歴の保存に失敗しました:', error);
  }
};

/**
 * 検索履歴を取得
 */
export const getSearchHistory = () => {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('検索履歴の取得に失敗しました:', error);
    return [];
  }
};

/**
 * 検索履歴をクリア
 */
export const clearSearchHistory = () => {
  try {
    localStorage.removeItem('searchHistory');
  } catch (error) {
    console.error('検索履歴のクリアに失敗しました:', error);
  }
};

/**
 * 保存済み検索を保存
 */
export const saveSavedSearch = (name, filters) => {
  try {
    const saved = getSavedSearches();

    saved.push({
      id: Date.now(),
      name,
      filters,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('savedSearches', JSON.stringify(saved));
    return true;
  } catch (error) {
    console.error('検索の保存に失敗しました:', error);
    return false;
  }
};

/**
 * 保存済み検索を取得
 */
export const getSavedSearches = () => {
  try {
    const saved = localStorage.getItem('savedSearches');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('保存済み検索の取得に失敗しました:', error);
    return [];
  }
};

/**
 * 保存済み検索を削除
 */
export const deleteSavedSearch = (id) => {
  try {
    const saved = getSavedSearches();
    const filtered = saved.filter(item => item.id !== id);
    localStorage.setItem('savedSearches', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('保存済み検索の削除に失敗しました:', error);
    return false;
  }
};

/**
 * 検索結果のハイライト
 */
export const highlightMatch = (text, query) => {
  if (!text || !query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * 検索クエリをパース（高度な検索構文）
 */
export const parseSearchQuery = (query) => {
  const parsed = {
    text: '',
    filters: {}
  };

  // 特殊な検索構文をパース
  // 例: status:active priority:high "exact phrase"
  const parts = query.match(/(\w+:[\w-]+|"[^"]+"|[^\s]+)/g) || [];

  parts.forEach(part => {
    if (part.includes(':')) {
      const [key, value] = part.split(':');
      parsed.filters[key] = value;
    } else if (part.startsWith('"') && part.endsWith('"')) {
      parsed.text += part.slice(1, -1) + ' ';
    } else {
      parsed.text += part + ' ';
    }
  });

  parsed.text = parsed.text.trim();

  return parsed;
};
