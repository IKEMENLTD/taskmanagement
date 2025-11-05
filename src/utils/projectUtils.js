import { supabase } from '../lib/supabase';

/**
 * プロジェクト管理ユーティリティ
 */

/**
 * 全プロジェクトを取得（タスクも含む）
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getAllProjects = async () => {
  try {
    // プロジェクトを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('プロジェクト取得エラー:', projectsError);
      return { data: null, error: projectsError };
    }

    // 各プロジェクトのタスクを取得
    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true });

        if (tasksError) {
          console.error(`プロジェクト ${project.id} のタスク取得エラー:`, tasksError);
          return { ...project, tasks: [] };
        }

        return {
          ...project,
          tasks: tasks || [],
          timeline: {
            start: project.timeline_start,
            end: project.timeline_end
          }
        };
      })
    );

    return { data: projectsWithTasks, error: null };
  } catch (err) {
    console.error('プロジェクト取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * プロジェクトを作成
 * @param {Object} projectData - プロジェクトデータ
 * @returns {Promise<{data: any, error: any}>}
 */
export const createProject = async (projectData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        color: projectData.color,
        status: projectData.status || 'active',
        progress: projectData.progress || 0,
        timeline_start: projectData.timeline?.start || null,
        timeline_end: projectData.timeline?.end || null,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('プロジェクト作成エラー:', error);
      return { data: null, error };
    }

    return { data: { ...data, tasks: [] }, error: null };
  } catch (err) {
    console.error('プロジェクト作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * プロジェクトを更新
 * @param {number} projectId - プロジェクトID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateProject = async (projectId, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // timelineオブジェクトがある場合は分解
    if (updates.timeline) {
      updateData.timeline_start = updates.timeline.start;
      updateData.timeline_end = updates.timeline.end;
      delete updateData.timeline;
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('プロジェクト更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('プロジェクト更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * プロジェクトを削除
 * @param {number} projectId - プロジェクトID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteProject = async (projectId) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('プロジェクト削除エラー:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('プロジェクト削除エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * タスクを作成
 * @param {number} projectId - プロジェクトID
 * @param {Object} taskData - タスクデータ
 * @returns {Promise<{data: any, error: any}>}
 */
export const createTask = async (projectId, taskData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        project_id: projectId,
        name: taskData.name,
        description: taskData.description || null,
        status: taskData.status || 'active',
        priority: taskData.priority || 'medium',
        progress: taskData.progress || 0,
        assignee: taskData.assignee || null,
        start_date: taskData.startDate || null,
        due_date: taskData.dueDate || null,
        completed_date: taskData.completedDate || null,
        dependencies: taskData.dependencies || [],
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('タスク作成エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('タスク作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * タスクを更新
 * @param {number} taskId - タスクID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateTask = async (taskId, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // キャメルケースをスネークケースに変換
    if (updates.startDate !== undefined) {
      updateData.start_date = updates.startDate;
      delete updateData.startDate;
    }
    if (updates.dueDate !== undefined) {
      updateData.due_date = updates.dueDate;
      delete updateData.dueDate;
    }
    if (updates.completedDate !== undefined) {
      updateData.completed_date = updates.completedDate;
      delete updateData.completedDate;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('タスク更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('タスク更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * タスクを削除
 * @param {number} taskId - タスクID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('タスク削除エラー:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('タスク削除エラー:', err);
    return { data: null, error: err };
  }
};
