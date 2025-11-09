# PayVault Design Guidelines

## Design Approach
**Hybrid System-Based Design** drawing from Material Design's data density principles and Linear's refined aesthetics. This productivity tool prioritizes clarity, efficiency, and professional polish while maintaining visual appeal for daily business use.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, professional, excellent readability for data
- **Hierarchy**:
  - Page Titles: 2xl font weight 700
  - Section Headers: xl font weight 600
  - Card/Table Headers: base font weight 600 uppercase tracking-wide
  - Body Text: base font weight 400
  - Small Labels/Meta: sm font weight 500

### Layout System
**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm
- Component padding: p-6 to p-8
- Card spacing: gap-6
- Section margins: my-12 to my-20
- Form field spacing: space-y-4

### Component Library

**Dashboard Cards**
- Grid layout: 3 columns desktop (grid-cols-3), 2 tablet (md:grid-cols-2), 1 mobile
- Card structure: rounded-xl border with p-6, hover shadow-lg transition
- Stat display: Large number (text-3xl font-bold), label below (text-sm text-muted)
- Icon placement: Top-left corner with subtle background circle

**Data Tables**
- Full-width responsive table with alternating row backgrounds (subtle stripe)
- Sticky header with medium font weight
- Row height: py-4 for comfortable scanning
- Action buttons: Icon-only on right side, revealed on row hover
- Pagination: Bottom-right with page numbers and prev/next buttons

**Forms & Modals**
- Modal overlay: backdrop blur with centered container (max-w-2xl)
- Form layout: Single column with consistent spacing (space-y-4)
- Input groups: Label above (text-sm font-medium), input below with border-2 focus states
- Dropdown styling: Custom styled select with chevron icon, matches input height
- Bank dropdown: Searchable with grouped Pakistani banks, "Custom" option triggers text input below
- IBAN field: Monospace font with auto-uppercase, validation icon on right
- Submit actions: Right-aligned with Cancel (outline) and Submit (solid indigo) buttons

**Navigation**
- Sidebar: Fixed left, w-64, full height with logo at top
- Nav items: Rounded-lg hover states, active item with indigo background
- User section: Bottom of sidebar with avatar, name, role badge, logout button
- Connection indicator: Fixed top-right corner, small pill badge (green/red) with text

**Salary Management Interface**
- Month/Year selector: Prominent at top with large dropdown or custom picker
- Generate button: Primary CTA, full-width on mobile, right-aligned desktop
- Salary records: Card-based layout with status badges (green/yellow/red pills)
- Filters: Horizontal row with dropdowns for status, employee, date range
- Mark as Paid: Inline button that transforms to checkmark with animation

**Status Indicators**
- Active/Inactive: Small dot + text (green/gray)
- Payment Status: Badge pills with icon (pending: yellow, paid: green, failed: red)
- Connection Status: Fixed badge top-right (Connected: green dot, Offline: red dot + text)

### Images
**No Hero Image** - This is a business productivity app focused on data and functionality, not marketing. The interface opens directly to the dashboard for immediate access.

### Animation Strategy
**Minimal, Purposeful Motion**:
- Page transitions: Subtle fade (200ms)
- Modal entry: Scale from 95% to 100% with fade
- Button interactions: Scale down slightly on click (active:scale-95)
- Success states: Checkmark animation when marking salary as paid
- Loading states: Spinner for async operations
- Avoid scroll animations, parallax, or decorative motion

### PWA-Specific Design
- Install prompt: Modal with app icon, benefits list, platform-specific install button
- Offline banner: Slide down from top when disconnected, slide up when reconnected
- Sync indicator: Small icon in header showing sync status during background operations
- App icons: Indigo gradient background with white "PV" monogram

### Form Validation Visual Treatment
- Error state: Red border-2, red text below field, error icon inside input (right side)
- Success state: Green border, checkmark icon
- Warning (duplicate account): Yellow border with warning icon and yellow text
- Inline validation: Show immediately on blur, clear on valid input

### Data Visualization (Optional Enhancement)
- Simple bar charts for salary trends: Indigo bars with hover tooltips
- Employee status breakdown: Donut chart with color-coded segments
- Keep charts minimal, functional, not decorative