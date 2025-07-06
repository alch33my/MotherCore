import React from 'react'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, HardDrive, Palette, Lock, CheckCircle, FolderOpen } from 'lucide-react'
import MatrixRain from '../effects/matrix-rain'

interface OnboardingFlowProps {
  onComplete: (password: string, dbPath: string) => void
  onCancel: () => void
}

type Step = 'welcome' | 'password' | 'database' | 'theme' | 'complete'

function OnboardingFlow({ onComplete, onCancel }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dbPath, setDbPath] = useState('')
  const [customDbPath, setCustomDbPath] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('cyberpunk-gold')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Step 1: Welcome
  const renderWelcomeStep = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <div className="logo-symbol">⚡</div>
        <h1 className="step-title">Welcome to MotherCore</h1>
        <p className="step-description">
          Your personal knowledge repository with a hierarchical structure designed for deep learning and easy retrieval.
          Let's set up your personal vault in a few simple steps.
        </p>
      </div>
      
      <div className="step-content">
        <div className="welcome-features">
          <div className="feature-item">
            <CheckCircle className="feature-icon text-matrix-gold" />
            <div className="feature-text">
              <h3>Secure Password</h3>
              <p>Create a master password to protect your data</p>
            </div>
          </div>
          
          <div className="feature-item">
            <CheckCircle className="feature-icon text-matrix-gold" />
            <div className="feature-text">
              <h3>Database Location</h3>
              <p>Choose where your data will be stored</p>
            </div>
          </div>
          
          <div className="feature-item">
            <CheckCircle className="feature-icon text-matrix-gold" />
            <div className="feature-text">
              <h3>Visual Preferences</h3>
              <p>Select your preferred visual theme</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button
          className="btn-secondary"
          onClick={onCancel}
        >
          Later
        </button>
        <button
          className="btn-primary flex items-center"
          onClick={() => setCurrentStep('password')}
        >
          Get Started <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  )
  
  // Step 2: Password Creation
  const renderPasswordStep = () => {
    const validatePassword = () => {
      if (!password) {
        setError('Password is required')
        return false
      }
      
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return false
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      
      setError('')
      return true
    }
    
    const handleNext = () => {
      if (validatePassword()) {
        setCurrentStep('database')
      }
    }
    
    return (
      <div className="onboarding-step">
        <div className="step-header">
          <Lock className="step-icon text-matrix-gold" />
          <h2 className="step-title">Create Your Master Password</h2>
          <p className="step-description">
            This password will be used to secure and access your data. Make sure it's strong and memorable.
          </p>
        </div>
        
        <div className="step-content">
          <div className="form-field">
            <label htmlFor="password" className="field-label">Master Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          <div className="form-field">
            <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field-input"
              placeholder="Confirm your password"
            />
          </div>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <ul className="requirements-list">
              <li className={password.length >= 8 ? 'met' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(password) ? 'met' : ''}>
                At least one uppercase letter
              </li>
              <li className={/[0-9]/.test(password) ? 'met' : ''}>
                At least one number
              </li>
            </ul>
          </div>
        </div>
        
        <div className="step-actions">
          <button
            className="btn-secondary flex items-center"
            onClick={() => setCurrentStep('welcome')}
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </button>
          <button
            className="btn-primary flex items-center"
            onClick={handleNext}
          >
            Next <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }
  
  // Step 3: Database Location
  const renderDatabaseStep = () => {
    const handleSelectLocation = async () => {
      try {
        if (!window.electronAPI) {
          setError('Application error: API not available')
          return
        }
        
        const result = await window.electronAPI.selectDirectory()
        
        if (result.success && result.path) {
          setDbPath(result.path)
          setCustomDbPath(true)
        }
      } catch (err) {
        console.error('Failed to select directory:', err)
        setError('Failed to select directory')
      }
    }
    
    return (
      <div className="onboarding-step">
        <div className="step-header">
          <HardDrive className="step-icon text-matrix-gold" />
          <h2 className="step-title">Choose Database Location</h2>
          <p className="step-description">
            Select where your data will be stored. You can use the default location or choose a custom folder.
          </p>
        </div>
        
        <div className="step-content">
          <div className="location-options">
            <div className="location-option">
              <input
                type="radio"
                id="defaultLocation"
                name="dbLocation"
                checked={!customDbPath}
                onChange={() => {
                  setCustomDbPath(false)
                  setDbPath('')
                }}
              />
              <label htmlFor="defaultLocation">
                <div className="option-title">Default Location (Recommended)</div>
                <div className="option-description">
                  Store in the application's root folder for portability
                </div>
              </label>
            </div>
            
            <div className="location-option">
              <input
                type="radio"
                id="customLocation"
                name="dbLocation"
                checked={customDbPath}
                onChange={() => setCustomDbPath(true)}
              />
              <label htmlFor="customLocation">
                <div className="option-title">Custom Location</div>
                <div className="option-description">
                  Choose a specific folder, such as a portable drive
                </div>
              </label>
            </div>
          </div>
          
          {customDbPath && (
            <div className="custom-location">
              <div className="location-display">
                <span className="location-label">Selected Location:</span>
                <span className="location-path">{dbPath || 'No location selected'}</span>
              </div>
              <button
                className="location-browse flex items-center"
                onClick={handleSelectLocation}
              >
                <FolderOpen className="mr-2 w-4 h-4" />
                Browse
              </button>
            </div>
          )}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <div className="info-box">
            <div className="info-title">Important</div>
            <p>
              If you choose a removable drive, make sure it's always connected when using the application. 
              You can change this location later in settings.
            </p>
          </div>
        </div>
        
        <div className="step-actions">
          <button
            className="btn-secondary flex items-center"
            onClick={() => setCurrentStep('password')}
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </button>
          <button
            className="btn-primary flex items-center"
            onClick={() => setCurrentStep('theme')}
            disabled={customDbPath && !dbPath}
          >
            Next <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }
  
  // Step 4: Theme Selection
  const renderThemeStep = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <Palette className="step-icon text-matrix-gold" />
        <h2 className="step-title">Choose Your Theme</h2>
        <p className="step-description">
          Select a visual style for your MotherCore experience. You can change this later in settings.
        </p>
      </div>
      
      <div className="step-content">
        <div className="theme-options">
          <div 
            className={`theme-option ${selectedTheme === 'cyberpunk-gold' ? 'selected' : ''}`}
            onClick={() => setSelectedTheme('cyberpunk-gold')}
          >
            <div className="theme-preview cyberpunk-gold-preview"></div>
            <div className="theme-label">Cyberpunk Gold</div>
          </div>
          
          <div 
            className={`theme-option ${selectedTheme === 'matrix-green' ? 'selected' : ''}`}
            onClick={() => setSelectedTheme('matrix-green')}
          >
            <div className="theme-preview matrix-green-preview"></div>
            <div className="theme-label">Matrix Green</div>
          </div>
          
          <div 
            className={`theme-option ${selectedTheme === 'cyber-blue' ? 'selected' : ''}`}
            onClick={() => setSelectedTheme('cyber-blue')}
          >
            <div className="theme-preview cyber-blue-preview"></div>
            <div className="theme-label">Cyber Blue</div>
          </div>
          
          <div 
            className={`theme-option ${selectedTheme === 'neon-purple' ? 'selected' : ''}`}
            onClick={() => setSelectedTheme('neon-purple')}
          >
            <div className="theme-preview neon-purple-preview"></div>
            <div className="theme-label">Neon Purple</div>
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button
          className="btn-secondary flex items-center"
          onClick={() => setCurrentStep('database')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </button>
        <button
          className="btn-primary flex items-center"
          onClick={() => setCurrentStep('complete')}
        >
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  )
  
  // Step 5: Setup Complete
  const renderCompleteStep = () => {
    const handleComplete = async () => {
      try {
        setLoading(true)
        
        // Save theme to local storage
        localStorage.setItem('mothercore-theme', selectedTheme)
        
        // Wait a bit to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Complete onboarding
        onComplete(password, customDbPath ? dbPath : '')
      } catch (err) {
        console.error('Error completing setup:', err)
        setError('Failed to complete setup')
        setLoading(false)
      }
    }
    
    return (
      <div className="onboarding-step">
        <div className="step-header">
          <CheckCircle className="step-icon text-matrix-success" size={48} />
          <h2 className="step-title">Setup Complete!</h2>
          <p className="step-description">
            You're all set to start using MotherCore. Let's create your first organization.
          </p>
        </div>
        
        <div className="step-content">
          <div className="setup-summary">
            <div className="summary-item">
              <div className="summary-label">Database Location:</div>
              <div className="summary-value">
                {customDbPath ? dbPath : 'Default Application Folder'}
              </div>
            </div>
            
            <div className="summary-item">
              <div className="summary-label">Theme:</div>
              <div className="summary-value">
                {selectedTheme === 'cyberpunk-gold' && 'Cyberpunk Gold'}
                {selectedTheme === 'matrix-green' && 'Matrix Green'}
                {selectedTheme === 'cyber-blue' && 'Cyber Blue'}
                {selectedTheme === 'neon-purple' && 'Neon Purple'}
              </div>
            </div>
          </div>
          
          <div className="next-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>Create your first organization</li>
              <li>Add projects to organize your work</li>
              <li>Start adding content</li>
            </ol>
          </div>
        </div>
        
        <div className="step-actions">
          <button
            className="btn-secondary flex items-center"
            onClick={() => setCurrentStep('theme')}
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </button>
          <button
            className="btn-primary flex items-center"
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner mr-2"></div>
                Setting Up...
              </>
            ) : (
              <>Get Started</>
            )}
          </button>
        </div>
      </div>
    )
  }
  
  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep()
      case 'password':
        return renderPasswordStep()
      case 'database':
        return renderDatabaseStep()
      case 'theme':
        return renderThemeStep()
      case 'complete':
        return renderCompleteStep()
      default:
        return null
    }
  }
  
  return (
    <div className="onboarding-flow">
      {/* Matrix Rain Background */}
      <div className="matrix-background">
        <MatrixRain theme="dark" />
      </div>
      
      {/* Onboarding Container */}
      <div className="onboarding-container">
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${currentStep === 'welcome' ? 'active' : ''} ${currentStep !== 'welcome' ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-name">Welcome</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'password' ? 'active' : ''} ${['theme', 'database', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-name">Security</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'database' ? 'active' : ''} ${['theme', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-name">Storage</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'theme' ? 'active' : ''} ${currentStep === 'complete' ? 'completed' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-name">Theme</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep === 'complete' ? 'active' : ''}`}>
            <span className="step-number">5</span>
            <span className="step-name">Complete</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="onboarding-content">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow 