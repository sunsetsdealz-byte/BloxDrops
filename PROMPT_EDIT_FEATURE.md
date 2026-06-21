# Prompt Editing Feature

## Overview
Users can now edit prompts after generation and regenerate new images with the updated text.

## What Was Added

### 1. New State Variables (Studio.jsx)
- `editingPrompt`: Boolean to track if user is in edit mode
- `editedPrompt`: String to store the edited prompt text

### 2. New Function
```javascript
regenerateWithEditedPrompt()
```
- Generates a new image with the edited prompt
- Preserves original attachment type, style, and rarity settings
- Creates a brand new generation with the updated prompt
- Shows loading state during generation

### 3. UI Changes
- **Edit Button**: Small "Edit" button with pencil icon appears next to "PROMPT" label
  - Only visible to the owner of the creation
  - Styled in zinc-400 with hover effect to brand yellow (#ccff00)
  
- **Edit Mode**: When clicked, displays:
  - Textarea with current prompt (3 rows, auto-resize disabled)
  - "Generate" button (brand yellow) to create new image
  - "Cancel" button to exit edit mode
  - Both buttons are styled consistently with the app design

## User Flow

1. User views their completed generation in Studio
2. Clicks "Edit" button next to the prompt
3. Textarea appears with current prompt pre-filled
4. User modifies the text
5. Clicks "Generate" to create new image with updated prompt
   - OR clicks "Cancel" to close without changes
6. New generation starts with updated prompt
7. Original generation remains in history

## Design Decisions

### Simple & Clean
- Inline editing (no modal overlay)
- Minimal UI - just textarea and two buttons
- Matches existing Studio design language

### Owner-Only
- Only the creation owner can edit prompts
- Uses existing `ownsCurrent` check
- Prevents unauthorized modifications

### Preserves Settings
- Keeps same attachment type (Hat, Hair, etc.)
- Keeps same style (anime, gothic, etc.)
- Keeps same rarity tier and edition cap
- Only the prompt text changes

### New Generation
- Creates a completely new generation (new ID)
- Original stays in history with likes intact
- Allows unlimited iterations on a concept

## Technical Details

- No backend changes required
- Uses existing `/generate/text-to-3d` endpoint
- Integrates with existing polling system
- Refreshes user balance and history after generation
- Proper loading states and error handling

## Testing

To test:
1. Generate a creation in Studio
2. Wait for it to complete
3. Look for "Edit" button next to prompt
4. Click Edit
5. Modify the prompt text
6. Click Generate
7. Verify new generation starts
8. Check that original is still in history

## Future Enhancements (Optional)

- Add "Remix" that copies settings but allows changing attachment/style
- Show prompt edit history
- Add undo/redo for prompt edits
- Suggest prompt improvements with AI
