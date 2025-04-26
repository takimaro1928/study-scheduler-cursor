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
  const { filteredQuestions, paginatedQuestions, filteredSubjects } = useMemo(() => {
    console.log("RedesignedAllQuestionsView: フィルタリング処理開始");
    console.log("subjects:", subjects);
    console.log("allQuestions:", allQuestions);
    
    // フィルタリングされたサブジェクトデータを保持
    let tempFilteredSubjects = [];
    
    // 検索キーワードを配列化 (スペース区切り)
    const searchKeywords = searchTerm
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k);
      
    // 全問題配列（フラット化したリスト）
    const tempFilteredQuestions = [];
    
    // 科目データが存在する場合は階層処理
    if (Array.isArray(subjects) && subjects.length > 0) {
      console.log(`科目データを処理: ${subjects.length}件`);
      
      // 科目ごとの処理
      tempFilteredSubjects = subjects
        .map((subject) => {
          if (!subject?.chapters) {
            console.log(`警告: 科目 ${subject?.name || subject?.id || '不明'} にchaptersがありません`);
            return { ...subject, chapters: [] };
          }
  
          // 科目名を取得
          const subjectName = subject.name || subject.subjectName || "未分類";
          const subjectId = subject.id;
          
          console.log(`科目処理中: ${subjectName}, ${subject.chapters.length}章`);
  
          // 科目フィルター (アクティブな場合のみ適用)
          if (
            filters.selectedSubjects.length > 0 &&
            !filters.selectedSubjects.includes(subjectId)
          ) {
            return { ...subject, chapters: [] };
          }
  
          // 章ごとの処理
          const filteredChapters = subject.chapters
            .map((chapter) => {
              if (!chapter?.questions) {
                console.log(`警告: 章 ${chapter?.name || chapter?.id || '不明'} にquestionsがありません`);
                return { ...chapter, questions: [] };
              }
              
              console.log(`章処理中: ${chapter.name || chapter.chapterName || '不明'}, ${chapter.questions.length}問`);
  
              // 章名を取得
              const chapterName = chapter.name || chapter.chapterName || "未分類";
              const chapterId = chapter.id;
  
              // 章フィルター (アクティブな場合のみ適用)
              if (
                filters.selectedChapters.length > 0 &&
                !filters.selectedChapters.includes(chapterId)
              ) {
                return { ...chapter, questions: [] };
              }
  
              // 章内の問題をフィルタリング
              const filteredQuestions = chapter.questions.filter((question) => {
                if (!question) return false;
                
                // 検索フィルタリング (検索語句がある場合のみ)
                if (searchKeywords.length > 0) {
                  const questionId = question.id?.toLowerCase() || "";
                  const comment = question.comment?.toLowerCase() || "";
  
                  // キーワードのいずれかが一致するか確認
                  const keywordMatch = searchKeywords.some(
                    (keyword) =>
                      questionId.includes(keyword) ||
                      subjectName.toLowerCase().includes(keyword) ||
                      chapterName.toLowerCase().includes(keyword) ||
                      comment.includes(keyword),
                  );
  
                  if (!keywordMatch) return false;
                }
  
                // 理解度フィルタリング (「すべて」以外が選択されている場合のみ)
                if (filters.understanding !== "all") {
                  if (
                    !question.understanding?.startsWith(filters.understanding)
                  ) {
                    return false;
                  }
                }
  
                // 正解率範囲フィルタリング (値が設定されている場合のみ)
                const rate = question.correctRate ?? 0;
                if (
                  filters.correctRateMin &&
                  rate < parseInt(filters.correctRateMin, 10)
                )
                  return false;
                if (
                  filters.correctRateMax &&
                  rate > parseInt(filters.correctRateMax, 10)
                )
                  return false;
  
                // 解答回数範囲フィルタリング (値が設定されている場合のみ)
                const answerCount = question.answerCount ?? 0;
                if (
                  filters.answerCountMin &&
                  answerCount < parseInt(filters.answerCountMin, 10)
                )
                  return false;
                if (
                  filters.answerCountMax &&
                  answerCount > parseInt(filters.answerCountMax, 10)
                )
                  return false;
  
                // 次回予定日範囲フィルタリング (値が設定されている場合のみ)
                if (question.nextDate) {
                  const nextDate = new Date(question.nextDate);
                  if (filters.nextDateStart) {
                    const startDate = new Date(filters.nextDateStart);
                    if (nextDate < startDate) return false;
                  }
                  if (filters.nextDateEnd) {
                    const endDate = new Date(filters.nextDateEnd);
                    endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
                    if (nextDate > endDate) return false;
                  }
                } else if (filters.nextDateStart || filters.nextDateEnd) {
                  // 次回予定日が設定されておらず、フィルターが有効な場合は除外
                  return false;
                }
  
                // 最終解答日範囲フィルタリング (値が設定されている場合のみ)
                if (question.lastAnswered) {
                  const lastAnswered = new Date(question.lastAnswered);
                  if (filters.lastAnsweredStart) {
                    const startDate = new Date(filters.lastAnsweredStart);
                    if (lastAnswered < startDate) return false;
                  }
                  if (filters.lastAnsweredEnd) {
                    const endDate = new Date(filters.lastAnsweredEnd);
                    endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
                    if (lastAnswered > endDate) return false;
                  }
                } else if (filters.lastAnsweredStart || filters.lastAnsweredEnd) {
                  // 最終解答日が設定されておらず、フィルターが有効な場合は除外
                  return false;
                }
                
                // 解答済みフィルタリング条件 (showAnsweredがfalseの場合のみ適用)
                if (!showAnswered && question.lastAnswered) {
                  return false;
                }
  
                // 全フィルターをパスした問題を全問題配列にも追加
                tempFilteredQuestions.push({
                  ...question,
                  subjectId,
                  subjectName,
                  chapterId,
                  chapterName,
                });
                
                return true;
              });
  
              return { ...chapter, questions: filteredQuestions };
            })
            .filter((chapter) => chapter.questions.length > 0);
  
          return { ...subject, chapters: filteredChapters };
        })
        .filter((subject) => subject.chapters.length > 0);
    } 
    // allQuestionsがある場合はそれもバックアップとして使用
    else if (Array.isArray(allQuestions) && allQuestions.length > 0) {
      console.log(`allQuestionsから${allQuestions.length}件の問題を取得しました`);
      
      // allQuestionsから問題を収集
      allQuestions.forEach(question => {
        if (question) {
          let passes = true;
          
          // 検索フィルタリング (検索語句がある場合のみ)
          if (searchKeywords.length > 0) {
            const questionId = question.id?.toLowerCase() || "";
            const comment = question.comment?.toLowerCase() || "";
            const subjectName = question.subjectName?.toLowerCase() || "";
            const chapterName = question.chapterName?.toLowerCase() || "";
            
            // キーワードのいずれかが一致するか確認
            passes = searchKeywords.some(
              (keyword) =>
                questionId.includes(keyword) ||
                subjectName.includes(keyword) ||
                chapterName.includes(keyword) ||
                comment.includes(keyword)
            );
            
            if (!passes) return; // この問題はスキップ
          }
          
          // 理解度フィルタリング (「すべて」以外が選択されている場合のみ)
          if (filters.understanding !== "all") {
            passes = question.understanding?.startsWith(filters.understanding) || false;
            if (!passes) return;
          }
          
          // 正解率範囲フィルタリング (値が設定されている場合のみ)
          const rate = question.correctRate ?? 0;
          if (filters.correctRateMin && rate < parseInt(filters.correctRateMin, 10)) return;
          if (filters.correctRateMax && rate > parseInt(filters.correctRateMax, 10)) return;
          
          // 解答回数範囲フィルタリング (値が設定されている場合のみ)
          const answerCount = question.answerCount ?? 0;
          if (filters.answerCountMin && answerCount < parseInt(filters.answerCountMin, 10)) return;
          if (filters.answerCountMax && answerCount > parseInt(filters.answerCountMax, 10)) return;
          
          // 次回予定日範囲フィルタリング (値が設定されている場合のみ)
          if (question.nextDate) {
            const nextDate = new Date(question.nextDate);
            if (filters.nextDateStart) {
              const startDate = new Date(filters.nextDateStart);
              if (nextDate < startDate) return;
            }
            if (filters.nextDateEnd) {
              const endDate = new Date(filters.nextDateEnd);
              endDate.setHours(23, 59, 59, 999);
              if (nextDate > endDate) return;
            }
          } else if (filters.nextDateStart || filters.nextDateEnd) {
            return;
          }
          
          // 最終解答日範囲フィルタリング (値が設定されている場合のみ)
          if (question.lastAnswered) {
            const lastAnswered = new Date(question.lastAnswered);
            if (filters.lastAnsweredStart) {
              const startDate = new Date(filters.lastAnsweredStart);
              if (lastAnswered < startDate) return;
            }
            if (filters.lastAnsweredEnd) {
              const endDate = new Date(filters.lastAnsweredEnd);
              endDate.setHours(23, 59, 59, 999);
              if (lastAnswered > endDate) return;
            }
          } else if (filters.lastAnsweredStart || filters.lastAnsweredEnd) {
            return;
          }
          
          // 解答済みフィルタリング条件 (showAnsweredがfalseの場合のみ適用)
          if (!showAnswered && question.lastAnswered) {
            return;
          }
          
          // 条件を満たす問題を追加
          tempFilteredQuestions.push(question);
        }
      });
      
      // 問題データはあるがsubjectsがない場合は、仮の科目構造を作成
      if (tempFilteredQuestions.length > 0 && tempFilteredSubjects.length === 0) {
        console.log("問題データから科目構造を生成します");
        
        // 問題からユニークな科目を抽出
        const subjectMap = new Map();
        
        tempFilteredQuestions.forEach(question => {
          const subjectId = question.subjectId || 'unknown';
          const subjectName = question.subjectName || '未分類';
          
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              id: subjectId,
              name: subjectName,
              chapters: new Map()
            });
          }
          
          const subject = subjectMap.get(subjectId);
          const chapterId = question.chapterId || 'unknown';
          const chapterName = question.chapterName || '未分類';
          
          if (!subject.chapters.has(chapterId)) {
            subject.chapters.set(chapterId, {
              id: chapterId,
              name: chapterName,
              questions: []
            });
          }
          
          subject.chapters.get(chapterId).questions.push(question);
        });
        
        // Mapから配列に変換
        tempFilteredSubjects = Array.from(subjectMap.values()).map(subject => ({
          ...subject,
          chapters: Array.from(subject.chapters.values())
        }));
        
        console.log(`科目構造生成完了: ${tempFilteredSubjects.length}科目`);
      }
    } else {
      console.warn("警告: subjects と allQuestions の両方が空または無効です");
    }
    
    console.log(`フィルタリング後の問題数: ${tempFilteredQuestions.length}`);
    console.log(`フィルタリング後の科目数: ${tempFilteredSubjects.length}`);
    
    // 自然順でソート
    tempFilteredQuestions.sort((a, b) => {
      return a.id?.localeCompare(b.id, undefined, { numeric: true }) || 0;
    });
    
    // 総件数を保存（ページング計算用）
    setTotalFilteredCount(tempFilteredQuestions.length);
    
    // ページングのためのスライス
    const startIndex = currentPage * PAGE_SIZE;
    const paginated = tempFilteredQuestions.slice(startIndex, startIndex + PAGE_SIZE);
    
    console.log(`ページング処理後の表示問題数: ${paginated.length}`);
    
    // subjects と allQuestions が共に空の場合、ダミーデータを作成（開発用）
    if (tempFilteredSubjects.length === 0 && tempFilteredQuestions.length === 0) {
      console.warn("データが存在しません。初期化されていない可能性があります。");
    }
    
    return { 
      filteredQuestions: tempFilteredQuestions,
      paginatedQuestions: paginated,
      filteredSubjects: tempFilteredSubjects
    };
  }, [subjects, allQuestions, searchTerm, filters, showAnswered, currentPage]);
  
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

  // リセットボタンの動作を改善
  const resetAllFilters = () => {
    console.log("すべてのフィルターをリセットします");
    setSearchTerm("");
    setCurrentPage(0);
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
    setShowAnswered(true);
    
    // データの再読み込み
    if (refreshData) {
      console.log("データを再読み込みします");
      setTimeout(refreshData, 100);
    }
  };

  // ★ 科目内の全問題選択/選択解除 ★
  const toggleSelectAllForSubject = (subject) => {
    if (!subject || !Array.isArray(subject.chapters)) return;

    // 科目内の全問題IDを収集
    const allQuestionIdsInSubject = [];
    subject.chapters.forEach((chapter) => {
      if (Array.isArray(chapter.questions)) {
        chapter.questions.forEach((question) => {
          if (question && question.id) {
            allQuestionIdsInSubject.push(question.id);
          }
        });
      }
    });

    if (allQuestionIdsInSubject.length === 0) return;

    // 全て選択されているかチェック
    const allSelected = allQuestionIdsInSubject.every((id) =>
      selectedQuestions.includes(id)
    );

    if (allSelected) {
      // 全て選択されていれば、全て解除
      const newSelectedQuestions = selectedQuestions.filter(
        (id) => !allQuestionIdsInSubject.includes(id)
      );
      toggleQuestionSelection(newSelectedQuestions);
    } else {
      // そうでなければ、全て選択
      const newSelectedQuestions = [
        ...new Set([...selectedQuestions, ...allQuestionIdsInSubject]),
      ];
      toggleQuestionSelection(newSelectedQuestions);
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

  // 問題リストの階層表示をレンダリングする関数
  const renderHierarchicalList = () => {
    return (
      <div className={styles.hierarchicalList}>
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <div key={subject.id} className={styles.subjectSection}>
              {/* 科目ヘッダー */}
              <div 
                className={styles.subjectHeader}
                onClick={() => toggleSubject && toggleSubject(subject.id)}
                style={{ 
                  borderLeftColor: getSubjectColorCode(subject.name || subject.subjectName)
                }}
              >
                {expandedSubjects[subject.id] ? (
                  <ChevronDown className={styles.chevronIcon} />
                ) : (
                  <ChevronRight className={styles.chevronIcon} />
                )}
                <span className={styles.subjectName}>
                  {subject.name || subject.subjectName || "未分類"}
                </span>
                <span className={styles.questionCount}>
                  {subject.chapters.reduce(
                    (total, chapter) => total + chapter.questions.length,
                    0
                  )}問
                </span>
                
                {/* 一括編集モード時、科目内全ての問題を選択するチェックボックス */}
                {bulkEditMode && (
                  <div 
                    className={styles.bulkCheckboxContainer}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectAllForSubject && toggleSelectAllForSubject(subject);
                    }}
                  >
                    <input
                      type="checkbox"
                      className={styles.bulkCheckbox}
                      checked={
                        subject.chapters.every(chapter =>
                          chapter.questions.every(q => selectedQuestions.includes(q.id))
                        )
                      }
                      onChange={() => {}} // イベントハンドラは親divで処理
                    />
                  </div>
                )}
              </div>
              
              {/* 展開時の章リスト */}
              {expandedSubjects[subject.id] && (
                <div className={styles.chaptersContainer}>
                  {subject.chapters.map((chapter) => (
                    <div key={chapter.id} className={styles.chapterSection}>
                      {/* 章ヘッダー */}
                      <div 
                        className={styles.chapterHeader}
                        onClick={() => toggleChapter && toggleChapter(chapter.id)}
                      >
                        {expandedChapters[chapter.id] ? (
                          <ChevronDown className={styles.chevronIconSmall} />
                        ) : (
                          <ChevronRight className={styles.chevronIconSmall} />
                        )}
                        <span className={styles.chapterName}>
                          {chapter.name || chapter.chapterName || "未分類"}
                        </span>
                        <span className={styles.questionCount}>
                          {chapter.questions.length}問
                        </span>
                      </div>
                      
                      {/* 展開時の問題リスト */}
                      {expandedChapters[chapter.id] && (
                        <div className={styles.questionsContainer}>
                          {chapter.questions.map((question) => (
                            <div 
                              key={question.id} 
                              className={styles.questionCard}
                              style={{
                                borderLeftColor: getSubjectColorCode(subject.name || subject.subjectName)
                              }}
                            >
                              {/* 一括編集モード時のチェックボックス */}
                              {bulkEditMode && (
                                <div className={styles.questionCheckbox}>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuestions.includes(question.id)}
                                    onChange={() => toggleQuestionSelection && toggleQuestionSelection(question.id)}
                                    className={styles.checkbox}
                                  />
                                </div>
                              )}
                              
                              {/* 問題カード内容 */}
                              <div className={styles.questionInfo}>
                                <div className={styles.questionId}>
                                  {question.id}
                                </div>
                                
                                <div className={styles.questionMeta}>
                                  {/* 次回予定日 */}
                                  {question.nextDate && (
                                    <div className={styles.nextDateContainer}>
                                      <Clock size={14} className={styles.metaIcon} />
                                      <span className={styles.nextDateText}>
                                        {formatDate && formatDate(question.nextDate)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* 理解度 */}
                                  {question.understanding && (
                                    <div className={getUnderstandingStyle(question.understanding).badgeClass}>
                                      {getUnderstandingStyle(question.understanding).icon}
                                      <span>{question.understanding}</span>
                                    </div>
                                  )}
                                  
                                  {/* 正解率 */}
                                  {question.correctRate !== undefined && (
                                    <div className={styles.correctRateContainer}>
                                      <div className={styles.rateBarContainer}>
                                        <div 
                                          className={`${styles.rateBar} ${getCorrectRateColorClass(question.correctRate)}`} 
                                          style={{ width: `${question.correctRate}%` }}
                                        />
                                      </div>
                                      <span className={styles.correctRateText}>
                                        <Percent size={14} className={styles.percentIcon} />
                                        {question.correctRate}%
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* コメントがある場合のインジケータ */}
                                  {question.comment && (
                                    <div className={styles.commentIndicator}>
                                      <MessageSquare size={14} className={styles.commentIcon} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* 編集ボタン */}
                              <button
                                className={styles.editButton}
                                onClick={() => setEditingQuestion && setEditingQuestion(question)}
                              >
                                <Edit size={16} />
                                編集
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <AlertTriangle className={styles.noResultsIcon} />
            <p>該当する問題がありません</p>
            {/* リセットボタンを追加 */}
            <button 
              onClick={resetAllFilters} 
              className={`${styles.resetSearchButton} mt-3`}
            >
              フィルターをリセット
            </button>
          </div>
        )}
      </div>
    );
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
      <div className={styles.resultsSummary}>
        検索結果: {totalFilteredCount}件
        {totalFilteredCount > 0 && (
          <span className={styles.pageInfo}>
            (表示モード: 科目別階層表示)
          </span>
        )}
      </div>
      
      {/* 階層表示の問題リスト */}
      {renderHierarchicalList()}
    </div>
  );
};

export default RedesignedAllQuestionsView;
