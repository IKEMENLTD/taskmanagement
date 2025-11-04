import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Filter, Award, Target, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getDateRange,
  calculateProjectStats,
  calculateTaskStats,
  calculateRoutineStats,
  calculateTeamStats,
  calculateProgressDistribution,
  calculatePriorityDistribution,
  calculateOverallSummary
} from '../../utils/statisticsUtils';
import { SimpleBarChart } from '../charts/SimpleBarChart';
import { SimplePieChart } from '../charts/SimplePieChart';
import { SimpleLineChart } from '../charts/SimpleLineChart';

/**
 * 統計ダッシュボードコンポーネント
 */
export const StatisticsView = ({ projects, routineTasks, teamMembers, darkMode = false }) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // 期間フィルター
  const [period, setPeriod] = useState('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 期間範囲を取得
  const dateRange = useMemo(() => {
    if (period === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return getDateRange(period);
  }, [period, customStartDate, customEndDate]);

  // 統計データを計算
  const stats = useMemo(() => {
    return calculateOverallSummary(projects, routineTasks, dateRange.startDate, dateRange.endDate);
  }, [projects, routineTasks, dateRange]);

  const projectStats = stats.projects;
  const taskStats = stats.tasks;
  const routineStats = stats.routines;
  const overallHealth = stats.overallHealth;

  // チーム統計
  const teamStats = useMemo(() => {
    return calculateTeamStats(projects, routineTasks, teamMembers, dateRange.startDate, dateRange.endDate);
  }, [projects, routineTasks, teamMembers, dateRange]);

  // プロジェクト進捗分布
  const progressDistribution = useMemo(() => {
    const dist = calculateProgressDistribution(projects);
    return dist.map(d => ({
      label: d.range + '%',
      value: d.count,
      color: getProgressColor(d.range)
    }));
  }, [projects]);

  // タスク優先度分布
  const priorityDistribution = useMemo(() => {
    const dist = calculatePriorityDistribution(projects);
    return dist.map(d => ({
      label: getPriorityLabel(d.priority),
      value: d.total,
      color: getPriorityColor(d.priority)
    }));
  }, [projects]);

  // ルーティン達成率トレンド
  const routineTrend = useMemo(() => {
    return routineStats.dailyRates.map(d => ({
      label: formatDate(d.date),
      value: d.rate
    }));
  }, [routineStats]);

  // 健全性スコアの色
  const getHealthColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthBgColor = (status) => {
    switch (status) {
      case 'excellent': return darkMode ? 'bg-green-900/30' : 'bg-green-100';
      case 'good': return darkMode ? 'bg-blue-900/30' : 'bg-blue-100';
      case 'fair': return darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100';
      case 'poor': return darkMode ? 'bg-red-900/30' : 'bg-red-100';
      default: return darkMode ? 'bg-gray-800' : 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${textColor}`}>統計ダッシュボード</h2>
          <p className={`${textSecondary} mt-1`}>プロジェクトとタスクの進捗状況を可視化</p>
        </div>
      </div>

      {/* 期間フィルター */}
      <div className={`${cardBg} rounded-xl p-4 border`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className={textSecondary} />
            <span className={`font-semibold ${textColor}`}>期間:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: '今日' },
              { id: 'week', label: '今週' },
              { id: 'month', label: '今月' },
              { id: 'year', label: '今年' },
              { id: 'custom', label: 'カスタム' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  period === p.id
                    ? 'bg-blue-500 text-white'
                    : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor}`
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
              />
              <span className={textSecondary}>~</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
              />
            </div>
          )}
        </div>

        <div className={`mt-2 text-sm ${textSecondary}`}>
          期間: {dateRange.startDate} ~ {dateRange.endDate}
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 全体健全性スコア */}
        <div className={`${cardBg} rounded-xl p-6 border ${getHealthBgColor(overallHealth.status)}`}>
          <div className="flex items-center justify-between mb-4">
            <Award size={24} className={getHealthColor(overallHealth.status)} />
            <span className={`text-xs font-semibold ${textSecondary}`}>健全性スコア</span>
          </div>
          <div className={`text-3xl font-bold ${getHealthColor(overallHealth.status)} mb-2`}>
            {overallHealth.score}
          </div>
          <div className={`text-sm ${textSecondary}`}>
            {overallHealth.status === 'excellent' && '優秀'}
            {overallHealth.status === 'good' && '良好'}
            {overallHealth.status === 'fair' && '普通'}
            {overallHealth.status === 'poor' && '要改善'}
          </div>
        </div>

        {/* プロジェクト統計 */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <div className="flex items-center justify-between mb-4">
            <Target size={24} className="text-blue-500" />
            <span className={`text-xs font-semibold ${textSecondary}`}>プロジェクト</span>
          </div>
          <div className={`text-3xl font-bold ${textColor} mb-2`}>
            {projectStats.total}
          </div>
          <div className={`text-sm ${textSecondary}`}>
            進行中: {projectStats.active} | 完了: {projectStats.completed}
          </div>
          <div className={`text-sm ${textSecondary} mt-1`}>
            平均進捗: {projectStats.averageProgress}%
          </div>
        </div>

        {/* タスク統計 */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <div className="flex items-center justify-between mb-4">
            <CheckCircle size={24} className="text-green-500" />
            <span className={`text-xs font-semibold ${textSecondary}`}>タスク</span>
          </div>
          <div className={`text-3xl font-bold ${textColor} mb-2`}>
            {taskStats.total}
          </div>
          <div className={`text-sm ${textSecondary}`}>
            完了: {taskStats.completed} | 進行中: {taskStats.inProgress}
          </div>
          <div className={`text-sm ${textSecondary} mt-1`}>
            完了率: {taskStats.completionRate}%
          </div>
        </div>

        {/* ルーティン統計 */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <div className="flex items-center justify-between mb-4">
            <TrendingUp size={24} className="text-purple-500" />
            <span className={`text-xs font-semibold ${textSecondary}`}>ルーティン</span>
          </div>
          <div className={`text-3xl font-bold ${textColor} mb-2`}>
            {routineStats.completionRate}%
          </div>
          <div className={`text-sm ${textSecondary}`}>
            完了: {routineStats.completed} / {routineStats.total}
          </div>
        </div>
      </div>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* プロジェクト進捗分布 */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-semibold ${textColor} mb-4`}>プロジェクト進捗分布</h3>
          <SimpleBarChart data={progressDistribution} darkMode={darkMode} height={200} />
        </div>

        {/* タスク優先度分布 */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-semibold ${textColor} mb-4`}>タスク優先度分布</h3>
          <SimplePieChart data={priorityDistribution} darkMode={darkMode} size={200} />
        </div>
      </div>

      {/* ルーティン達成率トレンド */}
      {routineTrend.length > 0 && (
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h3 className={`text-lg font-semibold ${textColor} mb-4`}>ルーティン達成率トレンド</h3>
          <SimpleLineChart data={routineTrend} darkMode={darkMode} height={200} />
        </div>
      )}

      {/* チームメンバー統計 */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-semibold ${textColor} mb-4`}>チームメンバー統計</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left p-3 ${textColor}`}>メンバー</th>
                <th className={`text-left p-3 ${textColor}`}>役割</th>
                <th className={`text-right p-3 ${textColor}`}>総タスク</th>
                <th className={`text-right p-3 ${textColor}`}>完了</th>
                <th className={`text-right p-3 ${textColor}`}>進行中</th>
                <th className={`text-right p-3 ${textColor}`}>遅延</th>
                <th className={`text-right p-3 ${textColor}`}>完了率</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.map((member, index) => (
                <tr key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`p-3 ${textColor}`}>{member.name}</td>
                  <td className={`p-3 ${textSecondary}`}>{member.role}</td>
                  <td className={`p-3 text-right ${textColor}`}>{member.totalTasks}</td>
                  <td className={`p-3 text-right text-green-500`}>{member.completedTasks}</td>
                  <td className={`p-3 text-right text-blue-500`}>{member.inProgressTasks}</td>
                  <td className={`p-3 text-right text-red-500`}>{member.delayedTasks}</td>
                  <td className={`p-3 text-right font-semibold ${textColor}`}>{member.taskCompletionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* プロジェクトステータス */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h4 className={`font-semibold ${textColor} mb-4`}>プロジェクトステータス</h4>
          <div className="space-y-2">
            {Object.entries(projectStats.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className={textSecondary}>{getStatusLabel(status)}</span>
                <span className={`font-semibold ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* タスクステータス */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h4 className={`font-semibold ${textColor} mb-4`}>タスクステータス</h4>
          <div className="space-y-2">
            {Object.entries(taskStats.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className={textSecondary}>{getTaskStatusLabel(status)}</span>
                <span className={`font-semibold ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ルーティンカテゴリ */}
        <div className={`${cardBg} rounded-xl p-6 border`}>
          <h4 className={`font-semibold ${textColor} mb-4`}>ルーティンカテゴリ</h4>
          <div className="space-y-2">
            {Object.entries(routineStats.byCategory).map(([category, data]) => (
              <div key={category} className="flex justify-between">
                <span className={textSecondary}>{getCategoryLabel(category)}</span>
                <span className={`font-semibold ${textColor}`}>
                  {data.completed}/{data.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ヘルパー関数
const getProgressColor = (range) => {
  if (range === '100') return '#10b981';
  if (range === '76-99') return '#3b82f6';
  if (range === '51-75') return '#f59e0b';
  if (range === '26-50') return '#ef4444';
  return '#6b7280';
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#3b82f6';
    case 'low': return '#6b7280';
    default: return '#6b7280';
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'urgent': return '緊急';
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return 'その他';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'planning': return '計画中';
    case 'active': return '進行中';
    case 'completed': return '完了';
    case 'onHold': return '保留';
    default: return 'その他';
  }
};

const getTaskStatusLabel = (status) => {
  switch (status) {
    case 'todo': return '未着手';
    case 'inProgress': return '進行中';
    case 'completed': return '完了';
    default: return 'その他';
  }
};

const getCategoryLabel = (category) => {
  switch (category) {
    case 'work': return '仕事';
    case 'health': return '健康';
    case 'personal': return '個人';
    default: return 'その他';
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};
