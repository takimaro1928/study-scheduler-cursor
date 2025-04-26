// src/TodayView.js
// 【App.js の useMemo 修正対応版】
// props で getTodayQuestions の代わりに todayQuestions を受け取り、
// 表示部分で科目名・章名を安全に表示するように修正。

import React, { useState, useEffect, memo } from 'react';
import { Check, X, AlertTriangle, ChevronsUpDown } from 'lucide-react';
import './TodayView.css'; // カスタムCSSを適用
// import styles from './TodayView.module.css'; // CSS Modules を使う場合はこの行のコメントを解除し、下の className を styles.*** 形式に変更してください

// React.memoを使用してコンポーネントをメモ化
const TodayView = memo(({ todayQuestions, recordAnswer, formatDate, refreshData }) => {
  // const todayQuestions = getTodayQuestions(); // ← この行は不要になったので削除またはコメントアウト

  const [expandedAmbiguousId, setExpandedAmbiguousId] = useState(null);
  const [questionStates, setQuestionStates] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

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
  const handleAmbiguousClick = (questionId) => {
    setExpandedAmbiguousId(prevId => (prevId === questionId ? null : questionId));
  };
  const selectAmbiguousReason = (questionId, reason) => {
    recordAnswer(questionId, true, `曖昧△:${reason}`);
    setExpandedAmbiguousId(null); // 理由を選んだらパネルを閉じる
    // 解答したら問題を非表示にする
    setAnsweredQuestions(prev => [...prev, questionId]);
    // 解答したら理解度選択状態はリセット
    setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
  };
  const handleUnderstandClick = (questionId) => {
    recordAnswer(questionId, true, '理解○');
    // 解答したら問題を非表示にする
    setAnsweredQuestions(prev => [...prev, questionId]);
    // 解答したら理解度選択状態はリセット
    setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
  };
  const getQuestionState = (questionId) => {
    return questionStates[questionId] || { showComprehension: false };
  };
  const ambiguousReasons = [ // 6つの理由
    '偶然正解した', '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった', '合っていたが、別の理由を思い浮かべていた',
    '自信はなかったけど、これかなとは思っていた', '問題を覚えてしまっていた', 'その他'
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
  if (todayQuestions && todayQuestions.length > 0) {
      console.log("First question in TodayView props:", todayQuestions[0]);
      console.log("First question Subject Name:", todayQuestions[0]?.subjectName);
      console.log("First question Chapter Name:", todayQuestions[0]?.chapterName);
  }

  // 未回答の問題のみフィルタリング
  const unansweredQuestions = todayQuestions ? todayQuestions.filter(q => !answeredQuestions.includes(q.id)) : [];

  return (
    <div className="today-view-container">
      {/* ヘッダー部分 */}
      <div className="today-view-header">
        <h2 className="today-view-title">
          今日解く問題 <span className="today-date-badge">{formatDate(new Date())}</span>
        </h2>
        <button 
          className="collapse-button"
          onClick={() => setCollapsed(prev => !prev)}
        >
          <ChevronsUpDown />
        </button>
      </div>

      {!collapsed && (
        !unansweredQuestions || unansweredQuestions.length === 0 ? (
          <div className="empty-state">
            <p>今日解く問題はありません 🎉</p>
            <p>素晴らしい！ゆっくり休んでください。</p>
          </div>
        ) : (
          // 問題リスト
          <div>
            {unansweredQuestions.map(question => {
              // ★ question が null や undefined でないことを確認
              if (!question || !question.id) {
                  console.warn("Rendering invalid question data:", question);
                  return null; // 不正なデータはスキップ
              }
              const questionState = getQuestionState(question.id);
              const isAmbiguousPanelOpen = expandedAmbiguousId === question.id;

              return (
                // 問題カード
                <div key={question.id} className="question-container">
                  <div className="question-header">
                    <div className="question-subject">{question.subjectName || question.subject?.name || '?'}</div>
                    <div className="question-chapter">{question.chapterName || question.chapter?.name || '?'}</div>
                  </div>
                  
                  <div className="question-text">
                    問題 {question.id}
                  </div>

                  {/* --- 正誤ボタンエリア --- */}
                  {!questionState.showComprehension && (
                    <div>
                      <div className="section-label">解答結果</div>
                      <div className="button-container">
                        <button
                          onClick={() => handleAnswerClick(question.id, true)}
                          className="check-button"
                        >
                          <Check /> 正解
                        </button>
                        <button
                          onClick={() => handleAnswerClick(question.id, false)}
                          className="skip-button"
                        >
                          <X /> 不正解
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- 理解度ボタンエリア --- */}
                  {questionState.showComprehension && (
                    <div>
                      <div className="section-label">理解度を選択</div>
                      <div className="button-container">
                        <button
                          onClick={() => handleUnderstandClick(question.id)}
                          className="check-button"
                        >
                          <Check /> 理解済み
                        </button>
                        <button
                          onClick={() => handleAmbiguousClick(question.id)}
                          className="skip-button"
                        >
                          <span style={{display: 'flex', alignItems: 'center'}}>
                            <AlertTriangle />
                            <span>曖昧</span>
                          </span>
                          <ChevronsUpDown />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- 曖昧理由選択パネル --- */}
                  {isAmbiguousPanelOpen && (
                    <div className="reason-panel">
                      <div className="reason-panel-title">曖昧だった理由を選択してください:</div>
                      <div className="reason-options">
                        {ambiguousReasons.map((reason, index) => (
                          <button
                            key={index}
                            onClick={() => selectAmbiguousReason(question.id, reason)}
                            className="reason-option"
                          >
                            <span>{reason}</span>
                            <span className="reason-badge">8日後</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
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
