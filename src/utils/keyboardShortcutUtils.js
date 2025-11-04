/**
 * キーボードショートカットユーティリティ
 */

/**
 * OSを検出
 */
export const isMac = () => {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
};

/**
 * モディファイアキーの文字列を取得
 */
export const getModifierKey = () => {
  return isMac() ? '⌘' : 'Ctrl';
};

/**
 * キーボードショートカットの定義
 */
export const keyboardShortcuts = {
  // グローバル
  search: {
    key: 'k',
    modifier: 'ctrlOrCmd',
    description: 'グローバル検索',
    action: 'focusSearch'
  },
  help: {
    key: '?',
    modifier: 'shift',
    description: 'ヘルプを表示',
    action: 'showHelp'
  },
  settings: {
    key: ',',
    modifier: 'ctrlOrCmd',
    description: '設定を開く',
    action: 'openSettings'
  },
  darkMode: {
    key: 'd',
    modifier: 'ctrlOrCmd',
    description: 'ダークモード切り替え',
    action: 'toggleDarkMode'
  },

  // ビュー切り替え
  viewTimeline: {
    key: '1',
    modifier: 'none',
    description: 'プロジェクト一覧',
    action: 'switchView',
    actionValue: 'timeline'
  },
  viewGantt: {
    key: '2',
    modifier: 'none',
    description: 'ガントチャート',
    action: 'switchView',
    actionValue: 'gantt'
  },
  viewCalendar: {
    key: '3',
    modifier: 'none',
    description: 'カレンダー',
    action: 'switchView',
    actionValue: 'calendar'
  },
  viewStatistics: {
    key: '4',
    modifier: 'none',
    description: '統計',
    action: 'switchView',
    actionValue: 'statistics'
  },
  viewTeam: {
    key: '5',
    modifier: 'none',
    description: 'チーム',
    action: 'switchView',
    actionValue: 'team'
  },
  viewRoutine: {
    key: '6',
    modifier: 'none',
    description: 'ルーティン',
    action: 'switchView',
    actionValue: 'routine'
  },
  viewReport: {
    key: '7',
    modifier: 'none',
    description: '日報',
    action: 'switchView',
    actionValue: 'report'
  },

  // モーダル
  closeModal: {
    key: 'Escape',
    modifier: 'none',
    description: 'モーダルを閉じる',
    action: 'closeModal'
  },

  // ナビゲーション
  nextTab: {
    key: 'Tab',
    modifier: 'ctrl',
    description: '次のタブ',
    action: 'nextTab'
  },
  prevTab: {
    key: 'Tab',
    modifier: 'ctrlShift',
    description: '前のタブ',
    action: 'prevTab'
  }
};

/**
 * ショートカットをカテゴリー別に取得
 */
export const getShortcutsByCategory = () => {
  return {
    'グローバル': [
      keyboardShortcuts.search,
      keyboardShortcuts.help,
      keyboardShortcuts.settings,
      keyboardShortcuts.darkMode
    ],
    'ビュー切り替え': [
      keyboardShortcuts.viewTimeline,
      keyboardShortcuts.viewGantt,
      keyboardShortcuts.viewCalendar,
      keyboardShortcuts.viewStatistics,
      keyboardShortcuts.viewTeam,
      keyboardShortcuts.viewRoutine,
      keyboardShortcuts.viewReport
    ],
    'ナビゲーション': [
      keyboardShortcuts.closeModal,
      keyboardShortcuts.nextTab,
      keyboardShortcuts.prevTab
    ]
  };
};

/**
 * キーイベントが特定のショートカットに一致するか判定
 */
export const matchesShortcut = (event, shortcut) => {
  const key = event.key.toLowerCase();
  const targetKey = shortcut.key.toLowerCase();

  // キーが一致しない場合
  if (key !== targetKey) {
    return false;
  }

  // モディファイアキーのチェック
  switch (shortcut.modifier) {
    case 'none':
      return !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;

    case 'ctrl':
      return event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;

    case 'ctrlOrCmd':
      return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;

    case 'shift':
      return event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;

    case 'ctrlShift':
      return event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey;

    case 'alt':
      return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;

    default:
      return false;
  }
};

/**
 * ショートカットを人間が読める形式にフォーマット
 */
export const formatShortcut = (shortcut) => {
  const parts = [];

  switch (shortcut.modifier) {
    case 'ctrl':
      parts.push('Ctrl');
      break;
    case 'ctrlOrCmd':
      parts.push(getModifierKey());
      break;
    case 'shift':
      parts.push('Shift');
      break;
    case 'ctrlShift':
      parts.push('Ctrl', 'Shift');
      break;
    case 'alt':
      parts.push('Alt');
      break;
  }

  // キーの表示名を取得
  let keyDisplay = shortcut.key;
  if (shortcut.key === 'Escape') {
    keyDisplay = 'Esc';
  } else if (shortcut.key.length === 1) {
    keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);

  return parts.join(' + ');
};

/**
 * 入力要素にフォーカスがあるか判定
 */
export const isInputFocused = () => {
  const activeElement = document.activeElement;
  const tagName = activeElement?.tagName?.toLowerCase();

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    activeElement?.isContentEditable
  );
};

/**
 * キーボードショートカットを無効化すべきか判定
 */
export const shouldDisableShortcut = (shortcut) => {
  // 入力要素にフォーカスがある場合
  if (isInputFocused()) {
    // 検索ショートカット (Ctrl+K) とEscapeは許可
    if (shortcut.action === 'focusSearch' || shortcut.action === 'closeModal') {
      return false;
    }
    return true;
  }

  return false;
};

/**
 * ショートカットキーを処理
 */
export const handleShortcutKey = (event, handlers) => {
  // すべてのショートカットをチェック
  for (const [name, shortcut] of Object.entries(keyboardShortcuts)) {
    if (matchesShortcut(event, shortcut)) {
      // このショートカットを無効化すべきか確認
      if (shouldDisableShortcut(shortcut)) {
        continue;
      }

      // ハンドラーが登録されているか確認
      if (handlers[shortcut.action]) {
        event.preventDefault();
        event.stopPropagation();

        // アクション値がある場合は引数として渡す
        if (shortcut.actionValue !== undefined) {
          handlers[shortcut.action](shortcut.actionValue);
        } else {
          handlers[shortcut.action]();
        }

        return true;
      }
    }
  }

  return false;
};

/**
 * キーボードショートカット設定をLocalStorageに保存
 */
export const saveShortcutSettings = (settings) => {
  try {
    localStorage.setItem('keyboardShortcutSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('ショートカット設定の保存に失敗しました:', error);
  }
};

/**
 * キーボードショートカット設定を取得
 */
export const getShortcutSettings = () => {
  try {
    const settings = localStorage.getItem('keyboardShortcutSettings');
    return settings ? JSON.parse(settings) : { enabled: true };
  } catch (error) {
    console.error('ショートカット設定の取得に失敗しました:', error);
    return { enabled: true };
  }
};
