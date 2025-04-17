import React, { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import styles from './styles/AddQuestionModal.module.css';

const AddQuestionModal = ({ isOpen, onClose, onSave, subjects }) => {
  const initialState = {
    id: '',
    subjectId: '',
    chapterId: '',
    number: '',
    understanding: '理解できていない×',
    nextDate: new Date().toISOString().split('T')[0],
    comment: '',
    correctRate: 0,
    answerCount: 0
  };

  const [question, setQuestion] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [availableChapters, setAvailableChapters] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 科目が変更されたときのハンドラー
  useEffect(() => {
    if (question.subjectId && !isNewSubject) {
      // 既存の科目が選択された場合、その科目に属する章をリストアップする
      const selectedSubject = subjects.find(s => s.id.toString() === question.subjectId.toString());
      
      if (selectedSubject && selectedSubject.chapters) {
        setAvailableChapters(selectedSubject.chapters);
      } else {
        setAvailableChapters([]);
      }
      
      // 章選択をリセット
      setQuestion(prev => ({ ...prev, chapterId: '' }));
      setIsNewChapter(false);
      setNewChapterName('');
    } else {
      // 新規科目の場合や科目が未選択の場合は章リストをクリア
      setAvailableChapters([]);
      setQuestion(prev => ({ ...prev, chapterId: '' }));
    }
  }, [question.subjectId, isNewSubject, subjects]);

  // 章が変更されたとき、または新規章が入力されたときに問題IDと問題番号を生成する
  useEffect(() => {
    if ((question.chapterId && !isNewChapter) || (isNewChapter && newChapterName)) {
      generateIdAndNumber();
    }
  }, [question.chapterId, isNewChapter, newChapterName]);

  // 問題IDと問題番号の自動生成
  const generateIdAndNumber = () => {
    let subjectPrefix = '';
    let chapterPrefix = '';
    let nextNumber = 1;
    
    // 科目のプレフィックスを決定
    if (!isNewSubject && question.subjectId) {
      const subject = subjects.find(s => s.id.toString() === question.subjectId.toString());
      if (subject) {
        // 既存科目の先頭の文字をプレフィックスとして使用
        const subjectName = subject.name || subject.subjectName || '';
        subjectPrefix = subjectName.charAt(0).toUpperCase();
      }
    } else if (isNewSubject && newSubjectName) {
      // 新規科目の先頭の文字をプレフィックスとして使用
      subjectPrefix = newSubjectName.charAt(0).toUpperCase();
    }
    
    // 章のプレフィックスと次の問題番号を決定
    if (!isNewChapter && question.chapterId) {
      const selectedSubject = subjects.find(s => s.id.toString() === question.subjectId.toString());
      if (selectedSubject) {
        const chapter = selectedSubject.chapters.find(c => c.id.toString() === question.chapterId.toString());
        if (chapter) {
          // 既存章の先頭の文字または章のIDをプレフィックスとして使用
          const chapterName = chapter.name || chapter.chapterName || '';
          chapterPrefix = chapterName.charAt(0).toUpperCase();
          
          // 章内の最後の問題番号+1を次の問題番号として使用
          if (chapter.questions && chapter.questions.length > 0) {
            const questionNumbers = chapter.questions
              .map(q => parseInt(q.number, 10))
              .filter(n => !isNaN(n));
              
            if (questionNumbers.length > 0) {
              nextNumber = Math.max(...questionNumbers) + 1;
            }
          }
        }
      }
    } else if (isNewChapter && newChapterName) {
      // 新規章の先頭の文字をプレフィックスとして使用
      chapterPrefix = newChapterName.charAt(0).toUpperCase();
    }
    
    // プレフィックスがあれば問題IDと問題番号を設定
    if (subjectPrefix && chapterPrefix) {
      const generatedId = `${subjectPrefix}${chapterPrefix}${String(nextNumber).padStart(3, '0')}`;
      setQuestion(prev => ({
        ...prev,
        id: generatedId,
        number: nextNumber.toString()
      }));
    }
  };

  // 入力値の変更を処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 「新規科目を追加」の特殊な選択肢
    if (name === 'subjectId' && value === 'new') {
      setIsNewSubject(true);
      setQuestion(prev => ({ ...prev, subjectId: '' }));
    } 
    // 「新規章を追加」の特殊な選択肢
    else if (name === 'chapterId' && value === 'new') {
      setIsNewChapter(true);
      setQuestion(prev => ({ ...prev, chapterId: '' }));
    }
    // 通常のフィールド値
    else {
      setQuestion(prev => ({ ...prev, [name]: value }));
    }
    
    // エラーがあれば削除
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // フォームの送信処理
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // バリデーション
    const newErrors = {};
    
    if (!isNewSubject && !question.subjectId) {
      newErrors.subjectId = '科目を選択してください';
    }
    
    if (isNewSubject && !newSubjectName.trim()) {
      newErrors.newSubject = '新しい科目名を入力してください';
    }
    
    if (!isNewChapter && !question.chapterId && !isNewSubject) {
      newErrors.chapterId = '章を選択してください';
    }
    
    if (isNewChapter && !newChapterName.trim()) {
      newErrors.newChapter = '新しい章名を入力してください';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 保存するデータを構築
    const questionToSave = {
      ...question
    };
    
    // 新規科目の場合
    if (isNewSubject) {
      questionToSave.newSubject = {
        name: newSubjectName,
        isNew: true
      };
    }
    
    // 新規章の場合
    if (isNewChapter) {
      questionToSave.newChapter = {
        name: newChapterName,
        isNew: true,
        subjectId: question.subjectId
      };
    }
    
    onSave(questionToSave);
    resetForm();
    onClose();
  };

  // フォームのリセット
  const resetForm = () => {
    setQuestion(initialState);
    setIsNewSubject(false);
    setIsNewChapter(false);
    setNewSubjectName('');
    setNewChapterName('');
    setErrors({});
    setShowAdvanced(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>新規問題追加</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* 科目選択または新規作成 */}
          <div className={styles.formGroup}>
            <label>
              科目 <span className={styles.required}>*</span>
            </label>
            <select
              name="subjectId"
              value={isNewSubject ? 'new' : question.subjectId}
              onChange={handleChange}
              className={errors.subjectId ? styles.inputError : ''}
              disabled={isNewSubject}
            >
              <option value="">科目を選択</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name || subject.subjectName}
                </option>
              ))}
              <option value="new">-- 新しい科目を追加 --</option>
            </select>
            {errors.subjectId && <div className={styles.errorText}>{errors.subjectId}</div>}
          </div>
          
          {/* 新規科目名入力欄 */}
          {isNewSubject && (
            <div className={styles.formGroup}>
              <label>
                新しい科目名 <span className={styles.required}>*</span>
              </label>
              <div className={styles.newItemContainer}>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="新しい科目名を入力"
                  className={errors.newSubject ? styles.inputError : ''}
                />
                <button 
                  type="button" 
                  className={styles.cancelNewButton}
                  onClick={() => {
                    setIsNewSubject(false);
                    setNewSubjectName('');
                  }}
                >
                  キャンセル
                </button>
              </div>
              {errors.newSubject && <div className={styles.errorText}>{errors.newSubject}</div>}
            </div>
          )}
          
          {/* 章選択または新規作成 (新規科目が選択されていない場合のみ表示) */}
          {!isNewSubject && (
            <div className={styles.formGroup}>
              <label>
                章 <span className={styles.required}>*</span>
              </label>
              <select
                name="chapterId"
                value={isNewChapter ? 'new' : question.chapterId}
                onChange={handleChange}
                disabled={!question.subjectId || isNewChapter}
                className={errors.chapterId ? styles.inputError : ''}
              >
                <option value="">章を選択</option>
                {availableChapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name || chapter.chapterName}
                  </option>
                ))}
                <option value="new">-- 新しい章を追加 --</option>
              </select>
              {errors.chapterId && <div className={styles.errorText}>{errors.chapterId}</div>}
            </div>
          )}
          
          {/* 新規章名入力欄 */}
          {isNewChapter && !isNewSubject && (
            <div className={styles.formGroup}>
              <label>
                新しい章名 <span className={styles.required}>*</span>
              </label>
              <div className={styles.newItemContainer}>
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="新しい章名を入力"
                  className={errors.newChapter ? styles.inputError : ''}
                />
                <button 
                  type="button" 
                  className={styles.cancelNewButton}
                  onClick={() => {
                    setIsNewChapter(false);
                    setNewChapterName('');
                  }}
                >
                  キャンセル
                </button>
              </div>
              {errors.newChapter && <div className={styles.errorText}>{errors.newChapter}</div>}
            </div>
          )}
          
          {/* 問題ID（自動生成・読み取り専用） */}
          <div className={styles.formGroup}>
            <label>問題ID（自動生成）</label>
            <input
              type="text"
              name="id"
              value={question.id}
              disabled
              placeholder="科目と章を選択すると自動生成されます"
            />
          </div>
          
          {/* 問題番号（自動生成・読み取り専用） */}
          <div className={styles.formGroup}>
            <label>問題番号（自動生成）</label>
            <input
              type="text"
              name="number"
              value={question.number}
              disabled
              placeholder="科目と章を選択すると自動生成されます"
            />
          </div>
          
          {/* 詳細設定トグル */}
          <button 
            type="button" 
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '詳細設定を閉じる' : '詳細設定を開く'}
          </button>
          
          {/* 詳細設定セクション */}
          {showAdvanced && (
            <div className={styles.advancedSection}>
              <div className={styles.formGroup}>
                <label>理解度</label>
                <select
                  name="understanding"
                  value={question.understanding}
                  onChange={handleChange}
                >
                  <option value="理解できていない×">理解できていない×</option>
                  <option value="曖昧△">曖昧△</option>
                  <option value="理解○">理解○</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>次回予定日</label>
                <input
                  type="date"
                  name="nextDate"
                  value={question.nextDate}
                  onChange={handleChange}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>コメント</label>
                <textarea
                  name="comment"
                  value={question.comment}
                  onChange={handleChange}
                  rows={3}
                  placeholder="問題に関するメモやコメントを入力"
                />
              </div>
            </div>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              キャンセル
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionModal; 
