import React, { useState } from 'react'
import MatrixRain from './renderer/components/effects/matrix-rain'
import { LockIcon, UnlockIcon } from 'lucide-react'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleAuthentication() {
    try {
      const result = await window.electronAPI.authenticate(password)
      if (result) {
        setIsAuthenticated(true)
        setError('')
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Authentication failed')
      window.electronAPI.logError(String(err))
    }
  }

  function renderAuthenticationScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-matrix-black">
        <div className="bg-matrix-dark-gray p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-matrix-green text-2xl mb-4 text-center">MotherCore</h1>
          <div className="flex items-center border-b border-matrix-green pb-2">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Master Password" 
              className="bg-transparent text-matrix-green w-full focus:outline-none"
            />
            <button 
              onClick={handleAuthentication}
              className="text-matrix-green hover:text-matrix-gold"
            >
              <UnlockIcon />
            </button>
          </div>
          {error && (
            <p className="text-matrix-error text-sm mt-2 text-center">{error}</p>
          )}
        </div>
      </div>
    )
  }

  function renderMainApplication() {
    return (
      <div className="h-screen bg-matrix-black text-matrix-green">
        <div className="grid grid-cols-[250px_1fr] h-full">
          {/* Sidebar Navigation */}
          <div className="bg-matrix-dark-gray p-4 border-r border-matrix-green">
            <h2 className="text-xl mb-4">Library</h2>
            {/* Navigation tree will go here */}
          </div>

          {/* Main Content Area */}
          <div className="overflow-auto p-4">
            {/* Main content will go here */}
            <h1 className="text-2xl">Welcome to MotherCore</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <MatrixRain />
      {!isAuthenticated ? renderAuthenticationScreen() : renderMainApplication()}
    </>
  )
}

export default App
