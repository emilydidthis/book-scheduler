# Book Tracker v2 - Specification

## Project Overview
- **Project name**: Book Tracker v2
- **Type**: Single-page web app (localStorage)
- **Core functionality**: Track books being read with auto-scheduled daily pages, calendar view, and progress tracking
- **Target users**: Readers who want to plan their reading schedule

## UI/UX Specification

### Layout Structure
- Single page with **Books** | **Calendar** tabs
- Max-width: 900px, centered
- Mobile-responsive (works on phone)

### Visual Design
- **Theme**: Warm, cozy reading aesthetic (like a library)
- **Color palette**:
  - Background: `#F5F0E8` (warm cream)
  - Card background: `#FFFFFF`
  - Primary accent: `#8B4513` (saddle brown)
  - Secondary: `#D4A574` (tan)
  - Text: `#2C2416` (dark brown)
  - Success: `#4A7C59` (forest green)
  - Warning: `#C9A227` (golden)
  - Danger: `#A63D40` (brick red)
- **Typography**:
  - Headings: `Playfair Display` (serif, elegant)
  - Body: `Source Sans 3` (clean sans-serif)
- **Spacing**: 16px base unit
- **Effects**: Subtle shadows on cards, rounded corners (8px)

### Tabs
- **Books tab**: Add book form, active books list, completed section
- **Calendar tab**: Monthly/2-week view with navigation

### Components

#### Add Book Form
- Input: Book title (text)
- Input: Total pages (number)
- Input: Due date (date picker) → auto-calculates days until due
- If >20 days until due → show speed options (7/12/20 days), default to Moderate (12)
- If ≤20 days until due → hide speed options (read as fast as needed)
- Button: "Add Book"
- Collapsible section (click to expand)

#### Book Card
- Book title (heading)
- Progress bar showing completion %
- **Exact daily target**: "Read 25 pages today" (calculated: remaining / daysUntilDue)
- Stats row:
  - Progress: X / Y pages (Z%)
  - Days remaining / Due status
- Progress input: Update total pages read
- Delete button (small, corner)
- Visual state: Normal / Progressing / Overdue / Completed (color change)

#### Calendar View
- **Toggle**: Monthly / 2-week view
- **Navigation**: Arrow buttons to move forward/backward
- **Each day cell**:
  - Day number
  - Book count (e.g., "3 books")
  - Truncated book titles (max 3, then "+N more")
- **Today**: Highlighted border
- **Click day** → Modal:
  - Date as heading
  - Book list with pages to read
  - Checkbox: "Mark done today"
  - Input: "Actually read X pages" (for partial reading)
  - Save button → updates progress bar in Books tab immediately

#### Empty State
- Friendly message when no books
- Icon and encouragement

## Functionality Specification

### Core Features

1. **Add Book**
   - Title (required)
   - Total pages (required)
   - Due date (required) → auto-calculates days until due
   - Reading speed: conditional (>20 days shows options, ≤20 hides)
   - Default speed: Moderate (12 days)
   - Auto-calculate: dailyTarget = total / min(daysUntilDue, speed)

2. **View Books**
   - List all active books sorted by due date (earliest first)
   - Show exact daily reading target: "Read X pages today"
   - Show progress percentage and bar

3. **Update Progress**
   - Input field to enter total pages read
   - Auto-update remaining and percentage
   - Visual celebration when book completed

4. **Delete Book**
   - Remove from list with confirmation
   - Also removes associated daily log entries

5. **Auto-Schedule**
   - Sort books by due date (earliest first gets priority)
   - Max 3 overlapping books scheduled per day
   - If overlap > 3, spread excess pages backward to earlier days
   - Schedule recalculated on every book add/delete/progress update

6. **Calendar View**
   - Monthly view: full month grid with prev/next month navigation
   - 2-week view: 14-day grid starting from current week's Sunday
   - Each day shows scheduled books count and truncated titles
   - Click day → modal to mark progress
   - "Mark done today" checkbox auto-fills actual read with target
   - "Actually read X" input for partial completion
   - Saving updates book progress immediately

7. **Persistence**
   - Books saved to localStorage
   - Daily log saved to localStorage
   - Load on page refresh

### Data Model
```javascript
// Book
{
  id: string,
  title: string,
  total: number,
  dueDate: string (ISO date),
  speed: 7 | 12 | 20,
  dailyTarget: number,
  completed: number,
  createdAt: string (ISO date)
}

// Daily Log
{
  "bookId-dateKey": {
    done: boolean,
    actualRead: number
  }
}
```

### Edge Cases
- Due date in past: Show as overdue (red)
- Already finished (completed >= total): Show as completed, move to completed section
- No books: Show empty state
- Same day due: Show "Due today!"
- No books scheduled for a calendar day: Show friendly message in modal

## Acceptance Criteria

1. Can add a book with title, page count, and due date
2. Speed options show/hide based on days until due (>20 shows, ≤20 hides)
3. Default speed is Moderate (12 days)
4. Daily target shows exact number: "Read X pages today"
5. Books tab shows books sorted by due date
6. Calendar tab has monthly/2-week toggle with navigation
7. Each calendar day shows book count and truncated titles
8. Clicking a day opens modal with book list, checkboxes, and partial read input
9. Saving progress in modal updates progress bar in Books tab immediately
10. Auto-schedule limits to max 3 overlapping books per day
11. Data persists after page refresh
12. Overdue books show warning styling
13. Completed books show success styling
14. Works on mobile (responsive)
