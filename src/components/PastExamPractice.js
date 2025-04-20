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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">{examTitle}</h2>
          <div className="flex space-x-2">
            <button
              onClick={toggleTimer}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                isTimerRunning
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } transition-all duration-200`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isTimerRunning ? 'タイマー停止' : 'タイマー開始'}
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm flex items-center transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              リセット
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">PDF表示</h3>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                  {formatTime(timer)}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors duration-200"
                  >
                    PDFアップロード
                  </label>
                </label>
              </div>
            </div>
            <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {pdfUrl ? (
                <PDFViewer url={pdfUrl} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-center px-8">
                    PDFがアップロードされていません。<br />
                    「PDFアップロード」ボタンからファイルを選択してください。
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">過去問選択</h3>
            <div className="space-y-4">
              {sampleExams.map(exam => (
                <div key={exam.id} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">{exam.title}</h4>
                      <button 
                        onClick={() => {
                          setExamTitle(exam.title);
                          setPdfUrl(exam.pdfUrl);
                        }}
                        className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2.5 py-1 rounded-full font-medium transition-colors duration-200"
                      >
                        選択
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">事例選択</h5>
                      <div className="grid grid-cols-4 gap-2">
                        {exam.questions.map((caseData, caseIdx) => (
                          <div key={caseIdx} className="col-span-1">
                            <button
                              className={`w-full py-2 px-3 text-sm rounded-lg font-medium transition-all duration-200 ${
                                selectedCase === caseData.id
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              onClick={() => {
                                setSelectedCase(caseData.id);
                                setSelectedQuestion(1);
                                saveCurrentAnswer();
                              }}
                            >
                              事例{caseData.id}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {selectedCase && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-sm font-medium text-gray-700">設問選択</h5>
                          <div className="flex items-center space-x-1">
                            <label className="text-xs text-gray-500">設問数</label>
                            <select
                              className="text-xs border border-gray-300 rounded p-1 bg-white"
                              value={
                                exam.questions.find(q => q.id === selectedCase)?.questionCount || 3
                              }
                              onChange={e => 
                                handleCaseQuestionCountChange(
                                  selectedCase, 
                                  parseInt(e.target.value)
                                )
                              }
                            >
                              {[1, 2, 3, 4, 5].map(num => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from(
                            { length: exam.questions.find(q => q.id === selectedCase)?.questionCount || 3 },
                            (_, i) => i + 1
                          ).map(qNum => (
                            <button
                              key={qNum}
                              className={`py-2 px-3 text-sm rounded-lg font-medium transition-all duration-200 ${
                                selectedQuestion === qNum
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              onClick={() => handleQuestionChange(selectedCase, qNum)}
                            >
                              設問{qNum}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-grow mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">解答:</label>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">{answerText.length}文字</span>
          </div>
          <textarea
            className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="ここに解答を入力してください..."
          />
        </div>

        {/* 保存ボタン */}
        <button
          className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
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
