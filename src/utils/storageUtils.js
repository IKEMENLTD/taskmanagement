/**
 * LocalStorageユーティリティ関数
 */

/**
 * アプリケーションの全データをクリア
 */
export const clearAllData = () => {
  // routineTasks, projects, teamMembers, routineCategoriesは空に設定（削除すると初期データが再度読み込まれるため）
  window.localStorage.setItem('routineTasks', JSON.stringify({}));
  window.localStorage.setItem('projects', JSON.stringify([]));
  window.localStorage.setItem('teamMembers', JSON.stringify([]));
  window.localStorage.setItem('routineCategories', JSON.stringify([]));

  // その他の設定は削除
  const otherKeys = ['selectedView', 'darkMode', 'sidebarOpen', 'filterProject', 'filterMember', 'routineViewMode'];
  otherKeys.forEach(key => {
    window.localStorage.removeItem(key);
  });
  console.log('すべてのデータをクリアしました');
};

/**
 * ルーティンデータのみをクリア
 */
export const clearRoutineData = () => {
  // 空のオブジェクトに設定（削除すると初期データが再度読み込まれるため）
  window.localStorage.setItem('routineTasks', JSON.stringify({}));
  console.log('ルーティンデータをクリアしました');
};

/**
 * 設定のみをクリア（データは保持）
 */
export const clearSettings = () => {
  const settingsKeys = ['selectedView', 'darkMode', 'sidebarOpen', 'filterProject', 'filterMember', 'routineViewMode'];
  settingsKeys.forEach(key => {
    window.localStorage.removeItem(key);
  });
  console.log('設定をクリアしました');
};

/**
 * ストレージの使用状況を取得
 */
export const getStorageInfo = () => {
  const keys = ['routineTasks', 'projects', 'teamMembers', 'routineCategories', 'selectedView', 'darkMode', 'sidebarOpen', 'filterProject', 'filterMember', 'routineViewMode'];
  const info = {};

  keys.forEach(key => {
    const item = window.localStorage.getItem(key);
    if (item) {
      info[key] = {
        size: new Blob([item]).size,
        value: JSON.parse(item)
      };
    }
  });

  return info;
};

/**
 * データをエクスポート（JSON形式）
 */
export const exportData = () => {
  const data = {};
  const keys = ['routineTasks', 'projects', 'teamMembers', 'routineCategories', 'selectedView', 'darkMode', 'sidebarOpen', 'filterProject', 'filterMember', 'routineViewMode'];

  keys.forEach(key => {
    const item = window.localStorage.getItem(key);
    if (item) {
      data[key] = JSON.parse(item);
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('データをエクスポートしました');
};

/**
 * データをインポート（JSON形式）
 */
export const importData = (jsonData) => {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    Object.entries(data).forEach(([key, value]) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    });

    console.log('データをインポートしました');
    return true;
  } catch (error) {
    console.error('データのインポートに失敗しました:', error);
    return false;
  }
};

/**
 * デバッグ用：LocalStorageの内容をコンソールに表示
 */
export const debugStorage = () => {
  console.log('=== LocalStorage Debug ===');
  const info = getStorageInfo();
  Object.entries(info).forEach(([key, data]) => {
    console.log(`${key}:`, data.value, `(${data.size} bytes)`);
  });
  console.log('========================');
};
