import { supabase } from '../lib/supabase';
import { getAllProjects } from './projectUtils';
import { getAllTeamMembers } from './teamMemberUtils';
import { getAllRoutineCategories } from './routineCategoryUtils';

/**
 * データベースバックアップユーティリティ
 */

/**
 * 全データをSupabaseから取得してバックアップ
 * @param {string} userId - ユーザーID
 * @returns {Promise<{data: object, error: any}>}
 */
export const exportAllData = async (userId) => {
  try {
    // プロジェクトとタスクを取得
    const { data: projects, error: projectsError } = await getAllProjects(userId);
    if (projectsError) {
      console.error('プロジェクト取得エラー:', projectsError);
      return { data: null, error: projectsError };
    }

    // チームメンバーを取得
    const { data: teamMembers, error: teamError } = await getAllTeamMembers(userId);
    if (teamError) {
      console.error('チームメンバー取得エラー:', teamError);
      return { data: null, error: teamError };
    }

    // ルーティンタスクを取得
    const { data: routineTasks, error: routineError } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (routineError) {
      console.error('ルーティン取得エラー:', routineError);
      return { data: null, error: routineError };
    }

    // ルーティンカテゴリーを取得
    const { data: routineCategories, error: categoriesError } = await getAllRoutineCategories();
    if (categoriesError) {
      console.error('ルーティンカテゴリー取得エラー:', categoriesError);
      return { data: null, error: categoriesError };
    }

    // ユーザー設定を取得
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // バックアップデータを構築
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: userId,
      projects: projects || [],
      teamMembers: teamMembers || [],
      routineTasks: routineTasks || [],
      routineCategories: routineCategories || [],
      userSettings: userSettings || null
    };

    return { data: backupData, error: null };
  } catch (err) {
    console.error('バックアップエラー:', err);
    return { data: null, error: err };
  }
};

/**
 * バックアップデータをSupabaseにインポート
 * @param {string} userId - ユーザーID
 * @param {object} backupData - バックアップデータ
 * @param {string} mode - インポートモード ('replace', 'merge')
 * @returns {Promise<{data: any, error: any}>}
 */
export const importAllData = async (userId, backupData, mode = 'replace') => {
  try {
    // バージョンチェック
    if (!backupData.version) {
      throw new Error('バックアップデータのバージョンが不明です');
    }

    let results = {
      projects: 0,
      tasks: 0,
      teamMembers: 0,
      routines: 0,
      categories: 0
    };

    // replaceモードの場合、既存データを削除
    if (mode === 'replace') {
      await deleteAllUserData(userId);
    }

    // プロジェクトとタスクをインポート
    if (backupData.projects && backupData.projects.length > 0) {
      for (const project of backupData.projects) {
        // プロジェクトを作成
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert([{
            name: project.name,
            status: project.status,
            progress: project.progress,
            color: project.color,
            timeline_start: project.timeline?.start || project.timeline_start,
            timeline_end: project.timeline?.end || project.timeline_end,
            team: project.team,
            created_by: userId
          }])
          .select()
          .single();

        if (projectError) {
          console.error('プロジェクトインポートエラー:', projectError);
          continue;
        }

        results.projects++;

        // タスクをインポート
        if (project.tasks && project.tasks.length > 0) {
          for (const task of project.tasks) {
            const { error: taskError } = await supabase
              .from('tasks')
              .insert([{
                project_id: newProject.id,
                name: task.name,
                description: task.description,
                assignee: task.assignee,
                status: task.status,
                priority: task.priority,
                progress: task.progress,
                start_date: task.startDate || task.start_date,
                due_date: task.dueDate || task.due_date,
                completed_date: task.completedDate || task.completed_date,
                dependencies: task.dependencies || [],
                created_by: userId
              }]);

            if (!taskError) {
              results.tasks++;
            }
          }
        }
      }
    }

    // チームメンバーをインポート
    if (backupData.teamMembers && backupData.teamMembers.length > 0) {
      for (const member of backupData.teamMembers) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert([{
            name: member.name,
            role: member.role,
            created_by: userId
          }]);

        if (!memberError) {
          results.teamMembers++;
        }
      }
    }

    // ルーティンタスクをインポート
    if (backupData.routineTasks && backupData.routineTasks.length > 0) {
      for (const routine of backupData.routineTasks) {
        const { error: routineError } = await supabase
          .from('routine_tasks')
          .insert([{
            name: routine.name,
            category: routine.category,
            assignee: routine.assignee,
            repeat: routine.repeat,
            selected_days: routine.selected_days || routine.selectedDays,
            time: routine.time,
            user_id: userId
          }]);

        if (!routineError) {
          results.routines++;
        }
      }
    }

    // ルーティンカテゴリーをインポート（重複チェック）
    if (backupData.routineCategories && backupData.routineCategories.length > 0) {
      // 既存のカテゴリーを取得
      const { data: existingCategories } = await supabase
        .from('routine_categories')
        .select('name');

      const existingNames = new Set(existingCategories?.map(c => c.name) || []);

      for (const category of backupData.routineCategories) {
        // 既に存在する場合はスキップ
        if (existingNames.has(category.name)) {
          continue;
        }

        const { error: categoryError } = await supabase
          .from('routine_categories')
          .insert([{
            name: category.name
          }]);

        if (!categoryError) {
          results.categories++;
        }
      }
    }

    return { data: results, error: null };
  } catch (err) {
    console.error('インポートエラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ユーザーの全データを削除
 * @param {string} userId - ユーザーID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteAllUserData = async (userId) => {
  try {
    // プロジェクトに紐づくタスクを削除（CASCADE設定されている場合は自動削除）
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('created_by', userId);

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);

      // タスクを削除
      await supabase
        .from('tasks')
        .delete()
        .in('project_id', projectIds);
    }

    // プロジェクトを削除
    await supabase
      .from('projects')
      .delete()
      .eq('created_by', userId);

    // チームメンバーを削除
    await supabase
      .from('team_members')
      .delete()
      .eq('created_by', userId);

    // ルーティンタスクを削除
    await supabase
      .from('routine_tasks')
      .delete()
      .eq('user_id', userId);

    // ルーティン達成記録を削除
    await supabase
      .from('routine_completions')
      .delete()
      .eq('user_id', userId);

    console.log('✅ 全データを削除しました');
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('データ削除エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * バックアップデータをJSON文字列に変換
 * @param {object} backupData - バックアップデータ
 * @returns {string}
 */
export const backupToJSON = (backupData) => {
  return JSON.stringify(backupData, null, 2);
};

/**
 * JSON文字列をバックアップデータに変換
 * @param {string} jsonString - JSON文字列
 * @returns {object}
 */
export const jsonToBackup = (jsonString) => {
  return JSON.parse(jsonString);
};

/**
 * ファイルをダウンロード
 * @param {string} content - ファイル内容
 * @param {string} filename - ファイル名
 * @param {string} mimeType - MIMEタイプ
 */
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
