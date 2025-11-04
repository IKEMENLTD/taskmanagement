// カテゴリー別カラー設定
export const getCategoryColor = (category) => {
  const colors = {
    work: 'bg-blue-500',
    health: 'bg-green-500',
    personal: 'bg-purple-500'
  };
  return colors[category] || 'bg-gray-500';
};

// カテゴリーテキスト変換
export const getCategoryText = (category) => {
  const texts = {
    work: '仕事',
    health: '健康',
    personal: '個人'
  };
  return texts[category] || category;
};

// ステータス別カラー設定
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-blue-500',
    completed: 'bg-green-500',
    pending: 'bg-yellow-500',
    blocked: 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
};

// 優先度別カラー設定
export const getPriorityColor = (priority) => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };
  return colors[priority] || 'bg-gray-500';
};

// 繰り返し設定テキスト変換
export const getRepeatText = (repeat) => {
  const repeatMap = {
    daily: '毎日',
    weekdays: '平日',
    weekly: '毎週',
    custom: 'カスタム'
  };
  return repeatMap[repeat] || repeat;
};
