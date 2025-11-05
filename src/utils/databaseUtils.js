import { supabase } from '../lib/supabase';

/**
 * データベース操作ユーティリティ関数
 *
 * Supabaseデータベースとの通信を簡単に行うための関数群
 */

// ========================================
// 組織（Organizations）操作
// ========================================

/**
 * 組織情報を取得
 * @param {string} organizationId - 組織ID
 */
export const getOrganization = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('組織情報の取得エラー:', error);
    return { data: null, error };
  }
};

// ========================================
// チームメンバー（Team Members）操作
// ========================================

/**
 * すべてのチームメンバーを取得
 * @param {string} organizationId - 組織ID
 */
export const getTeamMembers = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('チームメンバー取得エラー:', error);
    return { data: [], error };
  }
};

/**
 * チームメンバーを追加
 * @param {object} memberData - メンバー情報
 */
export const addTeamMember = async (memberData) => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .insert([memberData])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ チームメンバーを追加しました:', data.name);
    return { data, error: null };
  } catch (error) {
    console.error('チームメンバー追加エラー:', error);
    return { data: null, error };
  }
};

/**
 * チームメンバーを更新
 * @param {string} memberId - メンバーID
 * @param {object} updates - 更新内容
 */
export const updateTeamMember = async (memberId, updates) => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ チームメンバーを更新しました');
    return { data, error: null };
  } catch (error) {
    console.error('チームメンバー更新エラー:', error);
    return { data: null, error };
  }
};

/**
 * チームメンバーを削除
 * @param {string} memberId - メンバーID
 */
export const deleteTeamMember = async (memberId) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    console.log('✅ チームメンバーを削除しました');
    return { error: null };
  } catch (error) {
    console.error('チームメンバー削除エラー:', error);
    return { error };
  }
};

// ========================================
// プロジェクト（Projects）操作
// ========================================

/**
 * すべてのプロジェクトを取得
 * @param {string} organizationId - 組織ID
 */
export const getProjects = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    return { data: [], error };
  }
};

/**
 * プロジェクトを追加
 * @param {object} projectData - プロジェクト情報
 */
export const addProject = async (projectData) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ プロジェクトを追加しました:', data.title);
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト追加エラー:', error);
    return { data: null, error };
  }
};

/**
 * プロジェクトを更新
 * @param {string} projectId - プロジェクトID
 * @param {object} updates - 更新内容
 */
export const updateProject = async (projectId, updates) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ プロジェクトを更新しました');
    return { data, error: null };
  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    return { data: null, error };
  }
};

/**
 * プロジェクトを削除
 * @param {string} projectId - プロジェクトID
 */
export const deleteProject = async (projectId) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    console.log('✅ プロジェクトを削除しました');
    return { error: null };
  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    return { error };
  }
};

// ========================================
// ルーティンタスク（Routine Tasks）操作
// ========================================

/**
 * すべてのルーティンタスクを取得
 * @param {string} organizationId - 組織ID
 */
export const getRoutineTasks = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('ルーティンタスク取得エラー:', error);
    return { data: [], error };
  }
};

/**
 * ルーティンタスクを追加
 * @param {object} taskData - タスク情報
 */
export const addRoutineTask = async (taskData) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ ルーティンタスクを追加しました:', data.title);
    return { data, error: null };
  } catch (error) {
    console.error('ルーティンタスク追加エラー:', error);
    return { data: null, error };
  }
};

/**
 * ルーティンタスクを更新
 * @param {string} taskId - タスクID
 * @param {object} updates - 更新内容
 */
export const updateRoutineTask = async (taskId, updates) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    console.log('✅ ルーティンタスクを更新しました');
    return { data, error: null };
  } catch (error) {
    console.error('ルーティンタスク更新エラー:', error);
    return { data: null, error };
  }
};

/**
 * ルーティンタスクを削除
 * @param {string} taskId - タスクID
 */
export const deleteRoutineTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('routine_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    console.log('✅ ルーティンタスクを削除しました');
    return { error: null };
  } catch (error) {
    console.error('ルーティンタスク削除エラー:', error);
    return { error };
  }
};

// ========================================
// カテゴリー（Routine Categories）操作
// ========================================

/**
 * すべてのカテゴリーを取得
 * @param {string} organizationId - 組織ID
 */
export const getRoutineCategories = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('routine_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('カテゴリー取得エラー:', error);
    return { data: [], error };
  }
};

/**
 * カテゴリーを追加
 * @param {object} categoryData - カテゴリー情報
 */
export const addRoutineCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('routine_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ カテゴリーを追加しました:', data.name);
    return { data, error: null };
  } catch (error) {
    console.error('カテゴリー追加エラー:', error);
    return { data: null, error };
  }
};

// ========================================
// 一括データ移行用関数
// ========================================

/**
 * localStorageからSupabaseへデータを移行
 * @param {string} organizationId - 組織ID
 */
export const migrateDataToSupabase = async (organizationId) => {
  try {
    console.log('🔄 データ移行を開始します...');

    // localStorageからデータを取得
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const localTeamMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
    const localRoutineTasks = JSON.parse(localStorage.getItem('routineTasks') || '{}');
    const localCategories = JSON.parse(localStorage.getItem('routineCategories') || '[]');

    // チームメンバーの移行
    console.log('📤 チームメンバーを移行中...');
    for (const member of localTeamMembers) {
      const memberData = {
        organization_id: organizationId,
        name: member.name,
        email: member.email || null,
        role: member.role,
        avatar_url: member.avatar,
        workload: member.workload || 0,
        color: member.color || '#3B82F6'
      };
      await addTeamMember(memberData);
    }

    // プロジェクトの移行
    console.log('📤 プロジェクトを移行中...');
    for (const project of localProjects) {
      const projectData = {
        organization_id: organizationId,
        title: project.title,
        description: project.description || null,
        color: project.color || '#3B82F6',
        status: project.status || 'active',
        start_date: project.startDate || null,
        end_date: project.endDate || null,
        progress: project.progress || 0
      };
      await addProject(projectData);
    }

    // ルーティンタスクの移行
    console.log('📤 ルーティンタスクを移行中...');
    const allTasks = Object.values(localRoutineTasks).flat();
    for (const task of allTasks) {
      const taskData = {
        organization_id: organizationId,
        project_id: null, // 後で関連付け
        title: task.title,
        description: task.description || null,
        frequency: task.frequency || 'daily',
        assigned_to: null, // 後で関連付け
        status: task.completed ? 'completed' : 'pending',
        last_completed_at: task.lastCompleted || null
      };
      await addRoutineTask(taskData);
    }

    console.log('✅ データ移行が完了しました！');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ データ移行エラー:', error);
    return { success: false, error };
  }
};
