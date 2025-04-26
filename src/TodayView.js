// src/TodayView.js
// 【App.js の useMemo 修正対応版】
// props で getTodayQuestions の代わりに todayQuestions を受け取り、
// 表示部分で科目名・章名を安全に表示するように修正。

import React, { useState, useEffect, memo } from 'react';
import { Check, X, AlertTriangle, ChevronsUpDown, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
// import styles from './TodayView.module.css'; // CSS Modules を使う場合はこの行のコメントを解除し、下の className を styles.*** 形式に変更してください

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
    { id: 1, text: '偶然正解した' },
    { id: 2, text: '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった' },
    { id: 3, text: '合っていたが、別の理由を思い浮かべていた' },
    { id: 4, text: '自信はなかったけど、これかなとは思っていた' }, 
    { id: 5, text: '問題を覚えてしまっていた' }, 
    { id: 6, text: 'その他' }
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

  // CSS Modules を使う場合は className="today-container" を className={styles.todayContainer} 等に変更
  return (
    <div className="container">
      {/* ページタイトル */}
      <h2 className="section-title">
        <span>今日解く問題</span>
        <span className="question-badge">
          {formatDate(new Date())}
        </span>
      </h2>

      {/* ★ todayQuestions が null や undefined, 空配列の場合の表示 */}
      {!unansweredQuestions || unansweredQuestions.length === 0 ? (
        <div className="study-card">
          <p>今日解く問題はありません 🎉</p>
          <p>素晴らしい！ゆっくり休んでください。</p>
        </div>
      ) : (
        // 問題リスト
        <div className="cards-container">
          {unansweredQuestions.map((question, questionIndex) => {
            // 質問が存在するか確認
            if (!question || !question.id) {
              console.error('Invalid question object', question);
              return null;
            }

            const questionState = getQuestionState(question.id);

            return (
              <div key={question.id} className="question-container">
                <div className="section-title">
                  <span className="section-dot"></span>
                  問題 {questionIndex + 1}
                </div>
                
                {/* --- 問題文表示エリア --- */}
                <div className="question-content">
                  {question.content}
                </div>
                
                {/* --- 解答表示ボタン --- */}
                <div className="answer-toggle-container">
                  <button 
                    className="answer-toggle-button"
                    onClick={() => handleAnswerToggle(question.id)}
                  >
                    {showAnswers[question.id] ? '解答を隠す' : '解答を表示'}
                  </button>
                </div>
                
                {/* --- 解答文表示エリア --- */}
                {showAnswers[question.id] && (
                  <div className="answer-content">
                    <div className="section-title"><span className="section-dot"></span>解答</div>
                    {question.answer}
                  </div>
                )}

                {/* 理解度選択ボタン群 */}
                {questionState.showComprehension && (
                  <>
                    <div className="understanding-buttons">
                      <button
                        className={`understanding-button correct-button ${
                          comprehensionStates[question.id] === 'understood' ? 'selected' : ''
                        }`}
                        onClick={() => handleComprehensionClick(question.id, 'understood')}
                        disabled={expandedAmbiguousId !== null}
                      >
                        <Check size={18} />
                        <span>理解できた</span>
                      </button>
                      <button
                        className={`understanding-button incorrect-button ${
                          comprehensionStates[question.id] === 'ambiguous' ? 'selected' : ''
                        }`}
                        onClick={() => handleAmbiguousClick(question.id)}
                        disabled={expandedAmbiguousId !== null && expandedAmbiguousId !== question.id}
                      >
                        <AlertTriangle size={18} />
                        <span>曖昧・偶然</span>
                      </button>
                    </div>
                  </>
                )}

                {/* 曖昧理由選択パネル */}
                {expandedAmbiguousId === question.id && (
                  <div className="ambiguous-reasons-panel animate-fade-in">
                    <div className="ambiguous-reasons-title">理解できた理由を選択してください：</div>
                    <div className="ambiguous-reasons-list">
                      {ambiguousReasons.map(reason => (
                        <button
                          key={reason.id}
                          className={`ambiguous-reason-button ${selectedAmbiguousReason === reason.id ? 'selected' : ''}`}
                          onClick={() => handleSelectAmbiguousReason(reason.id)}
                        >
                          {reason.text}
                        </button>
                      ))}
                    </div>
                    <div className="ambiguous-reasons-actions">
                      <button 
                        className="ambiguous-cancel-button"
                        onClick={handleCancelAmbiguousReason}
                      >
                        キャンセル
                      </button>
                      <button 
                        className="ambiguous-confirm-button"
                        onClick={handleConfirmAmbiguousReason}
                        disabled={!selectedAmbiguousReason}
                      >
                        確定
                      </button>
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
