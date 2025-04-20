import React from 'react';
import { Tabs, TabList, Tab, TabPanel } from './components/Tabs';
import PastExamPractice from './components/PastExamPractice';
import FlashcardsContainer from './components/FlashcardsContainer';
import './index.css';

const SMEExamPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">中小企業診断士2次試験対策</h1>
      
      <Tabs defaultTab={0}>
        <TabList>
          <Tab index={0}>過去問・解答練習</Tab>
          <Tab index={1}>用語暗記カード</Tab>
        </TabList>
        
        <TabPanel index={0}>
          <PastExamPractice />
        </TabPanel>
        
        <TabPanel index={1}>
          <FlashcardsContainer />
        </TabPanel>
      </Tabs>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">使い方</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>「過去問・解答練習」タブでは、PDFで表示される過去問を解き、解答を記録できます。70分タイマーを使って本番に近い環境で練習できます。</li>
          <li>「用語暗記カード」タブでは、重要用語をフラッシュカード形式で暗記できます。自分だけのカードも追加可能です。</li>
        </ul>
      </div>
    </div>
  );
};

export default SMEExamPage; 
