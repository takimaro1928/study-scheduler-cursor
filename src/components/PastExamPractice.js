import React, { useState } from 'react';
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
  const [selectedExam, setSelectedExam] = useState(sampleExams[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(sampleExams[0].questions[0]);
  const [answerText, setAnswerText] = useState('');
  const [savedAnswers, setSavedAnswers] = useState({});
  const [timer, setTimer] = useState(70); // 70分タイマー
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // 試験の選択
  const handleExamChange = (e) => {
    const examId = e.target.value;
    const exam = sampleExams.find(exam => exam.id === examId);
    setSelectedExam(exam);
    setSelectedQuestion(exam.questions[0]);
    // 試験を切り替えた際に解答をリセット
    setAnswerText('');
  };

  // 問題の選択
  const handleQuestionChange = (question) => {
    // 現在の回答を保存
    if (selectedQuestion) {
      setSavedAnswers({
        ...savedAnswers,
        [`${selectedExam.id}-${selectedQuestion.id}`]: answerText
      });
    }
    
    // 選択した問題の回答を読み込み
    const savedAnswer = savedAnswers[`${selectedExam.id}-${question.id}`] || '';
    setSelectedQuestion(question);
    setAnswerText(savedAnswer);
  };

  // 回答の保存
  const handleSaveAnswer = () => {
    const key = `${selectedExam.id}-${selectedQuestion.id}`;
    setSavedAnswers({
      ...savedAnswers,
      [key]: answerText
    });
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 左側のパネル - PDFビューア */}
      <div className="md:col-span-2">
        <PDFViewer
          pdfUrl={selectedExam.pdfUrl}
          title={selectedExam.title}
        />
      </div>

      {/* 右側のパネル - 選択肢と解答エリア */}
      <div className="flex flex-col">
        {/* 試験選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">年度選択:</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedExam.id}
            onChange={handleExamChange}
          >
            {sampleExams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        {/* タイマー */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
          <div className="text-xl font-bold">{formatTime(timer)}</div>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded text-white ${isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={toggleTimer}
            >
              {isTimerRunning ? '停止' : '開始'}
            </button>
            <button
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
              onClick={resetTimer}
            >
              リセット
            </button>
          </div>
        </div>

        {/* 設問選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">設問選択:</label>
          <div className="grid grid-cols-2 gap-2">
            {selectedExam.questions.map(question => (
              <button
                key={question.id}
                className={`p-2 text-sm border rounded ${selectedQuestion.id === question.id ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'}`}
                onClick={() => handleQuestionChange(question)}
              >
                {question.text}
              </button>
            ))}
          </div>
        </div>

        {/* 解答エリア */}
        <div className="flex-grow mb-4">
          <label className="block text-sm font-medium mb-1">解答:</label>
          <textarea
            className="w-full h-64 p-2 border rounded resize-none"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="ここに解答を入力してください..."
          />
        </div>

        {/* 保存ボタン */}
        <button
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSaveAnswer}
        >
          解答を保存
        </button>
      </div>
    </div>
  );
};

export default PastExamPractice; 
