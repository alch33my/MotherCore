import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  className = '',
  primaryColor,
  accentColor
}) => {
  const iconStyle = {
    '--mothercore-primary': primaryColor,
    '--mothercore-accent': accentColor,
  } as React.CSSProperties;

  // Use specific class if custom colors provided
  const colorClass = (primaryColor || accentColor) ? 'custom-colors' : '';

  return (
    <span 
      className={`mothercore-icon ${className} ${colorClass}`}
      style={iconStyle}
      data-icon={name}
    >
      {getIconSVG(name, size)}
    </span>
  );
};

const getIconSVG = (name: string, size: number) => {
  // Simple implementation that loads SVG icons from the SVG directory
  const iconPath = `../../Images/SVG/${name}.svg`;
  
  return (
    <img 
      src={iconPath} 
      alt={name} 
      width={size} 
      height={size} 
      className="svg-icon"
    />
  );
};

export default Icon; 