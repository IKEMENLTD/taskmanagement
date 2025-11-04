// サンプルルーティンタスクデータ
export const sampleRoutines = {
  '2025-10-29': [
    // 田中さんのルーティン
    {
      id: 'r1',
      name: '朝のストレッチ',
      completed: true,
      time: '07:00',
      category: 'health',
      projectId: null,
      assignee: '田中',
      description: '10分間の軽いストレッチで体をほぐします。肩こり予防にも効果的です。',
      repeat: 'daily',
      duration: 10,
      notes: '昨日は少し長めに15分やりました。調子良いです。',
      streak: 28,
      completedDates: ['2025-10-28', '2025-10-27', '2025-10-26']
    },
    {
      id: 'r2',
      name: 'メール確認',
      completed: true,
      time: '09:00',
      category: 'work',
      projectId: null,
      assignee: '田中',
      description: '朝一番のメールチェックと優先順位の整理を行います。',
      repeat: 'weekdays',
      duration: 15,
      notes: '',
      streak: 45,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },
    {
      id: 'r3',
      name: 'チーム定例会議',
      completed: false,
      time: '10:00',
      category: 'work',
      projectId: 1,
      assignee: '田中',
      description: '新製品開発プロジェクトの進捗確認とタスクの調整を行います。',
      repeat: 'weekdays',
      duration: 30,
      notes: '',
      streak: 12,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },

    // 佐藤さんのルーティン
    {
      id: 'r10',
      name: 'コードレビュー',
      completed: true,
      time: '09:30',
      category: 'work',
      projectId: 1,
      assignee: '佐藤',
      description: 'チームメンバーのプルリクエストをレビューします。',
      repeat: 'weekdays',
      duration: 30,
      notes: '',
      streak: 35,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },
    {
      id: 'r11',
      name: 'API開発作業',
      completed: false,
      time: '10:30',
      category: 'work',
      projectId: 1,
      assignee: '佐藤',
      description: 'バックエンドAPIの開発と実装を進めます。',
      repeat: 'weekdays',
      duration: 120,
      notes: '',
      streak: 18,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },
    {
      id: 'r12',
      name: 'ランニング',
      completed: false,
      time: '19:30',
      category: 'health',
      projectId: null,
      assignee: '佐藤',
      description: '5km程度のランニングで体力維持。',
      repeat: 'custom',
      duration: 30,
      notes: '',
      streak: 42,
      completedDates: ['2025-10-28', '2025-10-27', '2025-10-25']
    },

    // 鈴木さんのルーティン
    {
      id: 'r13',
      name: 'テストケース作成',
      completed: true,
      time: '09:00',
      category: 'work',
      projectId: 1,
      assignee: '鈴木',
      description: '新機能のテストケースを作成します。',
      repeat: 'weekdays',
      duration: 60,
      notes: '',
      streak: 22,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },
    {
      id: 'r14',
      name: 'バグトリアージ',
      completed: false,
      time: '14:00',
      category: 'work',
      projectId: 1,
      assignee: '鈴木',
      description: '報告されたバグの優先順位付けと割り当て。',
      repeat: 'weekdays',
      duration: 30,
      notes: '',
      streak: 15,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },

    // 山田さんのルーティン
    {
      id: 'r15',
      name: 'SNS投稿',
      completed: true,
      time: '10:00',
      category: 'work',
      projectId: 2,
      assignee: '山田',
      description: 'マーケティングキャンペーンのSNS投稿を行います。',
      repeat: 'daily',
      duration: 20,
      notes: '',
      streak: 60,
      completedDates: ['2025-10-28', '2025-10-27', '2025-10-26']
    },
    {
      id: 'r16',
      name: 'ヨガ',
      completed: true,
      time: '18:00',
      category: 'health',
      projectId: null,
      assignee: '山田',
      description: 'オンラインヨガクラスに参加。',
      repeat: 'custom',
      duration: 45,
      notes: '',
      streak: 33,
      completedDates: ['2025-10-28', '2025-10-26', '2025-10-24']
    },

    // 高橋さんのルーティン
    {
      id: 'r17',
      name: 'デザインレビュー',
      completed: false,
      time: '11:00',
      category: 'work',
      projectId: 1,
      assignee: '高橋',
      description: '新機能のUIデザインをレビューします。',
      repeat: 'weekdays',
      duration: 60,
      notes: '',
      streak: 8,
      completedDates: ['2025-10-28', '2025-10-25', '2025-10-24']
    },
    {
      id: 'r18',
      name: '読書',
      completed: false,
      time: '21:00',
      category: 'personal',
      projectId: null,
      assignee: '高橋',
      description: 'デザイン関連の書籍を読む。',
      repeat: 'daily',
      duration: 30,
      notes: '',
      streak: 20,
      completedDates: ['2025-10-28', '2025-10-27', '2025-10-26']
    }
  ]
};
