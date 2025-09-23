# Apple-Style AI Spotlight

A macOS Spotlight-inspired AI search interface powered by Google Gemini 2.0 Flash.

## Features

🔍 **Instant Search**: Just like macOS Spotlight - type to search across your business data
🤖 **AI-Powered**: Uses Google Gemini 2.0 Flash for intelligent responses
⌨️ **Keyboard Navigation**: Full keyboard support with arrow keys and Enter
🚀 **Real-time Results**: Shows vendors, invoices, and contracts as you type
💡 **Smart Suggestions**: AI provides contextual suggestions and actions

## Usage

### Opening Spotlight
- **Keyboard**: Press `Cmd+Space` (or `Ctrl+Space` on Windows/Linux)
- **UI Button**: Click the search icon in the top-right corner

### Navigation
- `↑/↓ Arrow Keys`: Navigate through results
- `Enter`: Select/execute result
- `Escape`: Close Spotlight
- `Cmd+Space`: Toggle open/close

### Search Examples
- "Show overdue invoices"
- "vendor performance"
- "contracts expiring soon"
- "ACME Corp" (search by vendor name)
- "INV-2024-001" (search by invoice number)

## Setup

### Environment Variables
Make sure you have your Gemini API key configured:

```bash
# In .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

### Import and Use

```tsx
import { Spotlight } from '@/components/spotlight';

function App() {
  return (
    <Spotlight
      user={currentUser}
      invoices={invoices}
      vendors={vendors}
      contracts={contracts}
      company={company}
    />
  );
}
```

### Backward Compatibility
The old `Spotlight` component is still available and now uses the new Spotlight:

```tsx
import { Spotlight } from '@/components/ai-spotlight';
// This now uses the new Apple-style Spotlight internally
```

## AI Capabilities

The Spotlight uses Gemini 2.0 Flash to provide:

- **Data Analysis**: Ask about invoice trends, vendor performance, etc.
- **Quick Insights**: Get summaries of your business data
- **Smart Filtering**: Find specific records with natural language
- **Action Suggestions**: Get relevant next steps based on your query

## Architecture

```
src/
├── ai/
│   └── gemini-service.ts     # Gemini 2.0 Flash integration
├── components/
│   ├── spotlight.tsx         # Main Apple-style component
│   └── ai-spotlight.tsx      # Backward compatibility export
```

## Dependencies

- `@google/generative-ai`: Google Gemini AI SDK
- `@radix-ui/react-dialog`: Dialog component
- `lucide-react`: Icons
- React hooks for state management

## Performance

- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Data Limiting**: Only sends relevant data slices to AI
- **Client-side Filtering**: Fast local search for direct matches
- **Optimized Rendering**: Virtualized results for large datasets