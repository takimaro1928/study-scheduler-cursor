import React, { useState } from 'react';

const Flashcard = ({ 
  term, 
  definition, 
  onMarkLearned, 
  onMarkUnlearned, 
  studyStatus,
  allowPractice = false, // 文章化練習機能の有効/無効
  onNext,
  onPrevious
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);

  const flipCard = () => {
    // すでに入力済みで裏返っている状態でクリックされた場合はリセット
    if (isFlipped && isInputMode && userInput) {
      setIsInputMode(false);
      setUserInput('');
    }
    setIsFlipped(!isFlipped);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleStartPractice = (e) => {
    e.stopPropagation(); // カード全体のクリックイベントを停止
    setIsInputMode(true);
  };

  const handleCheckAnswer = (e) => {
    e.stopPropagation(); // カード全体のクリックイベントを停止
    setIsFlipped(true);
  };

  const handleMarkLearned = (e) => {
    e.stopPropagation(); // カード全体のクリックイベントを停止
    if (onMarkLearned) onMarkLearned();
  };

  const handleMarkUnlearned = (e) => {
    e.stopPropagation(); // カード全体のクリックイベントを停止
    if (onMarkUnlearned) onMarkUnlearned();
  };

  const handleNext = (e) => {
    e.stopPropagation(); // カード全体のクリックイベントを停止
    setIsFlipped(false);
    setUserInput('');
    setIsInputMode(false);
    if (onNext) onNext();
  };

  const handlePrevious = (e) => {
    e.stopPropagation(); // カード全体のクリックイベントを停止
    setIsFlipped(false);
    setUserInput('');
    setIsInputMode(false);
    if (onPrevious) onPrevious();
  };

  // 表と裏の表示内容を決定
  const frontContent = (
    <div className={`flex flex-col items-center justify-center h-full transition-opacity duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
      <h3 className="text-xl font-bold text-center mb-4">{term}</h3>
      
      {allowPractice && !isInputMode && (
        <button
          onClick={handleStartPractice}
          className="mt-4 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          説明を記述してみる
        </button>
      )}
      
      {allowPractice && isInputMode && (
        <div className="w-full px-4">
          <textarea 
            className="w-full h-24 p-2 border rounded resize-none"
            placeholder="この用語の説明を自分の言葉で書いてみましょう..."
            value={userInput}
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleCheckAnswer}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            確認する
          </button>
        </div>
      )}
    </div>
  );

  const backContent = (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
      <div className="overflow-auto max-h-[70%] w-full mb-4">
        <h4 className="text-lg font-bold mb-2">正解:</h4>
        <p className="text-md">{definition}</p>
        
        {allowPractice && userInput && (
          <>
            <h4 className="text-lg font-bold mt-4 mb-2">あなたの回答:</h4>
            <p className="text-md p-2 bg-gray-100 rounded">{userInput}</p>
          </>
        )}
      </div>
      
      <div className="flex space-x-2 mt-4">
        {studyStatus === 'unlearned' ? (
          <button
            onClick={handleMarkLearned}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            覚えた！
          </button>
        ) : (
          <button
            onClick={handleMarkUnlearned}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            復習が必要
          </button>
        )}
      </div>
    </div>
  );

  // ナビゲーションコントロール
  const navigationControls = (
    <div className="absolute bottom-2 right-2 flex space-x-2 z-10">
      <button
        onClick={handlePrevious}
        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
      >
        ←
      </button>
      <button
        onClick={handleNext}
        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
      >
        →
      </button>
    </div>
  );

  return (
    <div
      className={`relative cursor-pointer border rounded-lg shadow-lg p-6 h-80 w-full max-w-md mx-auto bg-white transition-all duration-300 transform ${isFlipped ? 'rotate-y-180' : ''}`}
      onClick={flipCard}
    >
      {frontContent}
      {backContent}
      {navigationControls}
      
      {/* 学習状態インジケーター */}
      <div className="absolute top-2 right-2">
        <div 
          className={`w-3 h-3 rounded-full ${studyStatus === 'learned' ? 'bg-green-500' : 'bg-yellow-500'}`}
          title={studyStatus === 'learned' ? '学習済み' : '未学習'}
        />
      </div>
    </div>
  );
};

export default Flashcard; 
