import React, { useState } from 'react';
import { Download, Upload, FileText, Database, CheckCircle, AlertCircle, X } from 'lucide-react';
import {
  projectsToCSV,
  tasksToCSV,
  routinesToCSV,
  teamMembersToCSV,
  dataToJSON,
  csvToProjects,
  csvToTasks,
  csvToRoutines,
  csvToTeamMembers,
  jsonToData,
  generateProjectsTemplate,
  generateTasksTemplate,
  generateRoutinesTemplate,
  generateTeamMembersTemplate,
  downloadFile
} from '../../utils/dataConverter';

/**
 * データ管理パネルコンポーネント
 */
export const DataManagementPanel = ({
  projects,
  setProjects,
  teamMembers,
  setTeamMembers,
  routineTasks,
  setRoutineTasks,
  routineCategories,
  setRoutineCategories,
  darkMode
}) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const [importMode, setImportMode] = useState('replace'); // replace, merge, add
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  // エクスポート機能
  const handleExportCSV = (type) => {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (type) {
      case 'projects':
        downloadFile(projectsToCSV(projects), `projects_${timestamp}.csv`, 'text/csv');
        break;
      case 'tasks':
        downloadFile(tasksToCSV(projects), `tasks_${timestamp}.csv`, 'text/csv');
        break;
      case 'routines':
        downloadFile(routinesToCSV(routineTasks), `routines_${timestamp}.csv`, 'text/csv');
        break;
      case 'team':
        downloadFile(teamMembersToCSV(teamMembers), `team_members_${timestamp}.csv`, 'text/csv');
        break;
      default:
        break;
    }
  };

  const handleExportJSON = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const json = dataToJSON(projects, teamMembers, routineTasks, routineCategories);
    downloadFile(json, `dashboard_data_${timestamp}.json`, 'application/json');
  };

  // テンプレートダウンロード
  const handleDownloadTemplate = (type) => {
    switch (type) {
      case 'projects':
        downloadFile(generateProjectsTemplate(), 'projects_template.csv', 'text/csv');
        break;
      case 'tasks':
        downloadFile(generateTasksTemplate(), 'tasks_template.csv', 'text/csv');
        break;
      case 'routines':
        downloadFile(generateRoutinesTemplate(), 'routines_template.csv', 'text/csv');
        break;
      case 'team':
        downloadFile(generateTeamMembersTemplate(), 'team_members_template.csv', 'text/csv');
        break;
      default:
        break;
    }
  };

  // インポート機能
  const handleImportFile = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;

        if (type === 'json') {
          const data = jsonToData(content);
          setImportPreviewData({ type: 'json', data });
          setShowImportPreview(true);
        } else {
          // CSV
          let parsedData;
          switch (type) {
            case 'projects':
              parsedData = csvToProjects(content);
              setImportPreviewData({ type: 'projects', data: parsedData });
              break;
            case 'tasks':
              parsedData = csvToTasks(content);
              setImportPreviewData({ type: 'tasks', data: parsedData });
              break;
            case 'routines':
              parsedData = csvToRoutines(content);
              setImportPreviewData({ type: 'routines', data: parsedData });
              break;
            case 'team':
              parsedData = csvToTeamMembers(content);
              setImportPreviewData({ type: 'team', data: parsedData });
              break;
            default:
              break;
          }
          setShowImportPreview(true);
        }

        setImportStatus({ type: 'success', message: 'ファイルを読み込みました。プレビューを確認してください。' });
      } catch (error) {
        setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
      }
    };

    if (type === 'json') {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }

    // リセット
    event.target.value = '';
  };

  // インポート実行
  const handleConfirmImport = () => {
    if (!importPreviewData) return;

    try {
      const { type, data } = importPreviewData;

      if (type === 'json') {
        // JSON全データインポート
        if (importMode === 'replace') {
          setProjects(data.projects);
          setTeamMembers(data.teamMembers);
          setRoutineTasks(data.routineTasks);
          setRoutineCategories(data.routineCategories);
        } else if (importMode === 'merge') {
          // マージ処理
          const mergedProjects = [...projects];
          data.projects.forEach(newP => {
            const index = mergedProjects.findIndex(p => p.id === newP.id);
            if (index !== -1) {
              mergedProjects[index] = newP;
            } else {
              mergedProjects.push(newP);
            }
          });
          setProjects(mergedProjects);

          const mergedMembers = [...teamMembers];
          data.teamMembers.forEach(newM => {
            const index = mergedMembers.findIndex(m => m.id === newM.id);
            if (index !== -1) {
              mergedMembers[index] = newM;
            } else {
              mergedMembers.push(newM);
            }
          });
          setTeamMembers(mergedMembers);

          setRoutineTasks({ ...routineTasks, ...data.routineTasks });
          setRoutineCategories([...new Set([...routineCategories, ...data.routineCategories])]);
        } else {
          // 追加のみ
          setProjects([...projects, ...data.projects]);
          setTeamMembers([...teamMembers, ...data.teamMembers]);
          setRoutineTasks({ ...routineTasks, ...data.routineTasks });
          setRoutineCategories([...new Set([...routineCategories, ...data.routineCategories])]);
        }

        setImportStatus({ type: 'success', message: 'データをインポートしました！' });
      } else if (type === 'projects') {
        if (importMode === 'replace') {
          setProjects(data);
        } else if (importMode === 'merge') {
          const mergedProjects = [...projects];
          data.forEach(newP => {
            const index = mergedProjects.findIndex(p => p.id === newP.id);
            if (index !== -1) {
              mergedProjects[index] = newP;
            } else {
              mergedProjects.push(newP);
            }
          });
          setProjects(mergedProjects);
        } else {
          setProjects([...projects, ...data]);
        }
        setImportStatus({ type: 'success', message: 'プロジェクトをインポートしました！' });
      } else if (type === 'tasks') {
        // タスクをプロジェクトにマージ
        const updatedProjects = projects.map(p => {
          if (data[p.id]) {
            if (importMode === 'replace') {
              return { ...p, tasks: data[p.id] };
            } else if (importMode === 'merge') {
              const mergedTasks = [...(p.tasks || [])];
              data[p.id].forEach(newT => {
                const index = mergedTasks.findIndex(t => t.id === newT.id);
                if (index !== -1) {
                  mergedTasks[index] = newT;
                } else {
                  mergedTasks.push(newT);
                }
              });
              return { ...p, tasks: mergedTasks };
            } else {
              return { ...p, tasks: [...(p.tasks || []), ...data[p.id]] };
            }
          }
          return p;
        });
        setProjects(updatedProjects);
        setImportStatus({ type: 'success', message: 'タスクをインポートしました！' });
      } else if (type === 'routines') {
        if (importMode === 'replace') {
          setRoutineTasks(data);
        } else if (importMode === 'merge') {
          const mergedRoutines = { ...routineTasks };
          Object.keys(data).forEach(date => {
            if (mergedRoutines[date]) {
              const mergedDateRoutines = [...mergedRoutines[date]];
              data[date].forEach(newR => {
                const index = mergedDateRoutines.findIndex(r => r.id === newR.id);
                if (index !== -1) {
                  mergedDateRoutines[index] = newR;
                } else {
                  mergedDateRoutines.push(newR);
                }
              });
              mergedRoutines[date] = mergedDateRoutines;
            } else {
              mergedRoutines[date] = data[date];
            }
          });
          setRoutineTasks(mergedRoutines);
        } else {
          const mergedRoutines = { ...routineTasks };
          Object.keys(data).forEach(date => {
            if (mergedRoutines[date]) {
              mergedRoutines[date] = [...mergedRoutines[date], ...data[date]];
            } else {
              mergedRoutines[date] = data[date];
            }
          });
          setRoutineTasks(mergedRoutines);
        }
        setImportStatus({ type: 'success', message: 'ルーティンをインポートしました！' });
      } else if (type === 'team') {
        if (importMode === 'replace') {
          setTeamMembers(data);
        } else if (importMode === 'merge') {
          const mergedMembers = [...teamMembers];
          data.forEach(newM => {
            const index = mergedMembers.findIndex(m => m.id === newM.id);
            if (index !== -1) {
              mergedMembers[index] = newM;
            } else {
              mergedMembers.push(newM);
            }
          });
          setTeamMembers(mergedMembers);
        } else {
          setTeamMembers([...teamMembers, ...data]);
        }
        setImportStatus({ type: 'success', message: 'チームメンバーをインポートしました！' });
      }

      setShowImportPreview(false);
      setImportPreviewData(null);

      // 3秒後にステータスをクリア
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* ステータスメッセージ */}
      {importStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          importStatus.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{importStatus.message}</span>
          <button
            onClick={() => setImportStatus(null)}
            className="ml-auto hover:opacity-70"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* エクスポートセクション */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <Download size={20} />
          データのエクスポート
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          現在のデータをCSVまたはJSON形式でダウンロードします
        </p>

        <div className="space-y-3">
          {/* CSV個別エクスポート */}
          <div>
            <h4 className={`text-sm font-semibold ${textColor} mb-2`}>CSV形式（個別）</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleExportCSV('projects')}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
              >
                📁 プロジェクト
              </button>
              <button
                onClick={() => handleExportCSV('tasks')}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
              >
                ✅ タスク
              </button>
              <button
                onClick={() => handleExportCSV('routines')}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
              >
                🔁 ルーティン
              </button>
              <button
                onClick={() => handleExportCSV('team')}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
              >
                👥 メンバー
              </button>
            </div>
          </div>

          {/* JSON統合エクスポート */}
          <div>
            <h4 className={`text-sm font-semibold ${textColor} mb-2`}>JSON形式（統合）</h4>
            <button
              onClick={handleExportJSON}
              className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white text-sm transition-all flex items-center gap-2`}
            >
              <Database size={18} />
              全データをエクスポート
            </button>
          </div>
        </div>
      </div>

      {/* テンプレートダウンロードセクション */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <FileText size={20} />
          CSVテンプレートのダウンロード
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          サンプルデータ入りのCSVテンプレートをダウンロードし、編集してインポートできます
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleDownloadTemplate('projects')}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white text-sm transition-all`}
          >
            📁 プロジェクト
          </button>
          <button
            onClick={() => handleDownloadTemplate('tasks')}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white text-sm transition-all`}
          >
            ✅ タスク
          </button>
          <button
            onClick={() => handleDownloadTemplate('routines')}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white text-sm transition-all`}
          >
            🔁 ルーティン
          </button>
          <button
            onClick={() => handleDownloadTemplate('team')}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white text-sm transition-all`}
          >
            👥 メンバー
          </button>
        </div>
      </div>

      {/* インポートセクション */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <Upload size={20} />
          データのインポート
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          CSVまたはJSON形式のファイルをアップロードしてデータをインポートします
        </p>

        {/* インポートモード選択 */}
        <div className="mb-4">
          <label className={`block text-sm font-medium ${textColor} mb-2`}>インポートモード</label>
          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}
          >
            <option value="replace">上書き（既存データを削除）</option>
            <option value="merge">マージ（IDが同じものは更新、新規は追加）</option>
            <option value="add">追加のみ（既存データはそのまま）</option>
          </select>
        </div>

        <div className="space-y-3">
          {/* CSV個別インポート */}
          <div>
            <h4 className={`text-sm font-semibold ${textColor} mb-2`}>CSV形式（個別）</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <label className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white text-sm transition-all cursor-pointer text-center`}>
                📁 プロジェクト
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleImportFile(e, 'projects')}
                  className="hidden"
                />
              </label>
              <label className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white text-sm transition-all cursor-pointer text-center`}>
                ✅ タスク
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleImportFile(e, 'tasks')}
                  className="hidden"
                />
              </label>
              <label className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white text-sm transition-all cursor-pointer text-center`}>
                🔁 ルーティン
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleImportFile(e, 'routines')}
                  className="hidden"
                />
              </label>
              <label className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white text-sm transition-all cursor-pointer text-center`}>
                👥 メンバー
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleImportFile(e, 'team')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* JSON統合インポート */}
          <div>
            <h4 className={`text-sm font-semibold ${textColor} mb-2`}>JSON形式（統合）</h4>
            <label className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white text-sm transition-all flex items-center gap-2 cursor-pointer inline-flex`}>
              <Database size={18} />
              全データをインポート
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleImportFile(e, 'json')}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* インポートプレビューモーダル */}
      {showImportPreview && importPreviewData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setShowImportPreview(false)}
        >
          <div
            className={`${cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div>
                <h3 className={`text-2xl font-bold ${textColor}`}>インポートプレビュー</h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  インポートする内容を確認してください
                </p>
              </div>
              <button onClick={() => setShowImportPreview(false)} className={`${textSecondary} hover:${textColor} transition-colors`}>
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 font-mono text-xs overflow-auto max-h-96`}>
                <pre className={textColor}>{JSON.stringify(importPreviewData.data, null, 2)}</pre>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmImport}
                  className={`flex-1 px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-all`}
                >
                  ✓ インポートを実行
                </button>
                <button
                  onClick={() => setShowImportPreview(false)}
                  className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} font-semibold transition-all`}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
