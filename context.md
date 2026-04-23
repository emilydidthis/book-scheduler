# Book Tracker v2 - Session Context

## Project
Single-page book reading tracker with auto-scheduling, calendar view, and cloud sync option.

## Files
- `index.html` — Main app (single file, ~2065 lines)
- `SPEC.md` — Original specification document (outdated)
- `apps-script.js` — Google Apps Script for cloud sync backend
- `context.md` — This file

## What Was Built

### 1. Tabs Navigation
- **Books** tab (default): Add form, book list, completed section
- **Calendar** tab: Monthly/2-week view with navigation
- Tab switching shows/hides content, renders calendar on switch

### 2. Add Book Form
- Book title (text)
- Count type toggle: **Pages** / **Chapters** / **Hours** (defaults to Pages)
- **Pages mode**: Total pages input
- **Chapters mode**: Total chapters + total pages (for time estimation)
- **Hours mode**: Total listening hours + playback speed (1x, 1.25x, 1.5x, 2x)
- Due date picker — auto-calculates days and estimated daily time

### 3. Book Cards (Compact 2-Column Grid)
- Book title (no speed badge — removed in favor of time-based scheduling)
- Progress bar
- Daily target: shows today's reading amount and estimated time, or date range with per-day average
- **Schedule info bar**: Shows `Xd · Y/day · Zh total` with +/- buttons to adjust reading span
- Stats row: Progress (click to edit total) and Due (click to change due date)
- Progress input with Update button
- Delete button

### 4. Auto-Schedule Engine (Time-Based)
- **Reading speed**: 1 page = 1.25 minutes
- **Chapter books**: Time = totalPages × 1.25 min (spread evenly across all chapters)
- **Hours books**: Time = hours × 60 / playbackSpeed
- **Target**: 60 minutes/day, but can exceed if needed to fit all books
- **Hard cap**: Max 3 books per day (non-negotiable)
- Books sorted by due date (earliest gets priority)
- **Scheduling**: Spreads each book evenly across all available days from today to due date, skipping days already at 3 books
- **targetDays field**: If set, limits how many days a book is spread across (picked from least-loaded days)
- **Chapter cap**: Chapter books max out at 1 chapter/day (no fractional chapters)
- Recalculates on: add book, delete book, update progress, change due date, adjust reading span

### 5. Calendar View
- **Monthly view**: Full month grid with prev/next navigation
- **2-week view**: 14-day grid starting from current week's Sunday
- Each day cell shows:
  - Day number
  - Time estimate: `~2h 30m`, `~45m`, or empty (no reading)
  - Due date indicators (red text, truncated titles)
  - Book count (e.g., "3 books")
  - Truncated book titles (max 3, then "+N more")
- Today highlighted with border
- **Overloaded days** (over 2 hours total): Red border + red background tint
- Click day → modal

### 6. Day Modal
- Date as heading
- List of scheduled books with:
  - Book title
  - Target amount for that day
  - "Mark done today" checkbox (auto-fills actual read with target)
  - "Actually read/listened X" input for partial completion
- Save button updates progress immediately in Books tab

### 7. Editable Fields on Cards
- **Progress stat**: Click to edit total pages/chapters/hours (for chapter books, also prompts for total pages for time estimation)
- **Due stat**: Click to show inline date picker and change due date
- **Schedule info +/- buttons**: Adjust `targetDays` — how many days the book is spread across (capped at days until due date, or remaining chapters for chapter books)

### 8. Cloud Sync (Optional)
- **Default**: localStorage (works offline, data persists locally)
- **Optional**: Google Sheets via Google Apps Script
- Setup instructions shown in banner if not configured
- Sync status indicator (bottom-right): "No cloud" / "Synced" / "Sync failed"
- Falls back to localStorage if cloud is unavailable
- `apps-script.js` creates its own Google Sheet called "Book Tracker Data" in user's Drive

### 9. Loading & Skeleton States
- Skeleton loaders shown while fetching from cloud
- Loading overlay with spinner during initial load

## Key Design Decisions

1. **Time-based scheduling** — Not speed-based; 1 page = 1.25 min, target 60 min/day
2. **3 books hard cap** — Never exceeds 3 books per day; time can go over 60 min if needed
3. **Spread evenly** — Each book spreads across all days from today to due date
4. **Least-loaded day selection** — When targetDays is set, picks the days with fewest existing minutes
5. **Chapter cap at 1/day** — Fractional chapters don't make sense; max spread = remaining chapters
6. **Editable totals** — Click progress stat to fix page/chapter counts per book
7. **No more speed selector** — The app determines the schedule automatically
8. **localStorage first, cloud optional** — Works immediately, sync is opt-in
9. **Google Sheets as backend** — Free, no API keys, no OAuth, user owns their data

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

// Daily Log (keyed by "bookId-YYYY-MM-DD")
{
  done: boolean,
  actualRead: number
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

## Removed Features (from earlier versions)
- Speed selector (7/12/20 days) — replaced by time-based auto-scheduling
- Speed badge and dropdown on cards
- `speed` and `dailyTarget` fields on books
- `getOverloadedDays()` helper (unused)

## Setup for Cloud Sync
1. Go to [script.new](https://script.new)
2. Paste contents of `apps-script.js`
3. Deploy → New deployment → Web app
4. Set "Who has access" to **Anyone**
5. Copy URL, paste into `index.html` at `YOUR_APPS_SCRIPT_URL_HERE`
