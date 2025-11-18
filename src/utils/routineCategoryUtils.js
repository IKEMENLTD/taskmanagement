import { supabase } from '../lib/supabase';

/**
 * ルーティンカテゴリー管理ユーティリティ
 */

/**
 * 組織の全ルーティンカテゴリーを取得
 * @param {string} organizationId - 組織ID
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getAllRoutineCategories = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('routine_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('ルーティンカテゴリー取得エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンカテゴリー取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンカテゴリーを作成
 * @param {string} organizationId - 組織ID
 * @param {Object} categoryData - カテゴリーデータ
 * @returns {Promise<{data: any, error: any}>}
 */
export const createRoutineCategory = async (organizationId, categoryData) => {
  try {
    const { data, error } = await supabase
      .from('routine_categories')
      .insert([{
        organization_id: organizationId,
        name: categoryData.name
      }])
      .select()
      .single();

    if (error) {
      console.error('ルーティンカテゴリー作成エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンカテゴリー作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンカテゴリーを更新
 * @param {number} categoryId - カテゴリーID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateRoutineCategory = async (categoryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('routine_categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('ルーティンカテゴリー更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンカテゴリー更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンカテゴリーを削除
 * @param {number} categoryId - カテゴリーID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteRoutineCategory = async (categoryId) => {
  try {
    const { error } = await supabase
      .from('routine_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('ルーティンカテゴリー削除エラー:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('ルーティンカテゴリー削除エラー:', err);
    return { data: null, error: err };
  }
};
