import { supabase } from '../lib/supabase';

/**
 * ルーティン管理ユーティリティ（マスター定義と実行記録を分離）
 */

// ============================================
// ルーティンマスター（routines テーブル）の管理
// ============================================

/**
 * 組織のすべてのルーティンマスターを取得
 * @param {string} organizationId - 組織ID
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getAllRoutines = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('time', { ascending: true });

    if (error) {
      console.error('ルーティンマスター取得エラー:', error);
      return { data: null, error };
    }

    // データ変換: selected_days を selectedDays に変換
    const convertedData = data?.map(routine => ({
      ...routine,
      selectedDays: (routine.selected_days || []).map(day =>
        typeof day === 'string' ? parseInt(day, 10) : day
      ),
      projectId: routine.project_id
    }));

    return { data: convertedData, error: null };
  } catch (err) {
    console.error('ルーティンマスター取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンマスターを作成
 * @param {string} organizationId - 組織ID
 * @param {Object} routineData - ルーティンデータ
 * @returns {Promise<{data: any, error: any}>}
 */
export const createRoutine = async (organizationId, routineData) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .insert([{
        organization_id: organizationId,
        name: routineData.name,
        description: routineData.description || null,
        time: routineData.time,
        category: routineData.category || 'work',
        project_id: routineData.projectId || null,
        assignee: routineData.assignee || null,
        repeat: routineData.repeat || 'daily',
        selected_days: routineData.selectedDays || [],
        duration: routineData.duration || 30,
        is_active: true,
        created_by: routineData.userId || null
      }])
      .select()
      .single();

    if (error) {
      console.error('ルーティンマスター作成エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンマスター作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンマスターを更新
 * @param {string} routineId - ルーティンID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateRoutine = async (routineId, updates) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', routineId)
      .select()
      .single();

    if (error) {
      console.error('ルーティンマスター更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンマスター更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンマスターを削除（論理削除）
 * @param {string} routineId - ルーティンID
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteRoutine = async (routineId) => {
  try {
    // is_active を false にする（論理削除）
    const { data, error } = await supabase
      .from('routines')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', routineId)
      .select()
      .single();

    if (error) {
      console.error('ルーティンマスター削除エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ルーティンマスター削除エラー:', err);
    return { data: null, error: err };
  }
};

// ============================================
// 実行記録（routine_tasks テーブル）の管理
// ============================================

/**
 * 指定日の実行記録を取得
 * @param {string} organizationId - 組織ID
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getRoutineTaskRecords = async (organizationId, date) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('date', date);

    if (error) {
      console.error('実行記録取得エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('実行記録取得エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * 実行記録を作成
 * @param {string} organizationId - 組織ID
 * @param {number} routineId - ルーティンマスターID
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @param {string} status - ステータス（pending/completed/skipped）
 * @returns {Promise<{data: any, error: any}>}
 */
export const createRoutineTaskRecord = async (organizationId, routineId, date, status = 'pending') => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .insert([{
        organization_id: organizationId,
        routine_id: routineId,
        date: date,
        status: status
      }])
      .select()
      .single();

    if (error) {
      console.error('実行記録作成エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('実行記録作成エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * 実行記録を更新（完了/スキップなど）
 * @param {string} taskId - 実行記録ID
 * @param {Object} updates - 更新データ
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateRoutineTaskRecord = async (taskId, updates) => {
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
      console.error('実行記録更新エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('実行記録更新エラー:', err);
    return { data: null, error: err };
  }
};

// ============================================
// 今日のルーティン取得（マスター + 実行記録を結合）
// ============================================

/**
 * 今日実行すべきルーティンを取得（マスターと実行記録を結合）
 * @param {string} organizationId - 組織ID
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getTodaysRoutines = async (organizationId, date) => {
  try {
    // 1. ルーティンマスターを取得
    const { data: routines, error: routinesError } = await getAllRoutines(organizationId);
    if (routinesError) return { data: null, error: routinesError };

    // 2. 今日の実行記録を取得
    const { data: records, error: recordsError } = await getRoutineTaskRecords(organizationId, date);
    if (recordsError) return { data: null, error: recordsError };

    // 3. 今日実行すべきルーティンをフィルタリング
    const dateObj = new Date(date + 'T00:00:00');
    const todaysRoutines = routines.filter(routine => shouldRoutineRunOnDate(routine, dateObj));

    // 4. マスターと実行記録を結合
    const combined = todaysRoutines.map(routine => {
      // この routine の今日の実行記録を探す
      const record = records?.find(r => r.routine_id === routine.id);

      return {
        // マスター情報
        routineId: routine.id,
        id: record?.id || null, // 実行記録のID（なければnull）
        name: routine.name,
        description: routine.description || '',
        time: routine.time,
        category: routine.category,
        projectId: routine.project_id,
        assignee: routine.assignee,
        repeat: routine.repeat,
        selectedDays: routine.selectedDays,
        duration: routine.duration,
        date: date,

        // 実行記録情報
        status: record?.status || 'pending',
        completed: record?.status === 'completed',
        completed_at: record?.completed_at || null,
        skipped_at: record?.skipped_at || null,
        skip_reason: record?.skip_reason || null,

        // その他
        created_at: routine.created_at,
        updated_at: record?.updated_at || routine.updated_at
      };
    });

    return { data: combined, error: null };
  } catch (err) {
    console.error('今日のルーティン取得エラー:', err);
    return { data: null, error: err };
  }
};

// ============================================
// 実行記録の状態変更（完了/スキップ/リセット）
// ============================================

/**
 * ルーティンを完了状態にする（実行記録がなければ作成）
 * @param {string} organizationId - 組織ID
 * @param {number} routineId - ルーティンマスターID
 * @param {string} taskRecordId - 実行記録ID（あれば）
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @returns {Promise<{data: any, error: any}>}
 */
export const completeRoutine = async (organizationId, routineId, taskRecordId, date) => {
  try {
    if (taskRecordId) {
      // 既存の実行記録を更新
      return await updateRoutineTaskRecord(taskRecordId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    } else {
      // 実行記録を新規作成
      const { data, error } = await supabase
        .from('routine_tasks')
        .insert([{
          organization_id: organizationId,
          routine_id: routineId,
          date: date,
          status: 'completed',
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('完了記録作成エラー:', error);
        return { data: null, error };
      }

      return { data, error: null };
    }
  } catch (err) {
    console.error('完了処理エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンをスキップ状態にする（実行記録がなければ作成）
 * @param {string} organizationId - 組織ID
 * @param {number} routineId - ルーティンマスターID
 * @param {string} taskRecordId - 実行記録ID（あれば）
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @param {string} reason - スキップ理由
 * @returns {Promise<{data: any, error: any}>}
 */
export const skipRoutine = async (organizationId, routineId, taskRecordId, date, reason = null) => {
  try {
    if (taskRecordId) {
      // 既存の実行記録を更新
      return await updateRoutineTaskRecord(taskRecordId, {
        status: 'skipped',
        skipped_at: new Date().toISOString(),
        skip_reason: reason
      });
    } else {
      // 実行記録を新規作成
      const { data, error } = await supabase
        .from('routine_tasks')
        .insert([{
          organization_id: organizationId,
          routine_id: routineId,
          date: date,
          status: 'skipped',
          skipped_at: new Date().toISOString(),
          skip_reason: reason
        }])
        .select()
        .single();

      if (error) {
        console.error('スキップ記録作成エラー:', error);
        return { data: null, error };
      }

      return { data, error: null };
    }
  } catch (err) {
    console.error('スキップ処理エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ルーティンを未完了状態に戻す
 * @param {string} taskRecordId - 実行記録ID
 * @returns {Promise<{data: any, error: any}>}
 */
export const resetRoutine = async (taskRecordId) => {
  if (!taskRecordId) {
    // 実行記録がない場合は何もしない（pendingと同じ）
    return { data: null, error: null };
  }

  return await updateRoutineTaskRecord(taskRecordId, {
    status: 'pending',
    completed_at: null,
    skipped_at: null,
    skip_reason: null
  });
};

// ============================================
// 自動処理・統計
// ============================================

/**
 * 前日の未完了タスクを自動的にスキップする
 * @param {string} organizationId - 組織ID
 * @param {string} date - 前日の日付 (YYYY-MM-DD)
 * @returns {Promise<{data: any, error: any}>}
 */
export const autoSkipPreviousDayTasks = async (organizationId, date) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .update({
        status: 'skipped',
        skipped_at: new Date().toISOString(),
        skip_reason: '日付変更により自動スキップ',
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
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
 * 指定期間のルーティンタスク統計を取得（組織全体）
 * @param {string} organizationId - 組織ID
 * @param {string} startDate - 開始日 (YYYY-MM-DD)
 * @param {string} endDate - 終了日 (YYYY-MM-DD)
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getRoutineStats = async (organizationId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('status')
      .eq('organization_id', organizationId)
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

  if (routine.repeat === 'weekdays' || routine.repeat === 'weekday') {
    // 平日（月〜金）
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (routine.repeat === 'weekend') {
    // 週末（土日）
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // カスタム繰り返し: selected_days（スネークケース）も確認
  const selectedDays = routine.selectedDays || routine.selected_days;
  if (routine.repeat === 'custom' && selectedDays && selectedDays.length > 0) {
    // カスタム（選択された曜日）
    // 文字列と数値の両方に対応
    return selectedDays.some(day => {
      const numDay = typeof day === 'string' ? parseInt(day, 10) : day;
      return numDay === dayOfWeek;
    });
  }

  // その他の場合はデフォルトでtrue（後方互換性のため）
  return true;
};

// ============================================
// 後方互換性のためのエイリアス
// ============================================

/**
 * @deprecated getTodaysRoutines を使用してください
 */
export const getRoutineTasks = getTodaysRoutines;

/**
 * @deprecated createRoutine を使用してください
 */
export const createRoutineTask = createRoutine;

/**
 * @deprecated updateRoutine を使用してください（マスター更新）または updateRoutineTaskRecord（実行記録更新）
 */
export const updateRoutineTask = updateRoutine;

/**
 * @deprecated deleteRoutine を使用してください
 */
export const deleteRoutineTask = deleteRoutine;

/**
 * @deprecated completeRoutine を使用してください
 */
export const completeRoutineTask = completeRoutine;

/**
 * @deprecated skipRoutine を使用してください
 */
export const skipRoutineTask = skipRoutine;

/**
 * @deprecated resetRoutine を使用してください
 */
export const resetRoutineTask = resetRoutine;
