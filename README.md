# MotherCore Digital Library

MotherCore is a desktop application for organizing and managing your knowledge with a hierarchical structure designed for deep learning and easy retrieval.

## Features

- **Hierarchical Organization**: Organize content in organizations, projects, books, chapters, and pages
- **Local-First**: All data is stored locally in a SQLite database
- **Rich Text Editing**: Create and edit content with rich text formatting
- **Secure**: Password protection for your knowledge base
- **Modern UI**: Sleek, cyberpunk-inspired interface with matrix rain effect

## Installation

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mothercore.git
cd mothercore
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run electron:dev
```

### Building for Production

1. Build the application:
```bash
npm run electron:pack
```

2. The packaged application will be available in the `dist` directory.

## Usage

### First Launch

On first launch, you'll be prompted to create a password to secure your digital library. This password will be required for future access.

### Creating Content

1. **Organizations**: Start by creating an organization to group related projects
2. **Projects**: Within an organization, create projects to organize your work
3. **Books**: Create books within projects to structure your knowledge
4. **Chapters**: Divide books into chapters for logical organization
5. **Pages**: Create pages within chapters to write your content

### Navigation

Use the sidebar tree to navigate through your content hierarchy. Click on any item to view its details and content.

## Architecture

MotherCore is built with:

- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **SQLite**: Local database (via better-sqlite3)
- **Tailwind CSS**: Utility-first CSS framework

### Directory Structure

```
mothercore/
├── dist-electron/     # Compiled Electron main and preload scripts
├── src/
│   ├── main/          # Electron main process code
│   │   ├── database.ts # Database manager
│   │   └── main.ts    # Main process entry point
│   ├── preload/       # Electron preload scripts
│   ├── renderer/      # React renderer process code
│   │   ├── components/ # React components
│   │   │   ├── books/
│   │   │   ├── chapters/
│   │   │   ├── content/
│   │   │   ├── effects/
│   │   │   ├── layout/
│   │   │   ├── navigation/
│   │   │   └── organizations/
│   │   └── ...
│   ├── App.tsx        # Main React component
│   └── ...
├── package.json
└── ...
```

## Developer Notes

### IPC Communication

Communication between the Electron main process and the renderer process is handled through IPC (Inter-Process Communication). The available methods are defined in the `src/vite-env.d.ts` file.

### Database Schema

The SQLite database has the following tables:

- `auth`: Stores authentication credentials
- `organizations`: Top-level organizational units
- `projects`: Projects belonging to organizations
- `books`: Books belonging to projects
- `chapters`: Chapters belonging to books
- `pages`: Pages belonging to chapters with content

### Adding New Features

When adding new features:

1. Update the database schema in `src/main/database.ts` if needed
2. Add IPC handlers in `src/main/main.ts`
3. Update the type definitions in `src/vite-env.d.ts`
4. Add UI components in `src/renderer/components/`
5. Update the main App component if needed

## Troubleshooting

### Common Issues

- **Blank Screen**: Make sure the preload script is correctly configured in `main.ts`
- **Authentication Issues**: Check the database file permissions
- **UI Not Updating**: Ensure CSS is properly imported and applied

### Debug Mode

Run the application with debug mode enabled:

```bash
npm run electron:dev
```

The DevTools will automatically open, allowing you to inspect elements and check console logs.

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
