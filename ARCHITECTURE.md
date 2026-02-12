# Architecture

PinchChat is a single-page React app (~3,600 lines) that connects to an [OpenClaw](https://github.com/openclaw/openclaw) gateway via WebSocket. There is no backend — it's a static build served by any web server (nginx, Caddy, Vite preview, etc.).

## High-Level Flow

```
┌─────────────┐    WebSocket     ┌──────────────────┐    LLM API    ┌──────────┐
│  PinchChat   │ ◄────────────► │  OpenClaw Gateway  │ ◄──────────► │ Provider │
│  (Browser)   │   JSON msgs    │  (Node.js daemon)  │              │ (Claude…) │
└─────────────┘                 └──────────────────┘              └──────────┘
```

PinchChat authenticates at runtime (no secrets in the build). The user enters a gateway URL and token on the login screen, which are stored in `sessionStorage`.

## Directory Structure

```
src/
├── App.tsx                 # Root component: routing, layout, keyboard shortcuts
├── main.tsx                # Entry point (React 18 createRoot)
├── index.css               # Global styles (Tailwind v4)
│
├── components/             # UI components
│   ├── Chat.tsx            # Message list, auto-scroll, scroll-to-bottom button
│   ├── ChatInput.tsx       # Textarea with file upload, drafts per session
│   ├── ChatMessage.tsx     # Single message: markdown rendering, blocks dispatch
│   ├── CodeBlock.tsx       # Fenced code blocks with copy button + language label
│   ├── ConnectionBanner.tsx # Reconnecting/disconnected banner
│   ├── ErrorBoundary.tsx   # React error boundary with retry
│   ├── Header.tsx          # Top bar: agent name, session title, controls
│   ├── ImageBlock.tsx      # Inline image display with lightbox
│   ├── KeyboardShortcuts.tsx # Keyboard shortcut help modal
│   ├── LanguageSelector.tsx # EN/FR language switcher
│   ├── LoginScreen.tsx     # Gateway URL + token input form
│   ├── SessionIcon.tsx     # Per-channel icons (Telegram, Discord, cron…)
│   ├── Sidebar.tsx         # Session list, search, pinning, resize, delete
│   ├── ThinkingBlock.tsx   # Collapsible thinking/reasoning block
│   ├── ToolCall.tsx        # Tool call badges with expandable params/results
│   └── TypingIndicator.tsx # Animated typing dots
│
├── hooks/                  # Custom React hooks
│   ├── useGateway.ts       # Core hook: WebSocket connection, message state, session management
│   ├── useLocale.ts        # i18n hook (useT for translations)
│   └── useNotifications.ts # Browser notifications + unread badge in document title
│
├── lib/                    # Pure utilities (no React)
│   ├── credentials.ts      # sessionStorage read/write for gateway URL + token
│   ├── gateway.ts          # WebSocket client: connect, send, reconnect, message parsing
│   ├── i18n.ts             # Translation strings (EN + FR) and locale detection
│   ├── image.ts            # Image URL/base64 helpers
│   ├── notificationSound.ts # Programmatic notification sound (Web Audio API)
│   ├── relativeTime.ts     # "2m ago", "3h ago" relative timestamp formatting
│   ├── sessionName.ts      # Human-friendly session name from key/label/channel
│   ├── systemEvent.ts      # Detect system events (heartbeats, webhooks, cron triggers)
│   └── utils.ts            # Misc helpers (cn class merger)
│
├── types/
│   └── index.ts            # TypeScript interfaces: ChatMessage, Session, MessageBlock, etc.
│
└── globals.d.ts            # Ambient type declarations
```

## Key Concepts

### Gateway Communication (`lib/gateway.ts` + `hooks/useGateway.ts`)

The WebSocket client handles:
- **Authentication**: sends token on connect
- **Session listing**: `sessions.list` → populates sidebar
- **Message history**: `history` → loads past messages for a session
- **Streaming**: `stream.start` / `stream.delta` / `stream.end` → real-time token display
- **Sending**: user messages, file uploads (base64)
- **Reconnection**: exponential backoff with jitter on disconnect

`useGateway` is the central hook that owns all state: connection status, sessions, messages, active session, and generating flag.

### Message Rendering (`ChatMessage.tsx`)

Messages are rendered block-by-block:
1. **Text blocks** → `ReactMarkdown` with `remark-gfm`, `remark-breaks`, `rehype-highlight`
2. **Thinking blocks** → collapsible `ThinkingBlock`
3. **Tool use blocks** → `ToolCall` badges (colored by tool name, expandable)
4. **Tool result blocks** → attached to their parent tool use
5. **Image blocks** → `ImageBlock` with lightbox

System events (heartbeats, webhooks) are detected via heuristics in `lib/systemEvent.ts` and rendered as subtle inline notifications instead of full message bubbles.

### Session Management

Sessions are displayed in the sidebar with:
- **Channel icons** (Telegram, Discord, cron, etc.) via `SessionIcon`
- **Human-readable names** via `lib/sessionName.ts` (instead of raw UUIDs)
- **Pinning** (persisted in `localStorage`)
- **Resizable sidebar** (drag right edge, width persisted)
- **Search/filter** (`Cmd+K`)
- **Delete** with confirmation dialog
- **Per-session input drafts** (preserved when switching sessions)
- **Recency sorting** with relative timestamps and message previews

### Styling

- **Tailwind CSS v4** with a dark zinc-based theme
- No component library — all custom components
- Consistent border/glow patterns: `border-white/8`, `bg-zinc-800/50`, cyan accents
- Responsive: mobile sidebar collapses, viewport-safe on iPhone

### i18n (`lib/i18n.ts`)

Simple key-value translation system with EN and FR. Language detected from `localStorage` → `navigator.language` → defaults to EN. Switchable via the header dropdown.

## Build & Deploy

```bash
npm run build          # Vite production build → dist/
```

Output is a static SPA. The Docker image (`ghcr.io/marlburrow/pinchchat`) uses multi-stage build: Node for compilation, nginx:alpine for serving.

CI/CD:
- **ci.yml** — lint + build on every push/PR
- **docker.yml** — build + push Docker image on push to main
- **release.yml** — on tag push (v*): Docker image with semver tags + GitHub Release
- **pages.yml** — deploy landing page from `docs/` to GitHub Pages
