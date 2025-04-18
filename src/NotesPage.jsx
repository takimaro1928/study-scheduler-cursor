import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import { Bold as BoldIcon, Italic as ItalicIcon, Heading1, Heading2, List, ListOrdered, RotateCcw, RotateCw, Save, X, Book } from 'lucide-react';
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
      <div className={styles['editor-menu-divider']}></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="元に戻す"
      >
        <RotateCcw size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="やり直す"
      >
        <RotateCw size={18} />
      </button>
    </div>
  );
};

// Tiptapエディタコンポーネント
const TiptapEditor = ({ content, onUpdate, placeholder, onSave, onCancel, isEditing }) => {
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

  // コンポーネントがアンマウントされる際にエディタをデストロイ
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  return (
    <div className={styles['editor-container']}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      {isEditing && (
        <div className={styles['editor-actions']}>
          <button 
            className={styles['save-button']} 
            onClick={onSave}
            title="保存"
          >
            <Save size={18} /> 保存
          </button>
          <button 
            className={styles['cancel-button']} 
            onClick={onCancel}
            title="キャンセル"
          >
            <X size={18} /> キャンセル
          </button>
        </div>
      )}
    </div>
  );
};

// NotesPageコンポーネント
const NotesPage = ({ subjects, saveSubjectNote }) => {
  const [selectedSubject, setSelectedSubject] = useState(
    subjects.length > 0 ? subjects[0].id : null
  );
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズを監視
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初期チェック
    checkIfMobile();
    
    // リサイズイベントのリスナー登録
    window.addEventListener('resize', checkIfMobile);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 選択された科目のノート内容を取得
  const getSelectedSubjectNotes = () => {
    if (!selectedSubject) return '';
    
    const subject = subjects.find(s => s.id === selectedSubject);
    return subject?.notes || '';
  };

  // 編集モードに切り替える
  const handleEdit = () => {
    setEditedContent(getSelectedSubjectNotes());
    setIsEditing(true);
  };

  // ノート内容が更新された時の処理
  const handleNoteUpdate = (content) => {
    setEditedContent(content);
  };

  // ノートを保存する
  const handleSave = () => {
    if (selectedSubject) {
      saveSubjectNote(selectedSubject, editedContent);
      setIsEditing(false);
      // 保存成功メッセージを表示するようなコードがあれば追加
    }
  };

  // 編集をキャンセルする
  const handleCancel = () => {
    if (window.confirm('編集内容を破棄しますか？')) {
      setIsEditing(false);
      setEditedContent('');
    }
  };

  // 科目選択時の処理
  const handleSubjectSelect = (subjectId) => {
    if (isEditing) {
      if (window.confirm('編集中の内容が保存されていません。変更を破棄して科目を切り替えますか？')) {
        setSelectedSubject(subjectId);
        setIsEditing(false);
        setEditedContent('');
      }
    } else {
      setSelectedSubject(subjectId);
    }
  };

  return (
    <div className={styles['notes-page']}>
      <div className={styles['page-header']}>
        <h2 className={styles['page-title']}><Book size={24} className={styles['page-icon']} /> 科目別ノート</h2>
        <p className={styles['page-description']}>各科目の要点や学習のコツを記録しましょう</p>
      </div>
      
      {/* モバイル用科目セレクター */}
      {isMobile && (
        <div className={styles['mobileSubjectSelector']}>
          <select 
            className={styles['mobileSelect']}
            value={selectedSubject || ''}
            onChange={(e) => handleSubjectSelect(e.target.value)}
          >
            <option value="" disabled>科目を選択してください</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className={styles['notes-container']}>
        {/* デスクトップ用サイドバー */}
        {!isMobile && (
          <div className={styles.sidebar}>
            <h3>科目一覧</h3>
            <div className={styles['subject-list']}>
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className={`${styles['subject-item']} ${selectedSubject === subject.id ? styles.selected : ''}`}
                  onClick={() => handleSubjectSelect(subject.id)}
                >
                  {subject.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles['notes-content']}>
          {selectedSubject ? (
            <>
              <div className={styles['notes-header']}>
                <h3>{subjects.find(s => s.id === selectedSubject)?.name} のノート</h3>
                {!isEditing && (
                  <button 
                    className={styles['edit-button']}
                    onClick={handleEdit}
                  >
                    編集
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <TiptapEditor
                  content={editedContent}
                  onUpdate={handleNoteUpdate}
                  placeholder="ここにノート内容を入力してください..."
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isEditing={isEditing}
                />
              ) : (
                <div className={styles['notes-display']}>
                  {getSelectedSubjectNotes() ? (
                    <div 
                      className={styles['notes-content-display']}
                      dangerouslySetInnerHTML={{ __html: getSelectedSubjectNotes() }}
                    />
                  ) : (
                    <div className={styles['empty-notes']}>
                      <p>まだノートがありません。「編集」ボタンをクリックして学習内容を記録しましょう。</p>
                      <button 
                        className={styles['start-note-button']}
                        onClick={handleEdit}
                      >
                        ノートを作成する
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles['no-subject']}>
              <p>科目を選択してノートを表示・編集できます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage; 
