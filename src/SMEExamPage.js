import React from 'react';
import { Toaster } from 'react-hot-toast';
import FlashcardsContainer from './components/FlashcardsContainer';
import './index.css';

const SMEExamPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          style: {
            background: '#4caf50',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#f44336',
          },
        },
      }} />
      
      <h1 className="text-2xl font-bold mb-6">中小企業診断士2次試験対策</h1>
      
      <FlashcardsContainer />
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">使い方</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>「用語暗記カード」では、重要用語をフラッシュカード形式で暗記できます。自分だけのカードも追加可能です。</li>
        </ul>
      </div>
    </div>
  );
};

export default SMEExamPage; 
