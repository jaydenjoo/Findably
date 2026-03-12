import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getContrastRatio,
  meetsContrastStandard,
  focusElement,
  getFocusableElements,
  trapFocus,
  saveFocusAndRestore,
  isVisibleToScreenReader,
  getLoadingAriaLabel,
  getErrorAriaLabel,
  getFormStatusAriaLabel,
  handleKeyboardEvent,
  createAccessibleErrorMessage,
  createAccessibleSuccessMessage,
  rgbToHex,
  isLargeText,
} from '../helpers';

describe('Accessibility Helpers - Color Contrast', () => {
  it('should calculate contrast ratio between white and black', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('should calculate contrast ratio between black and white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('should calculate contrast ratio between gray-600 and white', () => {
    const ratio = getContrastRatio('#6c757d', '#ffffff');
    expect(ratio).toBeDefined();
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(21);
  });

  it('should handle 3-digit hex colors', () => {
    const ratio = getContrastRatio('#fff', '#000');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('should return null for invalid hex colors', () => {
    const ratio = getContrastRatio('#gggggg', '#ffffff');
    expect(ratio).toBeNull();
  });

  it('should return null for invalid color format', () => {
    const ratio = getContrastRatio('red', 'blue');
    expect(ratio).toBeNull();
  });

  it('should meet WCAG AA standard for white text on dark background', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    const meets = meetsContrastStandard(ratio!, 'AA', false);
    expect(meets).toBe(true);
  });

  it('should fail WCAG AA standard for insufficient contrast', () => {
    // Light gray on lighter gray
    const ratio = getContrastRatio('#cccccc', '#ffffff');
    const meets = meetsContrastStandard(ratio!, 'AA', false);
    expect(meets).toBe(false);
  });

  it('should allow 3:1 contrast for large text (WCAG AA)', () => {
    const ratio = 3.1;
    const meets = meetsContrastStandard(ratio, 'AA', true); // large text
    expect(meets).toBe(true);
  });

  it('should require 4.5:1 for normal text (WCAG AA)', () => {
    const ratio = 3.1;
    const meets = meetsContrastStandard(ratio, 'AA', false);
    expect(meets).toBe(false);
  });

  it('should require 7:1 for normal text (WCAG AAA)', () => {
    const ratio = 6.9;
    const meets = meetsContrastStandard(ratio, 'AAA', false);
    expect(meets).toBe(false);
  });

  it('should allow 4.5:1 for large text (WCAG AAA)', () => {
    const ratio = 4.5;
    const meets = meetsContrastStandard(ratio, 'AAA', true);
    expect(meets).toBe(true);
  });
});

describe('Accessibility Helpers - Focus Management', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should focus element by selector', () => {
    const button = document.createElement('button');
    button.id = 'test-button';
    container.appendChild(button);

    focusElement('#test-button');
    expect(document.activeElement).toBe(button);
  });

  it('should focus element by reference', () => {
    const button = document.createElement('button');
    container.appendChild(button);

    focusElement(button);
    expect(document.activeElement).toBe(button);
  });

  it('should get all focusable elements', () => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const input = document.createElement('input');
    const link = document.createElement('a');
    link.href = '#';

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(input);
    container.appendChild(link);

    const focusable = getFocusableElements(container);
    expect(focusable.length).toBe(4);
  });

  it('should exclude hidden elements from focusable list', () => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    button2.style.display = 'none';

    container.appendChild(button1);
    container.appendChild(button2);

    const focusable = getFocusableElements(container);
    expect(focusable.length).toBe(1);
    expect(focusable[0]).toBe(button1);
  });

  it('should exclude disabled elements from focusable list', () => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    button2.disabled = true;

    container.appendChild(button1);
    container.appendChild(button2);

    const focusable = getFocusableElements(container);
    expect(focusable.length).toBe(1);
    expect(focusable[0]).toBe(button1);
  });

  it('should trap focus and loop on Tab key', () => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const button3 = document.createElement('button');

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);

    button1.focus();
    expect(document.activeElement).toBe(button1);

    const cleanup = trapFocus(container);

    // Simulate Tab on last element
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    button3.focus();
    container.dispatchEvent(tabEvent);

    cleanup();
  });

  it('should handle Escape key in trapFocus', () => {
    const button = document.createElement('button');
    container.appendChild(button);

    const mockEscape = vi.fn();
    const cleanup = trapFocus(container, mockEscape);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    container.dispatchEvent(escapeEvent);

    expect(mockEscape).toHaveBeenCalled();
    cleanup();
  });

  it('should save and restore focus', () => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');

    container.appendChild(button1);
    container.appendChild(button2);

    button1.focus();
    expect(document.activeElement).toBe(button1);

    const restore = saveFocusAndRestore();

    button2.focus();
    expect(document.activeElement).toBe(button2);

    restore();
    expect(document.activeElement).toBe(button1);
  });
});

describe('Accessibility Helpers - Screen Reader Detection', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should detect visible element', () => {
    expect(isVisibleToScreenReader(element)).toBe(true);
  });

  it('should hide element with aria-hidden', () => {
    element.setAttribute('aria-hidden', 'true');
    expect(isVisibleToScreenReader(element)).toBe(false);
  });

  it('should hide element with display none', () => {
    element.style.display = 'none';
    expect(isVisibleToScreenReader(element)).toBe(false);
  });

  it('should hide element with visibility hidden', () => {
    element.style.visibility = 'hidden';
    expect(isVisibleToScreenReader(element)).toBe(false);
  });

  it('should recognize sr-only class as visible to screen readers', () => {
    element.className = 'sr-only';
    expect(isVisibleToScreenReader(element)).toBe(true);
  });
});

describe('Accessibility Helpers - ARIA Label Generation', () => {
  it('should generate loading ARIA label', () => {
    const label = getLoadingAriaLabel(1, 3, '크롤링 중');
    expect(label).toContain('진단 중');
    expect(label).toContain('크롤링 중');
    expect(label).toContain('33%');
  });

  it('should generate error ARIA label', () => {
    const label = getErrorAriaLabel('이메일', '올바른 이메일을 입력하세요');
    expect(label).toContain('이메일');
    expect(label).toContain('오류');
    expect(label).toContain('올바른 이메일');
  });

  it('should generate form status ARIA label for valid form', () => {
    const label = getFormStatusAriaLabel(true, 5, 5);
    expect(label).toContain('유효함');
    expect(label).toContain('올바릅니다');
  });

  it('should generate form status ARIA label for invalid form', () => {
    const label = getFormStatusAriaLabel(false, 5, 3);
    expect(label).toContain('오류');
    expect(label).toContain('3/5');
  });
});

describe('Accessibility Helpers - Keyboard Event Handling', () => {
  it('should call Enter callback on Enter key', () => {
    const enterCallback = vi.fn();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });

    handleKeyboardEvent(event as unknown as React.KeyboardEvent, {
      Enter: enterCallback,
    });

    expect(enterCallback).toHaveBeenCalled();
  });

  it('should call Space callback on Space key', () => {
    const spaceCallback = vi.fn();
    const event = new KeyboardEvent('keydown', { key: ' ' });

    handleKeyboardEvent(event as unknown as React.KeyboardEvent, {
      Space: spaceCallback,
    });

    expect(spaceCallback).toHaveBeenCalled();
  });

  it('should call Escape callback on Escape key', () => {
    const escapeCallback = vi.fn();
    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    handleKeyboardEvent(event as unknown as React.KeyboardEvent, {
      Escape: escapeCallback,
    });

    expect(escapeCallback).toHaveBeenCalled();
  });

  it('should call arrow key callbacks', () => {
    const upCallback = vi.fn();
    const downCallback = vi.fn();
    const leftCallback = vi.fn();
    const rightCallback = vi.fn();

    handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }) as unknown as React.KeyboardEvent, {
      ArrowUp: upCallback,
    });
    expect(upCallback).toHaveBeenCalled();

    handleKeyboardEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown' }) as unknown as React.KeyboardEvent,
      {
        ArrowDown: downCallback,
      }
    );
    expect(downCallback).toHaveBeenCalled();

    handleKeyboardEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft' }) as unknown as React.KeyboardEvent,
      {
        ArrowLeft: leftCallback,
      }
    );
    expect(leftCallback).toHaveBeenCalled();

    handleKeyboardEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight' }) as unknown as React.KeyboardEvent,
      {
        ArrowRight: rightCallback,
      }
    );
    expect(rightCallback).toHaveBeenCalled();
  });
});

describe('Accessibility Helpers - Message Creation', () => {
  it('should create accessible error message', () => {
    const msg = createAccessibleErrorMessage('입력 오류 발생');
    expect(msg.icon).toBe('⚠️');
    expect(msg.message).toBe('입력 오류 발생');
  });

  it('should create accessible error message with custom icon', () => {
    const msg = createAccessibleErrorMessage('입력 오류 발생', '❌');
    expect(msg.icon).toBe('❌');
    expect(msg.message).toBe('입력 오류 발생');
  });

  it('should create accessible success message', () => {
    const msg = createAccessibleSuccessMessage('성공적으로 저장됨');
    expect(msg.icon).toBe('✓');
    expect(msg.message).toBe('성공적으로 저장됨');
  });

  it('should create accessible success message with custom icon', () => {
    const msg = createAccessibleSuccessMessage('성공적으로 저장됨', '✅');
    expect(msg.icon).toBe('✅');
    expect(msg.message).toBe('성공적으로 저장됨');
  });
});

describe('Accessibility Helpers - Color Conversion', () => {
  it('should convert RGB to hex', () => {
    const hex = rgbToHex({ r: 255, g: 255, b: 255 });
    expect(hex).toBe('#ffffff');
  });

  it('should convert RGB to hex with leading zeros', () => {
    const hex = rgbToHex({ r: 0, g: 0, b: 0 });
    expect(hex).toBe('#000000');
  });

  it('should convert RGB to hex with mixed values', () => {
    const hex = rgbToHex({ r: 255, g: 0, b: 128 });
    expect(hex).toBe('#ff0080');
  });
});

describe('Accessibility Helpers - Text Size Detection', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should detect large text (18px or more)', () => {
    element.style.fontSize = '20px';
    expect(isLargeText(element)).toBe(true);
  });

  it('should detect small text (less than 18px)', () => {
    element.style.fontSize = '16px';
    expect(isLargeText(element)).toBe(false);
  });

  it('should detect bold large text (14px bold or more)', () => {
    element.style.fontSize = '14px';
    element.style.fontWeight = 'bold';
    expect(isLargeText(element)).toBe(true);
  });

  it('should detect bold text with numeric weight', () => {
    element.style.fontSize = '14px';
    element.style.fontWeight = '700';
    expect(isLargeText(element)).toBe(true);
  });

  it('should not detect regular 14px text as large', () => {
    element.style.fontSize = '14px';
    element.style.fontWeight = 'normal';
    expect(isLargeText(element)).toBe(false);
  });
});
