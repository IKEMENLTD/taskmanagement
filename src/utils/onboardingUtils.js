/**
 * オンボーディングユーティリティ
 */

/**
 * オンボーディングステップの定義
 */
export const onboardingSteps = [
  {
    id: 'welcome',
    title: 'ようこそ！',
    description: '4次元プロジェクト管理システムへようこそ。このガイドでは、主な機能をご紹介します。',
    target: null, // 全体表示
    position: 'center'
  },
  {
    id: 'search',
    title: 'グローバル検索',
    description: 'プロジェクト、タスク、ルーティン、メンバーを素早く検索できます。あいまい検索にも対応しています。',
    target: 'global-search',
    position: 'bottom'
  },
  {
    id: 'views',
    title: 'ビュー切り替え',
    description: 'タブを切り替えて、プロジェクト一覧、ガントチャート、カレンダー、統計など様々な表示形式を選択できます。',
    target: 'view-tabs',
    position: 'bottom'
  },
  {
    id: 'timeline',
    title: 'プロジェクト一覧',
    description: 'プロジェクトとタスクを時系列で確認できます。進捗状況や担当者、期限が一目で分かります。',
    target: 'timeline-view',
    position: 'top'
  },
  {
    id: 'gantt',
    title: 'ガントチャート',
    description: 'プロジェクトのタイムラインを視覚的に把握できます。タスクの依存関係も確認できます。',
    target: 'gantt-view',
    position: 'top'
  },
  {
    id: 'calendar',
    title: 'カレンダー',
    description: 'タスクとルーティンをカレンダー形式で表示します。月表示と週表示を切り替えられます。',
    target: 'calendar-view',
    position: 'top'
  },
  {
    id: 'statistics',
    title: '統計ダッシュボード',
    description: 'プロジェクトの進捗状況、タスクの完了率、ルーティンの達成率などを可視化します。',
    target: 'statistics-view',
    position: 'top'
  },
  {
    id: 'routine',
    title: 'ルーティン管理',
    description: '日々の定型タスクを管理します。チーム別、カテゴリ別に表示でき、達成率も確認できます。',
    target: 'routine-view',
    position: 'top'
  },
  {
    id: 'settings',
    title: '設定',
    description: 'ダークモード、通知設定、データ管理などを設定できます。',
    target: 'settings-button',
    position: 'bottom-left'
  },
  {
    id: 'complete',
    title: '準備完了！',
    description: '基本的な機能の説明は以上です。それでは、プロジェクト管理を始めましょう！',
    target: null,
    position: 'center'
  }
];

/**
 * オンボーディング状態を取得
 */
export const getOnboardingState = () => {
  try {
    const state = localStorage.getItem('onboardingState');
    if (!state) {
      return {
        completed: false,
        currentStep: 0,
        skipped: false,
        completedAt: null
      };
    }
    return JSON.parse(state);
  } catch (error) {
    console.error('オンボーディング状態の取得に失敗しました:', error);
    return {
      completed: false,
      currentStep: 0,
      skipped: false,
      completedAt: null
    };
  }
};

/**
 * オンボーディング状態を保存
 */
export const saveOnboardingState = (state) => {
  try {
    localStorage.setItem('onboardingState', JSON.stringify(state));
  } catch (error) {
    console.error('オンボーディング状態の保存に失敗しました:', error);
  }
};

/**
 * オンボーディングを完了
 */
export const completeOnboarding = () => {
  const state = {
    completed: true,
    currentStep: onboardingSteps.length - 1,
    skipped: false,
    completedAt: new Date().toISOString()
  };
  saveOnboardingState(state);
};

/**
 * オンボーディングをスキップ
 */
export const skipOnboarding = () => {
  const state = {
    completed: true,
    currentStep: 0,
    skipped: true,
    completedAt: new Date().toISOString()
  };
  saveOnboardingState(state);
};

/**
 * オンボーディングをリセット
 */
export const resetOnboarding = () => {
  try {
    localStorage.removeItem('onboardingState');
  } catch (error) {
    console.error('オンボーディング状態のリセットに失敗しました:', error);
  }
};

/**
 * 現在のステップを取得
 */
export const getCurrentStep = () => {
  const state = getOnboardingState();
  return onboardingSteps[state.currentStep] || onboardingSteps[0];
};

/**
 * 次のステップに進む
 */
export const goToNextStep = () => {
  const state = getOnboardingState();
  const nextStep = Math.min(state.currentStep + 1, onboardingSteps.length - 1);

  const newState = {
    ...state,
    currentStep: nextStep
  };

  // 最後のステップに到達したら完了
  if (nextStep === onboardingSteps.length - 1) {
    newState.completed = true;
    newState.completedAt = new Date().toISOString();
  }

  saveOnboardingState(newState);
  return newState;
};

/**
 * 前のステップに戻る
 */
export const goToPreviousStep = () => {
  const state = getOnboardingState();
  const prevStep = Math.max(state.currentStep - 1, 0);

  const newState = {
    ...state,
    currentStep: prevStep
  };

  saveOnboardingState(newState);
  return newState;
};

/**
 * 特定のステップにジャンプ
 */
export const goToStep = (stepIndex) => {
  const state = getOnboardingState();
  const targetStep = Math.max(0, Math.min(stepIndex, onboardingSteps.length - 1));

  const newState = {
    ...state,
    currentStep: targetStep
  };

  saveOnboardingState(newState);
  return newState;
};

/**
 * オンボーディングを開始すべきか判定
 */
export const shouldShowOnboarding = () => {
  const state = getOnboardingState();
  return !state.completed;
};

/**
 * 要素の位置を取得
 */
export const getElementPosition = (elementId) => {
  if (!elementId) return null;

  const element = document.getElementById(elementId);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2
  };
};

/**
 * ツールチップの位置を計算
 */
export const calculateTooltipPosition = (targetPosition, position, tooltipWidth = 400, tooltipHeight = 200) => {
  if (!targetPosition) {
    // 中央表示
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - tooltipWidth / 2
    };
  }

  let top, left;

  switch (position) {
    case 'top':
      top = targetPosition.top - tooltipHeight - 20;
      left = targetPosition.centerX - tooltipWidth / 2;
      break;
    case 'bottom':
      top = targetPosition.bottom + 20;
      left = targetPosition.centerX - tooltipWidth / 2;
      break;
    case 'left':
      top = targetPosition.centerY - tooltipHeight / 2;
      left = targetPosition.left - tooltipWidth - 20;
      break;
    case 'right':
      top = targetPosition.centerY - tooltipHeight / 2;
      left = targetPosition.right + 20;
      break;
    case 'bottom-left':
      top = targetPosition.bottom + 20;
      left = targetPosition.left;
      break;
    case 'bottom-right':
      top = targetPosition.bottom + 20;
      left = targetPosition.right - tooltipWidth;
      break;
    default:
      top = targetPosition.bottom + 20;
      left = targetPosition.centerX - tooltipWidth / 2;
  }

  // 画面外にはみ出さないように調整
  top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
  left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

  return { top, left };
};
