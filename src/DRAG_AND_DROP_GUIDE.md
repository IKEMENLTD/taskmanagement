# ドラッグ&ドロップ機能ガイド

## 概要
このアプリケーションは、ルーティンタスクをドラッグ&ドロップで並び替えることができます。並び替えた順序は自動的にLocalStorageに保存され、ページをリロードしても保持されます。

## 使い方

### ルーティンビューでの並び替え

1. **ルーティンビューを開く**
   - ヘッダーの「ルーティン」タブをクリック

2. **タスクをドラッグ**
   - タスクカードの左側にある縦3点アイコン（⋮⋮）をドラッグ
   - または、タスクカード全体をドラッグ

3. **ドロップ位置を確認**
   - ドラッグ中、ドロップ可能な位置が青い線で表示されます
   - ドラッグ中のタスクは半透明になります

4. **ドロップして完了**
   - 目的の位置でマウスを離すとタスクが移動します
   - 変更は自動的に保存されます

### ドラッグ可能なエリア

#### 1. プロジェクト紐付きルーティン
- プロジェクトに紐付いているルーティンタスク
- このセクション内で自由に並び替え可能
- ヘッダー: 「プロジェクト紐付きルーティン（ドラッグで並び替え可能）」

#### 2. デイリールーティン
- カテゴリー別（仕事、健康、個人）に分類されたタスク
- **同じカテゴリー内**でのみ並び替え可能
- 異なるカテゴリー間での移動はできません
- ヘッダー: 「デイリールーティン（ドラッグで並び替え可能）」

## 視覚的フィードバック

### ドラッグ中
- **ドラッグ元のタスク**: 半透明（opacity: 0.4）になります
- **カーソル**: ドラッグ可能な場合は「移動」カーソルが表示されます
- **ドロップ先**: 青い線（border）が表示され、ドロップ位置を示します

### ドラッグアイコン
- 各タスクカードの左側に縦3点アイコン（⋮⋮）が表示されます
- このアイコンはドラッグ可能であることを示します
- ダークモード: グレー色
- ライトモード: 薄いグレー色

## 技術的な詳細

### 実装ファイル

1. **`src/hooks/useDragAndDrop.js`**
   - ドラッグ&ドロップのロジックを管理するカスタムフック
   - HTML5 Drag and Drop APIを使用
   - 主な機能:
     - `getDraggableProps()`: ドラッグ可能な要素用のprops
     - `getDropZoneStyle()`: ドロップゾーンのスタイル
     - `reorderItems()`: アイテムの並び替え

2. **`src/components/cards/RoutineCard.jsx`**
   - ドラッグ対応のタスクカード
   - `isDraggable` prop: ドラッグ可能かどうかを制御
   - `draggableProps` prop: ドラッグイベントハンドラー
   - `dropZoneStyle` prop: ドロップ時の視覚的フィードバック

3. **`src/components/views/RoutineView.jsx`**
   - ドラッグ&ドロップを実装したビューコンポーネント
   - カテゴリー別の並び替えロジック
   - ドロップ時に親コンポーネントに通知

4. **`src/hooks/useRoutines.js`**
   - `reorderRoutines()`: 並び替えたタスクをLocalStorageに保存

### データフロー

```
ユーザーがドラッグ開始
  ↓
useDragAndDrop がドラッグ状態を管理
  ↓
ユーザーがドロップ
  ↓
RoutineView が新しい順序を計算
  ↓
handleReorderRoutines が呼ばれる
  ↓
useRoutines.reorderRoutines が実行
  ↓
LocalStorage に保存
  ↓
UI が更新される
```

## カスタマイズ

### ドラッグ&ドロップを無効にする

RoutineViewコンポーネントで、以下のように設定することで無効化できます：

```jsx
<RoutineCard
  routine={routine}
  onToggle={onToggleRoutine}
  onClick={() => onRoutineClick(routine)}
  showAssignee={viewMode === 'team'}
  darkMode={darkMode}
  isDraggable={false}  // ドラッグ無効化
/>
```

### 視覚的スタイルのカスタマイズ

`src/hooks/useDragAndDrop.js`の`getDropZoneStyle`関数を編集：

```javascript
const getDropZoneStyle = (item, darkMode = false) => {
  if (!draggedItem) return '';

  const isDraggedItem = item === draggedItem;
  const isDropTarget = item === dragOverItem;

  if (isDraggedItem) {
    return darkMode
      ? 'opacity-40 border-blue-500'  // カスタマイズ可能
      : 'opacity-40 border-blue-600';
  }

  if (isDropTarget) {
    return darkMode
      ? 'border-t-4 border-blue-500 bg-blue-900 bg-opacity-20'
      : 'border-t-4 border-blue-600 bg-blue-100 bg-opacity-50';
  }

  return '';
};
```

## 制限事項

### 現在の制限
1. **カテゴリー間の移動不可**: デイリールーティンは同じカテゴリー内でのみ並び替え可能
2. **タッチデバイス**: モバイルデバイスでの動作は限定的（HTML5 DnD APIの制約）
3. **アニメーション**: スムーズなアニメーションは未実装

### 今後の改善案
1. カテゴリー間でのドラッグ&ドロップ対応
2. タッチデバイス対応（react-beautiful-dnd等のライブラリ検討）
3. ドラッグ時のスムーズなアニメーション追加
4. タスクの複製機能（Ctrl+ドラッグ）
5. マルチセレクトによる一括移動

## トラブルシューティング

### ドラッグできない
1. `isDraggable={true}` が設定されているか確認
2. ブラウザがHTML5 Drag and Drop APIをサポートしているか確認
3. コンソールエラーを確認

### 並び替えが保存されない
1. LocalStorageが有効になっているか確認
2. プライベートモードでは制限される場合があります
3. ブラウザのストレージ容量を確認

### ドロップ位置がおかしい
1. ページをリロードしてみる
2. ブラウザのキャッシュをクリア
3. 最新のブラウザバージョンを使用

## ブラウザ互換性

### 完全サポート
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 14+

### 部分サポート
- Safari 13（一部視覚的フィードバックが制限される）
- モバイルブラウザ（タッチ操作の制限）

### 非サポート
- IE 11以前（HTML5 DnD APIの制限）

## 開発者向け情報

### useDragAndDrop フックの使用例

```javascript
import { useDragAndDrop } from './hooks/useDragAndDrop';

function MyComponent() {
  const { getDraggableProps, getDropZoneStyle, reorderItems } = useDragAndDrop();
  const [items, setItems] = useState([...]);

  const handleDrop = (draggedItem, targetItem) => {
    const newItems = reorderItems(items, draggedItem, targetItem);
    setItems(newItems);
  };

  return (
    <div>
      {items.map(item => (
        <div
          key={item.id}
          className={getDropZoneStyle(item)}
          {...getDraggableProps(item, handleDrop)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### カスタムドロップハンドラーの実装

```javascript
const handleCustomDrop = (draggedItem, targetItem) => {
  // カスタムロジック
  console.log('Dragged:', draggedItem);
  console.log('Target:', targetItem);

  // 並び替え
  const newItems = reorderItems(items, draggedItem, targetItem);

  // バックエンドに保存
  saveToBackend(newItems);

  // ローカル状態を更新
  setItems(newItems);
};
```

## パフォーマンス

### 最適化のポイント
1. `React.memo()` でRoutineCardをメモ化（Step 11で実装予定）
2. `useCallback()` でドロップハンドラーをメモ化
3. 大量のタスクがある場合は仮想化を検討

### 現在のパフォーマンス
- タスク数 50以下: スムーズ
- タスク数 50-100: 問題なし
- タスク数 100以上: 最適化推奨
