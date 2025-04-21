import React, { useState, useEffect, useCallback, useRef } from 'react';
import FlashcardDeck from './FlashcardDeck';
import { toast } from 'react-hot-toast';
import { 
  getAllFlashcards,
  saveFlashcard,
  deleteFlashcard,
  getAllFlashcardGenres,
  saveFlashcardGenre,
  deleteFlashcardGenre,
  getAllFlashcardTags,
  saveFlashcardTag,
  deleteFlashcardTag,
  searchFlashcards,
  exportFlashcardData,
  importFlashcardData,
  getFlashcardCounts
} from '../utils/indexedDB';

// ユニークIDの生成
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// サンプルのフラッシュカードデータ
const sampleDecks = [
  {
    id: 'financial',
    title: '財務・会計',
    cards: [
      { id: 1, term: 'ROA', definition: '総資産利益率（Return on Assets）。総資産に対する利益の割合を示す指標。' },
      { id: 2, term: 'ROE', definition: '自己資本利益率（Return on Equity）。株主資本に対する利益の割合を示す指標。' },
      { id: 3, term: '運転資本', definition: '(流動資産 - 流動負債)で計算される、事業活動に必要な資金。' },
      { id: 4, term: 'キャッシュフロー', definition: '一定期間における現金および現金同等物の流入と流出。' },
      { id: 5, term: '減価償却', definition: '固定資産の取得原価を耐用年数にわたって費用配分する会計処理。' },
    ]
  },
  {
    id: 'strategy',
    title: '経営戦略',
    cards: [
      { id: 1, term: 'SWOT分析', definition: '組織の強み(Strengths)、弱み(Weaknesses)、機会(Opportunities)、脅威(Threats)を評価する戦略的計画ツール。' },
      { id: 2, term: '5フォース分析', definition: 'マイケル・ポーターが開発した業界の競争環境を分析するフレームワーク。' },
      { id: 3, term: 'PPM', definition: 'プロダクト・ポートフォリオ・マネジメント。事業や製品の市場成長率と相対的市場シェアに基づいて分類する手法。' },
      { id: 4, term: 'バリューチェーン', definition: '企業の活動を主活動と支援活動に分類し、価値創造のプロセスを分析するフレームワーク。' },
      { id: 5, term: '3C分析', definition: '顧客(Customer)、競合(Competitor)、自社(Company)の3つの要素から市場環境を分析する手法。' },
    ]
  },
  {
    id: 'marketing',
    title: 'マーケティング',
    cards: [
      { id: 1, term: '4P', definition: '製品(Product)、価格(Price)、流通(Place)、プロモーション(Promotion)からなるマーケティングミックスの要素。' },
      { id: 2, term: 'STP', definition: '市場細分化(Segmentation)、ターゲティング(Targeting)、ポジショニング(Positioning)の略。' },
      { id: 3, term: 'カスタマージャーニー', definition: '顧客が製品やサービスとの最初の接点から購入後までの全体験を時系列で表したもの。' },
      { id: 4, term: 'ペルソナ', definition: '特定のユーザーグループを代表する架空の人物像。' },
      { id: 5, term: 'AIDMA', definition: '消費者の購買行動プロセスを表すモデル。注意(Attention)、関心(Interest)、欲求(Desire)、記憶(Memory)、行動(Action)の頭文字。' },
    ]
  }
];

const FlashcardsContainer = () => {
  // 状態変数
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    genres: [],
    tags: [],
    difficulty: 'normal',
    status: 'unlearned'
  });
  const [editingCard, setEditingCard] = useState(null);
  const [showEditCardForm, setShowEditCardForm] = useState(false);
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    difficulty: 'all',
    genres: [],
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [cardCounts, setCardCounts] = useState({
    total: 0,
    learned: 0,
    learning: 0,
    unlearned: 0
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 新規カード追加用の状態
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  
  // 新規ジャンル/タグ追加用の状態
  const [showAddGenreForm, setShowAddGenreForm] = useState(false);
  const [showAddTagForm, setShowAddTagForm] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  
  // 検索・フィルタリング用の状態
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // 学習モード用の状態
  const [studyMode, setStudyMode] = useState(false);
  const [allowPractice, setAllowPractice] = useState(false);
  
  // インポート/エクスポート用の状態
  const [showImportExport, setShowImportExport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  
  // 学習モード関連
  const [studyCards, setStudyCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [testAnswers, setTestAnswers] = useState([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [sentenceCards, setSentenceCards] = useState([]);
  const [sentenceInput, setSentenceInput] = useState('');
  const [sentenceSubmitted, setSentenceSubmitted] = useState(false);
  
  // ファイルアップロードに使用する非表示のinput要素への参照
  const fileInputRef = useRef(null);
  
  // 学習統計状態
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // 初期データのロード
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // カードデータの取得
        const cardsData = await getAllFlashcards();
        setCards(cardsData);
        
        // ジャンルデータの取得
        const genresData = await getAllFlashcardGenres();
        setGenres(genresData);
        
        // タグデータの取得
        const tagsData = await getAllFlashcardTags();
        setTags(tagsData);
        
        // カード数の取得
        const counts = await getFlashcardCounts();
        setCardCounts(counts);
        
        setLoading(false);
      } catch (err) {
        console.error('データのロードに失敗しました:', err);
        setError('データのロードに失敗しました。ブラウザをリロードしてみてください。');
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // フィルタリングされたカードのリストを取得
  const getFilteredCards = useCallback(async () => {
    try {
      const options = {
        searchTerm: searchQuery,
        genres: selectedGenres.length > 0 ? selectedGenres : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        studyStatus: filterStatus !== 'all' ? filterStatus : null,
        sortBy: sortBy,
        sortDirection: sortDirection
      };
      
      const filteredCards = await searchFlashcards(options);
      return filteredCards;
    } catch (err) {
      console.error('カードの検索に失敗しました:', err);
      return [];
    }
  }, [searchQuery, selectedGenres, selectedTags, filterStatus, sortBy, sortDirection]);
  
  // 検索結果を更新
  useEffect(() => {
    const updateFilteredCards = async () => {
      setLoading(true);
      const filtered = await getFilteredCards();
      setCards(filtered);
      setLoading(false);
    };
    
    updateFilteredCards();
  }, [getFilteredCards]);
  
  // カードの追加
  const handleAddCard = async () => {
    // カード数チェック (500枚制限)
    if (cards.length >= 500) {
      toast.error('カード数が上限の500枚に達しています。新しいカードを追加するには、既存のカードを削除してください。');
      return;
    }
    
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      toast.error('問題と回答は必須項目です');
      return;
    }
    
    // 選択されたジャンルが3つ以上ないことを確認
    if (newCard.genres && newCard.genres.length > 3) {
      toast.error('ジャンルは最大3つまで設定できます');
      return;
    }
    
    try {
      const cardToSave = {
        ...newCard,
        id: generateId(),
        createdAt: new Date().toISOString(),
        lastStudied: null,
        studyCount: 0,
        correctCount: 0,
        incorrectCount: 0
      };
      
      await saveFlashcard(cardToSave);
      
      // 入力フォームをリセット
      setNewCard({
        question: '',
        answer: '',
        genres: [],
        tags: [],
        difficulty: 'normal',
        status: 'unlearned'
      });
      
      setShowAddCardForm(false);
      
      // カード一覧を更新
      const updatedCards = [...cards, cardToSave];
      setCards(updatedCards);
      
      // カード数を更新
      const counts = await getFlashcardCounts();
      setCardCounts(counts);
      
      toast.success('カードが追加されました');
    } catch (err) {
      console.error('カードの保存に失敗しました:', err);
      toast.error('カードの保存に失敗しました。もう一度やり直してください。');
    }
  };
  
  // カードの削除
  const handleDeleteCard = async (cardId) => {
    // カード削除の確認
    if (!window.confirm('このカードを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      // カードの削除
      await deleteFlashcard(cardId);
      
      // 削除したカードが現在編集中のカードなら、編集モードを終了
      if (editingCard && editingCard.id === cardId) {
        setEditingCard(null);
        setShowEditCardForm(false);
      }
      
      // カードリストを更新
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      
      // カード数の更新
      const counts = await getFlashcardCounts();
      setCardCounts(counts);
      
      toast.success('カードが削除されました');
    } catch (err) {
      console.error('カードの削除に失敗しました:', err);
      toast.error('カードの削除に失敗しました');
    }
  };
  
  // カードの更新
  const handleUpdateCard = async () => {
    if (!editingCard || !editingCard.term.trim() || !editingCard.definition.trim()) {
      toast.error('用語と説明文を入力してください');
      return;
    }
    
    try {
      // 更新日時を追加
      const updatedCard = {
        ...editingCard,
        updatedAt: new Date().toISOString()
      };
      
      await saveFlashcard(updatedCard);
      
      // 編集モードを終了
      setEditingCard(null);
      
      // カード一覧を更新
      const updatedCards = await getAllFlashcards();
      setCards(updatedCards);
    } catch (err) {
      console.error('カードの更新に失敗しました:', err);
      toast.error('カードの更新に失敗しました。もう一度やり直してください。');
    }
  };

  // ジャンルの追加
  const handleAddGenre = async () => {
    if (!newGenreName.trim()) {
      toast.error('ジャンル名を入力してください');
      return;
    }
    
    // 同名のジャンルが既に存在するかチェック
    const exists = genres.some(genre => genre.name.toLowerCase() === newGenreName.toLowerCase());
    if (exists) {
      toast.error('同じ名前のジャンルが既に存在します');
      return;
    }
    
    try {
      const newGenre = {
        name: newGenreName,
        createdAt: new Date().toISOString()
      };
      
      const genreId = await saveFlashcardGenre(newGenre);
      
      // 成功したら入力フォームをリセット
      setNewGenreName('');
      setShowAddGenreForm(false);
      
      // ジャンル一覧を更新
      const updatedGenres = await getAllFlashcardGenres();
      setGenres(updatedGenres);
    } catch (err) {
      console.error('ジャンルの保存に失敗しました:', err);
      toast.error('ジャンルの保存に失敗しました。もう一度やり直してください。');
    }
  };
  
  // ジャンルの削除
  const handleDeleteGenre = async (genreId) => {
    if (!genreId) return;
    
    const confirmed = window.confirm('このジャンルを削除してもよろしいですか？このジャンルを持つカードからジャンルが削除されます。');
    if (!confirmed) return;
    
    try {
      await deleteFlashcardGenre(genreId);
      
      // ジャンル一覧を更新
      const updatedGenres = await getAllFlashcardGenres();
      setGenres(updatedGenres);
      
      // カード一覧を更新（ジャンルが削除されたカードも更新されるため）
      const updatedCards = await getAllFlashcards();
      setCards(updatedCards);
    } catch (err) {
      console.error('ジャンルの削除に失敗しました:', err);
      toast.error('ジャンルの削除に失敗しました。もう一度やり直してください。');
    }
  };
  
  // タグの追加
  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast.error('タグ名を入力してください');
      return;
    }
    
    // 同名のタグが既に存在するかチェック
    const exists = tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase());
    if (exists) {
      toast.error('同じ名前のタグが既に存在します');
      return;
    }
    
    try {
      const newTag = {
        name: newTagName,
        createdAt: new Date().toISOString()
      };
      
      const tagId = await saveFlashcardTag(newTag);
      
      // 成功したら入力フォームをリセット
      setNewTagName('');
      setShowAddTagForm(false);
      
      // タグ一覧を更新
      const updatedTags = await getAllFlashcardTags();
      setTags(updatedTags);
    } catch (err) {
      console.error('タグの保存に失敗しました:', err);
      toast.error('タグの保存に失敗しました。もう一度やり直してください。');
    }
  };
  
  // タグの削除
  const handleDeleteTag = async (tagId) => {
    if (!tagId) return;
    
    const confirmed = window.confirm('このタグを削除してもよろしいですか？このタグを持つカードからタグが削除されます。');
    if (!confirmed) return;
    
    try {
      await deleteFlashcardTag(tagId);
      
      // タグ一覧を更新
      const updatedTags = await getAllFlashcardTags();
      setTags(updatedTags);
      
      // カード一覧を更新（タグが削除されたカードも更新されるため）
      const updatedCards = await getAllFlashcards();
      setCards(updatedCards);
    } catch (err) {
      console.error('タグの削除に失敗しました:', err);
      toast.error('タグの削除に失敗しました。もう一度やり直してください。');
    }
  };
  
  // データのエクスポート
  const handleExportData = async () => {
    try {
      const exportData = await exportFlashcardData();
      
      // JSONファイルとしてダウンロード
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `flashcards_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('データのエクスポートに失敗しました:', err);
      toast.error('データのエクスポートに失敗しました。もう一度やり直してください。');
    }
  };
  
  // インポートファイルの選択
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };
  
  // データのインポート
  const handleImportData = async () => {
    if (!importFile) {
      toast.error('インポートするファイルを選択してください');
      return;
    }

    try {
      // ファイルの内容を読み込む
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const fileContent = e.target.result;
          const importData = JSON.parse(fileContent);
          
          // 既存データを上書きするか確認
          const clearExisting = window.confirm('既存のデータを全て削除して新しいデータをインポートしますか？「いいえ」を選択すると、既存のデータにインポートデータが追加されます。');
          
          setImportProgress('インポート中...');
          
          // インポート実行
          const result = await importFlashcardData(importData, clearExisting);
          
          setImportProgress(`インポート完了: ${result.totalImported.cards}枚のカード、${result.totalImported.genres}個のジャンル、${result.totalImported.tags}個のタグをインポートしました。`);
          
          // データを再ロード
          const updatedCards = await getAllFlashcards();
          setCards(updatedCards);
          
          const updatedGenres = await getAllFlashcardGenres();
          setGenres(updatedGenres);
          
          const updatedTags = await getAllFlashcardTags();
          setTags(updatedTags);
          
          const counts = await getFlashcardCounts();
          setCardCounts(counts);
          
          // 完了後にクリア
          setTimeout(() => {
            setImportFile(null);
            setImportProgress(null);
            setShowImportExport(false);
          }, 3000);
        } catch (err) {
          console.error('JSONデータの解析に失敗しました:', err);
          setImportProgress('エラー: JSONデータの解析に失敗しました。');
        }
      };
      
      fileReader.onerror = () => {
        setImportProgress('エラー: ファイルの読み込みに失敗しました。');
      };
      
      fileReader.readAsText(importFile);
    } catch (err) {
      console.error('データのインポートに失敗しました:', err);
      toast.error('データのインポートに失敗しました。もう一度やり直してください。');
    }
  };
  
  // カードの学習状態が変更されたときのハンドラー
  const handleCardStatusChange = async (cardId, newStatus) => {
    try {
      // カード数を更新
      const counts = await getFlashcardCounts();
      setCardCounts(counts);
    } catch (err) {
      console.error('カード数の取得に失敗しました:', err);
    }
  };
  
  // 学習モードを開始
  const handleStartStudyMode = () => {
    setStudyMode(true);
  };
  
  // 学習モードを終了
  const handleExitStudyMode = () => {
    setStudyMode(false);
    setStudyCards([]);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestAnswers([]);
    setShowTestResults(false);
  };

  // カード編集処理
  const handleEditCard = async () => {
    if (!editingCard) return;

    // 入力検証
    if (!editingCard.question.trim() || !editingCard.answer.trim()) {
      toast.error('問題と回答は必須です');
      return;
    }

    if (editingCard.genres.length > 3) {
      toast.error('ジャンルは最大3つまで選択可能です');
      return;
    }

    try {
      // カードを更新
      await saveFlashcard(editingCard);
      
      // カードリストを更新
      const updatedCards = cards.map(card => 
        card.id === editingCard.id ? editingCard : card
      );
      setCards(updatedCards);
      
      // 編集モードを終了
      setEditingCard(null);
      setShowEditCardForm(false);
      
      toast.success('カードを更新しました');
      
      // カウントを更新
      const counts = await getFlashcardCounts();
      setCardCounts(counts);
    } catch (error) {
      console.error('カードの更新に失敗しました:', error);
      toast.error('カードの更新に失敗しました');
    }
  };
  
  // カード入力フォームの更新
  const handleNewCardChange = (field, value) => {
    setNewCard({
      ...newCard,
      [field]: value
    });
  };
  
  // 編集中のカードの更新
  const handleEditingCardChange = (field, value) => {
    setEditingCard({
      ...editingCard,
      [field]: value
    });
  };
  
  // ジャンル選択の変更（新規カード用）
  const handleGenreSelection = (genreId) => {
    // ジャンルが既に選択されているかチェック
    if (newCard.genres.includes(genreId)) {
      // 選択されている場合は削除
      setNewCard({
        ...newCard,
        genres: newCard.genres.filter(id => id !== genreId)
      });
    } else {
      // 選択されていない場合、既に3つ選択されていないか確認
      if (newCard.genres.length >= 3) {
        toast.error('ジャンルは最大3つまで選択できます');
        return;
      }
      // 選択リストに追加
      setNewCard({
        ...newCard,
        genres: [...newCard.genres, genreId]
      });
    }
  };
  
  // ジャンル選択の変更（編集用）
  const handleEditGenreSelection = (genreId) => {
    if (!editingCard) return;
    
    // ジャンルが既に選択されているかチェック
    if (editingCard.genres.includes(genreId)) {
      // 選択されている場合は削除
      setEditingCard({
        ...editingCard,
        genres: editingCard.genres.filter(id => id !== genreId)
      });
    } else {
      // 選択されていない場合、既に3つ選択されていないか確認
      if (editingCard.genres.length >= 3) {
        toast.error('ジャンルは最大3つまで選択できます');
        return;
      }
      // 選択リストに追加
      setEditingCard({
        ...editingCard,
        genres: [...editingCard.genres, genreId]
      });
    }
  };
  
  // タグ選択の変更（新規カード用）
  const handleTagSelection = (tagId) => {
    // タグが既に選択されているかチェック
    if (newCard.tags.includes(tagId)) {
      // 選択されている場合は削除
      setNewCard({
        ...newCard,
        tags: newCard.tags.filter(id => id !== tagId)
      });
    } else {
      // 選択リストに追加
      setNewCard({
        ...newCard,
        tags: [...newCard.tags, tagId]
      });
    }
  };
  
  // タグ選択の変更（編集用）
  const handleEditTagSelection = (tagId) => {
    if (!editingCard) return;
    
    // タグが既に選択されているかチェック
    if (editingCard.tags.includes(tagId)) {
      // 選択されている場合は削除
      setEditingCard({
        ...editingCard,
        tags: editingCard.tags.filter(id => id !== tagId)
      });
    } else {
      // 選択リストに追加
      setEditingCard({
        ...editingCard,
        tags: [...editingCard.tags, tagId]
      });
    }
  };
  
  // 検索とフィルタリング
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const searchResults = await searchFlashcards({
        searchTerm: searchQuery,
        genres: selectedGenres.length > 0 ? selectedGenres : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        studyStatus: filterStatus !== 'all' ? filterStatus : null,
        sortBy: sortBy,
        sortDirection: sortDirection
      });
      
      setCards(searchResults);
      setLoading(false);
    } catch (err) {
      console.error('カードの検索に失敗しました:', err);
      setLoading(false);
      setError('カードの検索に失敗しました');
    }
  };
  
  // 検索条件のリセット
  const handleResetSearch = async () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setSelectedTags([]);
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortDirection('desc');
    
    // 全てのカードを取得
    try {
      setLoading(true);
      const allCards = await getAllFlashcards();
      setCards(allCards);
      setLoading(false);
    } catch (err) {
      console.error('カードの取得に失敗しました:', err);
      setLoading(false);
      setError('カードの取得に失敗しました');
    }
  };
  
  // フィルタリングとソートの変更
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'searchQuery':
        setSearchQuery(value);
        break;
      case 'genre':
        // ジャンルの選択状態を切り替え
        if (selectedGenres.includes(value)) {
          setSelectedGenres(selectedGenres.filter(id => id !== value));
        } else {
          setSelectedGenres([...selectedGenres, value]);
        }
        break;
      case 'tag':
        // タグの選択状態を切り替え
        if (selectedTags.includes(value)) {
          setSelectedTags(selectedTags.filter(id => id !== value));
        } else {
          setSelectedTags([...selectedTags, value]);
        }
        break;
      case 'status':
        setFilterStatus(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'sortDirection':
        setSortDirection(value);
        break;
      default:
        break;
    }
  };

  // 学習モード関連
  // カードの勉強状態を更新
  const handleUpdateCardStatus = async (cardId, newStatus) => {
    try {
      const cardToUpdate = cards.find(card => card.id === cardId);
      if (!cardToUpdate) return;
      
      const updatedCard = {
        ...cardToUpdate,
        studyStatus: newStatus,
        lastStudied: new Date().toISOString()
      };
      
      await saveFlashcard(updatedCard);
      
      // カード一覧を更新
      const updatedCards = await getAllFlashcards();
      setCards(updatedCards);
      
      // 学習モード中の場合、学習中カードも更新
      if (studyMode && studyCards.length > 0) {
        setStudyCards(prevStudyCards => 
          prevStudyCards.map(card => 
            card.id === cardId ? updatedCard : card
          )
        );
      }
      
      // カード数を更新
      const counts = await getFlashcardCounts();
      setCardCounts(counts);
    } catch (err) {
      console.error('カードの状態更新に失敗しました:', err);
      toast.error('カードの状態更新に失敗しました。もう一度やり直してください。');
    }
  };
  
  // 復習モードの開始
  const handleStartReviewMode = async (status = null, genreId = null, tagId = null) => {
    try {
      setLoading(true);
      
      // フィルター条件に基づいてカードを取得
      let filteredCards = [...cards];
      
      // ステータスでフィルタリング
      if (status) {
        filteredCards = filteredCards.filter(card => card.studyStatus === status);
      }
      
      // ジャンルでフィルタリング
      if (genreId) {
        filteredCards = filteredCards.filter(card => card.genres.includes(genreId));
      }
      
      // タグでフィルタリング
      if (tagId) {
        filteredCards = filteredCards.filter(card => card.tags.includes(tagId));
      }
      
      // カードがなければ終了
      if (filteredCards.length === 0) {
        setLoading(false);
        toast.error('選択した条件に一致するカードがありません');
        return;
      }
      
      // ランダムに並び替え
      const shuffledCards = [...filteredCards].sort(() => Math.random() - 0.5);
      
      setStudyCards(shuffledCards);
      setCurrentCardIndex(0);
      setStudyMode('review');
      setShowAnswer(false);
      
      setLoading(false);
    } catch (err) {
      console.error('復習モードの開始に失敗しました:', err);
      setLoading(false);
      toast.error('復習モードの開始に失敗しました。もう一度やり直してください。');
    }
  };
  
  // テストモードの開始
  const handleStartTestMode = async (status = null, genreId = null, tagId = null) => {
    try {
      setLoading(true);
      
      // フィルター条件に基づいてカードを取得
      let filteredCards = [...cards];
      
      // ステータスでフィルタリング
      if (status) {
        filteredCards = filteredCards.filter(card => card.studyStatus === status);
      }
      
      // ジャンルでフィルタリング
      if (genreId) {
        filteredCards = filteredCards.filter(card => card.genres.includes(genreId));
      }
      
      // タグでフィルタリング
      if (tagId) {
        filteredCards = filteredCards.filter(card => card.tags.includes(tagId));
      }
      
      // カードがなければ終了
      if (filteredCards.length === 0) {
        setLoading(false);
        toast.error('選択した条件に一致するカードがありません');
        return;
      }
      
      // ランダムに並び替え
      const shuffledCards = [...filteredCards].sort(() => Math.random() - 0.5);
      
      setStudyCards(shuffledCards);
      setCurrentCardIndex(0);
      setStudyMode('test');
      setShowAnswer(false);
      setTestAnswers([]);
      
      setLoading(false);
    } catch (err) {
      console.error('テストモードの開始に失敗しました:', err);
      setLoading(false);
      toast.error('テストモードの開始に失敗しました。もう一度やり直してください。');
    }
  };
  
  // 次のカードへ
  const handleNextCard = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // テストモードの場合、結果を表示
      if (studyMode === 'test') {
        setShowTestResults(true);
      } else {
        // 学習終了時の処理
        handleExitStudyMode();
      }
    }
  };
  
  // 前のカードへ
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };
  
  // 回答の表示切替
  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };
  
  // テストモードでの回答処理
  const handleTestAnswer = (isCorrect) => {
    const currentCard = studyCards[currentCardIndex];
    
    // 回答を記録
    setTestAnswers([
      ...testAnswers,
      {
        cardId: currentCard.id,
        isCorrect
      }
    ]);
    
    // 正解/不正解に基づいてカードの状態を更新
    let newStatus = currentCard.studyStatus;
    
    if (isCorrect) {
      // 正解の場合、ステータスを一段階上げる
      if (newStatus === 'unlearned') {
        newStatus = 'learning';
      } else if (newStatus === 'learning') {
        newStatus = 'learned';
      }
    } else {
      // 不正解の場合、'unlearned'に戻す
      newStatus = 'unlearned';
    }
    
    // カードの状態を更新
    handleUpdateCardStatus(currentCard.id, newStatus);
    
    // 次のカードへ
    handleNextCard();
  };
  
  // 文章化練習機能
  const handleStartSentenceMode = async (genreId = null) => {
    try {
      setLoading(true);
      
      // フィルター条件に基づいてカードを取得
      let filteredCards = [...cards];
      
      // ジャンルでフィルタリング
      if (genreId) {
        filteredCards = filteredCards.filter(card => card.genres.includes(genreId));
      }
      
      // カードがなければ終了
      if (filteredCards.length < 5) {
        setLoading(false);
        toast.error('文章化練習には最低5枚のカードが必要です');
        return;
      }
      
      // ランダムに5枚のカードを選択
      const selectedCards = [...filteredCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      
      setSentenceCards(selectedCards);
      setStudyMode('sentence');
      setSentenceInput('');
      
      setLoading(false);
    } catch (err) {
      console.error('文章化練習の開始に失敗しました:', err);
      setLoading(false);
      toast.error('文章化練習の開始に失敗しました。もう一度やり直してください。');
    }
  };
  
  // 文章入力の処理
  const handleSentenceInputChange = (value) => {
    setSentenceInput(value);
  };
  
  // 文章練習の提出
  const handleSubmitSentence = () => {
    if (sentenceInput.trim() === '') {
      toast.error('文章を入力してください');
      return;
    }
    
    // 全ての単語が使われているかチェック
    const allTermsUsed = sentenceCards.every(card => 
      sentenceInput.toLowerCase().includes(card.term.toLowerCase())
    );
    
    if (!allTermsUsed) {
      toast.error('全ての用語を使用してください');
      return;
    }

    // 文章練習の結果を表示
    setSentenceSubmitted(true);
  };
  
  // 文章練習の終了
  const handleExitSentenceMode = () => {
    setStudyMode(null);
    setSentenceCards([]);
    setSentenceInput('');
    setSentenceSubmitted(false);
  };

  // カードをエクスポートする関数
  const handleExportCards = () => {
    // カードがない場合はエクスポートしない
    if (!cards || cards.length === 0) {
      toast.error('エクスポートできるカードがありません。');
      return;
    }

    try {
      // エクスポートデータを作成
      const exportData = {
        cards: cards,
        genres: genres,
        tags: tags,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // JSONに変換
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Blobを作成
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // 現在の日付をファイル名に使用
      const date = new Date().toISOString().split('T')[0];
      a.download = `flashcards_export_${date}.json`;
      a.href = url;
      
      // リンクをクリックしてダウンロード開始
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`${cards.length}枚のカードをエクスポートしました。`);
    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
      toast.error('エクスポートに失敗しました。');
    }
  };

  // カードをインポートする関数
  const handleImportCards = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズが大きすぎます（最大5MB）。');
      event.target.value = ''; // ファイル選択をリセット
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // JSONをパース
        const importData = JSON.parse(e.target.result);
        
        // データ構造を検証
        if (!importData.cards || !Array.isArray(importData.cards)) {
          throw new Error('無効なカードデータ形式です。');
        }
        
        // 全てのカードが有効なフォーマットであることを確認
        const validCards = importData.cards.filter(card => 
          card.id && card.term && card.definition
        );
        
        if (validCards.length === 0) {
          throw new Error('インポートするカードが見つかりませんでした。');
        }
        
        // カード数制限のチェック
        if (cards.length + validCards.length > 500) {
          throw new Error(`カード数が制限（500枚）を超えます。現在${cards.length}枚、インポート${validCards.length}枚`);
        }
        
        // 重複IDを避けるためにIDを再生成
        const existingIds = new Set(cards.map(card => card.id));
        const newCards = validCards.map(card => {
          const newId = existingIds.has(card.id) ? generateId() : card.id;
          existingIds.add(newId);
          return { ...card, id: newId };
        });
        
        // インポートするジャンルを処理
        let updatedGenres = [...genres];
        if (importData.genres && Array.isArray(importData.genres)) {
          const existingGenreNames = new Set(genres.map(g => g.name.toLowerCase()));
          const newGenres = importData.genres.filter(g => 
            g.id && g.name && !existingGenreNames.has(g.name.toLowerCase())
          ).map(g => ({
            ...g,
            id: generateId() // 新しいIDを生成
          }));
          
          updatedGenres = [...genres, ...newGenres];
        }
        
        // インポートするタグを処理
        let updatedTags = [...tags];
        if (importData.tags && Array.isArray(importData.tags)) {
          const existingTagNames = new Set(tags.map(t => t.name.toLowerCase()));
          const newTags = importData.tags.filter(t => 
            t.id && t.name && !existingTagNames.has(t.name.toLowerCase())
          ).map(t => ({
            ...t,
            id: generateId() // 新しいIDを生成
          }));
          
          updatedTags = [...tags, ...newTags];
        }
        
        // カードとジャンルとタグを更新
        const mergedCards = [...cards, ...newCards];
        setCards(mergedCards);
        setGenres(updatedGenres);
        setTags(updatedTags);
        
        // ローカルストレージを更新
        localStorage.setItem('flashcards', JSON.stringify(mergedCards));
        localStorage.setItem('flashcardGenres', JSON.stringify(updatedGenres));
        localStorage.setItem('flashcardTags', JSON.stringify(updatedTags));
        
        toast.success(`${newCards.length}枚のカードをインポートしました。`);
      } catch (error) {
        console.error('インポート中にエラーが発生しました:', error);
        toast.error(`インポートに失敗しました: ${error.message}`);
      }
      
      // ファイル選択をリセット
      event.target.value = '';
    };
    
    reader.onerror = () => {
      toast.error('ファイルの読み込みに失敗しました。');
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  // 学習統計を計算する関数
  const calculateStudyStats = () => {
    if (!cards || cards.length === 0) {
      return {
        totalCards: 0,
        learnedCards: 0,
        learningCards: 0,
        unlearnedCards: 0,
        completionRate: 0,
        studiedToday: 0,
        studiedThisWeek: 0,
        mostStudiedGenre: null,
        mostDifficultCards: []
      };
    }

    // 現在の日時
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // 各状態のカードをカウント
    const learnedCards = cards.filter(card => card.status === 'learned').length;
    const learningCards = cards.filter(card => card.status === 'learning').length;
    const unlearnedCards = cards.filter(card => !card.status || card.status === 'new').length;
    
    // 今日と今週に学習したカードを計算
    const studiedToday = cards.filter(card => {
      if (!card.lastStudied) return false;
      const studyDate = new Date(card.lastStudied);
      return studyDate >= today;
    }).length;

    const studiedThisWeek = cards.filter(card => {
      if (!card.lastStudied) return false;
      const studyDate = new Date(card.lastStudied);
      return studyDate >= lastWeek;
    }).length;

    // ジャンル別学習カウント
    const genreCounts = {};
    cards.forEach(card => {
      if (card.genreId && card.studyCount) {
        genreCounts[card.genreId] = (genreCounts[card.genreId] || 0) + card.studyCount;
      }
    });

    // 最も学習されたジャンル
    let mostStudiedGenreId = null;
    let maxStudyCount = 0;
    
    Object.keys(genreCounts).forEach(genreId => {
      if (genreCounts[genreId] > maxStudyCount) {
        maxStudyCount = genreCounts[genreId];
        mostStudiedGenreId = genreId;
      }
    });

    const mostStudiedGenre = mostStudiedGenreId
      ? genres.find(g => g.id === mostStudiedGenreId)?.name
      : null;

    // 最も難しいカード（不正解回数が多いもの）を特定
    const cardsWithIncorrect = cards
      .filter(card => card.incorrectCount && card.incorrectCount > 0)
      .sort((a, b) => (b.incorrectCount || 0) - (a.incorrectCount || 0))
      .slice(0, 5); // 上位5枚

    return {
      totalCards: cards.length,
      learnedCards,
      learningCards,
      unlearnedCards,
      completionRate: Math.round((learnedCards / cards.length) * 100),
      studiedToday,
      studiedThisWeek,
      mostStudiedGenre,
      mostDifficultCards: cardsWithIncorrect
    };
  };

  // 統計情報を更新する関数
  const updateStats = () => {
    const calculatedStats = calculateStudyStats();
    setStats(calculatedStats);
  };

  // カードが変更されたときに統計を更新
  useEffect(() => {
    updateStats();
  }, [cards]);

  // 統計ダッシュボード表示関数
  const renderStatsDashboard = () => {
    if (!showStats || !stats) return null;

    return (
      <div className="stats-dashboard">
        <h3 className="stats-title">学習統計</h3>
        
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{stats.totalCards}</div>
            <div className="stat-label">総カード数</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.learnedCards}</div>
            <div className="stat-label">習得済み</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.learningCards}</div>
            <div className="stat-label">学習中</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.unlearnedCards}</div>
            <div className="stat-label">未学習</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.completionRate}%</div>
            <div className="stat-label">完了率</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.studiedToday}</div>
            <div className="stat-label">今日の学習</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.studiedThisWeek}</div>
            <div className="stat-label">今週の学習</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.mostStudiedGenre || '-'}</div>
            <div className="stat-label">最も学習したジャンル</div>
          </div>
        </div>

        {stats.mostDifficultCards.length > 0 && (
          <div className="difficult-cards-section">
            <h4>復習が必要なカード</h4>
            <div className="difficult-cards-table-container">
              <table className="difficult-cards-table">
                <thead>
                  <tr>
                    <th>用語</th>
                    <th>ジャンル</th>
                    <th>不正解数</th>
                    <th>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.mostDifficultCards.map(card => (
                    <tr key={card.id}>
                      <td>{card.term}</td>
                      <td>{genres.find(g => g.id === card.genreId)?.name || '未分類'}</td>
                      <td>{card.incorrectCount}</td>
                      <td>
                        <button
                          className="small-button edit-button"
                          onClick={() => handleEditCard(card.id)}
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // データ管理ボタンを描画する関数
  const renderDataManagement = () => {
    return (
      <div className="data-management-controls">
        <button
          className={`control-button ${cards.length === 0 ? 'disabled' : ''}`}
          onClick={handleExportCards}
          disabled={cards.length === 0}
        >
          エクスポート
        </button>
        
        <button
          className="control-button"
          onClick={triggerFileInput}
        >
          インポート
        </button>
        
        <button
          className={`control-button ${showStats ? 'active' : ''}`}
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? '統計を隠す' : '統計を表示'}
        </button>
        
        {/* ファイル入力要素（非表示） */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleImportCards}
        />
      </div>
    );
  };

  // 編集フォームを開く
  const handleStartEdit = (card) => {
    if (card) {
      setEditingCard({...card});
      setShowEditCardForm(true);
    }
  };

  // triggerFileInput関数を追加
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flashcards-container">
      <div className="flashcards-header">
        <h2>用語暗記カード</h2>
        {renderDataManagement()}
      </div>

      {renderStatsDashboard()}

      {/* ... existing code ... */}
    </div>
  );
};

export default FlashcardsContainer; 
