import { useState } from 'react';

/**
 * ドラッグ&ドロップ機能を提供するカスタムフック
 * @returns {Object} ドラッグ&ドロップ用の関数とステート
 */
export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  /**
   * ドラッグ開始ハンドラー
   * @param {Event} e - ドラッグイベント
   * @param {any} item - ドラッグするアイテム
   */
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);

    // ドラッグ中のスタイル調整
    if (e.target) {
      e.target.style.opacity = '0.4';
    }
  };

  /**
   * ドラッグオーバーハンドラー
   * @param {Event} e - ドラッグイベント
   * @param {any} item - ドラッグオーバーされているアイテム
   */
  const handleDragOver = (e, item) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (item && draggedItem && item !== draggedItem) {
      setDragOverItem(item);
    }
  };

  /**
   * ドラッグエンターハンドラー
   * @param {Event} e - ドラッグイベント
   * @param {any} item - ドラッグエンターされているアイテム
   */
  const handleDragEnter = (e, item) => {
    e.preventDefault();
    if (item && draggedItem && item !== draggedItem) {
      setDragOverItem(item);
    }
  };

  /**
   * ドラッグリーブハンドラー
   * @param {Event} e - ドラッグイベント
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  /**
   * ドロップハンドラー
   * @param {Event} e - ドラッグイベント
   * @param {Function} onDrop - ドロップ時のコールバック関数
   */
  const handleDrop = (e, onDrop) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.target) {
      e.target.style.opacity = '1';
    }

    if (draggedItem && onDrop) {
      onDrop(draggedItem, dragOverItem);
    }

    // ステートをリセット
    setDraggedItem(null);
    setDragOverItem(null);
  };

  /**
   * ドラッグ終了ハンドラー
   * @param {Event} e - ドラッグイベント
   */
  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.style.opacity = '1';
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  /**
   * アイテムリストを並び替える
   * @param {Array} items - アイテムリスト
   * @param {any} draggedItem - ドラッグされたアイテム
   * @param {any} targetItem - ターゲットアイテム
   * @param {Function} getItemId - アイテムのIDを取得する関数（デフォルト: item => item.id）
   * @returns {Array} 並び替えられたアイテムリスト
   */
  const reorderItems = (items, draggedItem, targetItem, getItemId = (item) => item.id) => {
    if (!draggedItem || !targetItem) return items;

    const draggedId = getItemId(draggedItem);
    const targetId = getItemId(targetItem);

    const draggedIndex = items.findIndex(item => getItemId(item) === draggedId);
    const targetIndex = items.findIndex(item => getItemId(item) === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return items;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    return newItems;
  };

  /**
   * ドロップゾーンのスタイルを取得
   * @param {any} item - 現在のアイテム
   * @param {boolean} darkMode - ダークモードフラグ
   * @returns {string} CSSクラス文字列
   */
  const getDropZoneStyle = (item, darkMode = false) => {
    if (!draggedItem) return '';

    const isDraggedItem = item === draggedItem;
    const isDropTarget = item === dragOverItem;

    if (isDraggedItem) {
      return darkMode
        ? 'opacity-40 border-blue-500'
        : 'opacity-40 border-blue-600';
    }

    if (isDropTarget) {
      return darkMode
        ? 'border-t-4 border-blue-500 bg-blue-900 bg-opacity-20'
        : 'border-t-4 border-blue-600 bg-blue-100 bg-opacity-50';
    }

    return '';
  };

  /**
   * ドラッグ可能な要素の基本プロパティを取得
   * @param {any} item - ドラッグ可能なアイテム
   * @param {Function} onDrop - ドロップ時のコールバック
   * @returns {Object} ドラッグ用のprops
   */
  const getDraggableProps = (item, onDrop) => ({
    draggable: true,
    onDragStart: (e) => handleDragStart(e, item),
    onDragOver: (e) => handleDragOver(e, item),
    onDragEnter: (e) => handleDragEnter(e, item),
    onDragLeave: handleDragLeave,
    onDrop: (e) => handleDrop(e, onDrop),
    onDragEnd: handleDragEnd,
  });

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    reorderItems,
    getDropZoneStyle,
    getDraggableProps,
  };
};
