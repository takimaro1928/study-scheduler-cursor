import React, { useState } from 'react';
import { Tabs, TabList, Tab, TabPanel } from './components/Tabs';
import { FileText, BookOpen, Clock, Calendar } from 'lucide-react';
import styles from './DiagnosisSecondExamView.module.css';
import PastExamPractice from './components/PastExamPractice';
import FlashcardStudy from './components/FlashcardStudy';

const DiagnosisSecondExamView = () => {
  const [activeTab, setActiveTab] = useState('practice');

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>中小企業診断士2次試験対策</h2>
      
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab id="practice">
            <FileText size={18} />
            <span>過去問練習</span>
          </Tab>
          <Tab id="flashcards">
            <BookOpen size={18} />
            <span>用語暗記カード</span>
          </Tab>
        </TabList>
        
        <TabPanel id="practice">
          <PastExamPractice />
        </TabPanel>
        
        <TabPanel id="flashcards">
          <FlashcardStudy />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default DiagnosisSecondExamView; 
