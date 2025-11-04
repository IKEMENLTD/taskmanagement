import { useEffect, useCallback } from 'react';
import { handleShortcutKey, getShortcutSettings } from '../utils/keyboardShortcutUtils';

/**
 * キーボードショートカットフック
 */
export const useKeyboardShortcuts = (handlers, enabled = true) => {
  const handleKeyDown = useCallback(
    (event) => {
      // ショートカット設定をチェック
      const settings = getShortcutSettings();
      if (!settings.enabled || !enabled) {
        return;
      }

      // ショートカットを処理
      handleShortcutKey(event, handlers);
    },
    [handlers, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    // イベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};
