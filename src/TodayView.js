// src/TodayView.js
// 【App.js の useMemo 修正対応版】
// props で getTodayQuestions の代わりに todayQuestions を受け取り、
// 表示部分で科目名・章名を安全に表示するように修正。

import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, ChevronsUpDown, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
// import styles from './TodayView.module.css'; // CSS Modules を使う場合はこの行のコメントを解除し、下の className を styles.*** 形式に変更してください

// props で getTodayQuestions の代わりに todayQuestions を受け取る
const TodayView = ({ todayQuestions, recordAnswer, formatDate, refreshData }) => {
  // const todayQuestions = getTodayQuestions(); // ← この行は不要になったので削除またはコメントアウト

  const [expandedAmbiguousId, setExpandedAmbiguousId] = useState(null);
  const [questionStates, setQuestionStates] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

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
  
  // 未回答の問題のみフィルタリング
  const unansweredQuestions = todayQuestions ? todayQuestions.filter(q => !answeredQuestions.includes(q.id)) : [];

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
        <div className="study-cards-container">
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
              <div key={question.id} className="study-card">
                <div className="study-card-content">
                  {/* 問題情報 - ★ nullish coalescing (?? '?') を使って安全に表示 */}
                  <div className="subject-name">{question.subjectName || question.subject?.name || '?'}</div>
                  <div className="chapter-name">{question.chapterName || question.chapter?.name || '?'}</div>
                  <div className="question-badge">
                    問題 {question.id}
                  </div>

                  {/* --- 正誤ボタンエリア --- */}
                  {!questionState.showComprehension && (
                    <div>
                      <div className="section-title"><span className="section-dot"></span>解答結果</div>
                      <div className="answer-buttons-container">
                        <button
                          className="answer-button bg-white border-green-400"
                          onClick={() => handleAnswerClick(question.id, true)}
                          disabled={questionState.showComprehension || isAmbiguousPanelOpen || false}
                        >
                          正解
                        </button>
                        <button
                          className="answer-button bg-white border-red-400"
                          onClick={() => handleAnswerClick(question.id, false)}
                          disabled={questionState.showComprehension || isAmbiguousPanelOpen || false}
                        >
                          不正解
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- 理解度ボタンエリア (モダンデザイン) --- */}
                  {questionState.showComprehension && (
                    <div>
                      <div className="section-title"><span className="section-dot"></span>理解度を選択</div>
                      <div className="understanding-buttons-container mt-3">
                        <button
                          className={`answer-button correct-button ${questionState.showComprehension === true ? 'selected' : ''}`}
                          onClick={() => handleUnderstandClick(question.id)}
                        >
                          理解済み {questionState.showComprehension === true && <ChevronUp className="ml-auto" size={16} />}
                        </button>
                        <button
                          className={`answer-button incorrect-button ${questionState.showComprehension === false ? 'selected' : ''}`}
                          onClick={() => handleAmbiguousClick(question.id)}
                        >
                          曖昧 {isAmbiguousPanelOpen ? <ChevronUp className="ml-auto" size={16} /> : <ChevronDown className="ml-auto" size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div> {/* End of card content */}

                {/* --- 曖昧理由選択パネル (モダンデザイン) --- */}
                {isAmbiguousPanelOpen && (
                  <div className="reason-panel-modern">
                    <div className="reason-panel-title-modern">
                      曖昧だった理由を選択してください:
                    </div>
                    <div className="reason-options-list">
                      {ambiguousReasons.map((reason, index) => (
                        <button
                          key={index}
                          onClick={() => selectAmbiguousReason(question.id, reason)}
                          className="reason-option-modern"
                        >
                          <div className="reason-option-content">
                            <span className="reason-dot"></span>
                            <span className="reason-text">{reason}</span>
                          </div>
                          <span className="reason-badge">
                            {reason === '偶然正解した' ? '2日後' :
                             reason === '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった' ? '3日後' :
                             reason === '合っていたが、別の理由を思い浮かべていた' ? '3日後' :
                             reason === '自信はなかったけど、これかなとは思っていた' ? '4日後' :
                             reason === '問題を覚えてしまっていた' ? '5日後' :
                             '4日後'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div> // 問題カード end
            );
          })}
        </div> // 問題リスト end
      )}
    </div> // 全体コンテナ end
  );
};

export default TodayView;
