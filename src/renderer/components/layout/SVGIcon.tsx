import React from 'react';

interface SVGIconProps {
  name: string;
  size?: number;
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}

// This component properly loads and displays SVG icons with theming support
const SVGIcon: React.FC<SVGIconProps> = ({ 
  name, 
  size = 24, 
  className = '',
  primaryColor,
  accentColor
}) => {
  const [svgContent, setSvgContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // CSS Variables for colors
  const iconStyle = {
    '--mothercore-primary': primaryColor,
    '--mothercore-accent': accentColor,
    width: `${size}px`,
    height: `${size}px`,
  } as React.CSSProperties;

  React.useEffect(() => {
    const loadSVG = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Add .svg extension if not included
        const iconName = name.endsWith('.svg') ? name : `${name}.svg`;
        
        // Use a relative path that works within the project structure
        // This path should be relative to the public directory in development
        // and relative to the app root in production
        const iconPath = `/Images/SVG/${iconName}`;
        
        console.log(`Loading SVG from: ${iconPath}`);
        
        // Standard fetch for web context
        const response = await fetch(iconPath);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.statusText}`);
        }
        const svgText = await response.text();
        setSvgContent(svgText || null);
      } catch (err) {
        console.error('Error loading SVG:', err);
        setError(`Failed to load icon: ${name}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSVG();
  }, [name]);
  
  // Define CSS classes
  const colorClass = (primaryColor || accentColor) ? 'custom-colors' : '';
  const finalClassName = `mothercore-icon ${className} ${colorClass}`;

  if (isLoading) {
    return <span className={finalClassName} style={iconStyle}>...</span>;
  }
  
  if (error) {
    console.error('SVG Icon error:', error);
    return <span className={finalClassName} style={iconStyle}>!</span>;
  }
  
  if (!svgContent) {
    return <span className={finalClassName} style={iconStyle}></span>;
  }
  
  return (
    <span 
      className={finalClassName}
      style={iconStyle}
      data-icon={name}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default SVGIcon; 