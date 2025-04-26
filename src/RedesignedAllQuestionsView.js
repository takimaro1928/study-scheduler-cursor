// src/RedesignedAllQuestionsView.js
// モダンなカードデザイン + 科目カラー活用版 + 検索・フィルター機能強化版
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Filter,
  Edit,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X as XIcon,
  FilePlus,
  Sliders,
  PlusCircle,
  Check,
  File as FileIcon,
  Percent,
  MessageSquare,
} from "lucide-react";
import styles from "./RedesignedAllQuestionsView.module.css"; // CSSモジュール
import AddQuestionModal from "./AddQuestionModal";

// 科目ごとのカラーマップ（境界線の色に使用）
const subjectColorMap = {
  経営管理論: "#4f46e5", // indigo
  運営管理: "#10b981", // emerald
  経済学: "#ef4444", // red
  経営情報システム: "#3b82f6", // blue
  経営法務: "#8b5cf6", // purple
  "中小企業経営・中小企業政策": "#f59e0b", // amber
  過去問題集: "#6b7280", // gray
};

// デフォルトカラー（未知の科目用）
const defaultColor = "#9ca3af";

// 科目名からカラーコードを取得する関数
const getSubjectColorCode = (subjectName) => {
  return subjectColorMap[subjectName || ""] || defaultColor;
};

// 理解度に応じたスタイルとアイコンを返す関数
const getUnderstandingStyle = (understanding) => {
  if (understanding === "理解○") {
    return {
      icon: <CheckCircle className={styles.iconGreen} size={16} />,
      badgeClass: styles.understandingBadgeGreen,
    };
  } else if (understanding?.startsWith("曖昧△")) {
    return {
      icon: <AlertTriangle className={styles.iconYellow} size={16} />,
      badgeClass: styles.understandingBadgeYellow,
    };
  } else if (understanding === "理解できていない×") {
    return {
      icon: <XCircle className={styles.iconRed} size={16} />,
      badgeClass: styles.understandingBadgeRed,
    };
  } else {
    return {
      icon: <Info className={styles.iconGray} size={16} />,
      badgeClass: styles.understandingBadgeGray,
    };
  }
};

// 正解率に応じたバーの色クラスを返す関数
const getCorrectRateColorClass = (rate) => {
  if (rate >= 80) return styles.rateBarColorGreen;
  if (rate >= 60) return styles.rateBarColorLime;
  if (rate >= 40) return styles.rateBarColorYellow;
  if (rate >= 20) return styles.rateBarColorOrange;
  return styles.rateBarColorRed;
};

// 検索文字列内のキーワードをハイライトするコンポーネント
const HighlightedText = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return <span>{text}</span>;

  const normalizedText = text.toString();
  const normalizedSearch = searchTerm.toLowerCase();
  const keywords = normalizedSearch
    .split(/\s+/)
    .filter((keyword) => keyword.trim() !== "");

  if (keywords.length === 0) return <span>{text}</span>;

  // 正規表現をキーワードごとに作成 (大文字小文字を区別しない)
  const regexPattern = keywords
    .map(
      (keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), // 正規表現特殊文字のエスケープ
    )
    .join("|");

  const regex = new RegExp(`(${regexPattern})`, "gi");
  const parts = normalizedText.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const matchesKeyword = keywords.some(
          (keyword) => part.toLowerCase() === keyword.toLowerCase(),
        );
        return matchesKeyword ? (
          <mark key={i} className={styles.highlightedText}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
};

const flashcardSchema = {
  id: String,
  term: String,
  definition: String,
  category: String,
  tags: Array,
  importance: Number,
  lastReviewed: Date,
  nextReview: Date,
  difficulty: String,
  history: Array,
};

// 一度に表示する問題数（パフォーマンス向上のため）
const PAGE_SIZE = 50;

const RedesignedAllQuestionsView = ({
  subjects,
  allQuestions = [],
  expandedSubjects = {},
  expandedChapters = {},
  toggleSubject,
  toggleChapter,
  setEditingQuestion,
  bulkEditMode,
  setBulkEditMode,
  selectedQuestions = [],
  toggleQuestionSelection,
  saveBulkEdit,
  saveBulkEditItems,
  saveComment,
  handleQuestionDateChange,
  filterText,
  setFilterText,
  showAnswered,
  setShowAnswered,
  formatDate,
  addQuestion,
  answerHistory,
  refreshData
}) => {
  // 検索とフィルター用state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null); // 一括編集用の選択日付

  // 問題追加モーダル制御
  const [showAddModal, setShowAddModal] = useState(false);

  // 拡張フィルターstate
  const [filters, setFilters] = useState({
    understanding: "all",
    selectedSubjects: [],
    selectedChapters: [],
    correctRateMin: "",
    correctRateMax: "",
    answerCountMin: "",
    answerCountMax: "",
    nextDateStart: "",
    nextDateEnd: "",
    lastAnsweredStart: "",
    lastAnsweredEnd: "",
  });

  // 科目と章に関するオプション
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [chapterOptions, setChapterOptions] = useState([]);

  // ページング用のstate追加
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);

  // ページリセット用の効果
  useEffect(() => {
    // フィルターが変更されたらページを1ページ目に戻す
    setCurrentPage(0);
  }, [filterText, showAnswered, activeFiltersCount]);

  // 章オプションを更新する関数
  const updateChapterOptions = () => {
    if (!Array.isArray(subjects)) return;

    const selectedSubjectIds = filters.selectedSubjects;

    // 選択された科目がない場合は章リストをクリア
    if (selectedSubjectIds.length === 0) {
      setChapterOptions([]);
      return;
    }

    // 選択された科目に属する全ての章を取得
    const chapters = [];
    subjects.forEach((subject) => {
      if (
        selectedSubjectIds.includes(subject.id) &&
        Array.isArray(subject.chapters)
      ) {
        subject.chapters.forEach((chapter) => {
          chapters.push({
            id: chapter.id,
            name: chapter.name || chapter.chapterName || "未分類",
            subjectId: subject.id,
            subjectName: subject.name || subject.subjectName || "未分類",
          });
        });
      }
    });

    setChapterOptions(chapters);
  };
  
  // アクティブなフィルター数を計算する関数
  const updateActiveFiltersCount = () => {
    let count = 0;

    // 検索語句
    if (searchTerm.trim()) count++;

    // 理解度
    if (filters.understanding !== "all") count++;

    // 科目
    if (
      filters.selectedSubjects.length > 0 &&
      filters.selectedSubjects.length < subjectOptions.length
    )
      count++;

    // 章
    if (
      filters.selectedChapters.length > 0 &&
      filters.selectedChapters.length < chapterOptions.length
    )
      count++;

    // 正解率
    if (filters.correctRateMin || filters.correctRateMax) count++;

    // 解答回数
    if (filters.answerCountMin || filters.answerCountMax) count++;

    // 次回予定日
    if (filters.nextDateStart || filters.nextDateEnd) count++;

    // 最終解答日
    if (filters.lastAnsweredStart || filters.lastAnsweredEnd) count++;

    setActiveFiltersCount(count);
  };
  
  // 選択された科目に基づいて章オプションを更新
  useEffect(() => {
    updateChapterOptions();
  }, [filters.selectedSubjects]);
  
  // subjects が更新されたときにフィルタリングを再適用
  useEffect(() => {
    // フィルターカウントを再計算
    updateActiveFiltersCount();
    
    // データが変更されていれば科目・章オプションを再ロード
    if (subjects && subjects.length > 0) {
      // 科目オプションを抽出
      const subjectOpts = subjects.map((subject) => ({
        id: subject.id,
        name: subject.name || subject.subjectName || "未分類",
      }));
      
      setSubjectOptions(subjectOpts);
      updateChapterOptions();
      console.log("RedesignedAllQuestionsView: subjects 更新を検出");
    }
  }, [subjects]);

  // 科目選択を切り替える
  const toggleSubjectSelection = (subjectId) => {
    setFilters((prev) => {
      const newSelectedSubjects = [...prev.selectedSubjects];
      const index = newSelectedSubjects.indexOf(subjectId);

      if (index > -1) {
        newSelectedSubjects.splice(index, 1);
      } else {
        newSelectedSubjects.push(subjectId);
      }

      // 選択された科目に属さない章があれば選択解除
      const validChapterIds = Array.isArray(subjects)
        ? subjects
            .filter((s) => newSelectedSubjects.includes(s.id))
            .flatMap((s) => s.chapters || [])
            .map((c) => c.id)
        : [];

      const newSelectedChapters = prev.selectedChapters.filter((chapterId) =>
        validChapterIds.includes(chapterId),
      );

      return {
        ...prev,
        selectedSubjects: newSelectedSubjects,
        selectedChapters: newSelectedChapters,
      };
    });
  };

  // 章選択を切り替える
  const toggleChapterSelection = (chapterId) => {
    setFilters((prev) => {
      const newSelectedChapters = [...prev.selectedChapters];
      const index = newSelectedChapters.indexOf(chapterId);

      if (index > -1) {
        newSelectedChapters.splice(index, 1);
      } else {
        newSelectedChapters.push(chapterId);
      }

      return { ...prev, selectedChapters: newSelectedChapters };
    });
  };

  // 全ての科目選択を切り替える
  const toggleAllSubjects = () => {
    setFilters((prev) => {
      const allSubjectIds = subjectOptions.map((s) => s.id);
      const newSelectedSubjects =
        prev.selectedSubjects.length === allSubjectIds.length
          ? []
          : allSubjectIds;

      // 全科目選択が解除された場合は、章の選択も全て解除する
      const newSelectedChapters =
        newSelectedSubjects.length > 0 ? prev.selectedChapters : [];

      return {
        ...prev,
        selectedSubjects: newSelectedSubjects,
        selectedChapters: newSelectedChapters,
      };
    });
  };

  // 全ての章選択を切り替える
  const toggleAllChapters = () => {
    setFilters((prev) => {
      const allChapterIds = chapterOptions.map((c) => c.id);
      const newSelectedChapters =
        prev.selectedChapters.length === allChapterIds.length
          ? []
          : allChapterIds;

      return { ...prev, selectedChapters: newSelectedChapters };
    });
  };

  // アクティブなフィルター数を計算
  useEffect(() => {
    updateActiveFiltersCount();
  }, [filters, searchTerm, subjectOptions.length, chapterOptions.length]);

  // フィルタリングされた問題のカウントと実際に表示する問題の選択
  const { filteredQuestions, paginatedQuestions } = useMemo(() => {
    // フィルター処理は既存の関数をベースに実装
    const tempFilteredQuestions = [];
    
    // まずallQuestionsがあればそれを使う
    if (Array.isArray(allQuestions) && allQuestions.length > 0) {
      console.log(`allQuestionsから${allQuestions.length}件の問題を取得しました`);
      
      allQuestions.forEach(question => {
        if (!question) return;
        
        // 検索フィルタリング (複数キーワード対応)
        const searchKeywords = searchTerm
          .toLowerCase()
          .split(/\s+/)
          .filter(keyword => keyword.trim() !== "");
        
        let matchesSearch = true;
        
        if (searchKeywords.length > 0) {
          const questionId = question.id?.toLowerCase() || "";
          const comment = question.comment?.toLowerCase() || "";
          const subjectName = question.subjectName?.toLowerCase() || "";
          const chapterName = question.chapterName?.toLowerCase() || "";
          
          // いずれかのキーワードがマッチするかチェック (OR検索)
          matchesSearch = searchKeywords.some(
            (keyword) =>
              questionId.includes(keyword) ||
              subjectName.includes(keyword) ||
              chapterName.includes(keyword) ||
              comment.includes(keyword)
          );
        }
        
        // 科目フィルター
        let matchesSubject = true;
        if (filters.selectedSubjects.length > 0) {
          matchesSubject = filters.selectedSubjects.includes(question.subjectId);
        }
        
        // 章フィルター
        let matchesChapter = true;
        if (filters.selectedChapters.length > 0) {
          matchesChapter = filters.selectedChapters.includes(question.chapterId);
        }
        
        // 理解度フィルタリング
        let matchesUnderstanding = true;
        if (filters.understanding !== "all") {
          matchesUnderstanding = question.understanding?.startsWith(filters.understanding) || false;
        }
        
        // 正解率範囲フィルタリング
        let matchesCorrectRate = true;
        const rate = question.correctRate ?? 0;
        if (filters.correctRateMin && rate < parseInt(filters.correctRateMin, 10)) {
          matchesCorrectRate = false;
        }
        if (filters.correctRateMax && rate > parseInt(filters.correctRateMax, 10)) {
          matchesCorrectRate = false;
        }
        
        // 解答回数範囲フィルタリング
        let matchesAnswerCount = true;
        const answerCount = question.answerCount ?? 0;
        if (filters.answerCountMin && answerCount < parseInt(filters.answerCountMin, 10)) {
          matchesAnswerCount = false;
        }
        if (filters.answerCountMax && answerCount > parseInt(filters.answerCountMax, 10)) {
          matchesAnswerCount = false;
        }
        
        // 次回予定日範囲フィルタリング
        let matchesNextDate = true;
        if (question.nextDate) {
          const nextDate = new Date(question.nextDate);
          if (filters.nextDateStart) {
            const startDate = new Date(filters.nextDateStart);
            if (nextDate < startDate) matchesNextDate = false;
          }
          if (filters.nextDateEnd) {
            const endDate = new Date(filters.nextDateEnd);
            endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
            if (nextDate > endDate) matchesNextDate = false;
          }
        } else if (filters.nextDateStart || filters.nextDateEnd) {
          // 次回予定日が設定されておらず、フィルターが有効な場合は除外
          matchesNextDate = false;
        }
        
        // 最終解答日範囲フィルタリング
        let matchesLastAnswered = true;
        if (question.lastAnswered) {
          const lastAnswered = new Date(question.lastAnswered);
          if (filters.lastAnsweredStart) {
            const startDate = new Date(filters.lastAnsweredStart);
            if (lastAnswered < startDate) matchesLastAnswered = false;
          }
          if (filters.lastAnsweredEnd) {
            const endDate = new Date(filters.lastAnsweredEnd);
            endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
            if (lastAnswered > endDate) matchesLastAnswered = false;
          }
        } else if (filters.lastAnsweredStart || filters.lastAnsweredEnd) {
          // 最終解答日が設定されておらず、フィルターが有効な場合は除外
          matchesLastAnswered = false;
        }
        
        // 解答済みフィルタリング条件
        const matchesAnsweredFilter = showAnswered || !question.lastAnswered;
        
        // すべての条件を満たす場合
        if (matchesSearch && matchesSubject && matchesChapter && 
            matchesUnderstanding && matchesCorrectRate && 
            matchesAnswerCount && matchesNextDate && 
            matchesLastAnswered && matchesAnsweredFilter) {
          tempFilteredQuestions.push(question);
        }
      });
    } 
    // 古い方法（subjectsから直接抽出）はバックアップとして残す
    else if (Array.isArray(subjects)) {
      // 各科目をループ
      subjects.forEach(subject => {
        if (!subject) return;
        
        // 選択されたフィルターに基づいて科目をフィルタリング
        if (filters.selectedSubjects.length > 0 && !filters.selectedSubjects.includes(subject.id)) {
          return;
        }
        
        // chaptersが配列であることを確認
        if (Array.isArray(subject.chapters)) {
          subject.chapters.forEach(chapter => {
            if (!chapter) return;
            
            // 選択されたフィルターに基づいて章をフィルタリング
            if (filters.selectedChapters.length > 0 && !filters.selectedChapters.includes(chapter.id)) {
              return;
            }
            
            // questionsが配列であることを確認
            if (Array.isArray(chapter.questions)) {
              // 各問題をループ
              chapter.questions.forEach(question => {
                if (!question) return;
                
                // 検索フィルタリング (複数キーワード対応)
                const searchKeywords = searchTerm
                  .toLowerCase()
                  .split(/\s+/)
                  .filter(keyword => keyword.trim() !== "");
                
                let matchesSearch = true;
                
                if (searchKeywords.length > 0) {
                  const questionId = question.id?.toLowerCase() || "";
                  const comment = question.comment?.toLowerCase() || "";
                  const subjectName = subject.name?.toLowerCase() || subject.subjectName?.toLowerCase() || "";
                  const chapterName = chapter.name?.toLowerCase() || chapter.chapterName?.toLowerCase() || "";
                  
                  // いずれかのキーワードがマッチするかチェック (OR検索)
                  matchesSearch = searchKeywords.some(
                    (keyword) =>
                      questionId.includes(keyword) ||
                      subjectName.includes(keyword) ||
                      chapterName.includes(keyword) ||
                      comment.includes(keyword)
                  );
                }
                
                // 理解度フィルタリング
                let matchesUnderstanding = true;
                if (filters.understanding !== "all") {
                  matchesUnderstanding = question.understanding?.startsWith(filters.understanding) || false;
                }
                
                // 正解率範囲フィルタリング
                let matchesCorrectRate = true;
                const rate = question.correctRate ?? 0;
                if (filters.correctRateMin && rate < parseInt(filters.correctRateMin, 10)) {
                  matchesCorrectRate = false;
                }
                if (filters.correctRateMax && rate > parseInt(filters.correctRateMax, 10)) {
                  matchesCorrectRate = false;
                }
                
                // 解答回数範囲フィルタリング
                let matchesAnswerCount = true;
                const answerCount = question.answerCount ?? 0;
                if (filters.answerCountMin && answerCount < parseInt(filters.answerCountMin, 10)) {
                  matchesAnswerCount = false;
                }
                if (filters.answerCountMax && answerCount > parseInt(filters.answerCountMax, 10)) {
                  matchesAnswerCount = false;
                }
                
                // 次回予定日範囲フィルタリング
                let matchesNextDate = true;
                if (question.nextDate) {
                  const nextDate = new Date(question.nextDate);
                  if (filters.nextDateStart) {
                    const startDate = new Date(filters.nextDateStart);
                    if (nextDate < startDate) matchesNextDate = false;
                  }
                  if (filters.nextDateEnd) {
                    const endDate = new Date(filters.nextDateEnd);
                    endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
                    if (nextDate > endDate) matchesNextDate = false;
                  }
                } else if (filters.nextDateStart || filters.nextDateEnd) {
                  // 次回予定日が設定されておらず、フィルターが有効な場合は除外
                  matchesNextDate = false;
                }
                
                // 最終解答日範囲フィルタリング
                let matchesLastAnswered = true;
                if (question.lastAnswered) {
                  const lastAnswered = new Date(question.lastAnswered);
                  if (filters.lastAnsweredStart) {
                    const startDate = new Date(filters.lastAnsweredStart);
                    if (lastAnswered < startDate) matchesLastAnswered = false;
                  }
                  if (filters.lastAnsweredEnd) {
                    const endDate = new Date(filters.lastAnsweredEnd);
                    endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
                    if (lastAnswered > endDate) matchesLastAnswered = false;
                  }
                } else if (filters.lastAnsweredStart || filters.lastAnsweredEnd) {
                  // 最終解答日が設定されておらず、フィルターが有効な場合は除外
                  matchesLastAnswered = false;
                }
                
                // 解答済みフィルタリング条件
                const matchesAnsweredFilter = showAnswered || !question.lastAnswered;
                
                // すべての条件を満たす場合
                if (matchesSearch && matchesUnderstanding && matchesCorrectRate && 
                    matchesAnswerCount && matchesNextDate && matchesLastAnswered && matchesAnsweredFilter) {
                  tempFilteredQuestions.push({
                    ...question,
                    chapterId: chapter.id,
                    chapterName: chapter.name || chapter.chapterName || '',
                    subjectId: subject.id,
                    subjectName: subject.name || subject.subjectName || ''
                  });
                }
              });
            }
          });
        }
      });
    }
    
    // 自然順でソート
    tempFilteredQuestions.sort((a, b) => {
      // 既存のソート方法を使用
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    
    // 総件数を保存（ページング計算用）
    setTotalFilteredCount(tempFilteredQuestions.length);
    
    // ページングのためのスライス
    const startIndex = currentPage * PAGE_SIZE;
    const paginated = tempFilteredQuestions.slice(startIndex, startIndex + PAGE_SIZE);
    
    return { 
      filteredQuestions: tempFilteredQuestions,
      paginatedQuestions: paginated
    };
  }, [allQuestions, subjects, searchTerm, filters, showAnswered, currentPage]);
  
  // 総ページ数の計算
  const totalPages = Math.ceil(totalFilteredCount / PAGE_SIZE);
  
  // ページ移動ハンドラー
  const handlePageChange = (newPage) => {
    // 範囲チェック
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      // ページトップにスクロール
      window.scrollTo(0, 0);
    }
  };
  
  // ページャーコンポーネント
  const Paginator = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-4 mb-4">
        <button 
          onClick={() => handlePageChange(0)} 
          disabled={currentPage === 0}
          className="px-3 py-1 mx-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ≪ 最初
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 0}
          className="px-3 py-1 mx-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ＜ 前へ
        </button>
        
        <div className="mx-2">
          {currentPage + 1} / {totalPages} ページ
        </div>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1 mx-1 bg-gray-200 rounded disabled:opacity-50"
        >
          次へ ＞
        </button>
        <button 
          onClick={() => handlePageChange(totalPages - 1)} 
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1 mx-1 bg-gray-200 rounded disabled:opacity-50"
        >
          最後 ≫
        </button>
      </div>
    );
  };

  // すべてのフィルターをリセット
  const resetAllFilters = () => {
    setSearchTerm("");
    setFilters({
      understanding: "all",
      selectedSubjects: [],
      selectedChapters: [],
      correctRateMin: "",
      correctRateMax: "",
      answerCountMin: "",
      answerCountMax: "",
      nextDateStart: "",
      nextDateEnd: "",
      lastAnsweredStart: "",
      lastAnsweredEnd: "",
    });
  };

  // 科目内の全問題選択/選択解除
  const toggleSelectAllForSubject = (subject) => {
    if (!subject?.chapters) return;

    const allQuestionIdsInSubject = [];
    subject.chapters.forEach((chapter) => {
      chapter.questions.forEach((question) => {
        allQuestionIdsInSubject.push(question.id);
      });
    });

    if (allQuestionIdsInSubject.length === 0) return;

    // 全て選択されているかチェック
    const allSelected = allQuestionIdsInSubject.every((id) =>
      selectedQuestions.includes(id),
    );

    if (allSelected) {
      // 全て選択されていれば、全て解除
      toggleQuestionSelection((prev) =>
        prev.filter((id) => !allQuestionIdsInSubject.includes(id)),
      );
    } else {
      // そうでなければ、全て選択
      toggleQuestionSelection((prev) => [
        ...new Set([...prev, ...allQuestionIdsInSubject]),
      ]);
    }
  };

  // 一括編集用の関数
  const handleBulkEditDateSubmit = () => {
    if (!selectedDate || selectedQuestions.length === 0) {
      alert('日付と少なくとも1つの問題を選択してください');
      return;
    }
    
    try {
      // saveBulkEditItemsを呼び出して日付を一括更新
      saveBulkEditItems({ nextDate: selectedDate }, selectedQuestions);
      
      // 更新完了の通知
      alert(`${selectedQuestions.length}件の問題の次回日付を「${selectedDate}」に設定しました`);
      
      // 必要に応じてデータをリフレッシュ
      if (refreshData) {
        setTimeout(refreshData, 100);
      }
    } catch (e) {
      console.error('一括編集処理中にエラーが発生しました:', e);
      alert('一括編集処理中にエラーが発生しました');
    }
  };

  return (
    <div className={styles.container}>
      {/* 検索・フィルターコントロール */}
      <div className={styles.controlsContainer}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="キーワードで検索 (問題ID、科目名、章名、コメント)"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.searchIcon}>
            <Search size={18} />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className={styles.clearSearchButton}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        <div className={styles.controlButtons}>
          <button
            onClick={() => setShowAddModal(true)}
            className={styles.addButton}
          >
            <PlusCircle size={18} />
            新規問題追加
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${styles.controlButton} ${activeFiltersCount > 0 ? styles.activeFilterButton : ""}`}
          >
            <Filter size={18} />
            フィルター
            {activeFiltersCount > 0 && (
              <span className={styles.filterBadge}>{activeFiltersCount}</span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={`${styles.controlButton} ${
              bulkEditMode
                ? styles.bulkEditButtonActive
                : styles.bulkEditButtonInactive
            }`}
          >
            {bulkEditMode ? "選択終了" : "一括編集"}
          </button>
        </div>
      </div>

      {/* 新規問題追加モーダル */}
      {showAddModal && (
        <AddQuestionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(newQuestion) => {
            addQuestion(newQuestion);
            setShowAddModal(false);
          }}
          subjects={subjects}
        />
      )}

      {/* 拡張フィルターパネル */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>基本フィルター</h3>
            <div className={styles.filterGrid}>
              <div>
                <label className={styles.filterLabel}>理解度</label>
                <select
                  className={styles.filterSelect}
                  value={filters.understanding}
                  onChange={(e) =>
                    setFilters({ ...filters, understanding: e.target.value })
                  }
                >
                  <option value="all">すべて</option>
                  <option value="理解○">理解○</option>
                  <option value="曖昧△">曖昧△</option>
                  <option value="理解できていない×">理解できていない×</option>
                </select>
              </div>

              <div>
                <label className={styles.filterLabel}>正解率 (%)</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="最小"
                    className={styles.rangeInput}
                    value={filters.correctRateMin}
                    onChange={(e) =>
                      setFilters({ ...filters, correctRateMin: e.target.value })
                    }
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="最大"
                    className={styles.rangeInput}
                    value={filters.correctRateMax}
                    onChange={(e) =>
                      setFilters({ ...filters, correctRateMax: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className={styles.filterLabel}>解答回数</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="number"
                    min="0"
                    placeholder="最小"
                    className={styles.rangeInput}
                    value={filters.answerCountMin}
                    onChange={(e) =>
                      setFilters({ ...filters, answerCountMin: e.target.value })
                    }
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="最大"
                    className={styles.rangeInput}
                    value={filters.answerCountMax}
                    onChange={(e) =>
                      setFilters({ ...filters, answerCountMax: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>日付フィルター</h3>
            <div className={styles.filterGrid}>
              <div>
                <label className={styles.filterLabel}>次回予定日</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.nextDateStart}
                    onChange={(e) =>
                      setFilters({ ...filters, nextDateStart: e.target.value })
                    }
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.nextDateEnd}
                    onChange={(e) =>
                      setFilters({ ...filters, nextDateEnd: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className={styles.filterLabel}>最終解答日</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.lastAnsweredStart}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        lastAnsweredStart: e.target.value,
                      })
                    }
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.lastAnsweredEnd}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        lastAnsweredEnd: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>科目・章フィルター</h3>

            {/* 科目選択 */}
            <div className={styles.multiSelectContainer}>
              <div className={styles.multiSelectHeader}>
                <label className={styles.filterLabel}>科目</label>
                <button
                  className={styles.toggleAllButton}
                  onClick={toggleAllSubjects}
                >
                  {filters.selectedSubjects.length === subjectOptions.length
                    ? "全て解除"
                    : "全て選択"}
                </button>
              </div>
              <div className={styles.multiSelectGrid}>
                {subjectOptions.map((subject) => (
                  <div key={subject.id} className={styles.checkboxItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={filters.selectedSubjects.includes(subject.id)}
                        onChange={() => toggleSubjectSelection(subject.id)}
                        className={styles.checkbox}
                      />
                      <span>{subject.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 章選択 (科目が選択されている場合のみ表示) */}
            {filters.selectedSubjects.length > 0 &&
              chapterOptions.length > 0 && (
                <div className={styles.multiSelectContainer}>
                  <div className={styles.multiSelectHeader}>
                    <label className={styles.filterLabel}>章</label>
                    <button
                      className={styles.toggleAllButton}
                      onClick={toggleAllChapters}
                    >
                      {filters.selectedChapters.length === chapterOptions.length
                        ? "全て解除"
                        : "全て選択"}
                    </button>
                  </div>
                  <div className={styles.multiSelectGrid}>
                    {chapterOptions.map((chapter) => (
                      <div key={chapter.id} className={styles.checkboxItem}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={filters.selectedChapters.includes(
                              chapter.id,
                            )}
                            onChange={() => toggleChapterSelection(chapter.id)}
                            className={styles.checkbox}
                          />
                          <span
                            title={`${chapter.subjectName}: ${chapter.name}`}
                          >
                            {chapter.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={resetAllFilters}
              className={styles.filterResetButton}
            >
              <XIcon size={14} className={styles.resetIcon} />
              フィルターをリセット
            </button>
          </div>
        </div>
      )}

      {/* 一括編集パネル */}
      {bulkEditMode && selectedQuestions.length > 0 && (
        <div className={styles.bulkEditPanel}>
          <p className={styles.bulkEditMessage}>
            {selectedQuestions.length}件の問題を選択中
          </p>
          <div className={styles.bulkEditControls}>
            <input
              type="date"
              value={selectedDate ? selectedDate : ''}
              onChange={(e) => {
                try {
                  // 日付文字列をそのまま保持
                  const dateStr = e.target.value;
                  console.log("選択された日付文字列:", dateStr);
                  
                  if (dateStr) {
                    setSelectedDate(dateStr);
                  } else {
                    setSelectedDate(null);
                  }
                } catch (e) {
                  console.error("日付処理エラー:", e);
                  setSelectedDate(null);
                }
              }}
              className={styles.bulkEditDateInput}
            />
            <button
              onClick={handleBulkEditDateSubmit}
              disabled={!selectedDate}
              className={styles.bulkEditButton}
            >
              次回日付を一括設定
            </button>
          </div>
        </div>
      )}

      {/* 総件数表示 */}
      <div className="mb-2 text-sm text-gray-600">
        検索結果: {totalFilteredCount}件中 {currentPage * PAGE_SIZE + 1}～{Math.min((currentPage + 1) * PAGE_SIZE, totalFilteredCount)}件を表示
      </div>
      
      {/* ページャー（上部） */}
      <Paginator />
      
      {/* 問題リスト - filteredQuestionsをpaginatedQuestionsに変更 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-4">
        {paginatedQuestions.length > 0 ? (
          <table className="min-w-full">
            {/* テーブルヘッダー */}
            <thead>
              <tr className={styles.tableHeader}>
                {bulkEditMode && <th className={styles.checkboxHeader}></th>}
                <th className={styles.idHeader}>ID</th>
                <th className={styles.subjectHeader}>科目</th>
                <th className={styles.chapterHeader}>章</th>
                <th className={styles.understandingHeader}>理解度</th>
                <th className={styles.actionHeader}></th>
              </tr>
            </thead>
            {/* テーブルボディ */}
            <tbody>
              {paginatedQuestions.map((question) => (
                <tr key={question.id} className={styles.questionRow}>
                  {bulkEditMode && (
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className={styles.checkbox}
                      />
                    </td>
                  )}
                  <td className={styles.idCell}>
                    <div className={styles.idText}>{question.id}</div>
                  </td>
                  <td className={styles.subjectCell}>
                    <div className={styles.subjectText}
                      style={{ 
                        borderLeftColor: getSubjectColorCode(question.subjectName)
                      }}
                    >
                      <HighlightedText text={question.subjectName} searchTerm={searchTerm} />
                    </div>
                  </td>
                  <td className={styles.chapterCell}>
                    <div className={styles.chapterText}>
                      <HighlightedText text={question.chapterName} searchTerm={searchTerm} />
                    </div>
                  </td>
                  <td className={styles.understandingCell}>
                    {question.understanding && (
                      <div className={getUnderstandingStyle(question.understanding).badgeClass}>
                        {getUnderstandingStyle(question.understanding).icon}
                        <span>{question.understanding}</span>
                      </div>
                    )}
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      className={styles.editButton}
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Edit size={16} />
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            該当する問題がありません
          </div>
        )}
      </div>
      
      {/* ページャー（下部） */}
      <Paginator />
    </div>
  );
};

export default RedesignedAllQuestionsView;
