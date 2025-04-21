import React from 'react';
import styles from './DiagnosisSecondExamView.module.css';
import { BookOpen } from 'lucide-react';
import FlashcardStudy from './components/FlashcardStudy';

const DiagnosisSecondExamView = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>中小企業診断士2次試験対策</h2>
      
      <div className={styles.header}>
        <BookOpen size={18} />
        <span>用語暗記カード</span>
      </div>
      
      <FlashcardStudy />
    </div>
  );
};

export default DiagnosisSecondExamView; 
