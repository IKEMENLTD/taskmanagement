// サンプルプロジェクトデータ
export const sampleProjects = [
  {
    id: 1,
    name: '新製品開発プロジェクト',
    progress: 65,
    status: 'active',
    timeline: { start: '2025-10-01', end: '2025-12-31' },
    team: ['田中', '佐藤', '鈴木'],
    tasks: [
      {
        id: 101,
        name: 'UI設計',
        progress: 100,
        status: 'completed',
        assignee: '田中',
        priority: 'high',
        blockers: [],
        dueDate: '2025-10-20',
        description: 'ユーザーインターフェースの全体設計を行います。モバイルとデスクトップ両方のレスポンシブデザインを含みます。',
        tags: ['デザイン', 'UI/UX', 'フロントエンド'],
        estimatedHours: 40,
        actualHours: 38,
        startDate: '2025-10-01',
        completedDate: '2025-10-20',
        subTasks: [
          { id: 1011, name: 'ワイヤーフレーム作成', completed: true },
          { id: 1012, name: 'モックアップデザイン', completed: true },
          { id: 1013, name: 'プロトタイプ作成', completed: true },
          { id: 1014, name: 'レビュー・修正', completed: true }
        ],
        attachments: [
          { name: 'design-mockup.fig', size: '2.4MB', type: 'figma' },
          { name: 'ui-specifications.pdf', size: '1.1MB', type: 'pdf' }
        ],
        comments: [
          { author: '佐藤', text: 'デザインとても良いです！実装開始します。', date: '2025-10-18', time: '14:30' },
          { author: '鈴木', text: 'モバイル版も確認しました。問題ありません。', date: '2025-10-19', time: '10:15' }
        ],
        activities: [
          { type: 'status', message: 'ステータスを「完了」に変更', user: '田中', date: '2025-10-20', time: '16:00' },
          { type: 'progress', message: '進捗を100%に更新', user: '田中', date: '2025-10-20', time: '15:45' },
          { type: 'comment', message: 'コメントを追加', user: '佐藤', date: '2025-10-18', time: '14:30' }
        ],
        dependencies: [],
        relatedTasks: [102, 103]
      },
      {
        id: 102,
        name: 'バックエンド開発',
        progress: 80,
        status: 'active',
        assignee: '佐藤',
        priority: 'high',
        blockers: [],
        dueDate: '2025-11-15',
        description: 'RESTful APIの開発とデータベース設計を行います。認証システムとユーザー管理機能を実装します。',
        tags: ['バックエンド', 'API', 'データベース'],
        estimatedHours: 80,
        actualHours: 64,
        startDate: '2025-10-15',
        completedDate: null,
        subTasks: [
          { id: 1021, name: 'データベーススキーマ設計', completed: true },
          { id: 1022, name: 'API設計', completed: true },
          { id: 1023, name: 'エンドポイント実装', completed: false },
          { id: 1024, name: 'セキュリティ実装', completed: false },
          { id: 1025, name: 'パフォーマンス最適化', completed: false }
        ],
        attachments: [
          { name: 'api-documentation.md', size: '156KB', type: 'markdown' },
          { name: 'database-schema.sql', size: '45KB', type: 'sql' }
        ],
        comments: [
          { author: '田中', text: 'API設計書を確認しました。問題なさそうです。', date: '2025-10-25', time: '11:20' },
          { author: '佐藤', text: '認証システムの実装が完了しました。レビューお願いします。', date: '2025-10-28', time: '17:30' }
        ],
        activities: [
          { type: 'progress', message: '進捗を80%に更新', user: '佐藤', date: '2025-10-28', time: '17:45' },
          { type: 'comment', message: 'コメントを追加', user: '佐藤', date: '2025-10-28', time: '17:30' },
          { type: 'attachment', message: 'ファイルを追加: api-documentation.md', user: '佐藤', date: '2025-10-24', time: '09:15' }
        ],
        dependencies: [101],
        relatedTasks: [103]
      },
      {
        id: 103,
        name: 'テスト実装',
        progress: 30,
        status: 'active',
        assignee: '鈴木',
        priority: 'medium',
        blockers: ['バックエンド開発'],
        dueDate: '2025-11-30',
        description: '単体テスト、統合テスト、E2Eテストの実装を行います。テストカバレッジ80%以上を目指します。',
        tags: ['テスト', '品質保証', 'QA'],
        estimatedHours: 60,
        actualHours: 18,
        startDate: '2025-10-20',
        completedDate: null,
        subTasks: [
          { id: 1031, name: 'テスト計画書作成', completed: true },
          { id: 1032, name: '単体テスト実装', completed: false },
          { id: 1033, name: '統合テスト実装', completed: false },
          { id: 1034, name: 'E2Eテスト実装', completed: false }
        ],
        attachments: [
          { name: 'test-plan.xlsx', size: '234KB', type: 'excel' }
        ],
        comments: [
          { author: '鈴木', text: 'バックエンドAPI完成待ちです。', date: '2025-10-27', time: '13:00' }
        ],
        activities: [
          { type: 'blocker', message: 'ブロッカーを追加: バックエンド開発', user: '鈴木', date: '2025-10-27', time: '13:05' },
          { type: 'progress', message: '進捗を30%に更新', user: '鈴木', date: '2025-10-26', time: '16:20' }
        ],
        dependencies: [102],
        relatedTasks: [101, 102]
      },
      {
        id: 104,
        name: 'デザインシステム構築',
        progress: 90,
        status: 'active',
        assignee: '高橋',
        priority: 'medium',
        blockers: [],
        dueDate: '2025-10-31',
        description: '共通コンポーネントとデザインガイドラインの整備',
        tags: ['デザイン', 'UI/UX'],
        estimatedHours: 30,
        actualHours: 27,
        startDate: '2025-10-05',
        completedDate: null,
        subTasks: [
          { id: 1041, name: 'カラーパレット設計', completed: true },
          { id: 1042, name: 'タイポグラフィ設計', completed: true },
          { id: 1043, name: 'コンポーネントライブラリ', completed: false }
        ],
        attachments: [],
        comments: [],
        activities: [],
        dependencies: [],
        relatedTasks: [101]
      }
    ]
  },
  {
    id: 2,
    name: 'マーケティングキャンペーン',
    progress: 45,
    status: 'warning',
    timeline: { start: '2025-10-15', end: '2025-11-30' },
    team: ['山田', '高橋'],
    tasks: [
      {
        id: 201,
        name: 'コンテンツ作成',
        progress: 60,
        status: 'active',
        assignee: '山田',
        priority: 'high',
        blockers: [],
        dueDate: '2025-11-10',
        description: 'ブログ記事、SNS投稿、プレスリリースなどのマーケティングコンテンツを作成します。',
        tags: ['マーケティング', 'コンテンツ', 'ライティング'],
        estimatedHours: 40,
        actualHours: 24,
        startDate: '2025-10-15',
        completedDate: null,
        subTasks: [
          { id: 2011, name: 'コンテンツ戦略立案', completed: true },
          { id: 2012, name: 'ブログ記事執筆（5本）', completed: false },
          { id: 2013, name: 'SNS投稿作成（20本）', completed: false },
          { id: 2014, name: 'プレスリリース作成', completed: false }
        ],
        attachments: [
          { name: 'content-calendar.xlsx', size: '89KB', type: 'excel' },
          { name: 'blog-draft-1.docx', size: '125KB', type: 'word' }
        ],
        comments: [
          { author: '高橋', text: 'コンテンツカレンダー確認しました。順調ですね！', date: '2025-10-22', time: '10:30' }
        ],
        activities: [
          { type: 'progress', message: '進捗を60%に更新', user: '山田', date: '2025-10-28', time: '18:00' },
          { type: 'attachment', message: 'ファイルを追加: blog-draft-1.docx', user: '山田', date: '2025-10-26', time: '14:20' }
        ],
        dependencies: [],
        relatedTasks: [202, 203]
      },
      {
        id: 202,
        name: 'SNS戦略立案',
        progress: 20,
        status: 'blocked',
        assignee: '高橋',
        priority: 'high',
        blockers: ['予算承認待ち'],
        dueDate: '2025-11-05',
        description: 'Instagram、Twitter、LinkedInでの展開戦略を立案します。広告予算の配分も含みます。',
        tags: ['マーケティング', 'SNS', '戦略'],
        estimatedHours: 30,
        actualHours: 6,
        startDate: '2025-10-20',
        completedDate: null,
        subTasks: [
          { id: 2021, name: '競合分析', completed: true },
          { id: 2022, name: 'ターゲット設定', completed: false },
          { id: 2023, name: '予算配分計画', completed: false },
          { id: 2024, name: '運用スケジュール作成', completed: false }
        ],
        attachments: [
          { name: 'competitor-analysis.pptx', size: '3.2MB', type: 'powerpoint' }
        ],
        comments: [
          { author: '高橋', text: '予算承認が遅れています。経理部門に確認中です。', date: '2025-10-28', time: '09:45' },
          { author: '山田', text: '承認され次第、すぐに進められるように準備しておきましょう。', date: '2025-10-28', time: '10:00' }
        ],
        activities: [
          { type: 'blocker', message: 'ブロッカーを追加: 予算承認待ち', user: '高橋', date: '2025-10-28', time: '09:45' },
          { type: 'comment', message: 'コメントを追加', user: '高橋', date: '2025-10-28', time: '09:45' }
        ],
        dependencies: [],
        relatedTasks: [201, 203]
      },
      {
        id: 203,
        name: '効果測定',
        progress: 0,
        status: 'pending',
        assignee: '山田',
        priority: 'low',
        blockers: [],
        dueDate: '2025-11-30',
        description: 'キャンペーンの効果を測定し、ROIを分析します。Google AnalyticsとSNSインサイトを活用します。',
        tags: ['マーケティング', '分析', 'KPI'],
        estimatedHours: 20,
        actualHours: 0,
        startDate: '2025-11-20',
        completedDate: null,
        subTasks: [
          { id: 2031, name: 'KPI設定', completed: false },
          { id: 2032, name: 'トラッキング設定', completed: false },
          { id: 2033, name: 'データ収集', completed: false },
          { id: 2034, name: 'レポート作成', completed: false }
        ],
        attachments: [],
        comments: [],
        activities: [],
        dependencies: [201, 202],
        relatedTasks: [201, 202]
      }
    ]
  }
];
