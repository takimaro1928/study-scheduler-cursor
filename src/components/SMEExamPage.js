import React, { useState } from 'react';
import FlashCards from './FlashCards';

const SMEExamPage = () => {
  const [activeTab, setActiveTab] = useState('flashcards');

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <div className="px-6 pt-4 pb-3 flex items-center space-x-6">
          <button
            className={`relative px-1 py-2 transition-all duration-200 font-medium ${
              activeTab === 'flashcards'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('flashcards')}
          >
            用語暗記カード
            {activeTab === 'flashcards' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>
            )}
          </button>
          
          <button
            className={`relative px-1 py-2 transition-all duration-200 font-medium ${
              activeTab === 'analysis'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('analysis')}
          >
            学習分析
            {activeTab === 'analysis' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === 'flashcards' && <FlashCards />}
        {activeTab === 'analysis' && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-indigo-200 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">開発中の機能</h3>
            <p className="text-gray-500 text-center max-w-md">
              学習分析機能は現在開発中です。
              <br />
              もうしばらくお待ちください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMEExamPage; 
