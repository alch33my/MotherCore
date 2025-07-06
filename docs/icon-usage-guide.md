# MotherCore SVG Icon Usage Guide

This guide explains how to properly use SVG icons in the MotherCore application to ensure consistent styling and theming.

## Using the Icon Component

The simplest and recommended approach is to use our `Icon` component:

```tsx
import Icon from '../ui/Icon';

// In your component:
<Icon name="book-icon-black" size={24} />
```

### Available Icons

The following icons are available:

- `app-icon-main` - The main MotherCore application icon
- `book-icon-black` - Book icon (solid black)
- `book-icon-greys` - Book icon (greyscale, themeable)
- `organization-icon` - Organization icon
- `plus-icon` - Plus/add icon
- `save-file-icon` - Save file icon
- `ai-icon-black` - AI assistant icon

### Props

The `Icon` component accepts the following props:

- `name` (required): The name of the icon to display
- `size` (optional): Size in pixels (default: 24)
- `className` (optional): Additional CSS classes
- `color` (optional): Primary color (overrides theme)
- `secondaryColor` (optional): Secondary color (overrides theme)

## How It Works

The Icon component:

1. Imports SVG files directly as React components
2. Applies proper sizing and styling
3. Supports dynamic theming via CSS variables
4. Handles errors gracefully

## Adding New Icons

To add a new icon:

1. Add the SVG file to `Images/SVG/` directory
2. Ensure the SVG has proper structure:
   - Use `fill="#fefcac"` for primary elements (will be themed)
   - Use `fill="#6e3d21"` for secondary elements (will be themed)
   - Avoid hardcoded colors elsewhere
3. Import the SVG in `src/renderer/components/ui/Icon.tsx`
4. Add it to the `iconMap` object

## SVG Guidelines

For best results with theming:

- Use a consistent viewBox (e.g., `0 0 24 24`)
- Use simple paths with minimal complexity
- Avoid gradients and complex effects
- Use only two colors: primary and accent
- Keep file sizes small

## CSS Styling

The icons are styled using CSS variables:

- `--mothercore-primary`: Primary color (defaults to theme primary)
- `--mothercore-accent`: Accent color (defaults to theme secondary)

You can override these in your component:

```tsx
<Icon 
  name="book-icon-greys" 
  size={32}
  color="#ff0000"  // Override primary color
  secondaryColor="#0000ff"  // Override accent color
/>
```

## Troubleshooting

If icons aren't displaying correctly:

1. Check that the SVG file exists in the correct location
2. Verify the SVG structure follows our guidelines
3. Make sure the icon name is correctly spelled
4. Check for console errors related to SVG loading

## Advanced: Animation

SVG icons support animations via CSS:

```css
/* Animated Neural Pathways */
.icon-neural {
  animation: neural-pulse 2s ease-in-out infinite;
}

@keyframes neural-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
```

## Example Icons

The MotherCore application includes several SVG icons:

- `app-icon-main.svg`: Main application icon
- `book-icon-black.svg`: Book/knowledge icon 
- `book-icon-greys.svg`: Alternate book icon
- `ai-icon-black.svg`: AI assistant icon
- `organization-icon.svg`: Organization icon
- `plus-icon.svg`: Add/create icon
- `save-file-icon.svg`: Save file icon

Refer to the `/Images/SVG/` directory for all available icons. 