# Auto-Flow

A Chrome Extension for workflow automation with platform-specific workflows. Define automation workflows in TypeScript and run them with a single click.

## Features

- **Platform-based Organization**: Workflows organized by platform (Meta.AI, Flow.Veo)
- **Tabbed Interface**: Clean UI with tabs to switch between platforms
- **TypeScript-based Workflows**: Define workflows using strongly-typed TypeScript code
- **Multiple Step Types**: Support for form filling, clicking, waiting, and downloads
- **Lexical Editor Support**: Works with Meta.AI's Lexical editor
- **Extensible**: Easy to add new platforms and workflows

## Setup

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed (version 14 or higher)
2. **Install dependencies**:
   ```bash
   npm install
   ```

## Build & Load

1. **Build the extension**:
   ```bash
   npm run build
   ```
   This creates a `dist` directory with the compiled extension.

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions`
   - Enable **Developer mode** (toggle in the top right)
   - Click **Load unpacked**
   - Select the `dist` folder from this project

3. **Development Mode** (Optional):
   ```bash
   npm run dev
   ```
   Rebuilds automatically on file changes.

## Usage

1. Click the **Auto-Flow** icon in your Chrome toolbar
2. Select a platform tab (Meta.AI or Flow.Veo)
3. Choose a workflow from the list
4. Click **Run** to execute the workflow on the current page
5. Watch the status indicator for completion or errors

## Creating Workflows

Workflows are organized by platform in the `src/workflows/` directory.

### Workflow Structure

```typescript
import { Workflow } from './types';

export const myWorkflow: Workflow = {
  id: 'unique-id',
  name: 'Workflow Name',
  description: 'What this workflow does',
  platform: 'meta-ai', // or 'flow-veo'
  steps: [
    {
      type: 'fillInput',
      selector: 'p[contenteditable="true"]',
      value: 'Your text here',
    },
    {
      type: 'click',
      selector: 'button.submit',
    },
  ],
};
```

### Step Types

- **fillInput**: Fill text into input fields or contentEditable elements
  ```typescript
  { type: 'fillInput', selector: '#username', value: 'myuser' }
  ```

- **click**: Click elements
  ```typescript
  { type: 'click', selector: 'button.submit' }
  ```

- **wait**: Wait for duration or element
  ```typescript
  // Wait for duration
  { type: 'wait', duration: 2000 }
  
  // Wait for element to appear
  { type: 'wait', selector: '#result' }
  ```

- **download**: Trigger downloads
  ```typescript
  { type: 'download', selector: 'a.download-link' }
  ```

### Adding Workflows

1. **For Meta.AI**: Edit `src/workflows/meta-ai.ts`
2. **For Flow.Veo**: Edit `src/workflows/flow-veo.ts`
3. **Register**: Import and add to the platform array in `src/workflows/registry.ts`

### Adding New Platforms

1. **Add platform type** in `src/workflows/types.ts`:
   ```typescript
   export type Platform = 'meta-ai' | 'flow-veo' | 'your-platform';
   ```

2. **Create workflow file** `src/workflows/your-platform.ts`

3. **Update registry** in `src/workflows/registry.ts`:
   ```typescript
   import { yourWorkflows } from './your-platform';
   
   export const workflowsByPlatform = {
     'meta-ai': [...],
     'flow-veo': [...],
     'your-platform': yourWorkflows,
   };
   
   export const platforms = ['meta-ai', 'flow-veo', 'your-platform'];
   ```

4. **Add display name** in `src/popup/App.tsx`:
   ```typescript
   const platformNames = {
     'meta-ai': 'Meta.AI',
     'flow-veo': 'Flow.Veo',
     'your-platform': 'Your Platform',
   };
   ```

5. **Rebuild**: `npm run build`

## Project Structure

```
auto-flow/
├── src/
│   ├── workflows/
│   │   ├── types.ts       # Type definitions
│   │   ├── meta-ai.ts     # Meta.AI workflows
│   │   ├── flow-veo.ts    # Flow.Veo workflows
│   │   └── registry.ts    # Platform registry
│   ├── content/
│   │   └── index.ts       # Content script (executes workflows)
│   ├── background/
│   │   └── index.ts       # Background service worker
│   ├── popup/
│   │   ├── App.tsx        # Popup UI with tabs
│   │   └── main.tsx       # Popup entry point
│   └── index.css          # Styles
├── manifest.json          # Chrome extension manifest
└── index.html             # Popup HTML
```

## Tips

- Use browser DevTools to find CSS selectors for elements
- Test workflows on simple pages first
- Add wait steps between actions for stability
- Check the browser console for detailed execution logs
- For Lexical Editor (Meta.AI), target the contentEditable parent element

## Platforms

### Meta.AI
- Fill Prompt
- Generate & Download
- Multi-turn Conversation

### Flow.Veo
- Create Video
- Download Result
