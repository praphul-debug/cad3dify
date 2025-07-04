import React, { useState, useRef, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { ProjectManager } from './ProjectManager'
import { ModelLibrary } from './ModelLibrary'
import { AdvancedViewer } from './AdvancedViewer'

interface ProcessingResult {
  success: boolean
  modelId?: string
  imageUrl?: string
  stepUrl?: string
  error?: string
  message?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  imageUrl?: string
  stepUrl?: string
}

interface Project {
  id: string
  name: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
  user_id: string
}

interface Model {
  id: string
  prompt: string
  file_url: string
  created_at: string
  project_id?: string
}

export const EnhancedCadProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [activePanel, setActivePanel] = useState<'chat' | 'projects' | 'library'>('chat')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: isDemoMode() 
        ? 'Welcome to CAD3Dify Pro! This enhanced workspace includes project management, model library, and advanced 3D visualization. Upload a 2D CAD drawing to experience the full workflow.'
        : 'Welcome to CAD3Dify Pro! Create projects, manage your model library, and convert 2D CAD drawings to 3D models with advanced AI.',
      timestamp: new Date()
    }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const simulateDemoProcessing = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    addMessage({
      type: 'user',
      content: `Processing: ${selectedFile.name}${prompt ? `\n\nDescription: ${prompt}` : ''}${currentProject ? `\n\nProject: ${currentProject.name}` : ''}`,
      imageUrl: URL.createObjectURL(selectedFile)
    })

    addMessage({
      type: 'assistant',
      content: '🔄 Demo Mode: Analyzing your CAD drawing and generating 3D model... This showcases the full processing workflow.'
    })

    // Simulate processing steps
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    addMessage({
      type: 'assistant',
      content: '🧠 AI Analysis: Detecting geometric features, dimensions, and design intent...'
    })

    await new Promise(resolve => setTimeout(resolve, 2000))
    
    addMessage({
      type: 'assistant',
      content: '🔧 3D Generation: Creating parametric 3D model with proper constraints...'
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show demo success
    const demoStepUrl = 'demo-model.step'
    
    addMessage({
      type: 'assistant',
      content: '🎉 Success! Your 3D model has been generated and added to your library. The model includes proper geometric relationships and can be exported as a STEP file.',
      stepUrl: demoStepUrl
    })

    // Create demo model entry
    const demoModel: Model = {
      id: `demo-${Date.now()}`,
      prompt: prompt || `Generated from ${selectedFile.name}`,
      file_url: demoStepUrl,
      created_at: new Date().toISOString(),
      project_id: currentProject?.id
    }

    setSelectedModel(demoModel)
    setIsProcessing(false)
    setSelectedFile(null)
    setPrompt('')
  }

  const processImage = async () => {
    if (!selectedFile) return

    if (isDemoMode()) {
      await simulateDemoProcessing()
      return
    }

    // Real processing logic would go here
    addMessage({
      type: 'assistant',
      content: '⚠️ Full processing requires proper Supabase configuration and API keys. Please set up your environment variables.'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderSidebarContent = () => {
    switch (activePanel) {
      case 'projects':
        return (
          <ProjectManager 
            onProjectSelect={setCurrentProject}
            currentProject={currentProject}
          />
        )
      case 'library':
        return (
          <ModelLibrary 
            projectId={currentProject?.id}
            onModelSelect={setSelectedModel}
          />
        )
      default:
        return (
          <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">AI Assistant</h1>
                  <p className="text-sm text-slate-400">CAD Processing & Analysis</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm rounded-2xl p-4 shadow-lg backdrop-blur-sm ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white' 
                      : message.type === 'system'
                      ? 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 text-slate-200 border border-slate-600/30'
                      : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 text-white border border-slate-600/30'
                  }`}>
                    {message.imageUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded" 
                          className="w-full max-h-40 object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.stepUrl && (
                      <button
                        onClick={() => {
                          if (isDemoMode()) {
                            addMessage({
                              type: 'assistant',
                              content: '📁 Demo Mode: In the full version, this would download your generated STEP file. The model has been added to your library for viewing.'
                            })
                          }
                        }}
                        className="inline-flex items-center mt-3 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isDemoMode() ? 'View in Library' : 'Download STEP File'}
                      </button>
                    )}
                    <div className="text-xs opacity-60 mt-2 font-medium">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center mb-4 transition-all duration-300 backdrop-blur-sm ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' 
                    : 'border-slate-600/50 hover:border-slate-500/70 bg-slate-800/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-green-400 text-sm font-medium">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm font-medium mb-1">Drop your CAD image here</p>
                      <p className="text-slate-500 text-xs">Supports JPG, PNG, and other image formats</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose File
                    </label>
                  </div>
                )}
              </div>

              {/* Description Input */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your CAD drawing or add specific requirements (optional)..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 backdrop-blur-sm placeholder-slate-400"
                rows={3}
              />

              {/* Send Button */}
              <button
                onClick={processImage}
                disabled={!selectedFile || isProcessing}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:shadow-none"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    <span>{isDemoMode() ? 'Simulating Processing...' : 'Generating 3D Model...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isDemoMode() ? 'Try Demo Processing' : 'Generate 3D Model'}
                  </div>
                )}
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Configuration Notice */}
      {isDemoMode() && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-amber-500/90 backdrop-blur-sm text-amber-900 px-6 py-3 rounded-xl shadow-lg border border-amber-400/50">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Enhanced Demo Mode - Full workspace preview</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-full md:w-96 lg:w-[28rem]'} bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl relative z-10`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
          <div className="flex items-center justify-between">
            <div className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mr-3 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CAD3Dify Pro</h1>
                  <p className="text-sm text-slate-400">Enhanced AI Workspace</p>
                </div>
              </div>
              
              {/* Panel Tabs */}
              <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActivePanel('chat')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    activePanel === 'chat' 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActivePanel('projects')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    activePanel === 'projects' 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setActivePanel('library')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    activePanel === 'library' 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Library
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200"
            >
              <svg className={`w-5 h-5 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        {!isSidebarCollapsed && renderSidebarContent()}
      </div>

      {/* Main Viewer */}
      <div className="flex-1 bg-slate-950 flex flex-col relative">
        {/* Viewer Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mr-4 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Advanced 3D Viewer</h2>
              <p className="text-sm text-slate-400">
                {selectedModel ? `Viewing: ${selectedModel.prompt}` : 'Interactive 3D Model Preview'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isDemoMode() && (
              <div className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-xs font-medium">
                Enhanced Demo
              </div>
            )}
            {currentProject && (
              <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-xs font-medium">
                {currentProject.name}
              </div>
            )}
          </div>
        </div>
        
        {/* Advanced Viewer */}
        <div className="flex-1 relative">
          <AdvancedViewer 
            modelUrl={selectedModel?.file_url}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}