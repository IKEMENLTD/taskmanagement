/**
 * データ変換ユーティリティ
 * CSV、JSON形式の相互変換を行う
 */

/**
 * プロジェクトをCSV形式に変換
 */
export const projectsToCSV = (projects) => {
  const headers = ['ID', '名前', 'ステータス', '開始日', '終了日', '進捗率', 'カラー', 'チームメンバー'];
  const rows = projects.map(p => [
    p.id,
    p.name,
    p.status,
    p.timeline.start,
    p.timeline.end,
    p.progress,
    p.color || '#3b82f6',
    p.team.join('|')
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * CSVをプロジェクトに変換
 */
export const csvToProjects = (csv) => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    return {
      id: parseInt(values[0]) || Date.now(),
      name: values[1],
      status: values[2] || 'active',
      timeline: {
        start: values[3],
        end: values[4]
      },
      progress: parseInt(values[5]) || 0,
      color: values[6] || '#3b82f6',
      team: values[7] ? values[7].split('|').map(m => m.trim()) : [],
      tasks: []
    };
  });
};

/**
 * タスクをCSV形式に変換
 */
export const tasksToCSV = (projects) => {
  const headers = ['ID', 'プロジェクトID', 'プロジェクト名', 'タスク名', '担当者', '優先度', 'ステータス', '開始日', '期限', '進捗率', '説明'];
  const rows = [];

  projects.forEach(project => {
    if (project.tasks) {
      project.tasks.forEach(task => {
        rows.push([
          task.id,
          project.id,
          project.name,
          task.name,
          task.assignee,
          task.priority,
          task.status,
          task.startDate,
          task.dueDate,
          task.progress,
          task.description || ''
        ]);
      });
    }
  });

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * CSVをタスクに変換
 */
export const csvToTasks = (csv) => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const tasksByProject = {};

  lines.slice(1).forEach(line => {
    const values = parseCSVLine(line);
    const projectId = parseInt(values[1]);

    if (!tasksByProject[projectId]) {
      tasksByProject[projectId] = [];
    }

    tasksByProject[projectId].push({
      id: parseInt(values[0]) || Date.now(),
      name: values[3],
      assignee: values[4],
      priority: values[5] || 'medium',
      status: values[6] || 'active',
      startDate: values[7],
      dueDate: values[8],
      progress: parseInt(values[9]) || 0,
      description: values[10] || '',
      blockers: [],
      tags: [],
      estimatedHours: 0,
      actualHours: 0,
      completedDate: null,
      subTasks: [],
      attachments: [],
      comments: [],
      activities: [],
      dependencies: [],
      relatedTasks: []
    });
  });

  return tasksByProject;
};

/**
 * ルーティンをCSV形式に変換
 */
export const routinesToCSV = (routineTasks) => {
  const headers = ['ID', '日付', '名前', '時刻', 'カテゴリー', '担当者', '繰り返し', '曜日指定', '所要時間', 'プロジェクトID', '完了', 'メモ', '説明'];
  const rows = [];

  Object.keys(routineTasks).forEach(date => {
    routineTasks[date].forEach(routine => {
      rows.push([
        routine.id,
        date,
        routine.name,
        routine.time,
        routine.category || '',
        routine.assignee,
        routine.repeat || 'daily',
        routine.selectedDays ? routine.selectedDays.join('|') : '',
        routine.duration || 30,
        routine.projectId || '',
        routine.completed ? 'true' : 'false',
        routine.notes || '',
        routine.description || ''
      ]);
    });
  });

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * CSVをルーティンに変換
 */
export const csvToRoutines = (csv) => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const routinesByDate = {};

  lines.slice(1).forEach(line => {
    const values = parseCSVLine(line);
    const date = values[1];

    if (!routinesByDate[date]) {
      routinesByDate[date] = [];
    }

    routinesByDate[date].push({
      id: values[0],
      name: values[2],
      time: values[3],
      category: values[4] || '',
      assignee: values[5],
      repeat: values[6] || 'daily',
      selectedDays: values[7] ? values[7].split('|').map(d => parseInt(d)) : [],
      duration: parseInt(values[8]) || 30,
      projectId: values[9] ? parseInt(values[9]) : null,
      completed: values[10] === 'true',
      notes: values[11] || '',
      description: values[12] || '',
      streak: 0,
      completedDates: []
    });
  });

  return routinesByDate;
};

/**
 * チームメンバーをCSV形式に変換
 */
export const teamMembersToCSV = (teamMembers) => {
  const headers = ['ID', '名前', '役割', 'メールアドレス'];
  const rows = teamMembers.map(member => [
    member.id || member.name,
    member.name,
    member.role || '',
    member.email || ''
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * CSVをチームメンバーに変換
 */
export const csvToTeamMembers = (csv) => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    return {
      id: values[0] || values[1],
      name: values[1],
      role: values[2] || '',
      email: values[3] || ''
    };
  });
};

/**
 * 全データをJSON形式に変換
 */
export const dataToJSON = (projects, teamMembers, routineTasks, routineCategories) => {
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    version: '1.0',
    projects,
    teamMembers,
    routineTasks,
    routineCategories
  }, null, 2);
};

/**
 * JSONを全データに変換
 */
export const jsonToData = (json) => {
  try {
    const data = JSON.parse(json);
    return {
      projects: data.projects || [],
      teamMembers: data.teamMembers || [],
      routineTasks: data.routineTasks || {},
      routineCategories: data.routineCategories || []
    };
  } catch (error) {
    throw new Error('JSONの解析に失敗しました: ' + error.message);
  }
};

/**
 * CSVテンプレートを生成（サンプルデータ入り）
 */
export const generateProjectsTemplate = () => {
  const template = [
    ['ID', '名前', 'ステータス', '開始日', '終了日', '進捗率', 'カラー', 'チームメンバー'],
    [1, '新製品開発', 'active', '2025-01-01', '2025-12-31', 35, '#3b82f6', '田中|佐藤|鈴木'],
    [2, 'マーケティングキャンペーン', 'active', '2025-02-01', '2025-06-30', 60, '#10b981', '山田|佐藤']
  ];
  return template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

export const generateTasksTemplate = () => {
  const template = [
    ['ID', 'プロジェクトID', 'プロジェクト名', 'タスク名', '担当者', '優先度', 'ステータス', '開始日', '期限', '進捗率', '説明'],
    [1, 1, '新製品開発', '要件定義書作成', '田中', 'high', 'completed', '2025-01-01', '2025-01-15', 100, '顧客要件をまとめる'],
    [2, 1, '新製品開発', 'UI設計', '鈴木', 'medium', 'active', '2025-01-16', '2025-02-15', 50, 'Figmaでデザイン作成']
  ];
  return template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

export const generateRoutinesTemplate = () => {
  const template = [
    ['ID', '日付', '名前', '時刻', 'カテゴリー', '担当者', '繰り返し', '曜日指定', '所要時間', 'プロジェクトID', '完了', 'メモ', '説明'],
    ['r1', '2025-11-04', '朝のミーティング', '09:00', 'work', '田中', 'daily', '', 30, '', 'true', 'スムーズに進行', ''],
    ['r2', '2025-11-04', 'メール確認', '09:30', 'work', '佐藤', 'weekdays', '1|2|3|4|5', 15, '', 'true', '', '毎朝メールチェック']
  ];
  return template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

export const generateTeamMembersTemplate = () => {
  const template = [
    ['ID', '名前', '役割', 'メールアドレス'],
    ['tanaka', '田中太郎', 'プロジェクトマネージャー', 'tanaka@example.com'],
    ['sato', '佐藤花子', 'エンジニア', 'sato@example.com']
  ];
  return template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * CSV行をパース（ダブルクォート内のカンマを無視）
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

/**
 * ファイルをダウンロード
 */
export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
