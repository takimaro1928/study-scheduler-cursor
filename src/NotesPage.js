import React, { useState, useEffect } from 'react';
import styles from './NotesPage.module.css';
import { Bold, Italic, List, ListOrdered, Heading, Save, Edit2, X } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import HeadingExtension from '@tiptap/extension-heading';
import BulletListExtension from '@tiptap/extension-bullet-list';
import OrderedListExtension from '@tiptap/extension-ordered-list';

const NotesPage = ({ subjects, saveSubjectNote }) => {
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [originalContent, setOriginalContent] = useState('');

  // Tiptapエディターの設定
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // 独自設定のため無効化
        bulletList: false, // 独自設定のため無効化
        orderedList: false, // 独自設定のため無効化
      }),
      BoldExtension,
      ItalicExtension,
      HeadingExtension.configure({
        levels: [2],
      }),
      BulletListExtension,
      OrderedListExtension,
    ],
    editable: false, // 初期状態は閲覧モード
    content: '<p></p>',
  });

  // 初期表示時に最初の科目を選択
  useEffect(() => {
    if (subjects?.length > 0 && !activeSubjectId) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  // 科目変更時に内容をリセット
  useEffect(() => {
    if (activeSubjectId && editor) {
      const selectedSubject = subjects.find(subject => subject.id === activeSubjectId);
      if (selectedSubject) {
        const content = selectedSubject.notes || '<p></p>';
        editor.commands.setContent(content);
        setOriginalContent(content);
        setEditMode(false);
        editor.setEditable(false);
      }
    }
  }, [activeSubjectId, subjects, editor]);

  // 編集モード切替時の処理
  useEffect(() => {
    if (editor) {
      editor.setEditable(editMode);
    }
  }, [editMode, editor]);

  const handleSubjectClick = (subjectId) => {
    if (editMode && editor && editor.isEditable) {
      if (window.confirm('編集中の内容が保存されていません。変更を破棄しますか？')) {
        setActiveSubjectId(subjectId);
      }
    } else {
      setActiveSubjectId(subjectId);
    }
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = () => {
    if (activeSubjectId && editor) {
      const htmlContent = editor.getHTML();
      saveSubjectNote(activeSubjectId, htmlContent);
      setOriginalContent(htmlContent);
      setEditMode(false);
    }
  };

  const handleCancelClick = () => {
    if (editor) {
      editor.commands.setContent(originalContent);
      setEditMode(false);
    }
  };

  // 現在選択中の科目を取得
  const activeSubject = subjects?.find(subject => subject.id === activeSubjectId);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ノート</h1>
      
      <div className={styles.contentWrapper}>
        {/* サイドバー（科目リスト） */}
        <div className={styles.sidebar}>
          <ul className={styles.subjectList}>
            {subjects?.map(subject => (
              <li
                key={subject.id}
                className={`${styles.subjectItem} ${activeSubjectId === subject.id ? styles.activeSubject : ''}`}
                onClick={() => handleSubjectClick(subject.id)}
              >
                {subject.subjectName || subject.name}
              </li>
            ))}
          </ul>
        </div>
        
        {/* モバイル用科目セレクター */}
        <div className={styles.mobileSubjectSelector}>
          <select 
            className={styles.mobileSelect}
            value={activeSubjectId || ''}
            onChange={(e) => handleSubjectClick(Number(e.target.value))}
          >
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName || subject.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* メインコンテンツエリア */}
        <div className={styles.content}>
          {activeSubject ? (
            <>
              <div className={styles.noteHeader}>
                <h2 className={styles.subjectTitle}>{activeSubject.subjectName || activeSubject.name}</h2>
                <div className={styles.buttonGroup}>
                  {editMode ? (
                    <>
                      <button className={`${styles.button} ${styles.saveButton}`} onClick={handleSaveClick}>
                        <Save size={16} style={{ marginRight: '4px' }} />
                        保存
                      </button>
                      <button className={`${styles.button} ${styles.cancelButton}`} onClick={handleCancelClick}>
                        <X size={16} style={{ marginRight: '4px' }} />
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button className={`${styles.button} ${styles.editButton}`} onClick={handleEditClick}>
                      <Edit2 size={16} style={{ marginRight: '4px' }} />
                      編集
                    </button>
                  )}
                </div>
              </div>
              
              {editor && (
                <div className={styles.editorContainer}>
                  {editMode && (
                    <div className={styles.toolbar}>
                      <button 
                        className={`${styles.toolbarButton} ${editor?.isActive('bold') ? styles.toolbarButtonActive : ''}`}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="太字"
                      >
                        <Bold size={18} />
                      </button>
                      <button 
                        className={`${styles.toolbarButton} ${editor?.isActive('italic') ? styles.toolbarButtonActive : ''}`}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="斜体"
                      >
                        <Italic size={18} />
                      </button>
                      <div className={styles.separator}></div>
                      <button 
                        className={`${styles.toolbarButton} ${editor?.isActive('heading', { level: 2 }) ? styles.toolbarButtonActive : ''}`}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="見出し"
                      >
                        <Heading size={18} />
                      </button>
                      <div className={styles.separator}></div>
                      <button 
                        className={`${styles.toolbarButton} ${editor?.isActive('bulletList') ? styles.toolbarButtonActive : ''}`}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="箇条書き"
                      >
                        <List size={18} />
                      </button>
                      <button 
                        className={`${styles.toolbarButton} ${editor?.isActive('orderedList') ? styles.toolbarButtonActive : ''}`}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="番号付きリスト"
                      >
                        <ListOrdered size={18} />
                      </button>
                    </div>
                  )}
                  <EditorContent 
                    editor={editor} 
                    className={styles.editorContent} 
                  />
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyMessage}>
              科目を選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage; 
