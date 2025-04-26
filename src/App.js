// src/App.js
// 【useMemo 修正版 - 省略なし完全版】
// generateInitialData 内の科目データ定義の省略を元に戻し、
// useMemo を使って今日の問題リストを計算するように修正。

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // useMemo をインポート, useRefを追加
// lucide-react のインポート
import { Calendar, ChevronLeft, ChevronRight, List, Check, X, AlertTriangle, Info, Search, ChevronsUpDown } from 'lucide-react';
// 他のコンポーネントインポート
import QuestionEditModal from './QuestionEditModal';
import AmbiguousTrendsPage from './AmbiguousTrendsPage';
import RedesignedAllQuestionsView from './RedesignedAllQuestionsView';
import TopNavigation from './components/TopNavigation';
import TodayView from './TodayView'; // TodayView の import はそのまま
import ScheduleView from './ScheduleView';
import SettingsPage from './SettingsPage';
import StatsPage from './StatsPage';
import ReminderNotification from './ReminderNotification';
import EnhancedStatsPage from './EnhancedStatsPage';
import SMEExamPage from './SMEExamPage'; // 中小企業診断士2次試験対策ページをインポート
import ErrorBoundary from './components/ErrorBoundary';
// エラーハンドリング関連のインポート
import { setupGlobalErrorHandlers } from './utils/error-logger';
import { isStorageAvailable, getStorageItem, setStorageItem, studyDataValidator, historyDataValidator } from './utils/storage';
import { NotificationProvider } from './contexts/NotificationContext';
import MainView from './MainView';
import './index.css';
import OfflineIndicator from './components/OfflineIndicator';
import * as indexedDB from './utils/indexedDB';
import { 
  isIndexedDBSupported, 
  getStudyDataWithFallback, 
  getAnswerHistoryWithFallback, 
  saveStudyData, 
  saveAnswerHistory, 
  openDatabase, 
  closeDatabase, 
  cleanupOldAnswerHistory, 
  getDatabaseStats 
} from './utils/indexedDB';
import { createBackup, restoreFromBackup } from './utils/backup-restore';
// 他のコンポーネントインポートの近くに追加
import NotesPage from './NotesPage'; // NotesPageコンポーネントのインポート

// ★★★ 問題データの生成 ★★★
// 問題データを生成する補助関数
const generateQuestions = (prefix, startNum, count) => {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const questionNum = startNum + i;
    const id = `${prefix}${String(questionNum).padStart(3, '0')}`;
    
    questions.push({
      id,
      question: `これは${prefix}科目の問題${questionNum}です。この問題文はサンプルとして自動生成されています。`,
      choices: [
        { id: `${id}-1`, text: '選択肢1' },
        { id: `${id}-2`, text: '選択肢2' },
        { id: `${id}-3`, text: '選択肢3' },
        { id: `${id}-4`, text: '選択肢4' }
      ],
      correctAnswerIndex: Math.floor(Math.random() * 4),
      explanation: `この問題の解説文です。実際のアプリでは、ここに詳しい解説が入ります。`,
      imageUrl: null,
      category: 'サンプル',
      difficulty: Math.floor(Math.random() * 3) + 1,
      tags: ['サンプル', 'テスト'],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });
  }
  
  return questions;
};

// ★★★ 初期データの生成 ★★★
// 初期データを生成する関数 
const generateInitialData = () => {
  console.log("初期データを生成中...");
  
  // 問題ID接頭辞
  const genPrefix = {
    keiei: 'KE',  // 経営管理論
    unei: 'UN',   // 運営管理
    keizai: 'KZ', // 経済学
    system: 'SY', // 経営情報システム
    houmu: 'HM',  // 経営法務
    chusho: 'CS', // 中小企業経営・政策
    kako: 'KK'    // 過去問
  };
  
  // 各科目のサンプル問題を数問ずつ生成
  const subjectsData = [
    {
      id: 'subject-01',
      name: '経営管理論',
      color: '#4f46e5',
      order: 1,
      chapters: [
        {
          id: 'keiei-ch1',
          name: '経営戦略の基礎',
          questions: generateQuestions(genPrefix.keiei, 1, 5)
        },
        {
          id: 'keiei-ch2',
          name: '経営組織論',
          questions: generateQuestions(genPrefix.keiei, 6, 5)
        }
      ]
    },
    {
      id: 'subject-02',
      name: '経済学',
      color: '#ef4444',
      order: 2,
      chapters: [
        {
          id: 'keizai-ch1',
          name: 'ミクロ経済学',
          questions: generateQuestions(genPrefix.keizai, 1, 3)
        },
        {
          id: 'keizai-ch2',
          name: 'マクロ経済学',
          questions: generateQuestions(genPrefix.keizai, 4, 3)
        }
      ]
    },
    {
      id: 'subject-03',
      name: '運営管理',
      color: '#10b981',
      order: 3,
      chapters: [
        {
          id: 'unei-ch1',
          name: '生産管理',
          questions: generateQuestions(genPrefix.unei, 1, 3)
        },
        {
          id: 'unei-ch2',
          name: '品質管理',
          questions: generateQuestions(genPrefix.unei, 4, 3)
        }
      ]
    },
    {
      id: 'subject-04',
      name: '経営情報システム',
      color: '#3b82f6',
      order: 4,
      chapters: [
        {
          id: 'system-ch1',
          name: 'IT基礎',
          questions: generateQuestions(genPrefix.system, 1, 3)
        },
        {
          id: 'system-ch2',
          name: 'システム開発',
          questions: generateQuestions(genPrefix.system, 4, 3)
        }
      ]
    }
  ];
  
  console.log(`初期データ生成完了: ${subjectsData.length}科目`);
  return subjectsData;
};

// ★ 自然順ソート用の比較関数定義 (変更なし) ★
function naturalSortCompare(a, b) { if (a == null && b == null) return 0; if (a == null) return -1; if (b == null) return 1; const ax = [], bx = []; String(a).replace(/(\d+)|(\D+)/g, (_, $1, $2) => { ax.push([$1 || Infinity, $2 || ""]) }); String(b).replace(/(\d+)|(\D+)/g, (_, $1, $2) => { bx.push([$1 || Infinity, $2 || ""]) }); while (ax.length && bx.length) { const an = ax.shift(); const bn = bx.shift(); const nn = (parseInt(an[0]) - parseInt(bn[0])) || an[1].localeCompare(bn[1], undefined, { numeric: true, sensitivity: 'base' }); if (nn) return nn; } return ax.length - bx.length; }

// ★ 正解率計算関数 (変更なし) ★
function calculateCorrectRate(question, isCorrect) { const currentCount = question?.answerCount ?? 0; const validCurrentCount = (typeof currentCount === 'number' && !isNaN(currentCount)) ? currentCount : 0; const currentRate = question?.correctRate ?? 0; const validCurrentRate = (typeof currentRate === 'number' && !isNaN(currentRate)) ? currentRate : 0; if (validCurrentCount === 0) { return isCorrect ? 100 : 0; } const totalCorrectPoints = validCurrentRate * validCurrentCount / 100; const newRate = isCorrect ? ((totalCorrectPoints + 1) / (validCurrentCount + 1)) * 100 : (totalCorrectPoints / (validCurrentCount + 1)) * 100; return Math.round(newRate); }

// 総問題数を計算する関数
const calculateTotalQuestionCount = (subjects) => {
  let total = 0;
  if (Array.isArray(subjects)) {
    subjects.forEach(subject => {
      if (subject?.chapters) {
        subject.chapters.forEach(chapter => {
          if (chapter?.questions) {
            total += chapter.questions.length;
          }
        });
      }
    });
  }
  return total;
};

// ★ その他のユーティリティ関数 ★

// 全問題を取得する関数
const getAllQuestions = (subjectsData) => {
  const allQuestions = [];
  
  if (!Array.isArray(subjectsData)) {
    console.error('getAllQuestions: subjectsDataが配列ではありません', subjectsData);
    return [];
  }
  
  subjectsData.forEach(subject => {
    if (!subject || !Array.isArray(subject.chapters)) {
      return;
    }
    
    subject.chapters.forEach(chapter => {
      if (!chapter || !Array.isArray(chapter.questions)) {
        return;
      }
      
      chapter.questions.forEach(question => {
        if (question) {
          // 各問題に科目名と章名の情報を追加
          allQuestions.push({
            ...question,
            subjectId: subject.id,
            subjectName: subject.name || subject.subjectName || '未分類',
            chapterId: chapter.id,
            chapterName: chapter.name || chapter.chapterName || '未分類'
          });
        }
      });
    });
  });
  
  console.log(`getAllQuestions: 全部で${allQuestions.length}問の問題を取得しました`);
  return allQuestions;
};

// ★ メインビュー切り替え ★
function App() {
  useEffect(() => {
    document.title = "知識整理アプリ";
  }, []);

  // データの状態
  const [subjects, setSubjects] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
  
  // forceUpdateステートを最初に初期化（ブール値として定義）
  const [forceUpdate, setForceUpdate] = useState(false);
  
  // 現在のタブ
  const [currentTab, setCurrentTab] = useState(
    localStorage.getItem('currentTab') || 'today'
  );
  
  // setActiveTabはsetCurrentTabのエイリアスとして定義
  const setActiveTab = setCurrentTab;
  
  // UIステート
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const [daysSinceLastExport, setDaysSinceLastExport] = useState(null);
  const [hasStorageError, setHasStorageError] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showAnswered, setShowAnswered] = useState(false);
  const [memoryWarningShown, setMemoryWarningShown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // グローバルエラーハンドラーの設定
  useEffect(() => {
    setupGlobalErrorHandlers();
    
    // ローカルストレージの可用性チェック
    if (!isStorageAvailable()) {
      setHasStorageError(true);
    }
  }, []);
  
  // 最終データ更新時間の参照を保持
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_THROTTLE_MS = 500; // 500ミリ秒のスロットリング
  
  // データ再読み込み関数 - 依存配列からsetForceUpdateを削除
  const refreshData = useCallback(async () => {
    // データロードの頻度を制限
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < REFRESH_THROTTLE_MS) {
      console.log('データ読み込みの頻度を制限しています...');
      return;
    }
    lastRefreshTimeRef.current = now;

    console.log("データを強制的に再読み込みしています...");
    
    try {
      // 同期的にデータを取得
      const studyData = await getStudyDataWithFallback();
      const history = await getAnswerHistoryWithFallback();
      
      // データをセット
      console.log(`データ再読み込み成功: ${studyData?.length || 0}個の科目`);
      
      if (studyData) {
        setSubjects(studyData);
      }
      
      if (history) {
        setAnswerHistory(history);
      }
      
    } catch (error) {
      console.error("データ再読み込み中にエラーが発生しました:", error);
    }
  }, [setSubjects, setAnswerHistory]); // setForceUpdateを依存配列から削除
  
  // タブ切り替え時にデータをリフレッシュ
  useEffect(() => {
    // アクティブタブが変更されたらデータを最新化
    refreshData();
  }, [currentTab, refreshData]);
  
  // ★★★ 初期化 ★★★
  useEffect(() => {
    console.log("アプリ初期化を開始します...");
    
    // 初期化試行
    const initialize = async () => {
      try {
        // まずIndexedDBから読み込みを試みる
        const data = await getStudyDataWithFallback().catch(() => null);
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`データベースから${data.length}件の科目データを読み込みました`);
          setSubjects(data);
        } else {
          // データベースから読み込めなかった場合、初期データを生成
          console.log("保存されたデータが見つからないため、初期データを生成します");
          const initialData = generateInitialData();
          console.log(`初期データを生成しました: ${initialData.length}科目`);
          
          if (initialData && Array.isArray(initialData) && initialData.length > 0) {
            setSubjects(initialData);
            
            // 生成したデータを保存
            try {
              await saveStudyData(initialData);
              console.log("初期データをデータベースに保存しました");
            } catch (error) {
              console.error("データベースへの初期データ保存に失敗:", error);
              setStorageItem('studyData', initialData);
              console.log("初期データをLocalStorageに保存しました（フォールバック）");
            }
          } else {
            console.error("初期データの生成に失敗しました");
            // フォールバックとして空の配列を設定
            setSubjects([]);
            alert("データの初期化に失敗しました。ページを再読み込みしてください。");
          }
        }
        
        // 解答履歴も同様に読み込む
        const historyData = await getAnswerHistoryWithFallback().catch(() => null);
        
        if (historyData && Array.isArray(historyData)) {
          console.log(`データベースから${historyData.length}件の解答履歴を読み込みました`);
          setAnswerHistory(historyData);
        } else {
          console.log("解答履歴データが見つからないため、新規作成します");
          setAnswerHistory([]);
        }
      } catch (error) {
        console.error("初期化中にエラーが発生しました:", error);
        setHasStorageError(true);
        
        // バックアップとして初期データを生成
        try {
          const fallbackData = generateInitialData();
          setSubjects(fallbackData);
          alert("データの読み込みに問題が発生しましたが、初期データを生成しました。");
        } catch (e) {
          console.error("フォールバックデータ生成にも失敗:", e);
          setSubjects([]);
          alert("データの初期化に失敗しました。ページを再読み込みしてください。");
        }
      }
    };
    
    initialize();
    
    // データベース初期化
    const initializeDatabase = async () => {
      try {
        await openDatabase();
        console.log('データベース接続を確立しました');
        
        // データベース使用状況を確認
        const stats = await getDatabaseStats();
        console.log('データベース統計:', stats);
      } catch (error) {
        console.error('データベース初期化エラー:', error);
      }
    };
    
    initializeDatabase();
    
    // アプリ終了時にデータベース接続を閉じる
    return () => {
      closeDatabase();
    };
  }, []);

  // ★ データ保存処理 (IndexedDB対応) ★
  useEffect(() => {
    // ストレージが使用不可の場合はスキップ
    if (hasStorageError || !isStorageAvailable()) {
      return;
    }
    
    // 学習データが有効な場合のみ保存処理
    if (Array.isArray(subjects) && subjects.length > 0) {
      try { 
        // IndexedDBに保存（優先）
        saveStudyData(subjects)
          .then(() => {
            console.log("学習データをIndexedDBに保存しました");
          })
          .catch(error => {
            console.error("IndexedDBへの学習データ保存に失敗:", error);
            // フォールバックとしてLocalStorageに保存
            const dataToSave = JSON.stringify(subjects, (key, value) => { 
              if (key === 'lastAnswered' && value instanceof Date) { 
                return value.toISOString(); 
              } 
              return value; 
            });
            setStorageItem('studyData', subjects);
            console.log("学習データをLocalStorageに保存しました（フォールバック）");
          });
      } catch (e) { 
        console.error("学習データ保存失敗:", e); 
      }
    }
    
    // 履歴データが有効な場合のみ保存処理
    if (Array.isArray(answerHistory)) {
      try { 
        // IndexedDBに保存（優先）
        saveAnswerHistory(answerHistory)
          .then(() => {
            console.log("解答履歴をIndexedDBに保存しました");
          })
          .catch(error => {
            console.error("IndexedDBへの解答履歴保存に失敗:", error);
            // フォールバックとしてLocalStorageに保存
            setStorageItem('studyHistory', answerHistory);
            console.log("解答履歴をLocalStorageに保存しました（フォールバック）");
          });
      } catch (e) { 
        console.error("解答履歴保存失敗:", e); 
      }
    }
  }, [subjects, answerHistory, hasStorageError]);

useEffect(() => {
  // エクスポートリマインダーチェック
  const checkExportReminder = () => {
    const lastExportTimestamp = localStorage.getItem('lastExportTimestamp');
    const reminderDismissedTimestamp = localStorage.getItem('reminderDismissedTimestamp');
    
    const now = new Date().getTime();
    const dismissedTime = reminderDismissedTimestamp ? parseInt(reminderDismissedTimestamp, 10) : 0;
    const dismissedDaysAgo = Math.floor((now - dismissedTime) / (1000 * 60 * 60 * 24));
    
    // 通知を閉じてから3日以内は表示しない
    if (dismissedDaysAgo < 3) {
      return;
    }
    
    if (!lastExportTimestamp) {
      // 一度もエクスポートしていない場合
      setDaysSinceLastExport(14); // 14日に固定
      setShowExportReminder(true);
    } else {
      const lastExportTime = parseInt(lastExportTimestamp, 10);
      const daysSinceExport = Math.floor((now - lastExportTime) / (1000 * 60 * 60 * 24));
      
      // 14日以上経過していたらリマインダー表示
      if (daysSinceExport >= 14) {
        setDaysSinceLastExport(14); // 14日に固定
        setShowExportReminder(true);
      }
    }
  };
  
  checkExportReminder();
}, []);
    
const todayQuestionsList = useMemo(() => {
  const startTime = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const questions = [];

  // データがない場合は早期リターン
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return questions;
  }

  try {
    // 計算量を削減した処理
    let questionCount = 0;
    
    subjects.forEach((subject) => {
      if (!subject || !Array.isArray(subject.chapters)) return;
      
      const currentSubjectName = subject.subjectName || subject.name || '?';
      
      subject.chapters.forEach((chapter) => {
        if (!chapter || !Array.isArray(chapter.questions)) return;
        
        const currentChapterName = chapter.chapterName || chapter.name || '?';
        
        // 最大500問までに制限（パフォーマンス向上のため）
        if (questionCount >= 500) return;
        
        chapter.questions.forEach(question => {
          if (!question?.nextDate) return;
          try {
            const nextDate = new Date(question.nextDate);
            if (isNaN(nextDate.getTime())) return;
            nextDate.setHours(0, 0, 0, 0);
            if (nextDate.getTime() === todayTime) {
              // 無駄なログを出力しない
              questions.push({
                ...question,
                subjectName: currentSubjectName,
                chapterName: currentChapterName,
                name: question.name || question.id
              });
              questionCount++;
            }
          } catch (e) { 
            // エラーは静かに無視
          }
        });
      });
    });
    
    // デバッグログを最小限にする
    const endTime = Date.now();
    if (endTime - startTime > 100) { // 処理に100ms以上かかった場合のみ記録
      console.log(`todayQuestionsList計算: ${questions.length}問を${endTime - startTime}msで処理`);
    }
  } catch (e) {
    console.error('todayQuestionsList計算エラー:', e);
  }
  
  // 問題IDでソート
  return questions.sort((a, b) => (a.id).localeCompare(b.id, undefined, { numeric: true }));
}, [subjects, currentDate]); // 日付が変わった時だけ再計算

const getQuestionsForDate = (date) => {
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    console.error("無効な日付が指定されました:", date);
    return [];
  }
  
  // 日付を00:00:00に設定して比較
  targetDate.setHours(0, 0, 0, 0);
  const targetTime = targetDate.getTime();
  const questions = [];
  
  // データがない場合は空の配列を返す
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return questions;
  }

  // 全科目をループ
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    if (!subject || !Array.isArray(subject.chapters)) continue;
    
    // 両方のプロパティ名をサポート
    const currentSubjectName = subject.subjectName || subject.name || '未分類';

    // 各章をループ
    for (let j = 0; j < subject.chapters.length; j++) {
      const chapter = subject.chapters[j];
      if (!chapter || !Array.isArray(chapter.questions)) continue;
      
      // 両方のプロパティ名をサポート
      const currentChapterName = chapter.chapterName || chapter.name || '未分類';

      // 各問題をループ
      for (let k = 0; k < chapter.questions.length; k++) {
        const question = chapter.questions[k];
        if (!question || !question.nextDate) continue;
        
        try {
          // 日付を正規化
          let nextDate;
          
          if (typeof question.nextDate === 'string') {
            if (question.nextDate.includes('T')) {
              // ISO形式の場合
              nextDate = new Date(question.nextDate);
            } else {
              // 'YYYY-MM-DD'形式の場合
              const [year, month, day] = question.nextDate.split(/[-/]/);
              nextDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          } else if (question.nextDate instanceof Date) {
            nextDate = new Date(question.nextDate.getTime());
          } else {
            continue;
          }
          
          // 日付が無効な場合はスキップ
          if (isNaN(nextDate.getTime())) {
            continue;
          }
          
          // 時間部分を00:00:00に設定して比較
          nextDate.setHours(0, 0, 0, 0);
          
          // ターゲット日付と一致する場合
          if (nextDate.getTime() === targetTime) {
            // 結果に追加
            questions.push({ 
              ...question, 
              subjectName: currentSubjectName, 
              chapterName: currentChapterName,
              subject: currentSubjectName,
              chapter: currentChapterName,
              // 下位互換性のために name も設定
              name: question.name || question.id
            });
          }
        } catch(e) {
          // エラーログを簡潔に
          console.error(`Error processing question: ${e.message}`);
        }
      }
    }
  }
  
  // 結果をソートして返す
  return questions.sort((a, b) => naturalSortCompare(a.id, b.id));
};

  // ★★★ 回答記録 ★★★
  // 問題への回答を記録する関数
  const recordAnswer = (questionId, isCorrect, understanding = '理解○') => {
    console.log(`回答記録: ID=${questionId}, 正解=${isCorrect}, 理解度=${understanding}`);
    
    // 回答履歴に追加
    const timestamp = new Date().toISOString();
    const historyItem = {
      id: `answer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      questionId,
      isCorrect,
      understanding,
      timestamp
    };
    
    setAnswerHistory(prev => {
      // 50件を超える場合は古いものから削除
      const newHistory = [historyItem, ...prev];
      if (newHistory.length > 1000) {
        return newHistory.slice(0, 1000);
      }
      return newHistory;
    });
    
    // 科目データを更新
    setSubjects(prevSubjects => {
      if (!prevSubjects || !Array.isArray(prevSubjects)) {
        console.error('科目データが無効です');
        return prevSubjects;
      }
      
      const today = new Date();
      const nextDate = new Date(today);
      let newInterval = '1日';
      let previousUnderstanding = '';
      
      // 問題の理解度に応じて次の復習日を決定
      const newSubjects = prevSubjects.map(subject => {
        if (!subject || !Array.isArray(subject.chapters)) return subject;
        
        const newChapters = subject.chapters.map(chapter => {
          if (!chapter || !Array.isArray(chapter.questions)) return chapter;
          
          const newQuestions = chapter.questions.map(question => {
            if (!question || question.id !== questionId) return question;
            
            // 現在の理解度を保存
            previousUnderstanding = question.understanding || '未学習';
            
            // 問題のステータスを更新
            if (!isCorrect) {
              // 不正解の場合
              nextDate.setDate(today.getDate() + 1);
              newInterval = '1日';
              
              return {
                ...question,
                lastAnswered: timestamp,
                understanding: '不正解×',
                interval: newInterval,
                nextDate: nextDate.toISOString()
              };
            } else if (isCorrect && understanding.startsWith('曖昧△')) {
              // 曖昧理解の場合
              const reason = understanding.split(':')[1] || '';
              let daysToAdd = 3;
              
              if (reason === '偶然正解した') {
                daysToAdd = 2;
                newInterval = '2日';
              } else if (reason === '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった') {
                daysToAdd = 3;
                newInterval = '3日';
              } else if (reason === '合っていたが、別の理由を思い浮かべていた') {
                daysToAdd = 3;
                newInterval = '3日';
              } else if (reason === '自信はなかったけど、これかなとは思っていた') {
                daysToAdd = 4;
                newInterval = '4日';
              } else if (reason === '問題を覚えてしまっていた') {
                daysToAdd = 5;
                newInterval = '5日';
              } else if (reason === 'その他') {
                daysToAdd = 4;
                newInterval = '4日';
              }
              
              nextDate.setDate(today.getDate() + daysToAdd);
              
              return {
                ...question,
                lastAnswered: timestamp,
                understanding,
                interval: newInterval,
                nextDate: nextDate.toISOString()
              };
            } else if (isCorrect && understanding === '理解○') {
              // 完全理解の場合
              const isFirstCorrect = question.understanding === '未学習';
              const baseInterval = isFirstCorrect ? '1日' : (previousUnderstanding?.startsWith('曖昧△') ? '14日' : (question.interval || '1日'));
              
              switch(baseInterval) {
                case '1日':
                  nextDate.setDate(today.getDate() + 3);
                  newInterval = '3日';
                  break;
                case '3日':
                  nextDate.setDate(today.getDate() + 7);
                  newInterval = '7日';
                  break;
                case '7日':
                  nextDate.setDate(today.getDate() + 14);
                  newInterval = '14日';
                  break;
                case '14日':
                  nextDate.setMonth(today.getMonth() + 1);
                  newInterval = '1ヶ月';
                  break;
                case '1ヶ月':
                  nextDate.setMonth(today.getMonth() + 3);
                  newInterval = '3ヶ月';
                  break;
                default:
                  nextDate.setMonth(today.getMonth() + 6);
                  newInterval = '6ヶ月';
              }
              
              return {
                ...question,
                lastAnswered: timestamp,
                understanding,
                interval: newInterval,
                nextDate: nextDate.toISOString()
              };
            }
            
            // デフォルト（変更なし）
            return question;
          });
          
          return { ...chapter, questions: newQuestions };
        });
        
        return { ...subject, chapters: newChapters };
      });
      
      return newSubjects;
    });
    
    // データをストレージに保存
    saveStudyData(subjects); // 修正: subjects →　subjects
    saveAnswerHistory(answerHistory); // 修正: answerHistory → answerHistory
  };

  // ★ コメント保存用の関数 (変更なし) ★
  const saveComment = (questionId, commentText) => { setSubjects(prevSubjects => { if (!Array.isArray(prevSubjects)) return []; return prevSubjects.map(subject => { if (!subject?.chapters) return subject; return { ...subject, id: subject.id, name: subject.name, chapters: subject.chapters.map(chapter => { if (!chapter?.questions) return chapter; return { ...chapter, id: chapter.id, name: chapter.name, questions: chapter.questions.map(q => { if (q?.id === questionId) { return { ...q, comment: commentText }; } return q; })}; })}; }); }); };

  // ★ DnD 日付変更 (修正) ★
  const handleQuestionDateChange = (questionId, newDate) => { 
    console.log("日付変更: ", questionId, "新しい日付:", newDate);
    
    setSubjects(prevSubjects => { 
      if (!Array.isArray(prevSubjects)) return []; 
      
      // 日付の検証と正規化
      let targetDateString = null;
      try {
        const targetDate = new Date(newDate); 
        if (isNaN(targetDate.getTime())) { 
          console.error("無効日付:", newDate); 
          return prevSubjects; 
        } 
        targetDate.setHours(0, 0, 0, 0); 
        targetDateString = targetDate.toISOString();
        console.log("変換後の日付文字列:", targetDateString);
      } catch (e) {
        console.error("日付処理エラー:", e);
        return prevSubjects;
      }
      
      // 問題更新
      const newSubjects = prevSubjects.map(subject => { 
        if (!subject?.chapters) return subject; 
        
        return { 
          ...subject, 
          id: subject.id, 
          name: subject.name, 
          chapters: subject.chapters.map(chapter => { 
            if (!chapter?.questions) return chapter; 
            
            return { 
              ...chapter, 
              id: chapter.id, 
              name: chapter.name, 
              questions: chapter.questions.map(q => { 
                if (q?.id === questionId) { 
                  console.log("問題を更新:", q.id, "新しい日付:", targetDateString);
                  return { ...q, nextDate: targetDateString }; 
                } 
                return q; 
              }) 
            }; 
          }) 
        }; 
      }); 
      
      console.log("日付変更完了");
      
      // タブを切り替えて戻ってきたときに最新のデータが表示されるよう、
      // LocalStorageとIndexedDBを即座に更新
      try {
        // IndexedDBに保存（優先）
        saveStudyData(newSubjects).catch(error => {
          console.error("IndexedDBへの学習データ保存に失敗:", error);
          // フォールバックとしてLocalStorageに保存
          setStorageItem('studyData', newSubjects);
        });
      } catch (e) { 
        console.error("学習データ保存失敗:", e); 
      }
      
      return newSubjects; 
    });
  };

  // 日付変換をシンプルにする関数
  const simplifyDateFormat = (dateString) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return null;
      
      // YYYY-MM-DD形式の文字列を返す
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error("日付変換エラー:", e, dateString);
      return null;
    }
  };

  // 更新された保存関数
  const saveQuestionEdit = (questionData) => { 
    console.log("単純化した編集保存処理を実行します"); 
    
    // バックアップとして単純な文字列形式で直接保存（オリジナルのデータ）
    localStorage.setItem('debug_originalData', JSON.stringify(questionData));
    
    setSubjects(prevSubjects => { 
      if (!Array.isArray(prevSubjects)) return []; 
      
      // ディープコピーして新しい参照を作成
      const newSubjects = JSON.parse(JSON.stringify(prevSubjects));
      let found = false;
      
      // 対象の問題を見つけて直接更新
      for (const subject of newSubjects) {
        if (!subject?.chapters) continue;
        
        for (const chapter of subject.chapters) {
          if (!chapter?.questions) continue;
          
          for (let i = 0; i < chapter.questions.length; i++) {
            if (chapter.questions[i]?.id === questionData.id) {
              // 日付の簡易変換（YYYY-MM-DD形式で保存）
              let finalData = {...questionData};
              
                  if (questionData.nextDate) {
                    try {
                  // 日付をYYYY-MM-DD形式のプレーンな文字列に変換
                  const dateObj = new Date(questionData.nextDate);
                  if (!isNaN(dateObj.getTime())) {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    finalData.nextDate = `${year}-${month}-${day}`;
                      }
                    } catch (e) {
                  console.error("日付処理エラー:", e);
                    }
                  }
                  
              // 更新
              chapter.questions[i] = finalData;
              found = true;
              console.log(`問題ID:${questionData.id}を更新しました。次回日付:${finalData.nextDate}`);
              break;
                    }
          }
          if (found) break;
                  }
        if (found) break;
      }
      
      // 即時保存
      try {
        // LocalStorageに保存
        localStorage.setItem('studyData', JSON.stringify(newSubjects));
        console.log("LocalStorageに保存しました");
      
        // IndexedDBにも保存
      try {
          saveStudyData(newSubjects);
          console.log("IndexedDBへの保存を開始しました");
        } catch (dbError) {
          console.error("IndexedDB保存エラー:", dbError);
        }
      } catch (e) { 
        console.error("保存エラー:", e);
      }
      
      return newSubjects; 
    }); 
    
    setEditingQuestion(null); 
  };

  // ★ 一括編集用の保存関数（シンプル版） ★
  const saveBulkEditItems = (itemsToUpdate, specificQuestionIds = null) => { 
    console.log("シンプル化した一括編集処理を実行します"); 
    
    // バックアップ
    localStorage.setItem('debug_bulkEdit', JSON.stringify({
      items: itemsToUpdate,
      questionIds: specificQuestionIds || selectedQuestions
    }));
    
    // 個別の問題IDリストが指定されていなければ、選択された問題IDリストを使用
    const targetQuestionIds = specificQuestionIds || selectedQuestions;
    
    if (!targetQuestionIds || targetQuestionIds.length === 0) { 
      console.warn('一括編集する問題が選択されていません'); 
      return; 
    } 
    
    if (!itemsToUpdate || Object.keys(itemsToUpdate).length === 0) { 
      console.warn('更新データが空です');
      return; 
    } 
    
    // 日付を簡易フォーマットに変換
    const processedItems = {...itemsToUpdate};
    if (itemsToUpdate.nextDate) {
      try {
        // 日付をYYYY-MM-DD形式のプレーンな文字列に変換
        const dateObj = new Date(itemsToUpdate.nextDate);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          processedItems.nextDate = `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error("日付処理エラー:", e);
      }
    }
    
    setSubjects(prevSubjects => { 
      if (!Array.isArray(prevSubjects)) return []; 
      
      // ディープコピー
      const newSubjects = JSON.parse(JSON.stringify(prevSubjects));
      let updatedCount = 0;
      
      // 全科目・章を探索して対象の問題を更新
      for (const subject of newSubjects) {
        if (!subject?.chapters) continue;
        
        for (const chapter of subject.chapters) {
          if (!chapter?.questions) continue;
          
          for (let i = 0; i < chapter.questions.length; i++) {
            // ターゲットの問題IDに含まれるか確認
            if (chapter.questions[i] && targetQuestionIds.includes(chapter.questions[i].id)) {
              // 更新対象のプロパティだけを上書き
              for (const key in processedItems) {
                if (Object.hasOwnProperty.call(processedItems, key)) {
                  chapter.questions[i][key] = processedItems[key];
                }
              }
              updatedCount++; 
            }
          }
        }
      }
      
      console.log(`${updatedCount}件の問題を一括更新しました`);
      
      // データを保存
      try {
        localStorage.setItem('studyData', JSON.stringify(newSubjects));
        console.log("LocalStorageに保存しました");
      } catch (e) { 
        console.error("保存エラー:", e);
      }
      
      return newSubjects; 
    }); 
    
    // 選択をリセット（一括編集後）
    if (!specificQuestionIds) {
      setSelectedQuestions([]);
      setBulkEditMode(false);
    }
  };

  // ★ 古い一括編集保存 (修正) ★
  const saveBulkEdit = (date) => { 
    console.log("一括編集 saveBulkEdit 呼び出し:", date); 
    
    // 日付の検証と正規化
    try {
      const targetDate = new Date(date); 
      if (isNaN(targetDate.getTime())) { 
        console.error("無効日付:", date); 
        return; 
      } 
      targetDate.setHours(0, 0, 0, 0); 
      
      // 新しい一括編集関数を呼び出し
      saveBulkEditItems({ nextDate: targetDate }); 
    } catch (e) {
      console.error("一括編集日付処理エラー:", e);
    }
  };

  // ★ 一括編集 選択切り替え (変更なし) ★
  const toggleQuestionSelection = (questionId) => { setSelectedQuestions(prev => { if (prev.includes(questionId)) { return prev.filter(id => id !== questionId); } else { return [...prev, questionId]; } }); };

  // ★★★ 日付フォーマット ★★★
  // 日付を「YYYY/MM/DD」形式にフォーマットする関数
  const formatDate = (date) => { 
    if (!date) return '----/--/--'; 
    
    try { 
      const d = (date instanceof Date) ? date : new Date(date); 
      if (isNaN(d.getTime())) return '無効日付'; 
      
      const year = d.getFullYear(); 
      const month = d.getMonth() + 1; 
      const day = d.getDate(); 
      
      return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`; 
    } catch(e) { 
      console.error("formatDateエラー:", e, date); 
      return 'エラー'; 
    } 
  };

  // ★★★ 完全リセット関数 (既存) ★
  const resetAllData = () => {
    console.log("全学習データのリセットを実行します...");
    if (window.confirm("本当にすべての学習データ（解答履歴含む）をリセットしますか？\nこの操作は元に戻せません。")) {
      try {
        // IndexedDBのデータをクリア
        indexedDB.clearAllData()
          .then(() => {
            console.log("IndexedDBのデータを削除しました。");
            // LocalStorageも削除
            localStorage.removeItem('studyData');
            localStorage.removeItem('studyHistory');
            console.log("LocalStorageのデータも削除しました。");
            
            alert("学習データをリセットしました。ページをリロードして初期データを再生成します。");
            window.location.reload();
          })
          .catch(error => {
            console.error("IndexedDBデータのリセット中にエラーが発生しました:", error);
            
            // フォールバック: LocalStorage削除を試みる
            localStorage.removeItem('studyData');
            localStorage.removeItem('studyHistory');
            console.log("LocalStorageのデータを削除しました。");
            
            alert("データをリセットしました。ページをリロードして初期データを再生成します。");
            window.location.reload();
          });
      } catch (error) {
        console.error("データリセット中にエラーが発生しました:", error);
        alert("データのリセット中にエラーが発生しました。");
      }
    } else {
      console.log("データリセットはキャンセルされました。");
    }
  };

  // ★★★ 回答状況のみリセット関数 (新規追加) ★★★
  const resetAnswerStatusOnly = () => {
    console.log("回答状況のみリセットを実行します...");
    if (window.confirm("問題リストを維持したまま、全ての回答状況（正解率・理解度・次回解答日など）をリセットしますか？\nこの操作は元に戻せません。")) {
      try {
        // 解答履歴を削除
        localStorage.removeItem('studyHistory');
        setAnswerHistory([]);
        
        // 問題の回答状況のみリセット
        setSubjects(prevSubjects => {
          const resetSubjects = prevSubjects.map(subject => ({
            ...subject,
            chapters: subject.chapters.map(chapter => ({
              ...chapter,
              questions: chapter.questions.map(question => ({
                ...question,
                answerCount: 0,
                correctRate: 0,
                understanding: '理解○',
                lastAnswered: null,
                nextDate: null,
                previousUnderstanding: null,
                // comment はリセットしない (コメントは維持)
              }))
            }))
          }));
          
          // LocalStorageも更新
          try {
            localStorage.setItem('studyData', JSON.stringify(resetSubjects));
          } catch (e) {
            console.error("リセット後のデータ保存に失敗:", e);
          }
          
          return resetSubjects;
        });
        
        alert("回答状況をリセットしました。問題リストは維持されています。");
      } catch (error) {
        console.error("回答状況リセット中にエラーが発生しました:", error);
        alert("回答状況のリセット中にエラーが発生しました。");
      }
    } else {
      console.log("回答状況リセットはキャンセルされました。");
    }
  };

const handleDataImport = (importedData) => {
  console.log("インポートデータ処理関数が呼ばれました:", importedData);
  try {
    // データの基本検証
    if (!importedData || typeof importedData !== 'object') {
      console.error("無効なインポートデータ形式です");
      return false;
    }
    
    // subjects のインポート（存在するなら）
    if (Array.isArray(importedData.subjects)) {
      // 互換性のためのデータ修正を適用
      const processedSubjects = importedData.subjects.map(subject => {
        // プロパティ名の互換性確保
        if (subject.name && !subject.subjectName) subject.subjectName = subject.name;
        if (subject.subjectName && !subject.name) subject.name = subject.subjectName;
        
        // chapters に同様の処理を適用
        if (Array.isArray(subject.chapters)) {
          subject.chapters = subject.chapters.map(chapter => {
            if (chapter.name && !chapter.chapterName) chapter.chapterName = chapter.name;
            if (chapter.chapterName && !chapter.name) chapter.name = chapter.chapterName;
            
            // questions処理
            if (Array.isArray(chapter.questions)) {
              chapter.questions = chapter.questions.map(q => {
                // 日付形式の修正（String → Date）
                if (q.lastAnswered && !(q.lastAnswered instanceof Date)) {
                  const parsedDate = new Date(q.lastAnswered);
                  q.lastAnswered = !isNaN(parsedDate) ? parsedDate : null;
                }
                // 理解度、コメントの初期値設定
                if (typeof q.understanding === 'undefined') q.understanding = '理解○';
                if (typeof q.comment === 'undefined') q.comment = '';
                return q;
              });
            }
            return chapter;
          });
        }
        return subject;
      });
      
      // ステート更新
      setSubjects(processedSubjects);
      console.log("科目データを更新しました:", processedSubjects.length, "件");
    } else {
      console.warn("インポートデータに科目情報がありません");
    }
    
    // answerHistory のインポート（存在するなら）
    if (Array.isArray(importedData.answerHistory)) {
      setAnswerHistory(importedData.answerHistory);
      console.log("解答履歴を更新しました:", importedData.answerHistory.length, "件");
    } else {
      console.warn("インポートデータに解答履歴がありません");
    }
    
    return true; // インポート成功
  } catch (error) {
    console.error("データインポート処理中にエラー:", error);
    return false; // インポート失敗
　}
};

// リマインダー関連のハンドラ関数（App関数内の適切な位置に追加）
const handleDismissReminder = () => {
  localStorage.setItem('reminderDismissedTimestamp', new Date().getTime().toString());
  setShowExportReminder(false);
};

const handleGoToSettings = () => {
  setActiveTab('settings');
  setShowExportReminder(false);
};

// ★ エクスポート処理関数 ★
const handleDataExport = () => {
  console.log("データエクスポート処理を開始します...");
  try {
    // エクスポートデータの作成
    const exportData = {
      studyData: subjects,
      studyHistory: answerHistory,
      exportDate: new Date().toISOString(),
      version: "2.0.0"
    };
    
    // JSONに変換（Dateオブジェクトをシリアライズする特殊処理）
    const jsonData = JSON.stringify(exportData, (key, value) => {
      if (value instanceof Date) {
        return { 
          __type: "Date", 
          iso: value.toISOString() 
        };
      }
      return value;
    }, 2);
    
    // Blobの作成とダウンロード
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // エクスポートファイル名（日付入り）
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    a.download = `study-scheduler-export-${dateStr}.json`;
    
    // ダウンロード実行
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // エクスポート日時を保存
    localStorage.setItem('lastExportTimestamp', new Date().getTime().toString());
    
    console.log("データのエクスポートが完了しました");
    alert("学習データをエクスポートしました。");
    return true; // エクスポート成功
  } catch (error) {
    console.error("データエクスポート処理中にエラー:", error);
    alert("エクスポート中にエラーが発生しました：" + error.message);
    return false; // エクスポート失敗
  }
};

// 新規問題を追加する関数
const addQuestion = (newQuestion) => {
  setSubjects(prevSubjects => {
    const updatedSubjects = [...prevSubjects];
    let targetSubject;
    let targetChapter;
    
    // 新規科目の処理
    if (newQuestion.newSubject && newQuestion.newSubject.isNew) {
      // 新しい科目IDを生成（既存の最大ID + 1）
      const maxSubjectId = Math.max(...updatedSubjects.map(subject => Number(subject.id) || 0));
      const newSubjectId = maxSubjectId + 1;
      
      // 新しい科目オブジェクトを作成
      const newSubjectObj = {
        id: newSubjectId,
        subjectId: newSubjectId,
        subjectName: newQuestion.newSubject.name,
        name: newQuestion.newSubject.name,
        chapters: []
      };
      
      updatedSubjects.push(newSubjectObj);
      targetSubject = newSubjectObj;
      
      // 新規科目用の章も追加する必要がある
      const newChapterId = 1; // 新規科目の場合は章IDを1から始める
      const newChapterObj = {
        id: newChapterId,
        chapterId: newChapterId,
        chapterName: "未分類",
        name: "未分類",
        questions: []
      };
      
      targetSubject.chapters.push(newChapterObj);
      targetChapter = newChapterObj;
    } else {
      // 既存の科目から対象を検索
      targetSubject = updatedSubjects.find(s => s.id.toString() === newQuestion.subjectId.toString());
      
      if (!targetSubject) {
        console.error("対象の科目が見つかりません");
        return prevSubjects;
      }
    }
    
    // 新規章の処理
    if (newQuestion.newChapter && newQuestion.newChapter.isNew) {
      // 新しい章IDを生成（対象科目内の既存の最大ID + 1）
      const maxChapterId = Math.max(...targetSubject.chapters.map(chapter => Number(chapter.id) || 0), 0);
      const newChapterId = maxChapterId + 1;
      
      // 新しい章オブジェクトを作成
      const newChapterObj = {
        id: newChapterId,
        chapterId: newChapterId,
        chapterName: newQuestion.newChapter.name,
        name: newQuestion.newChapter.name,
        questions: []
      };
      
      targetSubject.chapters.push(newChapterObj);
      targetChapter = newChapterObj;
    } else if (!targetChapter) {
      // 既存の章から対象を検索
      targetChapter = targetSubject.chapters.find(c => c.id.toString() === newQuestion.chapterId.toString());
      
      if (!targetChapter) {
        console.error("対象の章が見つかりません");
        return prevSubjects;
      }
    }
    
    // 新規問題オブジェクトを作成
    const questionObj = {
      id: newQuestion.id,
      number: newQuestion.number,
      understanding: newQuestion.understanding,
      nextDate: newQuestion.nextDate,
      comment: newQuestion.comment,
      correctRate: 0,
      answerCount: 0,
      lastAnswered: null,
      history: []
    };
    
    // 章に問題を追加
    targetChapter.questions.push(questionObj);
    
    // トースト通知表示（将来的に実装）
    console.log(`問題 ${newQuestion.id} を追加しました`);
    
    return updatedSubjects;
  });
};

// ★ バックアップ処理関数 ★
const handleBackupData = async () => {
  console.log("バックアップ処理を開始します...");
  try {
    await createBackup();
    return true; // バックアップ成功
  } catch (error) {
    console.error("バックアップ処理中にエラー:", error);
    alert("バックアップ中にエラーが発生しました：" + error.message);
    return false; // バックアップ失敗
  }
};

// ★ 復元処理関数 ★
const handleRestoreData = async (backupData) => {
  console.log("データ復元処理を開始します...");
  
  // 念のため確認ダイアログを表示
  if (!window.confirm("バックアップからデータを復元しますか？\n現在のデータは上書きされます。")) {
    return false;
  }
  
  try {
    await restoreFromBackup(backupData);
    
    // UI状態を更新するためにデータを再読み込み
    const subjects = await indexedDB.getStudyDataWithFallback();
    const answerHistory = await indexedDB.getAnswerHistoryWithFallback();
    
    setSubjects(subjects);
    setAnswerHistory(answerHistory);
    
    alert("データの復元が完了しました。アプリを再読み込みします。");
    window.location.reload();
    
    return true; // 復元成功
  } catch (error) {
    console.error("データ復元処理中にエラー:", error);
    alert("復元中にエラーが発生しました：" + error.message);
    return false; // 復元失敗
  }
};

// 以下のコードをApp関数内のuseEffectとして追加（既存のuseEffectの後ろに追加）
// アプリ初期化時のデータベース最適化
useEffect(() => {
  // データベース接続の初期化と最適化
  const initializeDatabase = async () => {
    try {
      // データベース接続を開く（キャッシュされる）
      await openDatabase();
      
      // メモリ使用状況の確認（開発時のみ）
      if (process.env.NODE_ENV === 'development') {
        const stats = await getDatabaseStats();
        console.log('データベース統計:', stats);
      }
    } catch (error) {
      console.error('データベース初期化エラー:', error);
    }
  };
  
  initializeDatabase();
  
  // アプリ終了時にデータベース接続を閉じる
  return () => {
    closeDatabase();
  };
}, []);

// メモリ監視関数を修正
useEffect(() => {
  // ブラウザがPerformance APIをサポートしているか確認
  if (window.performance && window.performance.memory) {
    // 5秒ごとにメモリ使用量をチェック
    const memoryCheckInterval = setInterval(() => {
      const memoryInfo = window.performance.memory;
      
      // ヒープサイズが上限の80%を超えたら警告
      if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8 && !memoryWarningShown) {
        console.warn('メモリ使用量が高くなっています。ページをリロードしてください。');
        setMemoryWarningShown(true);
        
        // リソースを解放するため、不要なデータをクリア
        closeDatabase(); // dbConnection変数を直接参照せず、関数を呼び出す
        setTimeout(() => openDatabase(), 1000); // 1秒後に再接続
      }
    }, 5000);
    
    return () => clearInterval(memoryCheckInterval);
  }
}, [memoryWarningShown]);

// データクリーンアップ機能の追加
// App関数内で以下のコードを追加

// メモリ監視とデータクリーンアップのための関数
const cleanupMemoryUsage = (showMessage = false) => {
  try {
    // 不要なオブジェクトをクリア
    if (window.gc) {
      window.gc();
    }
    
    // キャッシュをクリア
    if ('caches' in window) {
      caches.keys().then(names => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
    
    if (showMessage) {
      alert('メモリクリーンアップが完了しました。一時的にデータ保存が停止されます。');
    }
    
    // データ保存操作を一時的にブロック
    blockSaveOperations(60000); // 1分間データ保存をブロック
    
    console.log('メモリクリーンアップが実行されました');
  } catch (e) {
    console.error('メモリクリーンアップエラー:', e);
  }
};

// 定期的なクリーンアップを実行するためのuseEffect
useEffect(() => {
  // 頻度を大幅に減らす - 30分→2時間ごと
  const cleanupInterval = setInterval(() => {
    cleanupMemoryUsage();
  }, 120 * 60 * 1000); // 2時間 = 120分 = 7,200,000ミリ秒
  
  // 初期化時に1回だけ実行
  const initialCleanupTimeout = setTimeout(() => {
    cleanupMemoryUsage();
  }, 60 * 1000); // 起動から1分後
  
  return () => {
    clearInterval(cleanupInterval);
    clearTimeout(initialCleanupTimeout);
  };
}, []);

// タブ切り替え時のデータクリーンアップを最適化
useEffect(() => {
  // refreshData()の呼び出しを削除 - これが無限ループの一因になっている可能性あり
  
  // タブ切り替え時にメモリ使用状況をチェック - 必要な場合のみ
  if (currentTab === 'stats' || currentTab === 'ambiguous') {
    // 統計タブや曖昧分析タブに切り替える前にのみクリーンアップ
    setTimeout(() => cleanupMemoryUsage(false), 100);
  }
}, [currentTab]);

  // ★★★ 今日の問題を計算 ★★★
  // useMemoを使って今日の問題リストを効率的に計算
  const todayQuestions = useMemo(() => {
    console.log("今日の問題リストを計算中...");
    if (!Array.isArray(subjects) || subjects.length === 0) {
      console.log("科目データがないため、今日の問題はありません");
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 今日の0時0分0秒に設定
    
    // すべての問題を取得
    const allQuestions = getAllQuestions(subjects);
    
    // 今日解くべき問題をフィルタリング
    const todayQuestions = allQuestions.filter(question => {
      // nextDateが今日以前の問題を今日解くべき問題とする
      if (!question.nextDate) return false;
      
      const nextDate = new Date(question.nextDate);
      nextDate.setHours(0, 0, 0, 0);
      
      return nextDate <= today;
    });
    
    console.log(`今日解くべき問題: ${todayQuestions.length}問`);
    return todayQuestions;
  }, [subjects]); // subjectsが変更されたときのみ再計算

  // ★★★ メインビューのレンダリング ★★★
  // 現在のタブに応じたコンポーネントをレンダリング
  const renderMainView = () => {
    switch (currentTab) {
      case 'today':
        return (
          <ErrorBoundary>
            <TodayView 
              todayQuestions={todayQuestions}
              recordAnswer={recordAnswer}
              formatDate={formatDate}
              refreshData={refreshData}
            />
          </ErrorBoundary>
        );
      // ... existing code ...
    }
  };

  // ★ アプリ全体のレンダリング (エラー状態対応) ★
  return (
  <ErrorBoundary>
    <NotificationProvider>
      <div className="App">
        <OfflineIndicator />
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={currentTab} setActiveTab={setCurrentTab} />
　　　　
          {/* ストレージエラー通知 */}
          {hasStorageError && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 mx-4 mt-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>
                  ローカルストレージにアクセスできないため、データが保存されません。
                  シークレットモードを使用している場合は通常モードに切り替えるか、ブラウザの設定を確認してください。
                </p>
              </div>
            </div>
          )}
　　　　
    {showExportReminder && (
      <ReminderNotification 
        daysSinceLastExport={daysSinceLastExport}
        onDismiss={handleDismissReminder}
              onGoToSettings={handleGoToSettings}
            />
          )}
          
          <div className="container mx-auto px-4 pt-4 pb-20">
            <MainView 
              activeTab={currentTab}
              setActiveTab={setCurrentTab}
              subjects={subjects}
              setSubjects={setSubjects}
              answerHistory={answerHistory} 
              refreshData={refreshData}
              forceUpdate={forceUpdate}
              setForceUpdate={setForceUpdate}
              getAllQuestions={() => getAllQuestions(subjects)}
              getQuestionsForToday={() => getQuestionsForDate(new Date())}
              getQuestionsForDate={getQuestionsForDate}
              recordAnswer={recordAnswer}
              saveQuestionEdit={saveQuestionEdit}
              handleQuestionDateChange={handleQuestionDateChange}
              saveBulkEdit={saveBulkEdit}
              saveBulkEditItems={saveBulkEditItems}
              bulkEditMode={bulkEditMode}
              setBulkEditMode={setBulkEditMode}
              selectedQuestions={selectedQuestions}
              setSelectedQuestions={setSelectedQuestions}
              toggleQuestionSelection={toggleQuestionSelection}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              resetAllData={resetAllData}
              resetAnswerStatusOnly={resetAnswerStatusOnly}
              formatDate={formatDate}
              editingQuestion={editingQuestion}
              setEditingQuestion={setEditingQuestion}
              filterText={filterText}
              setFilterText={setFilterText}
              showAnswered={showAnswered}
              setShowAnswered={setShowAnswered}
              expandedSubjects={expandedSubjects} 
              expandedChapters={expandedChapters}
              saveComment={saveComment}
              blockSaveOperations={blockSaveOperations}
              addQuestion={addQuestion}
              calculateCorrectRate={calculateCorrectRate}
              calculateTotalQuestionCount={calculateTotalQuestionCount}
            />
      </div>
      <div id="notification-area" className="fixed bottom-4 right-4 z-30"></div>
    </div>
      </div>
    </NotificationProvider>
  </ErrorBoundary>
  );
}

export default App;

// データ保存操作の一時ブロック機能
const blockSaveOperations = (duration = 60000) => {
  console.log(`データ保存操作を${duration/1000}秒間ブロックします`);
  window._blockSaveUntil = Date.now() + duration;
  
  // タイマーをセットしてブロック解除
  setTimeout(() => {
    window._blockSaveUntil = 0;
    console.log('データ保存操作のブロックを解除しました');
  }, duration);
  
  return true;
};

// ★★★ アコーディオン開閉 ★★★
// 科目と章の開閉状態を制御する関数
  const setExpandedSubjects = (prev => ({
    ...prev,
  }));
