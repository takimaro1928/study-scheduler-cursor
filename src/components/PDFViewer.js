import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// PDFJSワーカーの設定
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  return (
    <div className="pdf-viewer">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
            onClick={zoomOut}
          >
            縮小
          </button>
          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
            onClick={zoomIn}
          >
            拡大
          </button>
          <span className="px-2 py-1">{Math.round(scale * 100)}%</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            前へ
          </button>
          <span>
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            次へ
          </button>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="max-w-full"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer; 
