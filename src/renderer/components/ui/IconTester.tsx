import React from 'react';
import Icon from './Icon';
import type { IconName } from './Icon';

const icons: IconName[] = [
  'app-icon-main',
  'book-icon-greys',
  'ai-icon-grey',
  'task-icon-grey',
  'trash-icon-grey',
];

interface IconTesterProps {
  onClose?: () => void;
}

function IconTester({ onClose }: IconTesterProps) {
  return (
    <div className="icon-tester">
      <div className="icon-tester-header">
        <h2>Icon Tester</h2>
        {onClose && (
          <button onClick={onClose} className="close-button">
            ×
          </button>
        )}
      </div>
      
      <div className="icon-grid">
        {icons.map((iconName) => (
          <div key={iconName} className="icon-test-item">
            <div className="icon-container">
              <Icon name={iconName} size={32} />
            </div>
            <div className="icon-name">{iconName}</div>
          </div>
        ))}
      </div>
      
      <div className="icon-sizes">
        <h3>Sizes</h3>
        <div className="size-grid">
          {[16, 24, 32, 48, 64].map((size) => (
            <div key={size} className="size-item">
              <Icon name="book-icon-greys" size={size} />
              <div className="size-label">{size}px</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="icon-colors">
        <h3>Custom Colors</h3>
        <div className="color-grid">
          <div className="color-item">
            <Icon 
              name="book-icon-greys" 
              size={48} 
            />
            <div className="color-label">Red</div>
          </div>
          <div className="color-item">
            <Icon 
              name="book-icon-greys" 
              size={48} 
            />
            <div className="color-label">Green</div>
          </div>
          <div className="color-item">
            <Icon 
              name="book-icon-greys" 
              size={48} 
            />
            <div className="color-label">White</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IconTester; 