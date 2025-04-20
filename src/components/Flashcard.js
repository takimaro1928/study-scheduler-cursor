import React, { useState } from 'react';

const Flashcard = ({ term, definition }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className={`cursor-pointer border rounded-lg shadow-lg p-6 h-64 w-full max-w-md mx-auto bg-white transition-all duration-300 transform ${isFlipped ? 'rotate-y-180' : ''}`}
      onClick={flipCard}
    >
      <div className={`flex items-center justify-center h-full transition-opacity duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="text-xl font-bold text-center">{term}</h3>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-md text-center">{definition}</p>
      </div>
    </div>
  );
};

export default Flashcard; 
