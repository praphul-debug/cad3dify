import React, { useState, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'

interface Model {
  id: string
  prompt: string
  file_url: string
  created_at: string
  project_id?: string
}

interface ModelLibraryProps {
  projectId?: string
  onModelSelect: (model: Model) => void
}

export const ModelLibrary: React.FC<ModelLibraryProps> = ({ projectId, onModelSelect }) => {
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isDemoMode()) {
      loadModels()
    } else {
      // Demo models
      setModels([
        {
          id: 'demo-model-1',
          prompt: 'Mechanical gear assembly with precise teeth',
          file_url: 'demo-gear.step',
          created_at: new Date().toISOString(),
          project_id: projectId
        },
        {
          id: 'demo-model-2',
          prompt: 'Architectural bracket with mounting holes',
          file_url: 'demo-bracket.step',
          created_at: new Date().toISOString(),
          project_id: projectId
        },
        {
          id: 'demo-model-3',
          prompt: 'Cylindrical housing with threaded connections',
          file_url: 'demo-housing.step',
          created_at: new Date().toISOString(),
          project_id: projectId
        }
      ])
    }
  }, [projectId])

  const loadModels = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from('models').select('*')
      
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setModels(data || [])
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredModels = models.filter(model =>
    model.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const deleteModel = async (modelId: string) => {
    if (isDemoMode()) {
      setModels(prev => prev.filter(m => m.id !== modelId))
      return
    }

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', modelId)

      if (error) throw error
      setModels(prev => prev.filter(m => m.id !== modelId))
    } catch (error) {
      console.error('Error deleting model:', error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">Model Library</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search models..."
            className="w-full px-4 py-2 pl-10 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/70"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Models Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">
              {searchTerm ? 'No models match your search' : 'No models yet'}
            </p>
            <p className="text-slate-500 text-xs">
              {searchTerm ? 'Try a different search term' : 'Generate your first 3D model to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 border border-slate-700/30 hover:border-indigo-500/30"
                onClick={() => onModelSelect(model)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteModel(model.id)
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <h3 className="text-white font-medium mb-2 line-clamp-2">{model.prompt}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(model.created_at).toLocaleDateString()}</span>
                  <span className="bg-slate-700/50 px-2 py-1 rounded">STEP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}