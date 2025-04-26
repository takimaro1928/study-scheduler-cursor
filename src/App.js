// src/App.js
// 【useMemo 修正版 - 省略なし完全版】
// generateInitialData 内の科目データ定義の省略を元に戻し、
// useMemo を使って今日の問題リストを計算するように修正。

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // useMemo をインポート
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

// 問題生成関数 (IDゼロパディング、understanding='理解○' 固定)
function generateQuestions(prefix, start, end) {
    const questions = [];
    for (let i = start; i <= end; i++) {
        const today = new Date();
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + Math.floor(Math.random() * 30));
        questions.push({
            // ID生成: プレフィックス + ゼロパディングした番号
            id: `${prefix}${i.toString().padStart(2, '0')}`,
            number: i,
            correctRate: Math.floor(Math.random() * 100),
            lastAnswered: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Dateオブジェクトで保持
            nextDate: nextDate.toISOString(), // ISO文字列で保持
            interval: ['1日', '3日', '7日', '14日', '1ヶ月', '2ヶ月'][Math.floor(Math.random() * 6)],
            answerCount: Math.floor(Math.random() * 10),
            understanding: '理解○', // 固定
            previousUnderstanding: null,
            comment: '', // コメント用の空文字列
        });
    } return questions;
}

// ★★★ 初期データ生成関数 generateInitialData (省略なし) ★★★
const generateInitialData = () => {
    console.log("generateInitialData が呼ばれました (サンプルデータ生成)"); // 確認用ログ
    const pastExamSubjectPrefixMap = { "企業経営理論": "企経", "運営管理": "運営", "経済学・経済政策": "経済", "経営情報システム": "情報", "経営法務": "法務", "中小企業経営・政策": "中小", };
    const subjects = [
        // --- 科目 1: 経営管理論 ---
        { id: 1, subjectId: 1, subjectName: "経営管理論", notes: "<p></p>", chapters: [ { id: 101, chapterId: 101, chapterName: "企業活動と経営戦略の全体概要 Q1-1", questions: generateQuestions('1-1-Q', 1, 2) }, { id: 102, chapterId: 102, chapterName: "事業戦略（競争戦略） Q1-2", questions: generateQuestions('1-2-Q', 1, 16) }, { id: 103, chapterId: 103, chapterName: "企業戦略（成長戦略） Q1-3", questions: generateQuestions('1-3-Q', 1, 27) }, { id: 104, chapterId: 104, chapterName: "技術経営 Q1-4", questions: generateQuestions('1-4-Q', 1, 14) }, { id: 105, chapterId: 105, chapterName: "企業の社会的責任（CSR）とコーポレートガバナンス Q1-5", questions: generateQuestions('1-5-Q', 1, 5) }, { id: 106, chapterId: 106, chapterName: "組織構造論 Q2-1", questions: generateQuestions('2-1-Q', 1, 18) }, { id: 107, chapterId: 107, chapterName: "組織行動論 Q2-2", questions: generateQuestions('2-2-Q', 1, 21) }, { id: 108, chapterId: 108, chapterName: "人的資源管理 Q2-3", questions: generateQuestions('2-3-Q', 1, 12) }, { id: 109, chapterId: 109, chapterName: "マーケティングの基礎概念 Q3-1", questions: generateQuestions('3-1-Q', 1, 2) }, { id: 110, chapterId: 110, chapterName: "マーケティングマネジメント戦略の展開 Q3-2", questions: generateQuestions('3-2-Q', 1, 5) }, { id: 111, chapterId: 111, chapterName: "マーケティングリサーチ Q3-3", questions: generateQuestions('3-3-Q', 1, 4) }, { id: 112, chapterId: 112, chapterName: "消費者購買行動と組織購買行動 Q3-4", questions: generateQuestions('3-4-Q', 1, 8) }, { id: 113, chapterId: 113, chapterName: "製品戦略 Q3-5", questions: generateQuestions('3-5-Q', 1, 13) }, { id: 114, chapterId: 114, chapterName: "価格戦略 Q3-6", questions: generateQuestions('3-6-Q', 1, 8) }, { id: 115, chapterId: 115, chapterName: "チャネル・物流戦略 Q3-7", questions: generateQuestions('3-7-Q', 1, 7) }, { id: 116, chapterId: 116, chapterName: "プロモーション戦略 Q3-8", questions: generateQuestions('3-8-Q', 1, 7) }, { id: 117, chapterId: 117, chapterName: "関係性マーケティングとデジタルマーケティング Q3-9", questions: generateQuestions('3-9-Q', 1, 4) } ] },
        // --- 科目 2: 運営管理 ---
        { id: 2, subjectId: 2, subjectName: "運営管理", notes: "<p></p>", chapters: [ { id: 201, chapterId: 201, chapterName: "生産管理概論 Q1-1", questions: generateQuestions('2-1-1-Q', 1, 10) }, { id: 202, chapterId: 202, chapterName: "生産のプランニング Q1-2", questions: generateQuestions('2-1-2-Q', 1, 52) }, { id: 203, chapterId: 203, chapterName: "生産のオペレーション Q1-3", questions: generateQuestions('2-1-3-Q', 1, 35) }, { id: 204, chapterId: 204, chapterName: "製造業における情報システム Q1-4", questions: generateQuestions('2-1-4-Q', 1, 6) }, { id: 205, chapterId: 205, chapterName: "店舗・商業集積 Q2-1", questions: generateQuestions('2-2-1-Q', 1, 9) }, { id: 206, chapterId: 206, chapterName: "商品仕入・販売（マーチャンダイジング） Q2-2", questions: generateQuestions('2-2-2-Q', 1, 23) }, { id: 207, chapterId: 207, chapterName: "物流・輸配送管理 Q2-3", questions: generateQuestions('2-2-3-Q', 1, 18) }, { id: 208, chapterId: 208, chapterName: "販売流通情報システム Q2-4", questions: generateQuestions('2-2-4-Q', 1, 17) } ] },
        // --- 科目 3: 経済学 ---
        { id: 3, subjectId: 3, subjectName: "経済学", notes: "<p></p>", chapters: [ { id: 301, chapterId: 301, chapterName: "企業行動の分析 Q1", questions: generateQuestions('3-1-Q', 1, 19) }, { id: 302, chapterId: 302, chapterName: "消費者行動の分析 Q2", questions: generateQuestions('3-2-Q', 1, 22) }, { id: 303, chapterId: 303, chapterName: "市場均衡と厚生分析 Q3", questions: generateQuestions('3-3-Q', 1, 23) }, { id: 304, chapterId: 304, chapterName: "不完全競争 Q4", questions: generateQuestions('3-4-Q', 1, 15) }, { id: 305, chapterId: 305, chapterName: "市場の失敗と政府の役割 Q5", questions: generateQuestions('3-5-Q', 1, 15) }, { id: 306, chapterId: 306, chapterName: "国民経済計算と主要経済指標 Q6", questions: generateQuestions('3-6-Q', 1, 13) }, { id: 307, chapterId: 307, chapterName: "財市場の分析 Q7", questions: generateQuestions('3-7-Q', 1, 11) }, { id: 308, chapterId: 308, chapterName: "貨幣市場とIS-LM分析 Q8", questions: generateQuestions('3-8-Q', 1, 14) }, { id: 309, chapterId: 309, chapterName: "雇用と物価水準 Q9", questions: generateQuestions('3-9-Q', 1, 8) }, { id: 310, chapterId: 310, chapterName: "消費、投資、財政金融政策に関する理論 Q10", questions: generateQuestions('3-10-Q', 1, 11) }, { id: 311, chapterId: 311, chapterName: "国際マクロ経済 Q11", questions: generateQuestions('3-11-Q', 1, 6) }, { id: 312, chapterId: 312, chapterName: "景気循環と経済成長 Q12", questions: generateQuestions('3-12-Q', 1, 3) } ] },
        // --- 科目 4: 経営情報システム ---
        { id: 4, subjectId: 4, subjectName: "経営情報システム", notes: "<p></p>", chapters: [ { id: 401, chapterId: 401, chapterName: "情報技術に関する基礎知識 Q1", questions: generateQuestions('4-1-Q', 1, 178) }, { id: 402, chapterId: 402, chapterName: "ソフトウェア開発 Q2", questions: generateQuestions('4-2-Q', 1, 38) }, { id: 403, chapterId: 403, chapterName: "経営情報管理 Q3", questions: generateQuestions('4-3-Q', 1, 35) }, { id: 404, chapterId: 404, chapterName: "統計解析 Q4", questions: generateQuestions('4-4-Q', 1, 9) } ] },
        // --- 科目 5: 経営法務 ---
        { id: 5, subjectId: 5, subjectName: "経営法務", notes: "<p></p>", chapters: [ { id: 501, chapterId: 501, chapterName: "民法その他の知識 Q1", questions: generateQuestions('5-1-Q', 1, 54) }, { id: 502, chapterId: 502, chapterName: "会社法等に関する知識 Q2", questions: generateQuestions('5-2-Q', 1, 123) }, { id: 503, chapterId: 503, chapterName: "資本市場に関する知識 Q3", questions: generateQuestions('5-3-Q', 1, 12) }, { id: 504, chapterId: 504, chapterName: "倒産等に関する知識 Q4", questions: generateQuestions('5-4-Q', 1, 16) }, { id: 505, chapterId: 505, chapterName: "知的財産権等に関する知識 Q5", questions: generateQuestions('5-5-Q', 1, 107) }, { id: 506, chapterId: 506, chapterName: "その他経営法務に関する知識 Q6", questions: generateQuestions('5-6-Q', 1, 19) } ] },
        // --- 科目 6: 中小企業経営・政策 ---
        { id: 6, subjectId: 6, subjectName: "中小企業経営・中小企業政策", notes: "<p></p>", chapters: [ { id: 601, chapterId: 601, chapterName: "中小企業経営/中小企業概論 Q1-1", questions: generateQuestions('6-1-1-Q', 1, 31) }, { id: 602, chapterId: 602, chapterName: "中小企業経営/令和5年度の中小企業の動向 Q1-2", questions: generateQuestions('6-1-2-Q', 1, 40) }, { id: 603, chapterId: 603, chapterName: "中小企業経営/環境変化に対応する中小企業 Q1-3", questions: generateQuestions('6-1-3-Q', 1, 14) }, { id: 604, chapterId: 604, chapterName: "中小企業経営/経営課題に立ち向かう小規模業者業 Q1-4", questions: generateQuestions('6-1-4-Q', 1, 32) }, { id: 605, chapterId: 605, chapterName: "中小企業政策/中小企業政策の基本 Q2-1", questions: generateQuestions('6-2-1-Q', 1, 14) }, { id: 606, chapterId: 606, chapterName: "中小企業政策/中小企業施策 Q2-2", questions: generateQuestions('6-2-2-Q', 1, 68) }, { id: 607, chapterId: 607, chapterName: "中小企業政策/中小企業政策の変遷 Q2-3", questions: generateQuestions('6-2-3-Q', 1, 1) } ] },
        // --- 科目 7: 過去問題集 ---
        { id: 7, subjectId: 7, subjectName: "過去問題集", notes: "<p></p>", chapters: [ { id: 701, chapterId: 701, chapterName: "企業経営理論 令和6年度", questionCount: 40 }, { id: 702, chapterId: 702, chapterName: "企業経営理論 令和5年度", questionCount: 37 }, { id: 703, chapterId: 703, chapterName: "企業経営理論 令和4年度", questionCount: 37 }, { id: 704, chapterId: 704, chapterName: "企業経営理論 令和3年度", questionCount: 38 }, { id: 705, chapterId: 705, chapterName: "企業経営理論 令和2年度", questionCount: 36 }, { id: 706, chapterId: 706, chapterName: "運営管理 令和6年度", questionCount: 41 }, { id: 707, chapterId: 707, chapterName: "運営管理 令和5年度", questionCount: 37 }, { id: 708, chapterId: 708, chapterName: "運営管理 令和4年度", questionCount: 39 }, { id: 709, chapterId: 709, chapterName: "運営管理 令和3年度", questionCount: 41 }, { id: 710, chapterId: 710, chapterName: "運営管理 令和2年度", questionCount: 42 }, { id: 711, chapterId: 711, chapterName: "経済学・経済政策 令和6年度", questionCount: 22 }, { id: 712, chapterId: 712, chapterName: "経済学・経済政策 令和5年度", questionCount: 22 }, { id: 713, chapterId: 713, chapterName: "経済学・経済政策 令和4年度", questionCount: 21 }, { id: 714, chapterId: 714, chapterName: "経済学・経済政策 令和3年度", questionCount: 23 }, { id: 715, chapterId: 715, chapterName: "経済学・経済政策 令和2年度", questionCount: 22 }, { id: 716, chapterId: 716, chapterName: "経営情報システム 令和6年度", questionCount: 23 }, { id: 717, chapterId: 717, chapterName: "経営情報システム 令和5年度", questionCount: 25 }, { id: 718, chapterId: 718, chapterName: "経営情報システム 令和4年度", questionCount: 24 }, { id: 719, chapterId: 719, chapterName: "経営情報システム 令和3年度", questionCount: 25 }, { id: 720, chapterId: 720, chapterName: "経営情報システム 令和2年度", questionCount: 25 }, { id: 721, chapterId: 721, chapterName: "経営法務 令和6年度", questionCount: 24 }, { id: 722, chapterId: 722, chapterName: "経営法務 令和5年度", questionCount: 21 }, { id: 723, chapterId: 723, chapterName: "経営法務 令和4年度", questionCount: 22 }, { id: 724, chapterId: 724, chapterName: "経営法務 令和3年度", questionCount: 20 }, { id: 725, chapterId: 725, chapterName: "経営法務 令和2年度", questionCount: 22 }, { id: 726, chapterId: 726, chapterName: "中小企業経営・政策 令和6年度", questionCount: 11 }, { id: 727, chapterId: 727, chapterName: "中小企業経営・政策 令和5年度", questionCount: 22 }, { id: 728, chapterId: 728, chapterName: "中小企業経営・政策 令和4年度", questionCount: 22 }, { id: 729, chapterId: 729, chapterName: "中小企業経営・政策 令和3年度", questionCount: 22 }, { id: 730, chapterId: 730, chapterName: "中小企業経営・政策 令和2年度", questionCount: 22 }, ].map(chapterInfo => { const yearMatch = chapterInfo.chapterName.match(/令和(\d+)年度/); const subjectMatch = chapterInfo.chapterName.match(/^(.+?)\s+令和/); if (yearMatch && subjectMatch) { const year = `R${yearMatch[1].padStart(2, '0')}`; const subjectName = subjectMatch[1]; const prefixBase = pastExamSubjectPrefixMap[subjectName] || subjectName.replace(/[・/]/g, ''); const prefix = `過去問-${year}-${prefixBase}-Q`; return { id: chapterInfo.id, chapterId: chapterInfo.chapterId, chapterName: chapterInfo.chapterName, questions: generateQuestions(prefix, 1, chapterInfo.questionCount) }; } else { console.warn(`Could not parse year/subject from chapter name: ${chapterInfo.chapterName}`); return { id: chapterInfo.id, chapterId: chapterInfo.chapterId, chapterName: chapterInfo.chapterName, questions: [] }; } }) }
    ];
    subjects.forEach((s) => { s.subjectId = s.id; s.chapters.forEach((c) => { c.chapterId = c.id; }); });
    return subjects;
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
  if (!subjectsData) return allQuestions;
  
  subjectsData.forEach(subject => {
    if (subject.chapters) {
      subject.chapters.forEach(chapter => {
        if (chapter.questions) {
          chapter.questions.forEach(question => {
            allQuestions.push({
              ...question,
              subject: subject.name || subject.subjectName,
              chapter: chapter.name || chapter.chapterName,
              id: question.id,
              number: question.number
            });
          });
        }
      });
    }
  });
  
  return allQuestions;
};

// ★ メインビュー切り替え ★
function App() {
  const [subjects, setSubjects] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // 一括編集用の選択日付
　const [showExportReminder, setShowExportReminder] = useState(false);
  const [daysSinceLastExport, setDaysSinceLastExport] = useState(null);
  // エラー関連の状態
  const [hasStorageError, setHasStorageError] = useState(false);
  // フィルタリング用の状態
  const [filterText, setFilterText] = useState('');
  const [showAnswered, setShowAnswered] = useState(false);
  // パフォーマンスモニタリング用の状態変数を追加（App関数内のステート定義部分に追加）
  const [memoryWarningShown, setMemoryWarningShown] = useState(false);
  // App関数内の先頭部分（他のuseState宣言の近く）に以下を追加
  const [forceUpdate, setForceUpdate] = useState(0);
    
  // グローバルエラーハンドラーの設定
  useEffect(() => {
    setupGlobalErrorHandlers();
    
    // ローカルストレージの可用性チェック
    if (!isStorageAvailable()) {
      setHasStorageError(true);
    }
  }, []);
  
  // データ再読み込み関数の強化
  let lastRefreshTime = 0;
  const REFRESH_THROTTLE_MS = 10000; // 10秒間は連続読み込みを防止

  const refreshData = async () => {
    // データロードの頻度を制限
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_THROTTLE_MS) {
      console.log('データ読み込みの頻度を制限しています...');
      return;
    }
    lastRefreshTime = now;

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
  };
  
  // タブ切り替え時にデータをリフレッシュ
  useEffect(() => {
    // アクティブタブが変更されたらデータを最新化
    refreshData();
  }, [activeTab, refreshData]);
  
  // ★ 初期データ読み込み処理 (IndexedDB対応) ★
  useEffect(() => {
    try {
      // ストレージ使用不可の場合は初期データを生成
      if (hasStorageError) {
        setSubjects(generateInitialData());
        console.log('ストレージ使用不可のため、メモリ上で初期学習データを生成');
        return;
      }
      
      // 学習データのロード (IndexedDBを優先、フォールバックとしてLocalStorage)
      getStudyDataWithFallback()
        .then(studyDataToSet => {
          if (studyDataToSet && Array.isArray(studyDataToSet)) {
            // データ形式の互換性チェック
            studyDataToSet.forEach(subject => { 
              // notes プロパティの初期化を削除
              
              subject?.chapters?.forEach(chapter => { 
                chapter?.questions?.forEach(q => { 
                  if (q) { 
                    if (q.lastAnswered && !(q.lastAnswered instanceof Date)) { 
                      const parsedDate = new Date(q.lastAnswered); 
                      q.lastAnswered = !isNaN(parsedDate) ? parsedDate : null; 
                    } 
                    if (typeof q.understanding === 'undefined') { 
                      q.understanding = '理解○'; 
                    } 
                    if (typeof q.comment === 'undefined') { 
                      q.comment = ''; 
                    } 
                  } 
                }); 
              }); 
            });
            setSubjects(studyDataToSet);
            console.log('学習データを読み込み完了');
            
            // 展開状態の初期設定
            const initialExpandedSubjectsState = {};
            studyDataToSet.forEach(subject => { 
              if (subject?.id) { 
                initialExpandedSubjectsState[subject.id] = false; 
              } 
            }); 
            if (studyDataToSet.length > 0 && studyDataToSet[0]?.id) { 
              initialExpandedSubjectsState[studyDataToSet[0].id] = true; 
            }
            setExpandedSubjects(initialExpandedSubjectsState);
          } else {
            const initialData = generateInitialData();
            setSubjects(initialData);
            console.log('保存データがないため初期学習データを生成');
          }
        })
        .catch(error => {
          console.error("学習データ読み込みエラー:", error);
          setSubjects(generateInitialData());
        });

      // 履歴データのロード (IndexedDBを優先、フォールバックとしてLocalStorage)
      getAnswerHistoryWithFallback()
        .then(historyDataToSet => {
          if (Array.isArray(historyDataToSet)) {
            setAnswerHistory(historyDataToSet);
            console.log('解答履歴読み込み完了');
          } else {
            setAnswerHistory([]);
            console.log('解答履歴がないか無効なため、空の配列を設定');
          }
        })
        .catch(error => {
          console.error("解答履歴読み込みエラー:", error);
          setAnswerHistory([]);
        });

      console.log("初期データロード処理開始");
    } catch (error) {
      console.error("初期データロード中に予期せぬエラーが発生しました:", error);
      // エラー発生時も初期データを設定してアプリが機能するようにする
      setSubjects(generateInitialData());
    }
  }, [hasStorageError]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const questions = [];
    // 冗長なログ出力を削除
    // console.log("Calculating todayQuestionsList using useMemo. Subjects length:", subjects?.length);

    if (!Array.isArray(subjects) || subjects.length === 0) {
        // console.warn("todayQuestionsList (useMemo): subjects is empty.");
        return questions;
    }

    subjects.forEach((subject) => {
      if (!subject || !Array.isArray(subject.chapters)) {
           // console.warn("todayQuestionsList (useMemo): Invalid subject or chapters structure:", subject);
           return; // この subject をスキップ
      }
      // 両方のプロパティ名をサポート
      const currentSubjectName = subject.subjectName || subject.name || '?';

      subject.chapters.forEach((chapter) => {
        if (!chapter || !Array.isArray(chapter.questions)) {
             // console.warn("todayQuestionsList (useMemo): Invalid chapter or questions structure:", chapter);
             return; // この chapter をスキップ
        }
        // 両方のプロパティ名をサポート
        const currentChapterName = chapter.chapterName || chapter.name || '?';

        chapter.questions.forEach(question => {
            if (!question?.nextDate) return;
            try {
                const nextDate = new Date(question.nextDate);
                if (isNaN(nextDate.getTime())) return;
                nextDate.setHours(0, 0, 0, 0);
                if (nextDate.getTime() === todayTime) {
                    // ログ出力を削除
                    // console.log(`[Today - useMemo] Found match: ${question.id}. Subject: ${currentSubjectName}, Chapter: ${currentChapterName}`);
                    // 両方のプロパティを設定
                    questions.push({
                        ...question,
                        subjectName: currentSubjectName,
                        chapterName: currentChapterName,
                        // 下位互換性のために name も設定
                        name: question.name || question.id
                    });
                }
            } catch (e) { 
                // console.error("[Today - useMemo] Error processing question:", e, question); 
            }
        });
      });
    });
    // 問題IDでソート
    return questions.sort((a, b) => naturalSortCompare(a.id, b.id));
}, [subjects]);

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

  // ★ アコーディオン開閉 (変更なし) ★
  const toggleSubject = (subjectId) => { setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] })); };
  const toggleChapter = (chapterId) => { setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] })); };

  // ★ 解答記録 & 履歴追加 (リフレッシュ処理追加) ★
  const recordAnswer = (questionId, isCorrect, understanding) => { 
    const timestamp = new Date().toISOString(); 
    let updatedQuestionData = null; 
    
    setSubjects(prevSubjects => { 
      if (!Array.isArray(prevSubjects)) return []; 
      
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
                  const question = { ...q }; 
                  const previousUnderstanding = question.understanding; 
                  const today = new Date(); 
                  let nextDate = new Date(); 
                  let newInterval = ''; 
                  
                  // 曖昧な理解の場合、理由ごとに次回の復習日を調整
                  if (understanding.startsWith('曖昧△')) {
                    // 曖昧な理由に基づいて日数を決定
                    const reason = understanding.split(':')[1] || '';
                    let daysToAdd = 4; // デフォルトは4日後
                    
                    if (reason === '偶然正解した') {
                      daysToAdd = 2; // 最も短い復習間隔
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
                    console.log(`曖昧理由「${reason}」のため、${daysToAdd}日後に設定`);
                  } else if (isCorrect && understanding === '理解○') { 
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
                        nextDate.setMonth(today.getMonth() + 2); 
                        newInterval = '2ヶ月'; 
                        break; 
                      default: 
                        nextDate.setMonth(today.getMonth() + 2); 
                        newInterval = '2ヶ月'; 
                        break; 
                    } 
                  } else {
                    nextDate.setDate(today.getDate() + 1); 
                    newInterval = '1日'; 
                  } 
                  
                  updatedQuestionData = { 
                    ...question, 
                    lastAnswered: today, 
                    nextDate: nextDate.toISOString(), 
                    interval: newInterval, 
                    answerCount: (question.answerCount || 0) + 1, 
                    understanding: understanding, 
                    previousUnderstanding: previousUnderstanding, 
                    correctRate: calculateCorrectRate(question, isCorrect), 
                    comment: q.comment, 
                  }; 
                  
                  return updatedQuestionData; 
                } 
                return q; 
              }) 
            }; 
          }) 
        }; 
      }); 
      
      // 即時保存処理を追加
      try {
        saveStudyData(newSubjects).catch(error => {
          console.error("IndexedDBへの学習データ保存に失敗:", error);
          setStorageItem('studyData', newSubjects);
        });
      } catch (e) { 
        console.error("学習データ保存失敗:", e); 
      }
      
      return newSubjects; 
    }); 
    
    if (updatedQuestionData) { 
      const newHistoryRecord = { 
        id: crypto.randomUUID ? crypto.randomUUID() : `history-${Date.now()}-${Math.random()}`, 
        questionId: questionId, 
        timestamp: timestamp, 
        isCorrect: isCorrect, 
        understanding: understanding, 
      }; 
      
      setAnswerHistory(prevHistory => {
        const updatedHistory = [...prevHistory, newHistoryRecord];
        
        // 即時保存処理を追加
        try {
          saveAnswerHistory(updatedHistory).catch(error => {
            console.error("IndexedDBへの解答履歴保存に失敗:", error);
            setStorageItem('studyHistory', updatedHistory);
          });
        } catch (e) { 
          console.error("解答履歴保存失敗:", e); 
        }
        
        return updatedHistory;
      }); 
    } else { 
      console.warn("recordAnswer: Failed to find question or update data for", questionId); 
    } 
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

  // ★ 日付フォーマット (変更なし) ★
   const formatDate = (date) => { if (!date) return '----/--/--'; try { const d = (date instanceof Date) ? date : new Date(date); if (isNaN(d.getTime())) return '無効日付'; const year = d.getFullYear(); const month = d.getMonth() + 1; const day = d.getDate(); return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`; } catch(e) { console.error("formatDateエラー:", e, date); return 'エラー'; } };

  // ★ 完全リセット関数 (既存) ★
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
const cleanupMemoryUsage = (force = false) => {
  // 実行頻度を制限するためのフラグチェック
  if (window._isCleanupRunning) {
    console.log('クリーンアップ処理が既に実行中です');
    return false;
  }
  
  window._isCleanupRunning = true;
  console.log('メモリ使用状況チェック・クリーンアップ実行');
  
  try {
    // 強制クリーンアップまたはメモリ使用量が閾値を超えた場合に実行
    if (force || (window.performance && window.performance.memory && 
        window.performance.memory.usedJSHeapSize > window.performance.memory.jsHeapSizeLimit * 0.7)) {
      
      console.log('大規模メモリクリーンアップを実行します');
      
      // 1. 解答履歴の古いデータを削除（90日以上前のデータ）
      cleanupOldAnswerHistory(90)
        .then(count => {
          if (count > 0) {
            console.log(`${count}件の古い解答履歴を削除しました`);
          }
        })
        .catch(err => console.error('履歴クリーンアップエラー:', err))
        .finally(() => {
          // 完了時にフラグをリセット
          window._isCleanupRunning = false;
        });
      
      // 2. 内部キャッシュをクリア - forceUpdateは最小限に使用
      // UIの再描画は必要な場合のみに限定
      if (force) {
        setForceUpdate(prev => prev + 1);
      }
      
      // 3. 不要な配列を削除（参照を切る）
      if (localStorage.getItem('tempDataCache')) {
        localStorage.removeItem('tempDataCache');
      }
      
      return true;
    }
  } catch (e) {
    console.error('クリーンアップ処理でエラーが発生しました:', e);
  } finally {
    // 確実にフラグをリセット
    window._isCleanupRunning = false;
  }
  
  return false;
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
  if (activeTab === 'stats' || activeTab === 'ambiguous') {
    // 統計タブや曖昧分析タブに切り替える前にのみクリーンアップ
    setTimeout(() => cleanupMemoryUsage(false), 100);
  }
}, [activeTab]);

  // ★ アプリ全体のレンダリング (エラー状態対応) ★
  return (
  <ErrorBoundary>
    <NotificationProvider>
      <div className="App">
        <OfflineIndicator />
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
　　　　
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              subjects={subjects}
              setSubjects={setSubjects}
              answerHistory={answerHistory}
              toggleSubject={toggleSubject}
              toggleChapter={toggleChapter}
              expandedSubjects={expandedSubjects}
              expandedChapters={expandedChapters}
              selectedQuestions={selectedQuestions}
              toggleQuestionSelection={toggleQuestionSelection}
              setEditingQuestion={setEditingQuestion}
              bulkEditMode={bulkEditMode}
              setBulkEditMode={setBulkEditMode}
              saveBulkEdit={saveBulkEdit}
              saveBulkEditItems={saveBulkEditItems}
              handleQuestionDateChange={handleQuestionDateChange}
              saveComment={saveComment}
              filterText={filterText} 
              setFilterText={setFilterText}
              showAnswered={showAnswered}
              setShowAnswered={setShowAnswered}
              resetAllData={resetAllData}
              resetAnswerStatusOnly={resetAnswerStatusOnly}
             formatDate={formatDate}
              handleDataImport={handleDataImport}
              handleDataExport={handleDataExport}
              handleBackupData={handleBackupData}
              handleRestoreData={handleRestoreData}
              getAllQuestions={getAllQuestions}
              addQuestion={addQuestion}
              calculateTotalQuestionCount={calculateTotalQuestionCount}
              hasStorageError={hasStorageError}
              recordAnswer={recordAnswer}
              getQuestionsForDate={getQuestionsForDate}
              editingQuestion={editingQuestion}
              saveQuestionEdit={saveQuestionEdit}
              refreshData={refreshData}
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
