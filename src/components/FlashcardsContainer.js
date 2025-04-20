import React, { useState, useEffect } from 'react';
import FlashcardDeck from './FlashcardDeck';

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
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [showAddDeckForm, setShowAddDeckForm] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');

  useEffect(() => {
    // 初期データのロード
    setDecks(sampleDecks);
    if (sampleDecks.length > 0) {
      setSelectedDeckId(sampleDecks[0].id);
      setSelectedDeck(sampleDecks[0]);
    }
  }, []);

  useEffect(() => {
    // 選択されたデッキIDが変更されたときの処理
    if (selectedDeckId) {
      const deck = decks.find(d => d.id === selectedDeckId);
      setSelectedDeck(deck);
    } else {
      setSelectedDeck(null);
    }
  }, [selectedDeckId, decks]);

  const handleDeckChange = (e) => {
    setSelectedDeckId(e.target.value);
  };

  const handleAddCard = () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      alert('用語と定義を入力してください');
      return;
    }

    // 新しいカードを追加
    const updatedDecks = decks.map(deck => {
      if (deck.id === selectedDeckId) {
        const newCard = {
          id: Date.now(), // 一意のID
          term: newTerm,
          definition: newDefinition
        };
        return {
          ...deck,
          cards: [...deck.cards, newCard]
        };
      }
      return deck;
    });

    setDecks(updatedDecks);
    setNewTerm('');
    setNewDefinition('');
    setShowAddCardForm(false);
  };

  const handleAddDeck = () => {
    if (!newDeckTitle.trim()) {
      alert('デッキのタイトルを入力してください');
      return;
    }

    // 新しいデッキを追加
    const newDeck = {
      id: `deck-${Date.now()}`, // 一意のID
      title: newDeckTitle,
      cards: []
    };

    setDecks([...decks, newDeck]);
    setNewDeckTitle('');
    setShowAddDeckForm(false);
    setSelectedDeckId(newDeck.id);
  };

  return (
    <div>
      {/* デッキ選択と追加セクション */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-grow mr-4">
            <label className="block text-sm font-medium mb-1">デッキを選択:</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedDeckId}
              onChange={handleDeckChange}
            >
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>
                  {deck.title} ({deck.cards.length}枚)
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              onClick={() => setShowAddDeckForm(true)}
            >
              デッキを追加
            </button>
          </div>
        </div>

        {/* 新規デッキ追加フォーム */}
        {showAddDeckForm && (
          <div className="p-4 bg-gray-100 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">新規デッキを追加</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">デッキのタイトル:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                placeholder="例: 経営法務"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                onClick={() => setShowAddDeckForm(false)}
              >
                キャンセル
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                onClick={handleAddDeck}
              >
                デッキを作成
              </button>
            </div>
          </div>
        )}
      </div>

      {/* デッキ表示とカード追加ボタン */}
      {selectedDeck ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{selectedDeck.title}</h2>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => setShowAddCardForm(true)}
            >
              カードを追加
            </button>
          </div>

          {/* 新規カード追加フォーム */}
          {showAddCardForm && (
            <div className="p-4 bg-gray-100 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">新規カードを追加</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">用語:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="例: DCF法"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">定義:</label>
                <textarea
                  className="w-full p-2 border rounded resize-none h-24"
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="例: 将来のキャッシュフローを現在価値に割り引いて企業価値や資産価値を算定する方法。"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                  onClick={() => setShowAddCardForm(false)}
                >
                  キャンセル
                </button>
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={handleAddCard}
                >
                  カードを追加
                </button>
              </div>
            </div>
          )}

          {/* カードデッキ表示 */}
          {selectedDeck.cards.length > 0 ? (
            <FlashcardDeck cards={selectedDeck.cards} title={selectedDeck.title} />
          ) : (
            <p className="text-center p-6 bg-gray-100 rounded-lg">
              このデッキにはまだカードがありません。「カードを追加」ボタンから新しいカードを作成してください。
            </p>
          )}
        </div>
      ) : (
        <p className="text-center p-6 bg-gray-100 rounded-lg">
          デッキが選択されていません。デッキを選択するか、新しいデッキを作成してください。
        </p>
      )}
    </div>
  );
};

export default FlashcardsContainer; 
