import React, { useState, useEffect } from 'react';
import Flashcard from './Flashcard';

const FlashcardDeck = ({ cards, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingCards, setRemainingCards] = useState([]);
  const [completedCards, setCompletedCards] = useState([]);
  const [isStudyComplete, setIsStudyComplete] = useState(false);

  useEffect(() => {
    // カードをシャッフルして初期化
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setRemainingCards(shuffledCards);
    setCompletedCards([]);
    setCurrentIndex(0);
    setIsStudyComplete(false);
  }, [cards]);

  const currentCard = remainingCards[currentIndex] || null;

  const handleNext = () => {
    if (currentIndex < remainingCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 全てのカードを1周した
      setIsStudyComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleKnown = () => {
    // 「知っている」カードを完了リストに移動
    const knownCard = remainingCards[currentIndex];
    const newRemaining = remainingCards.filter((_, i) => i !== currentIndex);
    
    setCompletedCards([...completedCards, knownCard]);
    setRemainingCards(newRemaining);
    
    if (newRemaining.length === 0) {
      setIsStudyComplete(true);
    } else if (currentIndex >= newRemaining.length) {
      setCurrentIndex(newRemaining.length - 1);
    }
  };

  const handleReset = () => {
    // 全てのカードをリセット
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setRemainingCards(shuffledCards);
    setCompletedCards([]);
    setCurrentIndex(0);
    setIsStudyComplete(false);
  };

  if (cards.length === 0) {
    return <div className="text-center p-4">カードがありません。</div>;
  }

  if (isStudyComplete) {
    return (
      <div className="text-center p-4">
        <h2 className="text-xl font-bold mb-4">学習完了！</h2>
        <p className="mb-4">{completedCards.length}枚のカードを学習しました。</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={handleReset}
        >
          最初からやり直す
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="text-sm">
          残り: {remainingCards.length} / 完了: {completedCards.length}
        </div>
      </div>

      {currentCard && (
        <div className="mb-6">
          <Flashcard term={currentCard.term} definition={currentCard.definition} />
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
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          onClick={handleKnown}
        >
          知っている
        </button>
        
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={handleNext}
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck; 
