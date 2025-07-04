import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { supabase, isDemoMode } from '../lib/supabase'

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

export const CadProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [activePanel, setActivePanel] = useState<'chat' | 'projects' | 'library'>('chat')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentStepUrl, setCurrentStepUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'solid' | 'wireframe' | 'points'>('solid')
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef({
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    rotationX: 0,
    rotationY: 0,
    zoom: 10
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize demo data
  useEffect(() => {
    if (isDemoMode()) {
      // Demo projects
      setProjects([
        {
          id: 'demo-1',
          name: 'Mechanical Parts',
          thumbnail_url: 'https://images.pexels.com/photos/159298/gears-cogs-machine-machinery-159298.jpeg?auto=compress&cs=tinysrgb&w=400',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'demo-user'
        },
        {
          id: 'demo-2',
          name: 'Architectural Components',
          thumbnail_url: 'https://images.pexels.com/photos/273230/pexels-photo-273230.jpeg?auto=compress&cs=tinysrgb&w=400',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'demo-user'
        }
      ])

      // Demo models
      setModels([
        {
          id: 'demo-model-1',
          prompt: 'Mechanical gear assembly with precise teeth',
          file_url: 'demo-gear.step',
          created_at: new Date().toISOString(),
          project_id: 'demo-1'
        },
        {
          id: 'demo-model-2',
          prompt: 'Architectural bracket with mounting holes',
          file_url: 'demo-bracket.step',
          created_at: new Date().toISOString(),
          project_id: 'demo-2'
        },
        {
          id: 'demo-model-3',
          prompt: 'Cylindrical housing with threaded connections',
          file_url: 'demo-housing.step',
          created_at: new Date().toISOString(),
          project_id: 'demo-1'
        }
      ])
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    try {
      // Initialize enhanced Three.js scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0f172a)
      scene.fog = new THREE.Fog(0x0f172a, 10, 100)
      
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
      
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true
      })
      
      const updateSize = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const rect = canvas.getBoundingClientRect()
        const width = rect.width || 800
        const height = rect.height || 600
        
        renderer.setSize(width, height, false)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      
      updateSize()
      
      // Enhanced rendering settings
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2

      // Professional lighting setup
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
      scene.add(ambientLight)
      
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
      keyLight.position.set(15, 15, 10)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.width = 4096
      keyLight.shadow.mapSize.height = 4096
      keyLight.shadow.camera.near = 0.5
      keyLight.shadow.camera.far = 50
      scene.add(keyLight)

      const fillLight = new THREE.DirectionalLight(0x6366f1, 0.4)
      fillLight.position.set(-10, 5, -10)
      scene.add(fillLight)

      const rimLight = new THREE.PointLight(0x8b5cf6, 0.6, 100)
      rimLight.position.set(-8, 8, 8)
      scene.add(rimLight)

      // Grid and axes
      const gridHelper = new THREE.GridHelper(20, 40, 0x475569, 0x1e293b)
      gridHelper.name = 'grid'
      gridHelper.position.y = -0.01
      gridHelper.material.opacity = 0.6
      gridHelper.material.transparent = true
      scene.add(gridHelper)

      const axesHelper = new THREE.AxesHelper(3)
      axesHelper.name = 'axes'
      axesHelper.position.set(-8, 0, -8)
      scene.add(axesHelper)

      // Mouse controls
      const handleMouseDown = (event: MouseEvent) => {
        event.preventDefault()
        controlsRef.current.isMouseDown = true
        controlsRef.current.mouseX = event.clientX
        controlsRef.current.mouseY = event.clientY
      }

      const handleMouseMove = (event: MouseEvent) => {
        if (!controlsRef.current.isMouseDown) return
        
        const deltaX = event.clientX - controlsRef.current.mouseX
        const deltaY = event.clientY - controlsRef.current.mouseY
        
        controlsRef.current.rotationY += deltaX * 0.008
        controlsRef.current.rotationX += deltaY * 0.008
        
        controlsRef.current.rotationX = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, controlsRef.current.rotationX))
        
        const radius = controlsRef.current.zoom
        const targetX = radius * Math.cos(controlsRef.current.rotationY) * Math.cos(controlsRef.current.rotationX)
        const targetY = radius * Math.sin(controlsRef.current.rotationX)
        const targetZ = radius * Math.sin(controlsRef.current.rotationY) * Math.cos(controlsRef.current.rotationX)
        
        camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.1)
        camera.lookAt(0, 0, 0)
        
        controlsRef.current.mouseX = event.clientX
        controlsRef.current.mouseY = event.clientY
      }

      const handleMouseUp = () => {
        controlsRef.current.isMouseDown = false
      }

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault()
        const scale = event.deltaY > 0 ? 1.1 : 0.9
        controlsRef.current.zoom = Math.max(3, Math.min(50, controlsRef.current.zoom * scale))
        
        const radius = controlsRef.current.zoom
        const targetX = radius * Math.cos(controlsRef.current.rotationY) * Math.cos(controlsRef.current.rotationX)
        const targetY = radius * Math.sin(controlsRef.current.rotationX)
        const targetZ = radius * Math.sin(controlsRef.current.rotationY) * Math.cos(controlsRef.current.rotationX)
        
        camera.position.set(targetX, targetY, targetZ)
      }

      const handleResize = () => updateSize()

      const canvas = canvasRef.current
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('mouseleave', handleMouseUp)
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      window.addEventListener('resize', handleResize)

      sceneRef.current = scene
      rendererRef.current = renderer
      cameraRef.current = camera

      createDefaultModel()

      const animate = () => {
        frameRef.current = requestAnimationFrame(animate)
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }
      }
      animate()

      setIsViewerReady(true)

      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current)
        }
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
        canvas.removeEventListener('mouseleave', handleMouseUp)
        canvas.removeEventListener('wheel', handleWheel)
        window.removeEventListener('resize', handleResize)
        if (rendererRef.current) {
          rendererRef.current.dispose()
        }
      }
    } catch (error) {
      console.error('Failed to initialize 3D viewer:', error)
      setIsViewerReady(true)
    }
  }, [])

  const createDefaultModel = () => {
    if (!sceneRef.current) return

    // Clear existing models
    const objectsToRemove = sceneRef.current.children.filter(child => 
      child.name === 'cadModel'
    )
    objectsToRemove.forEach(obj => sceneRef.current!.remove(obj))

    const group = new THREE.Group()
    group.name = 'cadModel'

    // Create a complex default model
    const mainGeometry = new THREE.CylinderGeometry(2, 2, 5, 16)
    const mainMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x6366f1,
      metalness: 0.2,
      roughness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    })
    const mainCylinder = new THREE.Mesh(mainGeometry, mainMaterial)
    mainCylinder.position.y = 2.5
    mainCylinder.castShadow = true
    mainCylinder.receiveShadow = true
    group.add(mainCylinder)

    // Add flanges
    const flangeGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 16)
    const flangeMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x8b5cf6,
      metalness: 0.3,
      roughness: 0.2
    })
    
    const topFlange = new THREE.Mesh(flangeGeometry, flangeMaterial)
    topFlange.position.y = 5.25
    topFlange.castShadow = true
    group.add(topFlange)

    const bottomFlange = new THREE.Mesh(flangeGeometry, flangeMaterial)
    bottomFlange.position.y = -0.25
    bottomFlange.castShadow = true
    group.add(bottomFlange)

    // Add bolt holes
    const holeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8)
    const holeMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.1
    })
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const hole = new THREE.Mesh(holeGeometry, holeMaterial)
      hole.position.x = Math.cos(angle) * 2.5
      hole.position.z = Math.sin(angle) * 2.5
      hole.position.y = 5.25
      group.add(hole)
    }

    sceneRef.current.add(group)

    // Add rotation animation
    let time = 0
    const animateModel = () => {
      if (group.parent) {
        time += 0.005
        group.rotation.y = time
        requestAnimationFrame(animateModel)
      }
    }
    animateModel()
  }

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
    setCurrentStepUrl(demoStepUrl)
    
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

    setModels(prev => [demoModel, ...prev])
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

  const createProject = async () => {
    if (!newProjectName.trim()) return

    const demoProject: Project = {
      id: `demo-${Date.now()}`,
      name: newProjectName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'demo-user'
    }
    setProjects(prev => [demoProject, ...prev])
    setShowCreateModal(false)
    setNewProjectName('')
    setCurrentProject(demoProject)
  }

  const deleteProject = async (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
    }
  }

  const deleteModel = async (modelId: string) => {
    setModels(prev => prev.filter(m => m.id !== modelId))
    if (selectedModel?.id === modelId) {
      setSelectedModel(null)
    }
  }

  const toggleViewMode = () => {
    if (!sceneRef.current) return

    const nextMode = viewMode === 'solid' ? 'wireframe' : viewMode === 'wireframe' ? 'points' : 'solid'
    setViewMode(nextMode)

    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name !== 'grid' && child.name !== 'axes') {
        if (nextMode === 'wireframe') {
          child.material = new THREE.MeshBasicMaterial({ 
            color: 0x6366f1, 
            wireframe: true 
          })
        } else if (nextMode === 'points') {
          child.material = new THREE.PointsMaterial({ 
            color: 0x6366f1, 
            size: 0.1 
          })
        } else {
          child.material = new THREE.MeshPhysicalMaterial({ 
            color: 0x6366f1,
            metalness: 0.2,
            roughness: 0.1
          })
        }
      }
    })
  }

  const toggleGrid = () => {
    if (!sceneRef.current) return
    
    const grid = sceneRef.current.getObjectByName('grid')
    if (grid) {
      grid.visible = !showGrid
      setShowGrid(!showGrid)
    }
  }

  const toggleAxes = () => {
    if (!sceneRef.current) return
    
    const axes = sceneRef.current.getObjectByName('axes')
    if (axes) {
      axes.visible = !showAxes
      setShowAxes(!showAxes)
    }
  }

  const resetView = () => {
    if (!cameraRef.current) return
    
    controlsRef.current.rotationX = 0
    controlsRef.current.rotationY = 0
    controlsRef.current.zoom = 10
    
    cameraRef.current.position.set(10, 10, 10)
    cameraRef.current.lookAt(0, 0, 0)
  }

  const exportImage = () => {
    if (!rendererRef.current) return
    
    const link = document.createElement('a')
    link.download = 'cad-model.png'
    link.href = rendererRef.current.domElement.toDataURL()
    link.click()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredModels = models.filter(model =>
    model.prompt.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!currentProject || model.project_id === currentProject.id)
  )

  const renderSidebarContent = () => {
    switch (activePanel) {
      case 'projects':
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Projects</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {currentProject && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-sm text-slate-400">Current Project</p>
                  <p className="text-white font-medium">{currentProject.name}</p>
                </div>
              )}
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">No projects yet</p>
                  <p className="text-slate-500 text-xs">Create your first project to get started</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 border ${
                      currentProject?.id === project.id ? 'border-indigo-500/50' : 'border-slate-700/30'
                    }`}
                    onClick={() => setCurrentProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {project.thumbnail_url && (
                          <div className="w-full h-24 bg-slate-700/50 rounded-lg mb-3 overflow-hidden">
                            <img 
                              src={project.thumbnail_url} 
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="text-white font-medium mb-1">{project.name}</h3>
                        <p className="text-slate-400 text-xs">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteProject(project.id)
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 'library':
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
              {filteredModels.length === 0 ? (
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
                      className={`bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 border ${
                        selectedModel?.id === model.id ? 'border-indigo-500/50' : 'border-slate-700/30 hover:border-indigo-500/30'
                      }`}
                      onClick={() => setSelectedModel(model)}
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
                            setActivePanel('library')
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
        
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          {/* Viewer Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
              <div className="flex space-x-2">
                <button
                  onClick={toggleViewMode}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title={`Switch to ${viewMode === 'solid' ? 'wireframe' : viewMode === 'wireframe' ? 'points' : 'solid'} view`}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </button>
                
                <button
                  onClick={toggleGrid}
                  className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800/50 hover:bg-slate-700/50'}`}
                  title="Toggle grid"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <button
                  onClick={toggleAxes}
                  className={`p-2 rounded-lg transition-colors ${showAxes ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800/50 hover:bg-slate-700/50'}`}
                  title="Toggle axes"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-2 border border-slate-700/50">
              <div className="flex space-x-2">
                <button
                  onClick={resetView}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Reset view"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                <button
                  onClick={exportImage}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Export image"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* View Mode Indicator */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-700/50">
              <span className="text-white text-sm font-medium capitalize">{viewMode} View</span>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />
          
          {!isViewerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                </div>
                <div>
                  <p className="text-white font-medium">Initializing 3D Viewer</p>
                  <p className="text-slate-400 text-sm">Setting up the rendering environment...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/70"
              autoFocus
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewProjectName('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}