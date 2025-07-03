# PATCH 1: Terminal & AI Chat System

## 🎯 Vision: True Terminal Integration + Embedded AI Chat

Transform MotherCore into a development powerhouse with **real PowerShell/Terminal access** and **integrated Ollama AI chat** - all within the notes environment.

## 📐 Layout Decision: Right Panel Terminal + AI

**New Layout Architecture:**
```
─────────────────┐
 Right Panel     │
 (400px)         │
                 │
┌─────────────┐  │
│ AI CHAT     |  |
│             │  │
├─────────────┤  │
│  You:       │  │
│ How do I... │  │
│             │  │
|   AI:       │  │
│ To do that..│  │
├─────────────┤  │
│ TERMINAL    |  │
│             │  │
│ PS> ollama  │  │
│ PS> core    │  │
│ PS> ls      │  │
└─────────────┘  │
─────────────────┘
```

## 🖥️ True Terminal Implementation

### **Real PowerShell Integration**
**Technology Stack:**
- **Electron**: `child_process` for terminal spawning
- **Node-pty**: Full terminal emulation with PTY support
- **Xterm.js**: Terminal UI component with full features

### **Terminal Features**
```
⚡ MOTHERCORE TERMINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PS C:\Projects\MotherCore> ollama run llama2
PS C:\Projects\MotherCore> core create-note "AI Research"
PS C:\Projects\MotherCore> python data_analysis.py
PS C:\Projects\MotherCore> git status
PS C:\Projects\MotherCore> npm run build
PS C:\Projects\MotherCore> core list-projects
PS C:\Projects\MotherCore> 

[Clear] [Split Terminal] [New Terminal] [Settings]
```

### **Command Categories**

#### **1. System Commands (Native)**
- `ollama run llama2` - Run Ollama models
- `python script.py` - Execute Python scripts
- `npm install` - Node.js commands
- `git commit -m "message"` - Git operations
- `ls`, `dir`, `cd` - File system navigation
- `curl`, `wget` - Network operations

#### **2. Core Commands (MotherCore-specific)**
```bash
# Note management
core create-note "Note Title" --type=markdown
core list-notes --filter=recent
core search "react hooks" --in=code
core export-note "note-id" --format=pdf

# Organization management
core create-org "New Organization"
core list-projects --org="Programming"
core create-book "React Guide" --project="web-dev"

# AI integration
core chat "Explain this code" --context=current-file
core summarize --file=current --length=short
core generate-docs --from=code --to=markdown

# System info
core status
core version
core config --list
```

### **Terminal Architecture**
```typescript
interface TerminalManager {
  // System terminal (PowerShell/Bash)
  systemTerminal: SystemTerminal;
  
  // Core command processor
  coreProcessor: CoreCommandProcessor;
  
  // Multiple terminal tabs
  terminals: Terminal[];
  
  // Command history
  history: CommandHistory;
}

class SystemTerminal {
  spawn(shell: 'powershell' | 'bash' | 'zsh'): ChildProcess;
  execute(command: string): Promise<CommandResult>;
  pipe(input: string): void;
}

class CoreCommandProcessor {
  register(command: string, handler: CommandHandler): void;
  execute(command: string, args: string[]): Promise<any>;
  autocomplete(partial: string): string[];
}
```

## 🤖 AI Chat Integration


#### **Terminal-Based Chat**
```bash
# User types in terminal
PS> core chat "How do I optimize React performance?"

# AI responds in same terminal
🤖 AI Response:
To optimize React performance, consider these strategies:

1. Use React.memo() for component memoization
2. Implement useCallback() for function memoization
3. Use useMemo() for expensive calculations
4. Lazy load components with React.lazy()
5. Optimize bundle size with code splitting

Would you like me to show examples of any of these?

PS> core chat "Show me React.memo example"
```

### **Recommended: Split Panel Approach**

**Right Panel Structure:**
```
┌─────────────────────────────────┐
│ 🤖 AI ASSISTANT                 │
├─────────────────────────────────┤
│ Model: llama2:13b          [⚙️] │
├─────────────────────────────────┤
│ 💬 You (3:45 PM):               │
│ How do I handle async data      │
│ in React components?            │
│                                 │
│ 🤖 Assistant (3:45 PM):         │
│ For handling async data in      │
│ React, you have several options:│
│                                 │
│ 1. useEffect + useState:        │
│ ```javascript                   │
│ const [data, setData] = useState│
│ useEffect(() => {               │
│   fetchData().then(setData);    │
│ }, []);                         │
│ ```                             │
│                                 │
│ Would you like to see more      │
│ patterns?                       │
├─────────────────────────────────┤
│ [Type your message...]          │
│ [📎] [🎤] [📷] [⚡ Send]         │
├─────────────────────────────────┤
│ ⚡ TERMINAL                      │
├─────────────────────────────────┤
│ PS> ollama run llama2           │
│ PS> core status                 │
│ PS> python analyze.py           │
│ PS> _                           │
├─────────────────────────────────┤
│ [Split] [New] [Clear] [⚙️]       │
└─────────────────────────────────┘
```

### **AI Chat Features**

#### **1. Context Awareness**
```typescript
interface ChatContext {
  currentFile?: string;
  selectedText?: string;
  activeProject?: string;
  recentNotes?: string[];
  terminalHistory?: string[];
}

class AIChat {
  async sendMessage(
    message: string, 
    context: ChatContext
  ): Promise<string> {
    const contextPrompt = this.buildContextPrompt(context);
    return await this.ollama.chat(contextPrompt + message);
  }
}
```

#### **2. Quick Actions**
```
🎯 QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Explain Selection] [Debug Code] [Generate Docs]
[Optimize Code] [Write Tests] [Create Summary]
[Translate] [Grammar Check] [Suggest Improvements]
```

#### **3. File Integration**
```typescript
// User can drag files into chat
interface FileAttachment {
  type: 'code' | 'text' | 'image' | 'document';
  content: string;
  language?: string;
}

// AI can access current workspace
class WorkspaceContext {
  getCurrentFile(): FileContent;
  getSelectedText(): string;
  getProjectStructure(): ProjectTree;
  getRecentChanges(): GitDiff[];
}
```

## 🔧 Technical Implementation

### **Terminal Backend (Main Process)**
```typescript
// src/main/terminal.ts
import * as pty from 'node-pty';

class TerminalService {
  private terminals: Map<string, pty.IPty> = new Map();
  
  createTerminal(id: string, shell: string): pty.IPty {
    const terminal = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: process.env
    });
    
    this.terminals.set(id, terminal);
    return terminal;
  }
  
  writeToTerminal(id: string, data: string): void {
    const terminal = this.terminals.get(id);
    terminal?.write(data);
  }
}
```

### **Core Command System**
```typescript
// src/main/core-commands.ts
class CoreCommandSystem {
  private commands: Map<string, CommandHandler> = new Map();
  
  constructor(private db: Database) {
    this.registerDefaultCommands();
  }
  
  private registerDefaultCommands(): void {
    this.register('create-note', async (args) => {
      const title = args[0];
      const type = this.getFlag(args, '--type') || 'markdown';
      return await this.db.createNote(title, type);
    });
    
    this.register('list-notes', async (args) => {
      const filter = this.getFlag(args, '--filter');
      return await this.db.getNotes(filter);
    });
    
    this.register('chat', async (args) => {
      const message = args.join(' ');
      return await this.aiService.chat(message);
    });
  }
}
```

### **AI Service Integration**
```typescript
// src/main/ai-service.ts
class AIService {
  private ollamaClient: OllamaClient;
  
  async chat(message: string, context?: any): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    return await this.ollamaClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]);
  }
  
  private buildSystemPrompt(context: any): string {
    return `You are an AI assistant integrated into MotherCore, 
    a knowledge management application. Current context:
    - Active file: ${context?.currentFile}
    - Project: ${context?.activeProject}
    - Selected text: ${context?.selectedText}
    
    Help the user with their notes, code, and productivity tasks.`;
  }
}
```

### **Frontend Terminal Component**
```typescript
// src/renderer/components/terminal/Terminal.tsx
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

class TerminalComponent extends React.Component {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  
  componentDidMount() {
    this.terminal = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#ffd700',
        cursor: '#ffd700'
      }
    });
    
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    
    // Connect to backend terminal
    this.terminal.onData(data => {
      window.electronAPI.writeToTerminal(this.props.id, data);
    });
    
    window.electronAPI.onTerminalData(this.props.id, data => {
      this.terminal.write(data);
    });
  }
}
```

## 🎨 UI Design Specifications

### **Terminal Styling**
```css
.terminal-container {
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  font-family: 'Fira Code', monospace;
  padding: 16px;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.xterm-viewport {
  background-color: transparent !important;
}
```

### **AI Chat Styling**
```css
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 50%;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
}

.chat-message {
  padding: 12px 16px;
  margin: 8px;
  border-radius: 12px;
  animation: slideInUp 0.3s ease;
}

.chat-message.user {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  margin-left: 40px;
}

.chat-message.ai {
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  margin-right: 40px;
}
```

## 🚀 Implementation Phases

### **Phase 1: Terminal Foundation (Week 1)**
1. Set up node-pty in main process
2. Create xterm.js frontend component
3. Implement basic terminal communication
4. Add core command system structure
5. idea is to have real powwershell or linux terminal support, not our own but we do want our own app based commands starting with core or mother or mocore or something.

### **Phase 2: Core Commands (Week 2)**
1. Build command registry system
2. Implement note management commands
3. Add project/organization commands
4. Create command autocomplete

### **Phase 3: AI Integration (Week 3)**
2. Build AI chat interface
3. Implement context awareness
4. Add quick action buttons

### **Phase 4: Polish & Integration (Week 4)**
1. Perfect terminal/chat split layout 20/60/20
2. Add terminal themes and customization
3. Implement chat history persistence
4. Add file drag-and-drop to chat

## 🎯 Success Criteria

- [ ] Can run `ollama run llama2` in terminal successfully pulling ollama manifest like normal powershell
- [ ] Core commands work: `core create-note "Test"`
- [ ] AI chat responds to questions about current file
- [ ] Terminal and chat persist across app restarts
- [ ] Performance: Terminal responsive, chat under 2s response
- [ ] UI: Professional appearance matching MotherCore theme

This patch transforms MotherCore into a true development environment where you can seamlessly switch between note-taking, terminal commands, and AI assistance - all in one integrated workspace.