import React from 'react';

// Import SVG files with ReactComponent
import { ReactComponent as AppIconSVG } from '@images/SVG/app-icon-main.svg';
import { ReactComponent as BookIconSVG } from '@images/SVG/book-icon-greys.svg';
import { ReactComponent as AiIconSVG } from '@images/SVG/ai-icon-grey.svg';
import { ReactComponent as TaskIconSVG } from '@images/SVG/task-icon-grey.svg';
import { ReactComponent as TrashIconSVG } from '@images/SVG/trash-icon-grey.svg';

// Map of icon names to their components
const iconMap = {
  'app-icon-main': AppIconSVG,
  'book-icon-greys': BookIconSVG,
  'ai-icon-grey': AiIconSVG,
  'task-icon-grey': TaskIconSVG,
  'trash-icon-grey': TrashIconSVG,
};

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/**
 * Icon component that renders SVG icons with proper styling
 */
const Icon: React.FC<IconProps> = ({ name, size = 16, className = '' }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.error(`Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <IconComponent />
    </svg>
  );
};

export default Icon; 