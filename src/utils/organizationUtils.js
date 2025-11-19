import { supabase } from '../lib/supabase';

/**
 * 組織管理ユーティリティ
 */

/**
 * ユーザーの組織IDを取得
 * 現在は1組織のみなので、最初の組織を返す
 * @returns {Promise<{organizationId: string|null, error: any}>}
 */
export const getUserOrganizationId = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('組織ID取得エラー:', error);
      return { organizationId: null, error };
    }

    if (!data) {
      console.error('組織が見つかりません');
      return { organizationId: null, error: new Error('組織が見つかりません') };
    }

    return { organizationId: data.id, error: null };
  } catch (err) {
    console.error('組織ID取得エラー:', err);
    return { organizationId: null, error: err };
  }
};

/**
 * 全組織を取得
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getAllOrganizations = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('組織取得エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('組織取得エラー:', err);
    return { data: null, error: err };
  }
};
