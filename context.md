# Book Scheduler v2 - Session Context

## Project
Single-page book reading tracker with auto-scheduling, calendar view, Gantt chart, task system, and cloud sync option.

## Files
- `index.html` — Main app (single file, ~5050 lines)
- `SPEC.md` — Original specification document (outdated)
- `apps-script.js` — Google Apps Script for cloud sync backend
- `designs.html` — Design explorations
- `context.md` — This file

## Key Changes Since v2

### Cloud Sync Overhaul
- **Local-first merge** — LocalStorage is source of truth. On load, cloud data patches gaps in local data (never overwrites).
- **`cloudSaveQueue`** — Reliable background saves.
- **Missing `recalcBookCompleted()`** added — recalculates `book.completed` from sum of all done task `actual` values. Critical fix: modal editing was silently failing to update book progress.

### Task Regeneration (Always Correct)
- **`regenerateBookTasks(bookId)`** — Now cleans up orphaned missed tasks (past dates no longer in the new schedule) in addition to deleting future pending tasks.
- **`regenerateAllBooksTasks()`** — New. Deletes ALL future pending tasks for ALL active books on page load, then regenerates from scratch. Ensures task targets always match current `book.completed`.
- **All task completion paths** (`updateProgress`, `confirmTaskCompletion`, `completeTask`, `missTask`, `saveModalEdit`) now call `regenerateBookTasks()` to redistribute remaining pages after any progress change.

### UI Fixes
- **`adjustReadingDays()`** was missing entirely — added. +/- spread buttons now work.
- **Mobile task inline editing** — Fixed duplicate ID collision between mobile and desktop containers. Changed to DOM traversal from clicked checkbox to find correct content element.
- **History items now clickable** — Opens day modal for that date, supporting editing.
- **Due date on book cards** — Status text now shows both relative time and actual date (e.g., "5d left (May 4)").
- **Sidebar add form styled** — Proper spacing, borders, focus states, hover effects.
- **`updateSidebarType()`** fixed — removed reference to non-existent `sidebar-pagesGroup`.

### Task Indicator Dots
- Shows ALL tasks including completed ones (not just future).
- Tooltip shows actual completed amount for done tasks, target for pending.
- Colors match gantt chart: green = done, red = missed, grey outline = on-track pending.
- Orphaned past pending tasks hidden (schedule shifted away from those days).
- Auto-cleanup of orphaned missed tasks when schedule regenerates.

## What Was Built (Complete Feature List)

### 1. Tabs Navigation
- **Books** tab (default): Add form, book list, completed section
- **Today** tab: Pending, overdue, and done tasks
- **Calendar** tab: Monthly/2-week view with navigation
- **Gantt** tab: Horizontal timeline with segmented bars
- **History** tab: Task history grouped by date, filterable

### 2. Add Book Form
- Book title (text)
- Count type toggle: **Pages** / **Chapters** / **Hours** (defaults to Pages)
- **Pages mode**: Total pages input
- **Chapters mode**: Total chapters + total pages (for time estimation)
- **Hours mode**: Total listening hours + playback speed (1x, 1.25x, 1.5x, 2x)
- Due date picker — auto-calculates days and estimated daily time

### 3. Book Cards (Compact 2-Column Grid)
- Book title, progress bar, schedule badge
- Stats row: Progress (click to edit total) / Due (click to change due date, shows date)
- Spread control: +/- buttons to adjust reading span (`targetDays`)
- Task indicator dots: Green=done, Red=missed, Grey=pending. Hover for date+amount.
- Progress input with Update button, Delete button

### 4. Auto-Schedule Engine (Time-Based)
- **Reading speed**: 1 page = 1.25 minutes
- **Chapter books**: Time = totalPages × 1.25 min (spread evenly across all chapters)
- **Hours books**: Time = hours × 60 / playbackSpeed
- **Target**: 60 minutes/day, but can exceed if needed to fit all books
- **Hard cap**: Max 3 books per day (non-negotiable)
- Books sorted by due date (earliest gets priority)
- **Scheduling**: Spreads each book evenly, picking least-loaded days
- **targetDays field**: If set, limits how many days a book is spread across
- **Chapter cap**: Chapter books max out at 1 chapter/day

### 5. Calendar View
- **Monthly view**: Full month grid with prev/next navigation
- **2-week view**: 14-day grid starting from current week's Sunday
- Overloaded days (over 2 hours): Red border + red background tint
- Click day → modal
- Both mobile and desktop containers render simultaneously

### 6. Day Modal
- Date as heading
- List of scheduled books with target, checkbox, actual input
- Inline editing for past tasks (status + amount)
- Save button updates progress immediately

### 7. Today Tab
- Date header with task summary ("X/Y tasks done · Z min total")
- Today's pending tasks with inline edit-on-checkbox
- Overdue section (past pending tasks)
- Collapsible "Done Today" section with delta badges (+above/-below)

### 8. Task History Tab
- Groups tasks by date (newest first)
- Status icons: ✓ done, ✗ missed, ~ partial
- Filters: status (All/Done/Missed/Partial) + time range (7 days / 30 days / All)
- Click any entry to open day modal for editing

### 9. Gantt Chart
- **Green bars (top)** — Completed task days, grouped into contiguous segments
- **Tan/Red bars (bottom)** — Pending schedule. Tan = on-track, Red = overdue
- **Track bars** with diagonal slashes showing full range
- Zoom slider, scroll-to-today on load
- Book labels on left, month/day headers on top

### 10. Desktop Layout
- Left sidebar with tabs (Books/Today/History)
- Right main area with Calendar or Gantt view
- Toggle between views
- Add book form in sidebar
- Shared render functions — CSS handles visual differences via parent-scoped selectors

### 11. Cloud Sync (Optional)
- **Default**: localStorage (works offline)
- **Optional**: Google Sheets via Google Apps Script
- Local-first merge on load, background push on save
- Sync status indicator (bottom-right)

### 12. Task System
- **Tasks data model**: `{ bookId, date, target, actual, status: "pending"|"done"|"missed" }`
- **`generateTasks()`** — Fill-in-gaps only
- **`regenerateBookTasks(bookId)`** — Deletes future pending + orphaned missed tasks, regenerates
- **`regenerateAllBooksTasks()`** — Same for all active books (page load)
- **`resetAllTasksFrom(startDate)`** — One-time full reset
- **`cleanupOverdueTasks()`** — Marks overdue pending tasks as done where `book.completed` accounts for them
- **`redistributeAmount()`** — Splits shortfall across future tasks (remainder in last)
- **Inline edit**: Checkbox click shows number input for current position
- **Multi-undo**: Ctrl+Z/Cmd+Z, up to 50 actions

## Task Completion Flow
1. **Update button** (book card input): `updateProgress()` → sets `book.completed`, regenerates tasks
2. **Today tab checkbox**: `showTaskEditInput()` → `confirmTaskCompletion()` → delta = newCompleted - oldCompleted
3. **Day modal checkbox**: `completeTask()` → marks done, regenerates tasks
4. **Day modal miss**: `missTask()` → marks missed, regenerates tasks
5. **History edit**: `saveModalEdit()` → updates task, recalculates book, regenerates tasks

All paths call `regenerateBookTasks()` to ensure future task targets always match remaining pages.

## Rounding Strategy
- **Chapter books**: Whole numbers (Math.round)
- **Hours books**: Quarter-hour precision (Math.round(x * 4) / 4)
- **Page books**: 2 decimal places (Math.round(x * 100) / 100)

## Key Design Decisions
1. **Time-based scheduling** — 1 page = 1.25 min, target 60 min/day
2. **3 books hard cap** — Never exceeds 3 books per day
3. **Due date is deadline** — Not a reading day. `maxDays = daysUntilDue`
4. **Least-loaded day selection** — When targetDays is set, picks days with fewest existing minutes
5. **Chapter cap at 1/day** — Fractional chapters don't make sense
6. **localStorage first, cloud optional** — Works immediately, sync is opt-in
7. **Tasks are persistent** — Regenerate future pending only, preserve past history
8. **Due date parsing** — Always use `new Date(dateStr + 'T00:00:00')` for local timezone
9. **Orphaned cleanup** — Missed tasks on dates no longer in schedule are deleted on regeneration

## Data Model
```javascript
{
  id: string,
  title: string,
  type: "pages" | "chapters" | "hours",
  total: number,
  totalPages: number | null,      // For chapter books (time estimation)
  dueDate: string (ISO date),
  listeningSpeed: number,          // For hours type (default 1.5)
  targetDays: number | null,       // Custom day spread (null = use all available days)
  completed: number,
  createdAt: string (ISO date)
}

// Tasks (keyed by "bookId-YYYY-MM-DD")
{
  bookId: string,
  date: string,
  target: number,
  actual: number,
  status: "pending" | "done" | "missed"
}

// Schedule entry (keyed by "YYYY-MM-DD")
[
  {
    bookId: string,
    title: string,
    pages: number,                 // Actual units (pages/chapters/hours) for that day
    minutes: number,               // Estimated reading time in minutes
    dueDate: string,
    type: string
  }
]
```

## Removed Features
- Speed selector (7/12/20 days) — replaced by time-based auto-scheduling
- Speed badge and dropdown on cards
- `speed` and `dailyTarget` fields on books
- `getOverloadedDays()` helper (unused)
- Manual redistribution via `redistributeAmount()` — now replaced by full `regenerateBookTasks()` on all completion paths

## Setup for Cloud Sync
1. Go to [script.new](https://script.new)
2. Paste contents of `apps-script.js`
3. Deploy → New deployment → Web app
4. Set "Who has access" to **Anyone**
5. Copy URL, paste into `index.html` at `YOUR_APPS_SCRIPT_URL_HERE`

## GitHub Pages
- Repo: `book-scheduler`
- Deployed via GitHub Pages (branch: main, path: /)
