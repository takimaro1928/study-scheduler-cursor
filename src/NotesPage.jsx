import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import { Bold as BoldIcon, Italic as ItalicIcon, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import styles from './NotesPage.module.css';

// エディタのメニューバーコンポーネント
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className={styles['editor-menu']}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? styles['is-active'] : ''}
        title="太字"
      >
        <BoldIcon size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? styles['is-active'] : ''}
        title="斜体"
      >
        <ItalicIcon size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? styles['is-active'] : ''}
        title="見出し1"
      >
        <Heading1 size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? styles['is-active'] : ''}
        title="見出し2"
      >
        <Heading2 size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? styles['is-active'] : ''}
        title="箇条書き"
      >
        <List size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? styles['is-active'] : ''}
        title="番号付きリスト"
      >
        <ListOrdered size={18} />
      </button>
    </div>
  );
};

// Tiptapエディタコンポーネント
const TiptapEditor = ({ content, onUpdate, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      OrderedList,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles['tiptap-editor'],
        'data-placeholder': placeholder,
      },
    },
  });

  return (
    <div className={styles['editor-container']}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

// NotesPageコンポーネント
const NotesPage = ({ subjects, saveSubjectNote }) => {
  const [selectedSubject, setSelectedSubject] = useState(
    subjects.length > 0 ? subjects[0].id : null
  );

  // 選択された科目のノート内容を取得
  const getSelectedSubjectNotes = () => {
    if (!selectedSubject) return '';
    
    const subject = subjects.find(s => s.id === selectedSubject);
    return subject?.notes || '';
  };

  // ノート内容が更新された時の処理
  const handleNoteUpdate = (content) => {
    if (selectedSubject) {
      saveSubjectNote(selectedSubject, content);
    }
  };

  return (
    <div className={styles['notes-page']}>
      <h2 className={styles['page-title']}>ノート</h2>
      
      <div className={styles['notes-container']}>
        <div className={styles.sidebar}>
          <h3>科目一覧</h3>
          <div className={styles['subject-list']}>
            {subjects.map(subject => (
              <div
                key={subject.id}
                className={`${styles['subject-item']} ${selectedSubject === subject.id ? styles.selected : ''}`}
                onClick={() => setSelectedSubject(subject.id)}
              >
                {subject.name}
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles['notes-content']}>
          {selectedSubject ? (
            <>
              <h3>{subjects.find(s => s.id === selectedSubject)?.name} のノート</h3>
              <TiptapEditor
                content={getSelectedSubjectNotes()}
                onUpdate={handleNoteUpdate}
                placeholder="ここに内容を入力してください..."
              />
            </>
          ) : (
            <div className={styles['no-subject']}>
              <p>科目を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage; 
