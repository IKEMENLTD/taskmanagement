import { supabase } from '../lib/supabase';

/**
 * ルーティンタスク管理ユーティリティ
 */

/**
 * 指定日のルーティンタスクを取得（チーム全体）
 * @param {string} userId - ユーザーID（互換性のために残すが使用しない）
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getRoutineTasks = async (userId, date) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      console.error('ルーティンタスク取得エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンタスク取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンタスクを作成
 * @param {string} userId - ユーザーID
 * @param {Object} routineData - ルーティンデータ
 * @returns {Promise<{data: any, error: any}>}
 */
export const createRoutineTask = async (userId, routineData) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .insert([{
        user_id: userId,
        name: routineData.name,
        description: routineData.description || null,
        time: routineData.time,
        category: routineData.category || 'work',
        project_id: routineData.projectId || null,
        assignee: routineData.assignee || null,
        repeat: routineData.repeat || 'daily',
        duration: routineData.duration || 30,
        date: routineData.date,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('ルーティンタスク作成エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンタスク作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンタスクを更新
 * @param {string} taskId - タスクID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateRoutineTask = async (taskId, updates) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('ルーティンタスク更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンタスク更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンタスクを削除
 * @param {string} taskId - タスクID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteRoutineTask = async (taskId) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('ルーティンタスク削除エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンタスク削除エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンタスクを完了状態にする
 * @param {string} taskId - タスクID
 * @returns {Promise<{data: any, error: any}>}
 */
export const completeRoutineTask = async (taskId) => {
  return await updateRoutineTask(taskId, {
    status: 'completed',
    completed_at: new Date().toISOString()
  });
};

/**
 * ルーティンタスクをスキップ状態にする
 * @param {string} taskId - タスクID
 * @param {string} reason - スキップ理由（任意）
 * @returns {Promise<{data: any, error: any}>}
 */
export const skipRoutineTask = async (taskId, reason = null) => {
  return await updateRoutineTask(taskId, {
    status: 'skipped',
    skipped_at: new Date().toISOString(),
    skip_reason: reason
  });
};

/**
 * ルーティンタスクを未完了状態に戻す
 * @param {string} taskId - タスクID
 * @returns {Promise<{data: any, error: any}>}
 */
export const resetRoutineTask = async (taskId) => {
  return await updateRoutineTask(taskId, {
    status: 'pending',
    completed_at: null,
    skipped_at: null,
    skip_reason: null
  });
};

/**
 * 前日の未完了タスクを自動的にスキップする
 * @param {string} userId - ユーザーID
 * @param {string} date - 前日の日付 (YYYY-MM-DD)
 * @returns {Promise<{data: any, error: any}>}
 */
export const autoSkipPreviousDayTasks = async (userId, date) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .update({
        status: 'skipped',
        skipped_at: new Date().toISOString(),
        skip_reason: '日付変更により自動スキップ',
        updated_at: new Date().toISOString()
      })
      .eq('date', date)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('自動スキップエラー:', error);
      return { data: null, error };
    }

    console.log(`${date}の未完了タスクを自動スキップしました (${data.length}件)`);
    return { data, error: null };
  } catch (err) {
    console.error('自動スキップエラー:', err);
    return { data: null, error: err };
  }
};

/**
 * 指定期間のルーティンタスク統計を取得（チーム全体）
 * @param {string} userId - ユーザーID（互換性のために残すが使用しない）
 * @param {string} startDate - 開始日 (YYYY-MM-DD)
 * @param {string} endDate - 終了日 (YYYY-MM-DD)
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getRoutineStats = async (userId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('status')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('統計取得エラー:', error);
      return { data: null, error };
    }

    const stats = {
      total: data.length,
      completed: data.filter(t => t.status === 'completed').length,
      skipped: data.filter(t => t.status === 'skipped').length,
      pending: data.filter(t => t.status === 'pending').length
    };

    stats.completionRate = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

    stats.skipRate = stats.total > 0
      ? Math.round((stats.skipped / stats.total) * 100)
      : 0;

    return { data: stats, error: null };
  } catch (err) {
    console.error('統計取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンが指定された日付に実行されるべきかを判定
 * @param {Object} routine - ルーティンオブジェクト
 * @param {Date} date - 判定する日付
 * @returns {boolean} - その日に実行されるべきならtrue
 */
export const shouldRoutineRunOnDate = (routine, date) => {
  if (!routine || !date) return false;

  const dayOfWeek = date.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜

  if (routine.repeat === 'daily') {
    return true;
  }

  if (routine.repeat === 'weekday') {
    // 平日（月〜金）
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (routine.repeat === 'weekend') {
    // 週末（土日）
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  if (routine.repeat === 'custom' && routine.selectedDays && routine.selectedDays.length > 0) {
    // カスタム（選択された曜日）
    return routine.selectedDays.includes(dayOfWeek);
  }

  // その他の場合はデフォルトでtrue（後方互換性のため）
  return true;
};
