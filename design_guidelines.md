# Design Guidelines: Enterprise AI Chat Platform

## Design Approach

**Reference-Based Approach** drawing from:
- **Claude.ai**: Clean, focused conversational interface with excellent typography hierarchy
- **ChatGPT**: Accessible chat patterns with clear message threading
- **Apple HIG**: Minimalist content-focused design with purposeful whitespace
- **Linear**: Sharp typography and spatial organization
- **ElevenLabs**: Professional API playground aesthetics

**Core Principle**: Create a professional-grade AI platform that balances conversational accessibility with developer-focused functionality. The interface should feel premium, trustworthy, and effortlessly powerful.

---

## Typography System

**Font Stack**: Inter (primary), SF Mono (code)

**Hierarchy**:
- **Display**: 48px/56px, weight 700 (landing hero)
- **H1**: 36px/44px, weight 600 (page titles)
- **H2**: 24px/32px, weight 600 (section headers)
- **H3**: 18px/28px, weight 600 (subsections)
- **Body Large**: 16px/24px, weight 400 (chat messages, primary content)
- **Body**: 14px/20px, weight 400 (UI labels, secondary content)
- **Body Small**: 13px/18px, weight 400 (metadata, timestamps)
- **Code**: 14px/20px, SF Mono (inline code, JSON)
- **Code Block**: 13px/20px, SF Mono (multi-line code)

**Emphasis**: Use weight 500 for subtle emphasis, 600 for strong emphasis. Never use italic for UI elements.

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20** (e.g., p-4, gap-8, my-12)

**Grid Structure**:
- **Sidebar Navigation**: Fixed 256px width (collapsible to 64px icon-only on mobile)
- **Main Content Area**: Flexible, max-width 1280px with 48px horizontal padding
- **Chat Container**: Max-width 800px, centered within main area
- **API Playground**: Two-column split (40/60) - config/response

**Vertical Rhythm**: Consistent 32px spacing between major sections, 16px between related elements, 8px between tightly coupled items

**Responsive Breakpoints**:
- Mobile: < 768px (single column, collapsed sidebar)
- Tablet: 768px - 1024px (narrow sidebar, single column content)
- Desktop: > 1024px (full layout)

---

## Component Library

### Navigation & Structure

**Sidebar**:
- Persistent left sidebar with sections: Dashboard, Chat, Playground, API Docs, Pricing, Settings
- User profile at bottom with role badge (Admin/Developer/Viewer)
- Active state with subtle indicator bar (4px left border)
- Icon + label layout with 12px gap
- Collapsible on mobile with hamburger menu

**Top Bar**:
- Height 64px with shadow separator
- Left: Breadcrumb navigation (14px, weight 500)
- Right: Environment selector dropdown + User avatar (40px circle) + Notifications bell
- Sticky position on scroll

### Chat Interface

**Message Container**:
- User messages: Right-aligned, max-width 80%, rounded-2xl, padding 12px 16px
- AI responses: Left-aligned with AI avatar (32px circle), full-width, padding 16px 0
- Message spacing: 20px vertical gap between messages
- Timestamp: 12px, positioned below each message with 4px top margin

**Input Area**:
- Sticky bottom bar with elevation shadow
- Textarea with auto-expand (min-height 56px, max-height 200px)
- Rounded-xl container with 16px padding
- Action buttons row: Attach file + Send (primary) + Stop generation
- Character/token counter in bottom-right (12px, subtle)

**Streaming Response**:
- Typing indicator: Animated dots (8px each) with 150ms pulse
- Progressive text rendering with smooth fade-in per sentence
- Code blocks appear with syntax highlighting on completion

### API Playground

**Configuration Panel** (Left, 40%):
- Environment variable selector (dropdown, 40px height)
- API endpoint input (text field with copy button)
- Request method selector (GET/POST/PUT/DELETE tabs)
- Headers section (expandable accordion)
- Request body editor (JSON with syntax highlighting, min-height 300px)
- Execute button (primary, full-width, 44px height)

**Response Panel** (Right, 60%):
- Tabbed interface: Response, Headers, Logs
- Status indicator (200 = success badge, 4xx/5xx = error badge)
- Response time + size metadata (12px, top-right)
- JSON response viewer with collapsible tree structure
- Copy response button (top-right corner)
- Syntax-highlighted code blocks with line numbers

### Forms & Inputs

**Text Fields**:
- Height 44px with 12px horizontal padding
- Rounded-lg borders
- Label above (12px, weight 500) with 4px bottom margin
- Helper text below (12px, subtle) with 4px top margin
- Focus state with elevated shadow

**Dropdowns**:
- Same height as text fields (44px)
- Chevron icon (16px) right-aligned with 12px right padding
- Dropdown menu with 4px top margin, rounded-lg, shadow-lg
- Menu items: 40px height, 12px padding, hover state

**Buttons**:
- Primary: Height 44px, rounded-lg, weight 500, padding 16px 24px
- Secondary: Same dimensions, outlined style
- Text button: No background, 12px padding, weight 500
- Icon buttons: 40px square, rounded-lg, centered icon

**Code Editor Integration**:
- Monaco-style interface with line numbers
- Tab width: 2 spaces
- Minimap on right side (disabled on mobile)
- Autocomplete dropdown with fuzzy search

### Data Display

**API Documentation**:
- Two-column layout (navigation tree left 280px, content right)
- Code examples in tabs (cURL, JavaScript, Python)
- Request/response examples with collapsible sections
- Parameter tables with 3 columns: Name, Type, Description
- Endpoint cards with method badge + path + description

**Pricing Cards**:
- Three-column grid (Free, Pro, Enterprise)
- Card height 600px with sticky CTA button at bottom
- Feature list with checkmark icons (16px) + 8px left margin
- Price display: 48px for number, 20px for /month
- Highlight "Popular" badge (absolute positioned, -12px top)

**Role-Based Access Controls**:
- Permission matrix table for admin view
- User list with role badges (pill-shaped, 24px height)
- Inline role editor (dropdown) with save/cancel actions
- Audit log with timestamp + user + action columns

### Legal & Documentation Pages

**Legal Pages** (Terms, Privacy, BAA):
- Single-column prose layout, max-width 720px, centered
- Section headers with anchor links (H2, 24px, weight 600)
- Numbered lists with 32px left indent
- Last updated timestamp (12px, top-right)
- Table of contents sidebar (sticky, 240px width)

---

## Animations

**Minimal, Purposeful Motion**:
- Page transitions: 200ms ease-out
- Dropdown menus: 150ms ease-out slide-down
- Message appearance: 300ms fade-in
- Hover states: 100ms ease
- **No scroll-triggered animations**
- **No parallax effects**
- **No auto-playing carousels**

**Loading States**:
- Skeleton screens for chat history (pulsing shimmer)
- Spinner for API requests (16px, centered)
- Progress bar for file uploads (4px height, rounded)

---

## Accessibility

- **Keyboard Navigation**: Full support with visible focus rings (2px offset)
- **ARIA Labels**: Complete labeling for screen readers
- **Focus Management**: Trap focus in modals, restore on close
- **Skip Links**: "Skip to main content" at top
- **Contrast**: Minimum 4.5:1 for all text
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Error Messages**: Inline with 8px top margin, icon + text

---

## Images

**Hero Section** (Landing Page):
- Full-width hero image (1920x1080) showcasing interface screenshot
- Glassmorphic overlay for text content (blur-md)
- Buttons with backdrop-blur-lg and semi-transparent backgrounds

**Feature Screenshots**:
- Chat interface mockup (800x600) in Features section
- API playground screenshot (1200x800) in Developer section
- Pricing comparison visual (dashboard metrics, 1000x600)

**Profile/Avatars**:
- User avatars: 40px circles in navigation, 32px in chat
- AI avatar: Custom branded icon, 32px circle
- Team photos in About section: 120x120 circles

---

## Page-Specific Layouts

### Landing Page
1. **Hero**: Full-height viewport with gradient overlay on hero image, centered CTA (primary + secondary buttons)
2. **Features Grid**: 3-column layout showcasing Chat, Playground, API Docs
3. **Playground Demo**: Interactive preview with sample API call
4. **Pricing Table**: 3-column comparison with sticky headers
5. **Trust Section**: 4-column client logos + testimonials (2-column)
6. **Legal Links**: Footer section with comprehensive links
7. **CTA Section**: Final conversion with environment variable showcase

### Chat Interface
- Full-height layout with sidebar, chat area (centered 800px), and right panel for context/settings (280px, toggleable)

### API Playground
- Split-pane with resizable divider, sticky action bar at top

### Documentation
- Three-pane: Navigation tree (left), content (center), table of contents (right)

This design system creates a professional, trustworthy platform that developers will respect while maintaining conversational warmth for AI interactions.