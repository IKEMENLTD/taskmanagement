import { supabase } from '../lib/supabase';

/**
 * チームメンバー管理ユーティリティ
 */

/**
 * 全チームメンバーを取得
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getAllTeamMembers = async () => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('チームメンバー取得エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('チームメンバー取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * チームメンバーを作成
 * @param {Object} memberData - メンバーデータ
 * @returns {Promise<{data: any, error: any}>}
 */
export const createTeamMember = async (memberData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        name: memberData.name,
        role: memberData.role || 'メンバー',
        avatar: memberData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberData.name)}&background=random`,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('チームメンバー作成エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('チームメンバー作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * チームメンバーを更新
 * @param {number} memberId - メンバーID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateTeamMember = async (memberId, updates) => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('チームメンバー更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('チームメンバー更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * チームメンバーを削除
 * @param {number} memberId - メンバーID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteTeamMember = async (memberId) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('チームメンバー削除エラー:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('チームメンバー削除エラー:', err);
    return { data: null, error: err };
  }
};
