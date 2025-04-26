// src/TodayView.js
// 【App.js の useMemo 修正対応版】
// props で getTodayQuestions の代わりに todayQuestions を受け取り、
// 表示部分で科目名・章名を安全に表示するように修正。

import React, { useState, useEffect, memo } from 'react';
import { Check, X, AlertTriangle, ChevronsUpDown, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './TodayView.module.css'; // CSSモジュールをインポート

// React.memoを使用してコンポーネントをメモ化
const TodayView = memo(({ todayQuestions, recordAnswer, formatDate, refreshData }) => {
  // const todayQuestions = getTodayQuestions(); // ← この行は不要になったので削除またはコメントアウト

  const [expandedAmbiguousId, setExpandedAmbiguousId] = useState(null);
  const [questionStates, setQuestionStates] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showAnswers, setShowAnswers] = useState({});
  const [comprehensionStates, setComprehensionStates] = useState({});
  const [selectedAmbiguousReason, setSelectedAmbiguousReason] = useState(null);

  // --- ハンドラ関数群 (変更なし) ---
  const handleAnswerClick = (questionId, isCorrect) => {
    if (isCorrect) {
      setQuestionStates(prev => ({ ...prev, [questionId]: { showComprehension: true } }));
    } else {
      recordAnswer(questionId, false, '理解できていない×');
      // 解答したら問題を非表示にする
      setAnsweredQuestions(prev => [...prev, questionId]);
      // 解答したら理解度選択状態はリセット
      setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
    }
  };

  const handleComprehensionClick = (questionId, state) => {
    if (state === 'understood') {
      handleUnderstandClick(questionId);
    } else {
      setComprehensionStates(prev => ({
        ...prev,
        [questionId]: state
      }));
    }
  };

  const handleAmbiguousClick = (questionId) => {
    setComprehensionStates(prev => ({
      ...prev,
      [questionId]: 'ambiguous'
    }));
    setExpandedAmbiguousId(prevId => (prevId === questionId ? null : questionId));
  };

  const handleSelectAmbiguousReason = (reasonId) => {
    setSelectedAmbiguousReason(reasonId);
  };

  const handleConfirmAmbiguousReason = () => {
    if (expandedAmbiguousId && selectedAmbiguousReason) {
      const reason = ambiguousReasons.find(r => r.id === selectedAmbiguousReason);
      selectAmbiguousReason(expandedAmbiguousId, reason.text);
    }
  };

  const handleCancelAmbiguousReason = () => {
    setExpandedAmbiguousId(null);
    setSelectedAmbiguousReason(null);
  };

  const handleAnswerToggle = (questionId) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const selectAmbiguousReason = (questionId, reason) => {
    recordAnswer(questionId, true, `曖昧△:${reason}`);
    setExpandedAmbiguousId(null); // 理由を選んだらパネルを閉じる
    setSelectedAmbiguousReason(null);
    // 解答したら問題を非表示にする
    setAnsweredQuestions(prev => [...prev, questionId]);
    // 解答したら理解度選択状態はリセット
    setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
    setComprehensionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
  };

  const handleUnderstandClick = (questionId) => {
    recordAnswer(questionId, true, '理解○');
    // 解答したら問題を非表示にする
    setAnsweredQuestions(prev => [...prev, questionId]);
    // 解答したら理解度選択状態はリセット
    setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
    setComprehensionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
  };

  const getQuestionState = (questionId) => {
    return questionStates[questionId] || { showComprehension: false };
  };

  const ambiguousReasons = [ // 6つの理由
    { id: 1, text: '偶然正解した', days: 8 },
    { id: 2, text: '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった', days: 8 },
    { id: 3, text: '合っていたが、別の理由を思い浮かべていた', days: 8 },
    { id: 4, text: '自信はなかったけど、これかなとは思っていた', days: 8 },
    { id: 5, text: '問題を覚えてしまっていた', days: 8 },
    { id: 6, text: 'その他', days: 8 }
  ];

  // 変更を適用した後のデータ更新
  useEffect(() => {
    if (answeredQuestions.length > 0) {
      // データをリフレッシュして非表示にする問題を更新
      if (refreshData) {
        refreshData();
      }
    }
  }, [answeredQuestions, refreshData]);

  // --- JSX 部分 ---
  // 確認用ログ（開発中に適宜確認）
  console.log("TodayView rendering with questions count:", todayQuestions?.length);
  
  // 未回答の問題のみフィルタリング
  const unansweredQuestions = todayQuestions ? todayQuestions.filter(q => !answeredQuestions.includes(q.id)) : [];

  // 各問題の曖昧状態判定のヘルパー関数
  const isAmbiguousPanelOpen = expandedAmbiguousId !== null;

  return (
    <div className={styles.container}>
      {/* ページタイトル */}
      <h2 className={styles.sectionTitle}>
        <span>今日解く問題</span>
        <span className={styles.questionBadge}>
          {formatDate(new Date())}
        </span>
      </h2>

      {/* todayQuestions が null や undefined, 空配列の場合の表示 */}
      {!unansweredQuestions || unansweredQuestions.length === 0 ? (
        <div className={styles.studyCard}>
          <p>今日解く問題はありません 🎉</p>
          <p>素晴らしい！ゆっくり休んでください。</p>
        </div>
      ) : (
        // 問題リスト
        <div className={styles.cardsContainer}>
          {unansweredQuestions.map((question, questionIndex) => {
            // 質問が存在するか確認
            if (!question || !question.id) {
              console.error('Invalid question object', question);
              return null;
            }

            const questionState = getQuestionState(question.id);

            return (
              <div key={question.id} className={styles.questionContainer}>
                <div className={styles.sectionTitle}>
                  <span className={styles.sectionDot}></span>
                  問題 {questionIndex + 1}
                </div>
                
                {/* --- 問題文表示エリア --- */}
                <div className={styles.questionContent}>
                  {question.content}
                </div>
                
                {/* --- 解答表示ボタン --- */}
                <div className={styles.answerToggleContainer}>
                  <button 
                    className={styles.answerToggleButton}
                    onClick={() => handleAnswerToggle(question.id)}
                  >
                    {showAnswers[question.id] ? '解答を隠す' : '解答を表示'}
                  </button>
                </div>
                
                {/* --- 解答文表示エリア --- */}
                {showAnswers[question.id] && (
                  <div className={styles.answerContent}>
                    <div className={styles.sectionTitle}><span className={styles.sectionDot}></span>解答</div>
                    {question.answer}
                  </div>
                )}

                {/* 正解・不正解ボタン */}
                {!questionState.showComprehension && (
                  <div className={styles.answerButtons}>
                    <button
                      className={styles.correctButton}
                      onClick={() => handleAnswerClick(question.id, true)}
                    >
                      正解
                    </button>
                    <button
                      className={styles.incorrectButton}
                      onClick={() => handleAnswerClick(question.id, false)}
                    >
                      不正解
                    </button>
                  </div>
                )}

                {/* 理解度選択ボタン群 */}
                {questionState.showComprehension && (
                  <>
                    <div className={styles.understandingChoice}>
                      <p className={styles.choiceHeader}>理解度を選択</p>
                      <div className={styles.understandingButtons}>
                        <button
                          className={`${styles.understandingButton} ${styles.correctButton} ${
                            comprehensionStates[question.id] === 'understood' ? styles.selected : ''
                          }`}
                          onClick={() => handleComprehensionClick(question.id, 'understood')}
                          disabled={expandedAmbiguousId !== null}
                        >
                          <Check size={18} />
                          <span>理解済み</span>
                        </button>
                        <button
                          className={`${styles.understandingButton} ${styles.ambiguousButton} ${
                            comprehensionStates[question.id] === 'ambiguous' ? styles.selected : ''
                          }`}
                          onClick={() => handleAmbiguousClick(question.id)}
                          disabled={expandedAmbiguousId !== null && expandedAmbiguousId !== question.id}
                        >
                          <AlertTriangle size={18} />
                          <span>曖昧</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* 曖昧理由選択パネル */}
                {expandedAmbiguousId === question.id && (
                  <div className={`${styles.ambiguousReasonsPanel} ${styles.animateFadeIn}`}>
                    <div className={styles.ambiguousReasonsTitle}>曖昧だった理由を選択してください:</div>
                    <div className={styles.ambiguousReasonsList}>
                      {ambiguousReasons.map(reason => (
                        <div 
                          key={reason.id} 
                          className={`${styles.ambiguousReasonItem} ${selectedAmbiguousReason === reason.id ? styles.selectedReason : ''}`}
                          onClick={() => handleSelectAmbiguousReason(reason.id)}
                        >
                          <div className={styles.reasonContent}>
                            <span className={styles.reasonDot}></span>
                            <span>{reason.text}</span>
                          </div>
                          <span className={styles.daysBadge}>{reason.days}日後</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // 最適化されたprops比較ロジック
  // 質問リストが同じ長さで内容も変わっていなければ再レンダリングしない
  if (prevProps.todayQuestions?.length === nextProps.todayQuestions?.length) {
    // IDの比較だけを行い、完全一致なら再レンダリングしない
    const prevIds = prevProps.todayQuestions.map(q => q.id).join(',');
    const nextIds = nextProps.todayQuestions.map(q => q.id).join(',');
    return prevIds === nextIds;
  }
  return false; // 長さが異なる場合は再レンダリング
});

export default TodayView;
