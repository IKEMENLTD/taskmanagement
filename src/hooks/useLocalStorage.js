import { useState, useEffect } from 'react';

/**
 * LocalStorageと同期するカスタムフック
 * @param {string} key - LocalStorageのキー
 * @param {any} initialValue - 初期値
 * @returns {[any, Function]} - [値, 更新関数]
 */
export const useLocalStorage = (key, initialValue) => {
  // 初期値を取得（LocalStorageまたはinitialValue）
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // 値を更新してLocalStorageに保存
  const setValue = (value) => {
    try {
      // 関数の場合は実行して値を取得
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      // LocalStorageに保存
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
};
