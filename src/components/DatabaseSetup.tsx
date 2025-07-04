import React from 'react'

interface DatabaseSetupProps {
  onComplete: () => void
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Database Setup Required</h2>
            <p className="text-slate-400 text-sm">
              To use CAD3Dify, you need to set up Supabase for storing your CAD models and images.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <h3 className="text-white font-medium mb-2">Setup Steps:</h3>
              <ol className="text-slate-300 text-sm space-y-2">
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                  Click "Connect to Supabase" in the top right
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                  Follow the setup instructions
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                  Start converting your CAD drawings!
                </li>
              </ol>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Continue to Demo Mode
          </button>

          <p className="text-xs text-slate-500">
            Demo mode allows you to explore the interface but won't process actual CAD files.
          </p>
        </div>
      </div>
    </div>
  )
}