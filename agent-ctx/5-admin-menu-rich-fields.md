# Task 5 — AdminMenu rich fields

**Agent:** full-stack-developer (AdminMenu rich fields)
**Task ID:** 5
**File modified:** `src/components/admin/AdminMenu.tsx` (only this one, per task constraint)

## Summary
Upgraded the Admin Menu "Add/Edit Item" modal to support the new rich `MenuItem` fields
(`tagline`, `shortDescription`, `chefRecommended`, `ingredients[]`, `allergens[]`,
`servingSize`, `images[]`) using the existing admin primitives from
`src/components/admin/ui.tsx`.

## What changed

### Item rows (in the category list)
- Thumbnail now reads from `item.images?.[0] || item.image` (placeholder = `UtensilsCrossed`).
- New "Chef's Pick" gold badge (`ChefHat` icon) shown when `item.chefRecommended` is true.
- Secondary line prefers the italic-gold `tagline` and falls back to the muted `description`.

### `ItemModal` — upgraded to `size="xl"`, 4 labelled sections
1. **Essentials** — Name (required), Tagline, Category + Price (2-col), Short Description, Full Description (rows 4, required).
2. **Imagery** — new custom `MultiImageUploader` (NOT the single `ImageUploader`):
   - Responsive `grid-cols-3 sm:grid-cols-4` of aspect-square thumbnails.
   - "Cover" gold pill + Star on index 0; numeric counter chip on every tile.
   - Hover overlay: Replace (file picker → `FileReader.readAsDataURL`), Delete, ChevronLeft/ChevronRight reorder.
   - "Add Image" dashed tile (file picker → appends).
   - "Paste URL" fallback row (text input + "Add URL" button, Enter also adds).
   - Validation: `image/*` only, 6MB max, inline red error.
3. **Dietary & Classification** — Spice Level (SearchableSelect 0/1/2/3) + Serving Size (AdminInput) 2-col; then 4 Toggles in a bordered container: Vegetarian (green), Featured (gold), Chef's Recommendation (gold), Available (green).
4. **Ingredients & Allergens** — two `TagInput` components:
   - Ingredients: gold chips.
   - Allergens: red-tinted chips + red container focus border, with `COMMON_ALLERGENS` quick-add suggestions.
   - Behaviour: Enter/comma adds (case-insensitive dedupe), Backspace-on-empty removes last, blur-with-text adds, X removes per chip.

### Form state
- Extended `ItemFormState` with `tagline`, `shortDescription`, `images: string[]`, `chefRecommended`, `ingredients: string[]`, `allergens: string[]`, `servingSize`. Dropped the legacy single `image` field (derived at save).
- `deriveItemForm(item, categories)` handles both add (defaults) and edit (with `?? ""` / `?? false` / `?? []` null-coalescing and `images` fallback to `[item.image]`).
- Kept the lazy `useState(() => deriveItemForm(item, categories))` + conditional `key={editingItem?.id ?? "new"}` mount pattern → lint-safe, no `react-hooks/set-state-in-effect`.

### Save
- `save()` posts the full payload: `name, tagline, shortDescription, description, price, image (images[0] ?? null), images (array), categoryId, available, veg, spice, featured, chefRecommended, ingredients (array), allergens (array), servingSize`.
- Kept `apiPost("/api/menu", payload)` for create and `apiPatch(`/api/menu/${item.id}`, payload)` for edit. The API serialises arrays to JSON and auto-syncs `image` from `images[0]`.
- Footer save button disabled via a derived `canSave` (name + price + category set, not saving).

### Imports
- Added: `useRef` (shared file input), lucide `Upload, X, ChevronLeft, ChevronRight, ChefHat, Link as LinkIcon, AlertTriangle`.
- Dropped: `ImageUploader` (replaced by custom `MultiImageUploader`).

## Lint
`cd /home/z/my-project && bun run lint` → **0 errors, 0 warnings** (exit 0).
No `react-hooks/set-state-in-effect` violations (only the existing fetch-on-mount `useEffect`
with `setState` inside `.then()`, which is allowed). No unused imports.

## Notes
- Dev server untouched (already running on 3000). No build run.
- Only `src/components/admin/AdminMenu.tsx` was modified — the admin design system, API
  routes, types, and all other files are untouched.
- The full Task 5 record has also been appended to `/home/z/my-project/worklog.md`.
