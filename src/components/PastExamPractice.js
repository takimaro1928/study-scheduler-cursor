import React, { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';

// サンプルPDFデータ（実際の実装では外部から取得）
const sampleExams = [
  {
    id: '2022',
    title: '2022年度 中小企業診断士2次試験',
    pdfUrl: 'https://example.com/pdfs/sme_exam_2022.pdf',
    questions: [
      { id: 1, text: '事例Ⅰ 設問1' },
      { id: 2, text: '事例Ⅰ 設問2' },
      { id: 3, text: '事例Ⅱ 設問1' },
      { id: 4, text: '事例Ⅱ 設問2' },
      { id: 5, text: '事例Ⅲ 設問1' },
      { id: 6, text: '事例Ⅲ 設問2' },
      { id: 7, text: '事例Ⅳ 設問1' },
      { id: 8, text: '事例Ⅳ 設問2' },
    ]
  },
  {
    id: '2021',
    title: '2021年度 中小企業診断士2次試験',
    pdfUrl: 'https://example.com/pdfs/sme_exam_2021.pdf',
    questions: [
      { id: 1, text: '事例Ⅰ 設問1' },
      { id: 2, text: '事例Ⅰ 設問2' },
      { id: 3, text: '事例Ⅱ 設問1' },
      { id: 4, text: '事例Ⅱ 設問2' },
      { id: 5, text: '事例Ⅲ 設問1' },
      { id: 6, text: '事例Ⅲ 設問2' },
      { id: 7, text: '事例Ⅳ 設問1' },
      { id: 8, text: '事例Ⅳ 設問2' },
    ]
  }
];

const PastExamPractice = () => {
  const [examTitle, setExamTitle] = useState('中小企業診断士2次試験');
  const [pdfUrl, setPdfUrl] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [savedAnswers, setSavedAnswers] = useState({});
  const [timer, setTimer] = useState(70);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // 事例と設問の構造
  const [cases, setCases] = useState([
    { id: 1, name: '事例I', questions: [1, 2] },
    { id: 2, name: '事例II', questions: [1, 2] },
    { id: 3, name: '事例III', questions: [1, 2] },
    { id: 4, name: '事例IV', questions: [1, 2] }
  ]);
  
  const [selectedCase, setSelectedCase] = useState(cases[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(1);

  // 問題の選択
  const handleQuestionChange = (caseId, questionNum) => {
    // 現在の回答を保存
    saveCurrentAnswer();
    
    // 選択した事例を特定
    const caseObj = cases.find(c => c.id === caseId);
    if (!caseObj) return;
    
    setSelectedCase(caseObj);
    setSelectedQuestion(questionNum);
    
    // 選択した問題の回答を読み込み
    const key = `${caseObj.id}-${questionNum}`;
    const savedAnswer = savedAnswers[key] || '';
    setAnswerText(savedAnswer);
  };

  // 現在の回答を保存
  const saveCurrentAnswer = () => {
    if (selectedCase && selectedQuestion) {
      const key = `${selectedCase.id}-${selectedQuestion}`;
      setSavedAnswers(prev => ({
        ...prev,
        [key]: answerText
      }));
    }
  };

  // 回答の保存
  const handleSaveAnswer = () => {
    saveCurrentAnswer();
    alert('解答を保存しました');
  };

  // タイマーの制御
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setTimer(70);
    setIsTimerRunning(false);
  };

  // タイマーのフォーマット
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins < 10 ? '0' : ''}${mins}`;
  };
  
  // 事例の問題数を変更
  const handleCaseQuestionCountChange = (caseId, count) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        // 問題数に合わせて問題配列を調整
        const newQuestions = Array.from({ length: count }, (_, i) => i + 1);
        return { ...c, questions: newQuestions };
      }
      return c;
    }));
  };

  // PDFのアップロード処理
  const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 左側のパネル - PDFビューア */}
      <div className="md:col-span-2">
        {pdfUrl ? (
          <PDFViewer
            pdfUrl={pdfUrl}
            title={examTitle}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-6 bg-gray-50">
            <p className="mb-4 text-gray-500">PDFファイルをアップロードしてください</p>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-md font-medium flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              PDFを選択
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
            </label>
          </div>
        )}
      </div>

      {/* 右側のパネル - 設定と解答エリア */}
      <div className="flex flex-col">
        {/* 試験名入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">試験名:</label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="試験名を入力"
          />
        </div>

        {/* タイマー */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg flex justify-between items-center shadow-sm">
          <div className="text-xl font-bold">{formatTime(timer)}</div>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md text-white font-medium transition shadow-sm flex items-center ${isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={toggleTimer}
            >
              {isTimerRunning 
               ? (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>停止</>) 
               : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>開始</>)}
            </button>
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition shadow-sm flex items-center"
              onClick={resetTimer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              リセット
            </button>
          </div>
        </div>

        {/* 事例設定 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">事例設定:</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {cases.map(caseItem => (
              <div key={caseItem.id} className="flex items-center space-x-2 border rounded p-2 bg-white shadow-sm">
                <span className="whitespace-nowrap font-medium">{caseItem.name}</span>
                <div className="flex items-center ml-auto">
                  <label className="text-xs mr-1">問題数:</label>
                  <select 
                    className="p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={caseItem.questions.length}
                    onChange={(e) => handleCaseQuestionCountChange(caseItem.id, parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 設問選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">設問選択:</label>
          <div className="grid grid-cols-2 gap-2">
            {cases.map(caseItem => (
              <React.Fragment key={caseItem.id}>
                {caseItem.questions.map(questionNum => (
                  <button
                    key={`${caseItem.id}-${questionNum}`}
                    className={`p-2 text-sm border rounded-md transition shadow-sm
                      ${selectedCase.id === caseItem.id && selectedQuestion === questionNum 
                        ? 'bg-blue-100 border-blue-500 font-medium text-blue-800' 
                        : 'hover:bg-gray-100 bg-white'}`}
                    onClick={() => handleQuestionChange(caseItem.id, questionNum)}
                  >
                    {caseItem.name} 設問{questionNum}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 解答エリア */}
        <div className="flex-grow mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">解答:</label>
            <span className="text-xs text-gray-500">{answerText.length}文字</span>
          </div>
          <textarea
            className="w-full h-64 p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="ここに解答を入力してください..."
          />
        </div>

        {/* 保存ボタン */}
        <button
          className="w-full p-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition shadow-md flex items-center justify-center"
          onClick={handleSaveAnswer}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
          </svg>
          解答を保存する
        </button>
      </div>
    </div>
  );
};

export default PastExamPractice; 
