/**
 * Accessibility (a11y) Helper Functions
 *
 * Provides utility functions for WCAG 2.1 AA compliance:
 * - Color contrast checking
 * - Focus management
 * - ARIA attribute generation
 * - Keyboard event handling
 */

/**
 * Calculate relative luminance for color contrast ratio
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Relative luminance (0-1)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((x) => {
    const val = x / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color string to RGB values
 * @param hex Hex color string (e.g., "#ffffff", "fff", "#fff")
 * @returns RGB object or null if invalid
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').toLowerCase();

  if (cleaned.length === 3) {
    const [r, g, b] = cleaned.split('').map((x) => parseInt(x + x, 16));
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  return null;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * @param color1 Hex color string
 * @param color2 Hex color string
 * @returns Contrast ratio (1-21), or null if colors invalid
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const c1 = parseHexColor(color1);
  const c2 = parseHexColor(color2);

  if (!c1 || !c2) return null;

  const lum1 = getLuminance(c1.r, c1.g, c1.b);
  const lum2 = getLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param ratio Contrast ratio
 * @param level "AA" (4.5:1 for normal, 3:1 for large) or "AAA" (7:1 for normal, 4.5:1 for large)
 * @param isLargeText Whether text is >= 18px or >= 14px bold
 * @returns true if meets standard
 */
export function meetsContrastStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
  // AAA
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Manage focus on an element
 * @param selector CSS selector or element
 * @param options Focus options
 */
export function focusElement(
  selector: string | HTMLElement,
  options?: FocusOptions
): void {
  const element =
    typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector;

  if (element) {
    element.focus(options);
  }
}

/**
 * Get all focusable elements within a container
 * @param container Container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => {
      // Check if element is visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }
  );
}

/**
 * Trap focus within a modal/dialog
 * @param container Modal container element
 * @param onEscape Callback for Escape key
 * @returns Cleanup function
 */
export function trapFocus(
  container: HTMLElement,
  onEscape?: () => void
): () => void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      onEscape?.();
    }

    if (e.key !== 'Tab') {
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 * @returns Function to restore focus
 */
export function saveFocusAndRestore(): () => void {
  const previousElement = document.activeElement as HTMLElement;

  return () => {
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  };
}

/**
 * Check if element is visible to screen readers
 * @param element Element to check
 * @returns true if visible, false if hidden
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  // Check display: none
  if (style.display === 'none') {
    return false;
  }

  // Check visibility: hidden
  if (style.visibility === 'hidden') {
    return false;
  }

  // Check sr-only class (visually hidden but accessible)
  if (element.className.includes('sr-only')) {
    return true; // sr-only is specifically for screen readers
  }

  return true;
}

/**
 * Generate ARIA label for loading/processing state
 * @param currentStep Current step number
 * @param totalSteps Total number of steps
 * @param currentStepLabel Label for current step
 * @returns ARIA label string
 */
export function getLoadingAriaLabel(
  currentStep: number,
  totalSteps: number,
  currentStepLabel: string
): string {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  return `진단 중... (${currentStepLabel}, ${percentage}%)`;
}

/**
 * Generate ARIA label for error message
 * @param fieldName Name of the field with error
 * @param errorMessage Error message
 * @returns ARIA label string
 */
export function getErrorAriaLabel(fieldName: string, errorMessage: string): string {
  return `${fieldName} 오류: ${errorMessage}`;
}

/**
 * Generate ARIA label for form submission status
 * @param isValid Whether form is valid
 * @param fieldCount Number of fields
 * @param validCount Number of valid fields
 * @returns ARIA label string
 */
export function getFormStatusAriaLabel(isValid: boolean, fieldCount: number, validCount: number): string {
  if (isValid) {
    return `양식 유효함. 모든 필드가 올바릅니다.`;
  }
  return `양식에 오류가 있습니다. ${validCount}/${fieldCount} 필드가 올바릅니다.`;
}

/**
 * Handle keyboard event for custom components
 * @param e Keyboard event
 * @param callbacks Object with callback functions for keys
 */
export function handleKeyboardEvent(
  e: React.KeyboardEvent,
  callbacks: {
    Enter?: () => void;
    Space?: () => void;
    Escape?: () => void;
    ArrowUp?: () => void;
    ArrowDown?: () => void;
    ArrowLeft?: () => void;
    ArrowRight?: () => void;
  }
): void {
  const keyMap: Record<string, keyof typeof callbacks> = {
    Enter: 'Enter',
    ' ': 'Space',
    Escape: 'Escape',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
  };

  const handlerKey = keyMap[e.key];
  if (handlerKey && callbacks[handlerKey]) {
    e.preventDefault();
    callbacks[handlerKey]?.();
  }
}

/**
 * Generate readable error message that combines text + color/icon
 * @param message Error message text
 * @param icon Icon component or emoji
 * @returns Object with message and icon
 */
export function createAccessibleErrorMessage(
  message: string,
  icon: string = '⚠️'
): {
  icon: string;
  message: string;
} {
  return {
    icon,
    message,
  };
}

/**
 * Generate readable success message with icon
 * @param message Success message text
 * @param icon Icon component or emoji
 * @returns Object with message and icon
 */
export function createAccessibleSuccessMessage(
  message: string,
  icon: string = '✓'
): {
  icon: string;
  message: string;
} {
  return {
    icon,
    message,
  };
}

/**
 * Convert color object to hex string for comparison
 * @param color Color object with r, g, b properties
 * @returns Hex color string
 */
export function rgbToHex(color: { r: number; g: number; b: number }): string {
  return (
    '#' +
    [color.r, color.g, color.b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Check if text should use large text WCAG standards (≥18px or ≥14px bold)
 * @param element Element to check
 * @returns true if element uses large text
 */
export function isLargeText(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const fontSize = parseFloat(style.fontSize);
  const fontWeight = style.fontWeight;

  const isLargeFontSize = fontSize >= 18;
  const isBoldLargeFont = fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700);

  return isLargeFontSize || isBoldLargeFont;
}
