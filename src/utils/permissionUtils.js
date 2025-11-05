import { supabase } from '../lib/supabase';

/**
 * 権限管理ユーティリティ関数
 */

/**
 * ユーザーのロールを取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<string>} - ロール（admin, member, viewer）
 */
export const getUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('ロール取得エラー:', error);
      return 'member'; // デフォルトはメンバー
    }

    return data?.role || 'member';
  } catch (err) {
    console.error('ロール取得エラー:', err);
    return 'member';
  }
};

/**
 * 管理者かどうかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const isAdmin = (role) => {
  return role === 'admin';
};

/**
 * メンバーかどうかチェック（管理者も含む）
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const isMember = (role) => {
  return role === 'admin' || role === 'member';
};

/**
 * 閲覧者かどうかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const isViewer = (role) => {
  return role === 'viewer';
};

/**
 * プロジェクトを作成できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canCreateProject = (role) => {
  return isAdmin(role);
};

/**
 * プロジェクトを削除できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canDeleteProject = (role) => {
  return isAdmin(role);
};

/**
 * タスクを作成できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canCreateTask = (role) => {
  return isMember(role);
};

/**
 * タスクを編集できるかチェック
 * @param {string} role - ユーザーのロール
 * @param {string} taskAssignedTo - タスクの担当者ID
 * @param {string} currentUserId - 現在のユーザーID
 * @returns {boolean}
 */
export const canEditTask = (role, taskAssignedTo, currentUserId) => {
  // 管理者は全て編集可能
  if (isAdmin(role)) return true;

  // メンバーは自分のタスクのみ編集可能
  if (isMember(role) && taskAssignedTo === currentUserId) return true;

  // 閲覧者は編集不可
  return false;
};

/**
 * タスクを削除できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canDeleteTask = (role) => {
  return isAdmin(role);
};

/**
 * メンバーを追加できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canAddMember = (role) => {
  return isAdmin(role);
};

/**
 * メンバーを削除できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canDeleteMember = (role) => {
  return isAdmin(role);
};

/**
 * 設定を変更できるかチェック
 * @param {string} role - ユーザーのロール
 * @returns {boolean}
 */
export const canChangeSettings = (role) => {
  return isAdmin(role);
};

/**
 * ロールの日本語名を取得
 * @param {string} role - ロール
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  const labels = {
    admin: '👑 管理者',
    member: '👤 メンバー',
    viewer: '👁️ 閲覧者'
  };
  return labels[role] || '👤 メンバー';
};

/**
 * ロールの説明を取得
 * @param {string} role - ロール
 * @returns {string}
 */
export const getRoleDescription = (role) => {
  const descriptions = {
    admin: 'すべての操作が可能です',
    member: '自分のタスクの編集が可能です',
    viewer: '閲覧のみ可能です'
  };
  return descriptions[role] || '';
};
