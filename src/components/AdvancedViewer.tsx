import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

interface AdvancedViewerProps {
  modelUrl?: string
  className?: string
}

export const AdvancedViewer: React.FC<AdvancedViewerProps> = ({ modelUrl, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number>()
  const [viewMode, setViewMode] = useState<'solid' | 'wireframe' | 'points'>('solid')
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const controlsRef = useRef({
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    rotationX: 0,
    rotationY: 0,
    zoom: 10
  })

  useEffect(() => {
    if (!canvasRef.current) return

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

    // Load model or show default
    if (modelUrl) {
      loadModel(modelUrl)
    } else {
      createDefaultModel()
    }

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

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

  const loadModel = (url: string) => {
    // In a real implementation, you would load the STEP file here
    // For now, create a representative model
    createDefaultModel()
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

  const toggleFullscreen = () => {
    if (!canvasRef.current) return
    
    if (!isFullscreen) {
      canvasRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  const exportImage = () => {
    if (!rendererRef.current) return
    
    const link = document.createElement('a')
    link.download = 'cad-model.png'
    link.href = rendererRef.current.domElement.toDataURL()
    link.click()
  }

  return (
    <div className={`relative ${className}`}>
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
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Toggle fullscreen"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
    </div>
  )
}