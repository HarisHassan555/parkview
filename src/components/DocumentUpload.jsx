import { useState, useRef } from 'react'
import OCRService from '../services/OCRService'

const DocumentUpload = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false)
  const [tableMode, setTableMode] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG) or PDF file.')
      return
    }

    // Validate file size (5MB limit for free OCR API)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.')
      return
    }

    try {
      await onUpload(file)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current.click()
  }

  const toggleTableMode = () => {
    const newMode = !tableMode
    setTableMode(newMode)
    OCRService.setTableMode(newMode)
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
          disabled={isProcessing}
        />
        
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-xl font-medium text-gray-900 mb-2">
              {isProcessing ? 'Processing document...' : 'Upload your document'}
            </p>
            <p className="text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports: JPG, PNG, PDF (Max 5MB)
            </p>
          </div>
          
          <button
            onClick={onButtonClick}
            disabled={isProcessing}
            style={{ marginTop: '70px' }}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Choose File'}
          </button>
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Processing with AI...</span>
        </div>
      )}

      {/* OCR Mode Toggle */}
      {/* <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Table Detection</h3>
            <p className="text-sm text-gray-600">
              {tableMode ? 'Table detection enabled (better for structured data)' : 'Table detection disabled (raw text extraction)'}
            </p>
          </div>
          <button
            onClick={toggleTableMode}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tableMode
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                : 'bg-gray-600 text-white hover:bg-gray-700 shadow-md'
            }`}
          >
            {tableMode ? 'Table Mode ON' : 'Table Mode OFF'}
          </button>
        </div>
      </div> */}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">How it works:</h3>
        <ol className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="bg-blue-200 text-blue-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5">1</span>
            Upload a document (image or PDF)
          </li>
          <li className="flex items-start">
            <span className="bg-blue-200 text-blue-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5">2</span>
            Our AI system will extract all text
          </li>
          {/* <li className="flex items-start">
            <span className="bg-blue-200 text-blue-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5">3</span>
            View the extracted text on the next screen
          </li>
          <li className="flex items-start">
            <span className="bg-blue-200 text-blue-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5">4</span>
            Copy or download the results
          </li> */}
        </ol>
      </div>
    </div>
  )
}

export default DocumentUpload