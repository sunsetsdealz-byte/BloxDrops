# Cancel Generation Button

## Date: 2025
## Status: ✅ Deployed

## Summary
Added a "Cancel Generation" button that appears on the generating overlay after 30 seconds to help users delete stuck generations.

## Implementation
- **Location**: Generating overlay (when status === "pending")
- **Trigger**: Shows after `elapsedTime > 30` seconds
- **Permission**: Only visible to owner (`ownsCurrent`)
- **Action**: Calls existing `deleteCurrent()` function

## UI Details
```jsx
<button>
  <Trash icon />
  Cancel Generation
</button>
```

**Styling**:
- Red theme (bg-red-500/20, border-red-500/50, text-red-400)
- Appears below the elapsed time counter
- Disabled state while deleting
- Hover effect for better UX

## User Flow
1. Generation starts → spinner shows
2. After 30 seconds → "Cancel Generation" button appears
3. User clicks → confirmation dialog (from existing deleteCurrent)
4. Confirms → generation deleted
5. User returned to clean state

## Why 30 Seconds?
- Normal generations: 5-15 seconds
- Slow generations: 15-30 seconds
- After 30s: Likely stuck or failed
- Gives enough time before showing the nuclear option

## Technical Notes
- Uses existing `deleteCurrent()` function
- Uses existing `deleting` state for loading
- Uses existing `ownsCurrent` permission check
- No backend changes needed
- Conditionally rendered based on elapsed time
