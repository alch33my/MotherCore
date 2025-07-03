import React from 'react'
import { useState } from 'react'
import { UserCircle, LogOut, Settings, HelpCircle, Info } from 'lucide-react'

interface AccountMenuProps {
  onLogout?: () => void
}

function AccountMenu({ onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={toggleMenu}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-matrix-gold bg-opacity-20 hover:bg-opacity-30 text-matrix-gold transition-colors"
        aria-label="Account menu"
      >
        <UserCircle size={20} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-matrix z-50">
            <div className="bg-matrix-dark-gray border border-matrix-gold border-opacity-30 rounded-md py-1">
              <div className="px-4 py-3 border-b border-matrix-gold border-opacity-20">
                <p className="text-white font-medium">MotherCore</p>
                <p className="text-matrix-amber text-sm">Local Account</p>
              </div>
              
              <button 
                className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-matrix-gold hover:bg-opacity-10"
                onClick={() => {
                  // Handle settings
                  setIsOpen(false)
                }}
              >
                <Settings size={16} className="mr-2 text-matrix-amber" />
                <span>Settings</span>
              </button>
              
              <button 
                className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-matrix-gold hover:bg-opacity-10"
                onClick={() => {
                  // Handle help
                  setIsOpen(false)
                }}
              >
                <HelpCircle size={16} className="mr-2 text-matrix-amber" />
                <span>Help</span>
              </button>
              
              <button 
                className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-matrix-gold hover:bg-opacity-10"
                onClick={() => {
                  // Handle about
                  setIsOpen(false)
                }}
              >
                <Info size={16} className="mr-2 text-matrix-amber" />
                <span>About</span>
              </button>
              
              <div className="border-t border-matrix-gold border-opacity-20 mt-1"></div>
              
              <button 
                className="flex items-center w-full px-4 py-2 text-left text-white hover:bg-matrix-error hover:bg-opacity-10"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2 text-matrix-error" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AccountMenu 
