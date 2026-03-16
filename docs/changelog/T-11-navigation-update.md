# T-11: Navigation Updates — Sidebar & Mobile Menu

## Changes Made

### 1. Sidebar Component (`src/components/dashboard/Sidebar.tsx`)

- **Locked items are now clickable** — Changed from disabled UI to full `<Link>` navigation
- **Visual indicators for locked items**:
  - 70% opacity (`opacity-70`) to visually distinguish
  - Lock icon (🔒) from lucide-react
  - "PRO" badge with secondary variant
  - Tooltip on hover: "유료 결제 후 이용 가능합니다"
- **Active route highlighting** — Uses existing `isNavActive()` helper
  - Active: `bg-primary-50 font-semibold text-primary-700`
  - Inactive: `font-normal text-slate-600 hover:bg-slate-50`
  - Applied consistently to both locked and unlocked items
- **Responsive** — Hidden on < lg breakpoint (shows MobileMenu instead)

### 2. Mobile Menu Component (`src/components/dashboard/MobileMenu.tsx`)

- **Locked items are now clickable** — No disabled state, same navigation behavior as sidebar
- **Visual indicators for locked items**:
  - Same as sidebar: 70% opacity + Lock icon + PRO badge
  - No tooltip (not needed on mobile)
  - Updated `aria-label` to include "— PRO 전용"
- **Active route highlighting** — Same styles as sidebar
- **Menu closes after navigation** — `setOpen(false)` on all link clicks
- **Responsive** — Shows hamburger menu on < lg breakpoint

## Design Decisions

### Why Locked Items Are Clickable

- Per task requirement: "Clicking locked items should navigate to the page (BlurOverlay handles access control there)"
- This shifts access control responsibility to the destination page's BlurOverlay component
- Better UX: Users can see what content they're missing before being blocked
- Consistent with free trial patterns: "see before you buy"

### Visual Differentiation

- **Opacity-70**: Subtle visual hint of "limited" status without being jarring
- **Lock icon + PRO badge**: Clear, immediate visual signal
- **Tooltip**: Additional context (desktop only, respects space constraints)
- **Active state preservation**: Locked items show active state same as unlocked

### Accessibility

- `aria-label` properly describes locked items: `"실행 도구 — PRO 전용"`
- `aria-current="page"` on active links for screen readers
- Semantic `<nav>` and `<Link>` components
- All interactive elements keyboard accessible

## Testing Checklist

- [x] Active route highlighting works (tested logic flow)
- [x] Lock icon + PRO badge render on locked items
- [x] Locked items are navigable (all items use `<Link>`)
- [x] Sidebar responsive: hidden on < lg
- [x] MobileMenu responsive: hamburger on < lg
- [x] No ESLint errors
- [x] TypeScript compilation passes
- [x] Tooltip works on sidebar locked items
- [x] Active state applied correctly to both locked/unlocked items

## Files Modified

1. `src/components/dashboard/Sidebar.tsx` — Main desktop sidebar
2. `src/components/dashboard/MobileMenu.tsx` — Mobile hamburger menu

## Related Files (Not Modified)

- `src/config/navigation.ts` — Navigation config with `locked` property (pre-existing)
- `src/components/shared/BlurOverlay.tsx` — Access control at destination page (existing)
- `src/app/(dashboard)/layout.tsx` — Dashboard layout integration (existing)
