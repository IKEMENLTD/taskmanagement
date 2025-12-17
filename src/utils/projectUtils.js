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

        // タスクのフィールド名をキャメルケースに変換
        const convertedTasks = (tasks || []).map(task => ({
          ...task,
          projectId: task.project_id,
          startDate: task.start_date,
          dueDate: task.due_date,
          completedDate: task.completed_date
        }));

        return {
          ...project,
          tasks: convertedTasks,
          team: project.team || [],
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
        team: projectData.team || [],
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('プロジェクト作成エラー:', error);
      return { data: null, error };
    }

    return { data: { ...data, tasks: [], team: [] }, error: null };
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

    // teamが配列でない場合は空配列に変換
    if (updateData.team && !Array.isArray(updateData.team)) {
      updateData.team = [];
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

    // データベースに存在しないフィールドを削除
    delete updateData.projectName;
    delete updateData.tasks;
    delete updateData.created_at;
    delete updateData.id;

    // キャメルケースをスネークケースに変換
    if (updates.projectId !== undefined) {
      updateData.project_id = updates.projectId;
      delete updateData.projectId;
    }
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
    // taskIdがundefinedまたはnullの場合はエラー
    if (taskId === undefined || taskId === null) {
      console.error('タスク削除エラー: タスクIDが指定されていません');
      return { data: null, error: new Error('タスクIDが指定されていません') };
    }

    console.log('タスク削除開始: taskId =', taskId);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('タスク削除エラー:', error);
      return { data: null, error };
    }

    console.log('タスク削除成功: taskId =', taskId);
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('タスク削除エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * 全タスクの開始日を一括更新
 * @param {string} startDate - 設定する開始日（YYYY-MM-DD形式）
 * @returns {Promise<{data: {updated: number, total: number}, error: any}>}
 */
export const bulkUpdateTaskStartDates = async (startDate) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('ログインしてください') };
    }

    console.log(`📅 全タスクの開始日を ${startDate} に更新中...`);

    // ユーザーが作成したプロジェクトを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('created_by', user.id);

    if (projectsError) {
      console.error('❌ プロジェクト取得エラー:', projectsError);
      return { data: null, error: projectsError };
    }

    if (!projects || projects.length === 0) {
      console.log('ℹ️ プロジェクトが見つかりません');
      return { data: { updated: 0, total: 0 }, error: null };
    }

    const projectIds = projects.map(p => p.id);
    console.log(`📊 ${projectIds.length}個のプロジェクトを確認`);

    // 全タスクを取得
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, name, start_date')
      .in('project_id', projectIds);

    if (tasksError) {
      console.error('❌ タスク取得エラー:', tasksError);
      return { data: null, error: tasksError };
    }

    const totalTasks = tasks?.length || 0;
    console.log(`📊 合計 ${totalTasks} 個のタスクが見つかりました`);

    if (totalTasks === 0) {
      console.log('ℹ️ 更新するタスクがありません');
      return { data: { updated: 0, total: 0 }, error: null };
    }

    // start_dateが設定されていないタスクをフィルタリング
    const tasksToUpdate = tasks.filter(task => !task.start_date);
    console.log(`🔄 ${tasksToUpdate.length} 個のタスクを更新します`);

    if (tasksToUpdate.length === 0) {
      console.log('✅ 全てのタスクに開始日が設定されています');
      return { data: { updated: 0, total: totalTasks }, error: null };
    }

    // 一括更新を実行
    let updatedCount = 0;
    const errors = [];

    for (const task of tasksToUpdate) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ start_date: startDate })
        .eq('id', task.id);

      if (updateError) {
        console.error(`❌ タスク "${task.name}" の更新に失敗:`, updateError);
        errors.push({ task: task.name, error: updateError });
      } else {
        updatedCount++;
        console.log(`✅ タスク "${task.name}" を更新しました`);
      }
    }

    console.log(`\n📊 更新結果:`);
    console.log(`  ✅ 成功: ${updatedCount} 個`);
    console.log(`  ❌ 失敗: ${errors.length} 個`);
    console.log(`  📝 合計: ${totalTasks} 個のタスク`);

    if (errors.length > 0) {
      return {
        data: { updated: updatedCount, total: totalTasks, errors },
        error: new Error(`${errors.length}個のタスクの更新に失敗しました`)
      };
    }

    return { data: { updated: updatedCount, total: totalTasks }, error: null };
  } catch (err) {
    console.error('❌ 一括更新エラー:', err);
    return { data: null, error: err };
  }
};
