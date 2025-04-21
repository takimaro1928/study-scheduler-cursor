import React, { useState, useEffect, useCallback } from 'react';
import Flashcard from './Flashcard';
import { updateFlashcardStudyStatus } from '../utils/indexedDB';

const FlashcardDeck = ({ cards, title, allowPractice = false, onCardStatusChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingCards, setRemainingCards] = useState([]);
  const [completedCards, setCompletedCards] = useState([]);
  const [isStudyComplete, setIsStudyComplete] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortOrder, setSortOrder] = useState('random'); // 'random', 'alpha', 'created'

  // カードデータが変更されたら状態をリセット
  useEffect(() => {
    if (!Array.isArray(cards) || cards.length === 0) {
      setRemainingCards([]);
      setCompletedCards([]);
      setCurrentIndex(0);
      setIsStudyComplete(false);
      return;
    }

    let sortedCards = [...cards];
    
    // ソート順に応じてカードをソート
    switch (sortOrder) {
      case 'alpha':
        sortedCards.sort((a, b) => a.term.localeCompare(b.term, 'ja'));
        break;
      case 'created':
        sortedCards.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'random':
      default:
        sortedCards.sort(() => Math.random() - 0.5);
        break;
    }

    // 学習状態でカードを分類
    const learned = sortedCards.filter(card => card.studyStatus === 'learned');
    const unlearned = sortedCards.filter(card => card.studyStatus === 'unlearned' || !card.studyStatus);

    setCompletedCards(learned);
    setRemainingCards(unlearned);
    setCurrentIndex(0);
    setIsStudyComplete(unlearned.length === 0);
  }, [cards, sortOrder]);

  const currentCard = remainingCards[currentIndex] || null;

  const handleNext = useCallback(() => {
    if (currentIndex < remainingCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (remainingCards.length > 0) {
      // 全てのカードを1周した
      setIsStudyComplete(true);
    }
  }, [currentIndex, remainingCards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleMarkLearned = useCallback(async () => {
    if (!currentCard) return;

    try {
      // IndexedDBで学習状態を更新
      await updateFlashcardStudyStatus(currentCard.id, 'learned');

      // カードの状態を更新
      const knownCard = remainingCards[currentIndex];
      const newRemaining = remainingCards.filter((_, i) => i !== currentIndex);
      
      setCompletedCards(prev => [...prev, { ...knownCard, studyStatus: 'learned' }]);
      setRemainingCards(newRemaining);
      
      // 親コンポーネントに状態変更を通知
      if (onCardStatusChange) {
        onCardStatusChange(knownCard.id, 'learned');
      }
      
      if (newRemaining.length === 0) {
        setIsStudyComplete(true);
      } else if (currentIndex >= newRemaining.length) {
        setCurrentIndex(newRemaining.length - 1);
      }
    } catch (error) {
      console.error('学習状態の更新に失敗しました:', error);
    }
  }, [currentCard, currentIndex, remainingCards, onCardStatusChange]);

  const handleMarkUnlearned = useCallback(async () => {
    // 表示中のカードは完了リストにあるカード
    const cardToUnlearn = showCompleted ? completedCards[currentIndex] : null;

    if (!cardToUnlearn) return;

    try {
      // IndexedDBで学習状態を更新
      await updateFlashcardStudyStatus(cardToUnlearn.id, 'unlearned');

      // カードの状態を更新
      const newCompleted = completedCards.filter((_, i) => i !== currentIndex);
      setCompletedCards(newCompleted);
      setRemainingCards(prev => [...prev, { ...cardToUnlearn, studyStatus: 'unlearned' }]);
      
      // 親コンポーネントに状態変更を通知
      if (onCardStatusChange) {
        onCardStatusChange(cardToUnlearn.id, 'unlearned');
      }
      
      if (newCompleted.length === 0) {
        setShowCompleted(false);
      } else if (currentIndex >= newCompleted.length) {
        setCurrentIndex(newCompleted.length - 1);
      }
    } catch (error) {
      console.error('学習状態の更新に失敗しました:', error);
    }
  }, [showCompleted, completedCards, currentIndex, onCardStatusChange]);

  const handleToggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
    setCurrentIndex(0);
  };

  const handleReset = () => {
    // カードをリセット
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setRemainingCards(shuffledCards);
    setCompletedCards([]);
    setCurrentIndex(0);
    setIsStudyComplete(false);
    setShowCompleted(false);
  };

  const handleChangeSortOrder = (e) => {
    setSortOrder(e.target.value);
  };

  if (!Array.isArray(cards) || cards.length === 0) {
    return <div className="text-center p-4">カードがありません。</div>;
  }

  if (isStudyComplete && !showCompleted) {
    return (
      <div className="text-center p-4">
        <h2 className="text-xl font-bold mb-4">学習完了！</h2>
        <p className="mb-4">{completedCards.length}枚のカードを学習しました。</p>
        <div className="flex justify-center space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={handleReset}
          >
            最初からやり直す
          </button>
          {completedCards.length > 0 && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              onClick={handleToggleShowCompleted}
            >
              学習済みカードを復習する
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayCards = showCompleted ? completedCards : remainingCards;
  const currentDisplayCard = displayCards[currentIndex] || null;

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center space-x-4">
          <div>
            <select 
              value={sortOrder} 
              onChange={handleChangeSortOrder}
              className="p-1 border rounded"
            >
              <option value="random">ランダム</option>
              <option value="alpha">50音順</option>
              <option value="created">作成日順</option>
            </select>
          </div>
          <div className="text-sm">
            <span className="px-2 py-1 bg-yellow-100 rounded">
              未学習: {remainingCards.length}
            </span>
            <span className="px-2 py-1 bg-green-100 rounded ml-2">
              学習済み: {completedCards.length}
            </span>
          </div>
          {(remainingCards.length > 0 && completedCards.length > 0) && (
            <button
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-sm"
              onClick={handleToggleShowCompleted}
            >
              {showCompleted ? '未学習カードを表示' : '学習済みカードを表示'}
            </button>
          )}
        </div>
      </div>

      {currentDisplayCard && (
        <div className="mb-6">
          <Flashcard 
            term={currentDisplayCard.term} 
            definition={currentDisplayCard.definition}
            studyStatus={currentDisplayCard.studyStatus || 'unlearned'}
            onMarkLearned={handleMarkLearned}
            onMarkUnlearned={handleMarkUnlearned}
            allowPractice={allowPractice}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
          <div className="text-center mt-2 text-sm text-gray-500">
            {currentIndex + 1} / {displayCards.length}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition disabled:opacity-50"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          前へ
        </button>
        
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={handleNext}
          disabled={currentIndex === displayCards.length - 1 && displayCards.length > 0}
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck; 
