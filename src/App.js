// src/App.js
// 【useMemo 修正版 - 省略なし完全版】
// generateInitialData 内の科目データ定義の省略を元に戻し、
// useMemo を使って今日の問題リストを計算するように修正。

import React, { useState, useEffect, useMemo } from 'react'; // useMemo をインポート
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
        { id: 1, subjectId: 1, subjectName: "経営管理論", chapters: [ { id: 101, chapterId: 101, chapterName: "企業活動と経営戦略の全体概要 Q1-1", questions: generateQuestions('1-1-Q', 1, 2) }, { id: 102, chapterId: 102, chapterName: "事業戦略（競争戦略） Q1-2", questions: generateQuestions('1-2-Q', 1, 16) }, { id: 103, chapterId: 103, chapterName: "企業戦略（成長戦略） Q1-3", questions: generateQuestions('1-3-Q', 1, 27) }, { id: 104, chapterId: 104, chapterName: "技術経営 Q1-4", questions: generateQuestions('1-4-Q', 1, 14) }, { id: 105, chapterId: 105, chapterName: "企業の社会的責任（CSR）とコーポレートガバナンス Q1-5", questions: generateQuestions('1-5-Q', 1, 5) }, { id: 106, chapterId: 106, chapterName: "組織構造論 Q2-1", questions: generateQuestions('2-1-Q', 1, 18) }, { id: 107, chapterId: 107, chapterName: "組織行動論 Q2-2", questions: generateQuestions('2-2-Q', 1, 21) }, { id: 108, chapterId: 108, chapterName: "人的資源管理 Q2-3", questions: generateQuestions('2-3-Q', 1, 12) }, { id: 109, chapterId: 109, chapterName: "マーケティングの基礎概念 Q3-1", questions: generateQuestions('3-1-Q', 1, 2) }, { id: 110, chapterId: 110, chapterName: "マーケティングマネジメント戦略の展開 Q3-2", questions: generateQuestions('3-2-Q', 1, 5) }, { id: 111, chapterId: 111, chapterName: "マーケティングリサーチ Q3-3", questions: generateQuestions('3-3-Q', 1, 4) }, { id: 112, chapterId: 112, chapterName: "消費者購買行動と組織購買行動 Q3-4", questions: generateQuestions('3-4-Q', 1, 8) }, { id: 113, chapterId: 113, chapterName: "製品戦略 Q3-5", questions: generateQuestions('3-5-Q', 1, 13) }, { id: 114, chapterId: 114, chapterName: "価格戦略 Q3-6", questions: generateQuestions('3-6-Q', 1, 8) }, { id: 115, chapterId: 115, chapterName: "チャネル・物流戦略 Q3-7", questions: generateQuestions('3-7-Q', 1, 7) }, { id: 116, chapterId: 116, chapterName: "プロモーション戦略 Q3-8", questions: generateQuestions('3-8-Q', 1, 7) }, { id: 117, chapterId: 117, chapterName: "関係性マーケティングとデジタルマーケティング Q3-9", questions: generateQuestions('3-9-Q', 1, 4) } ] },
        // --- 科目 2: 運営管理 ---
        { id: 2, subjectId: 2, subjectName: "運営管理", chapters: [ { id: 201, chapterId: 201, chapterName: "生産管理概論 Q1-1", questions: generateQuestions('2-1-1-Q', 1, 10) }, { id: 202, chapterId: 202, chapterName: "生産のプランニング Q1-2", questions: generateQuestions('2-1-2-Q', 1, 52) }, { id: 203, chapterId: 203, chapterName: "生産のオペレーション Q1-3", questions: generateQuestions('2-1-3-Q', 1, 35) }, { id: 204, chapterId: 204, chapterName: "製造業における情報システム Q1-4", questions: generateQuestions('2-1-4-Q', 1, 6) }, { id: 205, chapterId: 205, chapterName: "店舗・商業集積 Q2-1", questions: generateQuestions('2-2-1-Q', 1, 9) }, { id: 206, chapterId: 206, chapterName: "商品仕入・販売（マーチャンダイジング） Q2-2", questions: generateQuestions('2-2-2-Q', 1, 23) }, { id: 207, chapterId: 207, chapterName: "物流・輸配送管理 Q2-3", questions: generateQuestions('2-2-3-Q', 1, 18) }, { id: 208, chapterId: 208, chapterName: "販売流通情報システム Q2-4", questions: generateQuestions('2-2-4-Q', 1, 17) } ] },
        // --- 科目 3: 経済学 ---
        { id: 3, subjectId: 3, subjectName: "経済学", chapters: [ { id: 301, chapterId: 301, chapterName: "企業行動の分析 Q1", questions: generateQuestions('3-1-Q', 1, 19) }, { id: 302, chapterId: 302, chapterName: "消費者行動の分析 Q2", questions: generateQuestions('3-2-Q', 1, 22) }, { id: 303, chapterId: 303, chapterName: "市場均衡と厚生分析 Q3", questions: generateQuestions('3-3-Q', 1, 23) }, { id: 304, chapterId: 304, chapterName: "不完全競争 Q4", questions: generateQuestions('3-4-Q', 1, 15) }, { id: 305, chapterId: 305, chapterName: "市場の失敗と政府の役割 Q5", questions: generateQuestions('3-5-Q', 1, 15) }, { id: 306, chapterId: 306, chapterName: "国民経済計算と主要経済指標 Q6", questions: generateQuestions('3-6-Q', 1, 13) }, { id: 307, chapterId: 307, chapterName: "財市場の分析 Q7", questions: generateQuestions('3-7-Q', 1, 11) }, { id: 308, chapterId: 308, chapterName: "貨幣市場とIS-LM分析 Q8", questions: generateQuestions('3-8-Q', 1, 14) }, { id: 309, chapterId: 309, chapterName: "雇用と物価水準 Q9", questions: generateQuestions('3-9-Q', 1, 8) }, { id: 310, chapterId: 310, chapterName: "消費、投資、財政金融政策に関する理論 Q10", questions: generateQuestions('3-10-Q', 1, 11) }, { id: 311, chapterId: 311, chapterName: "国際マクロ経済 Q11", questions: generateQuestions('3-11-Q', 1, 6) }, { id: 312, chapterId: 312, chapterName: "景気循環と経済成長 Q12", questions: generateQuestions('3-12-Q', 1, 3) } ] },
        // --- 科目 4: 経営情報システム ---
        { id: 4, subjectId: 4, subjectName: "経営情報システム", chapters: [ { id: 401, chapterId: 401, chapterName: "情報技術に関する基礎知識 Q1", questions: generateQuestions('4-1-Q', 1, 178) }, { id: 402, chapterId: 402, chapterName: "ソフトウェア開発 Q2", questions: generateQuestions('4-2-Q', 1, 38) }, { id: 403, chapterId: 403, chapterName: "経営情報管理 Q3", questions: generateQuestions('4-3-Q', 1, 35) }, { id: 404, chapterId: 404, chapterName: "統計解析 Q4", questions: generateQuestions('4-4-Q', 1, 9) } ] },
        // --- 科目 5: 経営法務 ---
        { id: 5, subjectId: 5, subjectName: "経営法務", chapters: [ { id: 501, chapterId: 501, chapterName: "民法その他の知識 Q1", questions: generateQuestions('5-1-Q', 1, 54) }, { id: 502, chapterId: 502, chapterName: "会社法等に関する知識 Q2", questions: generateQuestions('5-2-Q', 1, 123) }, { id: 503, chapterId: 503, chapterName: "資本市場に関する知識 Q3", questions: generateQuestions('5-3-Q', 1, 12) }, { id: 504, chapterId: 504, chapterName: "倒産等に関する知識 Q4", questions: generateQuestions('5-4-Q', 1, 16) }, { id: 505, chapterId: 505, chapterName: "知的財産権等に関する知識 Q5", questions: generateQuestions('5-5-Q', 1, 107) }, { id: 506, chapterId: 506, chapterName: "その他経営法務に関する知識 Q6", questions: generateQuestions('5-6-Q', 1, 19) } ] },
        // --- 科目 6: 中小企業経営・政策 ---
        { id: 6, subjectId: 6, subjectName: "中小企業経営・中小企業政策", chapters: [ { id: 601, chapterId: 601, chapterName: "中小企業経営/中小企業概論 Q1-1", questions: generateQuestions('6-1-1-Q', 1, 31) }, { id: 602, chapterId: 602, chapterName: "中小企業経営/令和5年度の中小企業の動向 Q1-2", questions: generateQuestions('6-1-2-Q', 1, 40) }, { id: 603, chapterId: 603, chapterName: "中小企業経営/環境変化に対応する中小企業 Q1-3", questions: generateQuestions('6-1-3-Q', 1, 14) }, { id: 604, chapterId: 604, chapterName: "中小企業経営/経営課題に立ち向かう小規模業者業 Q1-4", questions: generateQuestions('6-1-4-Q', 1, 32) }, { id: 605, chapterId: 605, chapterName: "中小企業政策/中小企業政策の基本 Q2-1", questions: generateQuestions('6-2-1-Q', 1, 14) }, { id: 606, chapterId: 606, chapterName: "中小企業政策/中小企業施策 Q2-2", questions: generateQuestions('6-2-2-Q', 1, 68) }, { id: 607, chapterId: 607, chapterName: "中小企業政策/中小企業政策の変遷 Q2-3", questions: generateQuestions('6-2-3-Q', 1, 1) } ] },
        // --- 科目 7: 過去問題集 ---
        { id: 7, subjectId: 7, subjectName: "過去問題集", chapters: [ { id: 701, chapterId: 701, chapterName: "企業経営理論 令和6年度", questionCount: 40 }, { id: 702, chapterId: 702, chapterName: "企業経営理論 令和5年度", questionCount: 37 }, { id: 703, chapterId: 703, chapterName: "企業経営理論 令和4年度", questionCount: 37 }, { id: 704, chapterId: 704, chapterName: "企業経営理論 令和3年度", questionCount: 38 }, { id: 705, chapterId: 705, chapterName: "企業経営理論 令和2年度", questionCount: 36 }, { id: 706, chapterId: 706, chapterName: "運営管理 令和6年度", questionCount: 41 }, { id: 707, chapterId: 707, chapterName: "運営管理 令和5年度", questionCount: 37 }, { id: 708, chapterId: 708, chapterName: "運営管理 令和4年度", questionCount: 39 }, { id: 709, chapterId: 709, chapterName: "運営管理 令和3年度", questionCount: 41 }, { id: 710, chapterId: 710, chapterName: "運営管理 令和2年度", questionCount: 42 }, { id: 711, chapterId: 711, chapterName: "経済学・経済政策 令和6年度", questionCount: 22 }, { id: 712, chapterId: 712, chapterName: "経済学・経済政策 令和5年度", questionCount: 22 }, { id: 713, chapterId: 713, chapterName: "経済学・経済政策 令和4年度", questionCount: 21 }, { id: 714, chapterId: 714, chapterName: "経済学・経済政策 令和3年度", questionCount: 23 }, { id: 715, chapterId: 715, chapterName: "経済学・経済政策 令和2年度", questionCount: 22 }, { id: 716, chapterId: 716, chapterName: "経営情報システム 令和6年度", questionCount: 23 }, { id: 717, chapterId: 717, chapterName: "経営情報システム 令和5年度", questionCount: 25 }, { id: 718, chapterId: 718, chapterName: "経営情報システム 令和4年度", questionCount: 24 }, { id: 719, chapterId: 719, chapterName: "経営情報システム 令和3年度", questionCount: 25 }, { id: 720, chapterId: 720, chapterName: "経営情報システム 令和2年度", questionCount: 25 }, { id: 721, chapterId: 721, chapterName: "経営法務 令和6年度", questionCount: 24 }, { id: 722, chapterId: 722, chapterName: "経営法務 令和5年度", questionCount: 21 }, { id: 723, chapterId: 723, chapterName: "経営法務 令和4年度", questionCount: 22 }, { id: 724, chapterId: 724, chapterName: "経営法務 令和3年度", questionCount: 20 }, { id: 725, chapterId: 725, chapterName: "経営法務 令和2年度", questionCount: 22 }, { id: 726, chapterId: 726, chapterName: "中小企業経営・政策 令和6年度", questionCount: 11 }, { id: 727, chapterId: 727, chapterName: "中小企業経営・政策 令和5年度", questionCount: 22 }, { id: 728, chapterId: 728, chapterName: "中小企業経営・政策 令和4年度", questionCount: 22 }, { id: 729, chapterId: 729, chapterName: "中小企業経営・政策 令和3年度", questionCount: 22 }, { id: 730, chapterId: 730, chapterName: "中小企業経営・政策 令和2年度", questionCount: 22 }, ].map(chapterInfo => { const yearMatch = chapterInfo.chapterName.match(/令和(\d+)年度/); const subjectMatch = chapterInfo.chapterName.match(/^(.+?)\s+令和/); if (yearMatch && subjectMatch) { const year = `R${yearMatch[1].padStart(2, '0')}`; const subjectName = subjectMatch[1]; const prefixBase = pastExamSubjectPrefixMap[subjectName] || subjectName.replace(/[・/]/g, ''); const prefix = `過去問-${year}-${prefixBase}-Q`; return { id: chapterInfo.id, chapterId: chapterInfo.chapterId, chapterName: chapterInfo.chapterName, questions: generateQuestions(prefix, 1, chapterInfo.questionCount) }; } else { console.warn(`Could not parse year/subject from chapter name: ${chapterInfo.chapterName}`); return { id: chapterInfo.id, chapterId: chapterInfo.chapterId, chapterName: chapterInfo.chapterName, questions: [] }; } }) }
    ];
    subjects.forEach((s) => { s.subjectId = s.id; s.chapters.forEach((c) => { c.chapterId = c.id; }); });
    return subjects;
};

// ★ 自然順ソート用の比較関数定義 (変更なし) ★
function naturalSortCompare(a, b) { if (a == null && b == null) return 0; if (a == null) return -1; if (b == null) return 1; const ax = [], bx = []; String(a).replace(/(\d+)|(\D+)/g, (_, $1, $2) => { ax.push([$1 || Infinity, $2 || ""]) }); String(b).replace(/(\d+)|(\D+)/g, (_, $1, $2) => { bx.push([$1 || Infinity, $2 || ""]) }); while (ax.length && bx.length) { const an = ax.shift(); const bn = bx.shift(); const nn = (parseInt(an[0]) - parseInt(bn[0])) || an[1].localeCompare(bn[1], undefined, { numeric: true, sensitivity: 'base' }); if (nn) return nn; } return ax.length - bx.length; }

// ★ 正解率計算関数 (変更なし) ★
function calculateCorrectRate(question, isCorrect) { const currentCount = question?.answerCount ?? 0; const validCurrentCount = (typeof currentCount === 'number' && !isNaN(currentCount)) ? currentCount : 0; const currentRate = question?.correctRate ?? 0; const validCurrentRate = (typeof currentRate === 'number' && !isNaN(currentRate)) ? currentRate : 0; if (validCurrentCount === 0) { return isCorrect ? 100 : 0; } const totalCorrectPoints = validCurrentRate * validCurrentCount / 100; const newRate = isCorrect ? ((totalCorrectPoints + 1) / (validCurrentCount + 1)) * 100 : (totalCorrectPoints / (validCurrentCount + 1)) * 100; return Math.round(newRate); }

// --- App コンポーネント本体 ---
function App() {
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
　const [showExportReminder, setShowExportReminder] = useState(false);
  const [daysSinceLastExport, setDaysSinceLastExport] = useState(null);
    
  // ★ 初期データロード処理 (変更なし) ★
  useEffect(() => {
    console.log("初期データロード開始 (Ver. サンプルデータ優先)");
    const savedStudyData = localStorage.getItem('studyData');
    let studyDataToSet;
    if (savedStudyData) {
      try {
        studyDataToSet = JSON.parse(savedStudyData);
        // データ形式の互換性チェック (変更なし)
        studyDataToSet.forEach(subject => { subject?.chapters?.forEach(chapter => { chapter?.questions?.forEach(q => { if (q) { if (q.lastAnswered && !(q.lastAnswered instanceof Date)) { const parsedDate = new Date(q.lastAnswered); q.lastAnswered = !isNaN(parsedDate) ? parsedDate : null; } if (typeof q.understanding === 'undefined') { q.understanding = '理解○'; } if (typeof q.comment === 'undefined') { q.comment = ''; } } }); }); });
        console.log('学習データをLocalStorageから読み込み完了');
      } catch (e) { console.error('学習データ読み込み失敗:', e); studyDataToSet = generateInitialData(); console.log('読み込み失敗のため、初期学習データを生成'); }
    } else {
      studyDataToSet = generateInitialData();
      console.log('LocalStorageにデータがないため初期学習データを生成');
    }
    setSubjects(studyDataToSet);

    const savedHistoryData = localStorage.getItem('studyHistory');
    let historyDataToSet = [];
    if (savedHistoryData) { try { historyDataToSet = JSON.parse(savedHistoryData); console.log('解答履歴読み込み完了'); } catch (e) { console.error('解答履歴読み込み失敗:', e); historyDataToSet = []; } } else { console.log('解答履歴なし'); }
    setAnswerHistory(historyDataToSet);

    const initialExpandedSubjectsState = {};
    if (Array.isArray(studyDataToSet)) { studyDataToSet.forEach(subject => { if (subject?.id) { initialExpandedSubjectsState[subject.id] = false; } }); if (studyDataToSet.length > 0 && studyDataToSet[0]?.id) { initialExpandedSubjectsState[studyDataToSet[0].id] = true; } }
    setExpandedSubjects(initialExpandedSubjectsState);
    console.log("初期データロード完了");
  }, []);

  // ★ データ保存処理 (変更なし) ★
  useEffect(() => {
    try { const dataToSave = JSON.stringify(subjects, (key, value) => { if (key === 'lastAnswered' && value instanceof Date) { return value.toISOString(); } return value; }); localStorage.setItem('studyData', dataToSave); } catch (e) { console.error("学習データ保存失敗:", e); }
    try { localStorage.setItem('studyHistory', JSON.stringify(answerHistory)); } catch (e) { console.error("解答履歴保存失敗:", e); }
  }, [subjects, answerHistory]);

　// 既存のuseEffect（データロード処理やデータ保存処理）の後に追加
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
      setDaysSinceLastExport(null);
      setShowExportReminder(true);
    } else {
      const lastExportTime = parseInt(lastExportTimestamp, 10);
      const daysSinceExport = Math.floor((now - lastExportTime) / (1000 * 60 * 60 * 24));
      
      // 14日以上経過していたらリマインダー表示
      if (daysSinceExport >= 14) {
        setDaysSinceLastExport(daysSinceExport);
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
    console.log("Calculating todayQuestionsList using useMemo. Subjects length:", subjects?.length);

    if (!Array.isArray(subjects) || subjects.length === 0) {
        console.warn("todayQuestionsList (useMemo): subjects is empty.");
        return questions;
    }

    subjects.forEach((subject) => {
      if (!subject || !Array.isArray(subject.chapters)) {
           console.warn("todayQuestionsList (useMemo): Invalid subject or chapters structure:", subject);
           return; // この subject をスキップ
      }
      // 両方のプロパティ名をサポート
      const currentSubjectName = subject.subjectName || subject.name || '?';

      subject.chapters.forEach((chapter) => {
        if (!chapter || !Array.isArray(chapter.questions)) {
             console.warn("todayQuestionsList (useMemo): Invalid chapter or questions structure:", chapter);
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
                    console.log(`[Today - useMemo] Found match: ${question.id}. Subject: ${currentSubjectName}, Chapter: ${currentChapterName}`);
                    // 両方のプロパティを設定
                    questions.push({
                        ...question,
                        subjectName: currentSubjectName,
                        chapterName: currentChapterName,
                        // 下位互換性のために name も設定
                        name: question.name || question.id
                    });
                }
            } catch (e) { console.error("[Today - useMemo] Error processing question:", e, question); }
        });
      });
    });
    // 問題IDでソート
    return questions.sort((a, b) => naturalSortCompare(a.id, b.id));
}, [subjects]);

// App.js 内のgetQuestionsForDate関数の修正部分

const getQuestionsForDate = (date) => {
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) return [];
  targetDate.setHours(0, 0, 0, 0);
  const targetTime = targetDate.getTime();
  const questions = [];
  console.log(`getQuestionsForDate called for ${formatDate(date)}. Current subjects length:`, subjects?.length);

  if (!Array.isArray(subjects) || subjects.length === 0) {
      console.warn(`getQuestionsForDate (${formatDate(date)}): subjects is empty or not an array. Returning empty list.`);
      return questions;
  }

  subjects.forEach((subject) => {
    if (!subject || !Array.isArray(subject.chapters)) {
        console.warn(`getQuestionsForDate (${formatDate(date)}): Invalid subject or chapters structure:`, subject);
        return;
    }
    // 両方のプロパティ名をサポート
    const currentSubjectName = subject.subjectName || subject.name || '?';

    subject.chapters.forEach((chapter) => {
      if (!chapter || !Array.isArray(chapter.questions)) {
          console.warn(`getQuestionsForDate (${formatDate(date)}): Invalid chapter or questions structure:`, chapter);
          return;
      }
      // 両方のプロパティ名をサポート
      const currentChapterName = chapter.chapterName || chapter.name || '?';

      chapter.questions.forEach(question => {
        if (!question?.nextDate) return;
        try {
          const nextDate = new Date(question.nextDate);
          if (isNaN(nextDate.getTime())) return;
          nextDate.setHours(0, 0, 0, 0);
          if (nextDate.getTime() === targetTime) {
            console.log(`[Date] Found match: ${question.id}. Subject Name: ${currentSubjectName}, Chapter Name: ${currentChapterName}`);
            if (currentSubjectName === '?' || currentChapterName === '?') {
                console.log("[Date] Problem Details:", JSON.stringify(question));
                console.log("[Date] Chapter Details (without questions):", JSON.stringify({...chapter, questions: undefined}));
                console.log("[Date] Subject Details (without chapters):", JSON.stringify({...subject, chapters: undefined}));
            }
            // 両方のプロパティを設定
            questions.push({ 
              ...question, 
              subjectName: currentSubjectName, 
              chapterName: currentChapterName,
              // 下位互換性のために name も設定
              name: question.name || question.id
            });
          }
        } catch(e) {
          console.error(`Error processing question in getQuestionsForDate (${formatDate(date)}):`, e, question);
        }
      });
    });
  });
  return questions.sort((a, b) => naturalSortCompare(a.id, b.id));
};

  // ★ アコーディオン開閉 (変更なし) ★
  const toggleSubject = (subjectId) => { setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] })); };
  const toggleChapter = (chapterId) => { setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] })); };

  // ★ 解答記録 & 履歴追加 (変更なし) ★
  const recordAnswer = (questionId, isCorrect, understanding) => { const timestamp = new Date().toISOString(); let updatedQuestionData = null; setSubjects(prevSubjects => { if (!Array.isArray(prevSubjects)) return []; const newSubjects = prevSubjects.map(subject => { if (!subject?.chapters) return subject; return { ...subject, id: subject.id, name: subject.name, chapters: subject.chapters.map(chapter => { if (!chapter?.questions) return chapter; return { ...chapter, id: chapter.id, name: chapter.name, questions: chapter.questions.map(q => { if (q?.id === questionId) { const question = { ...q }; const previousUnderstanding = question.understanding; const today = new Date(); let nextDate = new Date(); let newInterval = ''; if (understanding.startsWith('曖昧△')) { nextDate.setDate(today.getDate() + 8); newInterval = '8日'; } else if (isCorrect && understanding === '理解○') { const isFirstCorrect = question.understanding === '未学習'; const baseInterval = isFirstCorrect ? '1日' : (previousUnderstanding?.startsWith('曖昧△') ? '14日' : (question.interval || '1日')); switch(baseInterval) { case '1日': nextDate.setDate(today.getDate() + 3); newInterval = '3日'; break; case '3日': nextDate.setDate(today.getDate() + 7); newInterval = '7日'; break; case '7日': nextDate.setDate(today.getDate() + 14); newInterval = '14日'; break; case '14日': nextDate.setMonth(today.getMonth() + 1); newInterval = '1ヶ月'; break; case '1ヶ月': nextDate.setMonth(today.getMonth() + 2); newInterval = '2ヶ月'; break; default: nextDate.setMonth(today.getMonth() + 2); newInterval = '2ヶ月'; break; } } else { nextDate.setDate(today.getDate() + 1); newInterval = '1日'; } updatedQuestionData = { ...question, lastAnswered: today, nextDate: nextDate.toISOString(), interval: newInterval, answerCount: (question.answerCount || 0) + 1, understanding: understanding, previousUnderstanding: previousUnderstanding, correctRate: calculateCorrectRate(question, isCorrect), comment: q.comment, }; return updatedQuestionData; } return q; }) }; }) }; }); return newSubjects; }); if (updatedQuestionData) { const newHistoryRecord = { id: crypto.randomUUID ? crypto.randomUUID() : `history-${Date.now()}-${Math.random()}`, questionId: questionId, timestamp: timestamp, isCorrect: isCorrect, understanding: understanding, }; setAnswerHistory(prevHistory => [...prevHistory, newHistoryRecord]); } else { console.warn("recordAnswer: Failed to find question or update data for", questionId); } };

  // ★ コメント保存用の関数 (変更なし) ★
  const saveComment = (questionId, commentText) => { setSubjects(prevSubjects => { if (!Array.isArray(prevSubjects)) return []; return prevSubjects.map(subject => { if (!subject?.chapters) return subject; return { ...subject, id: subject.id, name: subject.name, chapters: subject.chapters.map(chapter => { if (!chapter?.questions) return chapter; return { ...chapter, id: chapter.id, name: chapter.name, questions: chapter.questions.map(q => { if (q?.id === questionId) { return { ...q, comment: commentText }; } return q; })}; })}; }); }); };

  // ★ DnD 日付変更 (変更なし) ★
  const handleQuestionDateChange = (questionId, newDate) => { setSubjects(prevSubjects => { if (!Array.isArray(prevSubjects)) return []; const targetDate = new Date(newDate); if (isNaN(targetDate.getTime())) { console.error("無効日付:", newDate); return prevSubjects; } targetDate.setHours(0, 0, 0, 0); const targetDateString = targetDate.toISOString(); const newSubjects = prevSubjects.map(subject => { if (!subject?.chapters) return subject; return { ...subject, id: subject.id, name: subject.name, chapters: subject.chapters.map(chapter => { if (!chapter?.questions) return chapter; return { ...chapter, id: chapter.id, name: chapter.name, questions: chapter.questions.map(q => { if (q?.id === questionId) { return { ...q, nextDate: targetDateString }; } return q; }) }; }) }; }); return newSubjects; }); };

  // ★ 個別編集保存 (変更なし) ★
  const saveQuestionEdit = (questionData) => { console.log("編集保存 (App.js):", questionData); setSubjects(prevSubjects => { if (!Array.isArray(prevSubjects)) return []; const newSubjects = prevSubjects.map(subject => { if (!subject?.chapters) return subject; return { ...subject, id: subject.id, name: subject.name, chapters: subject.chapters.map(chapter => { if (!chapter?.questions) return chapter; return { ...chapter, id: chapter.id, name: chapter.name, questions: chapter.questions.map(q => { if (q?.id === questionData.id) { const updatedQuestion = { ...q, ...questionData, lastAnswered: questionData.lastAnswered ? new Date(questionData.lastAnswered) : null, }; if (updatedQuestion.nextDate && isNaN(new Date(updatedQuestion.nextDate).getTime())) { updatedQuestion.nextDate = q.nextDate; } if (questionData.lastAnswered && isNaN(updatedQuestion.lastAnswered?.getTime())) { updatedQuestion.lastAnswered = null; } if (typeof updatedQuestion.answerCount !== 'number' || isNaN(updatedQuestion.answerCount) || updatedQuestion.answerCount < 0) { updatedQuestion.answerCount = 0; } if (typeof updatedQuestion.correctRate !== 'number' || isNaN(updatedQuestion.correctRate) || updatedQuestion.correctRate < 0 || updatedQuestion.correctRate > 100) { updatedQuestion.correctRate = 0;} console.log("最終更新データ:", updatedQuestion); return updatedQuestion; } return q; }) }; }) }; }); return newSubjects; }); setEditingQuestion(null); };

  // ★ 新しい一括編集関数 (変更なし) ★
  const saveBulkEditItems = (itemsToUpdate) => { console.log("一括編集実行 (App.js):", itemsToUpdate, "対象:", selectedQuestions); if (!selectedQuestions || selectedQuestions.length === 0) { alert('一括編集する問題を選択してください。'); return; } if (!itemsToUpdate || Object.keys(itemsToUpdate).length === 0) { return; } let updatedCount = 0; setSubjects(prevSubjects => { if (!Array.isArray(prevSubjects)) return []; const newSubjects = prevSubjects.map(subject => { if (!subject?.chapters) return subject; return { ...subject, id: subject.id, name: subject.name, chapters: subject.chapters.map(chapter => { if (!chapter?.questions) return chapter; return { ...chapter, id: chapter.id, name: chapter.name, questions: chapter.questions.map(q => { if (q && selectedQuestions.includes(q.id)) { updatedCount++; let updatedQuestion = { ...q }; for (const key in itemsToUpdate) { if (Object.hasOwnProperty.call(itemsToUpdate, key)) { let value = itemsToUpdate[key]; console.log(`Updating ${q.id}: ${key} = ${value}`); if (key === 'nextDate') { const dateValue = value ? new Date(value) : null; updatedQuestion[key] = (dateValue && !isNaN(dateValue.getTime())) ? dateValue.toISOString() : null; if (!updatedQuestion[key] && value) console.warn(`無効な日付(nextDate):`, value); } else if (key === 'lastAnswered') { const dateValue = value ? new Date(value) : null; updatedQuestion[key] = (dateValue && !isNaN(dateValue.getTime())) ? dateValue : null; if (!updatedQuestion[key] && value) console.warn(`無効な日付(lastAnswered):`, value); } else if (key === 'answerCount') { const numValue = parseInt(value, 10); updatedQuestion[key] = (!isNaN(numValue) && numValue >= 0) ? numValue : 0; } else if (key === 'correctRate') { const numValue = parseInt(value, 10); updatedQuestion[key] = (!isNaN(numValue) && numValue >= 0 && numValue <= 100) ? numValue : 0;} else { updatedQuestion[key] = value; } } } return updatedQuestion; } return q; }) }; }) }; }); if (updatedCount > 0) { alert(`${updatedCount}件の問題が更新されました。`); } return newSubjects; }); setBulkEditMode(false); setSelectedQuestions([]); console.log("一括編集完了"); };

  // ★ 古い一括編集保存 (変更なし) ★
  const saveBulkEdit = (date) => { console.log("古い saveBulkEdit が呼ばれました。saveBulkEditItems を使用します。"); const targetDate = new Date(date); if (isNaN(targetDate.getTime())) { console.error("無効日付:", date); return; } targetDate.setHours(0, 0, 0, 0); const targetDateString = targetDate.toISOString(); saveBulkEditItems({ nextDate: targetDateString }); };

  // ★ 一括編集 選択切り替え (変更なし) ★
  const toggleQuestionSelection = (questionId) => { setSelectedQuestions(prev => { if (prev.includes(questionId)) { return prev.filter(id => id !== questionId); } else { return [...prev, questionId]; } }); };

  // ★ 日付フォーマット (変更なし) ★
   const formatDate = (date) => { if (!date) return '----/--/--'; try { const d = (date instanceof Date) ? date : new Date(date); if (isNaN(d.getTime())) return '無効日付'; const year = d.getFullYear(); const month = d.getMonth() + 1; const day = d.getDate(); return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`; } catch(e) { console.error("formatDateエラー:", e, date); return 'エラー'; } };

  // ★ 完全リセット関数 (既存) ★
  const resetAllData = () => { console.log("全学習データのリセットを実行します..."); if (window.confirm("本当にすべての学習データ（解答履歴含む）をリセットしますか？\nこの操作は元に戻せません。")) { try { localStorage.removeItem('studyData'); localStorage.removeItem('studyHistory'); console.log("LocalStorageのデータを削除しました。"); alert("学習データをリセットしました。ページをリロードして初期データを再生成します。"); window.location.reload(); } catch (error) { console.error("データリセット中にエラーが発生しました:", error); alert("データのリセット中にエラーが発生しました。"); } } else { console.log("データリセットはキャンセルされました。"); } };

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

const handleDataExport = () => {
  try {
    // エクスポートするデータの準備
    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: "1.0.0", // アプリのバージョン（任意）
      subjects: subjects,
      answerHistory: answerHistory
    };
    
    // JSONに変換
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Blobオブジェクトを作成
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // ダウンロードリンクを作成
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // ファイル名設定（日付を含む）
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `study-scheduler-data-${dateStr}.json`;
    
    // ダウンロードを実行
    document.body.appendChild(link);
    link.click();
    
    // 後片付け
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 成功時にタイムスタンプを記録
    localStorage.setItem('lastExportTimestamp', new Date().getTime().toString());
    return true;
  } catch (error) {
    console.error("エクスポート処理中にエラー:", error);
    return false;
  }
};
      

  // ★ メインビュー切り替え ★
  const MainView = () => {
    switch (activeTab) {
      // ★ TodayView には計算済みのリスト (todayQuestionsList) を渡す ★
      case 'today': return <TodayView todayQuestions={todayQuestionsList} recordAnswer={recordAnswer} formatDate={formatDate} />;
      case 'schedule': return <ScheduleView subjects={subjects} getQuestionsForDate={getQuestionsForDate} handleQuestionDateChange={handleQuestionDateChange} formatDate={formatDate} />;
      case 'all': return <RedesignedAllQuestionsView subjects={subjects} expandedSubjects={expandedSubjects} expandedChapters={expandedChapters} toggleSubject={toggleSubject} toggleChapter={toggleChapter} setEditingQuestion={setEditingQuestion} setBulkEditMode={setBulkEditMode} bulkEditMode={bulkEditMode} selectedQuestions={selectedQuestions} setSelectedQuestions={setSelectedQuestions} saveBulkEditItems={saveBulkEditItems} formatDate={formatDate} toggleQuestionSelection={toggleQuestionSelection} />;
      case 'trends': return <AmbiguousTrendsPage subjects={subjects} formatDate={formatDate} answerHistory={answerHistory} saveComment={saveComment} />;
     　case 'stats': return <EnhancedStatsPage subjects={subjects} answerHistory={answerHistory} formatDate={formatDate} />;
      // ★ resetAnswerStatusOnly も渡す ★
    　case 'settings': return <SettingsPage 
  onResetData={resetAllData} 
  onResetAnswerStatusOnly={resetAnswerStatusOnly} 
  onDataImport={handleDataImport}
  onDataExport={handleDataExport} // 新規追加
  subjects={subjects}
  answerHistory={answerHistory}
/>;
      // ★ デフォルトも TodayView に ★
      default: return <TodayView todayQuestions={todayQuestionsList} recordAnswer={recordAnswer} formatDate={formatDate} />;
    }
  };

  // ★ アプリ全体のレンダリング (変更なし) ★
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
　　　　
    {showExportReminder && (
      <ReminderNotification 
        daysSinceLastExport={daysSinceLastExport}
        onGoToSettings={handleGoToSettings}
        onDismiss={handleDismissReminder}
      />
    )}
      
      <div className="p-0 sm:p-4">
        <MainView />
         {editingQuestion && (
           <QuestionEditModal
             question={editingQuestion}
             onSave={saveQuestionEdit}
             onCancel={() => setEditingQuestion(null)}
             formatDate={formatDate}
           />
         )}
      </div>
      <div id="notification-area" className="fixed bottom-4 right-4 z-30"></div>
    </div>
  );
}

export default App;
