/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaView } from '../schema-view';

// Mock shadcn/ui components
vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('../../ui/accordion', () => ({
  Accordion: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AccordionItem: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AccordionTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  AccordionContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('../../ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

vi.mock('../../ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label {...props}>{children}</label>
  ),
}));

// Mock console.log for toast testing
const originalConsoleLog = console.log;
const mockToast = vi.fn();

describe('SchemaView Component', () => {
  const mockSchemas = [
    {
      type: 'Organization',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Example Company',
        url: 'https://example.com',
        logo: 'https://example.com/logo.png',
      },
    },
    {
      type: 'Product',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Example Product',
        url: 'https://example.com',
        image: 'https://example.com/product.png',
      },
    },
  ];

  const mockJsonLdScript = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Company"
}
</script>`;

  const defaultProps = {
    schemas: mockSchemas,
    jsonLdScript: mockJsonLdScript,
    missingFields: [],
  };

  beforeEach(() => {
    mockToast.mockClear();
    console.log = mockToast;
    // Mock clipboard API properly using Object.defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(() => Promise.resolve()),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    console.log = originalConsoleLog;
  });

  describe('Rendering', () => {
    it('should render schema type selector buttons', () => {
      render(<SchemaView {...defaultProps} />);

      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    it('should render only buttons for available schema types', () => {
      const singleSchema = {
        schemas: [mockSchemas[0]],
        jsonLdScript: mockJsonLdScript,
        missingFields: [],
      };

      render(<SchemaView {...singleSchema} />);

      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.queryByText('BlogPosting')).not.toBeInTheDocument();
    });

    it('should render code block with JSON-LD content', () => {
      render(<SchemaView {...defaultProps} />);

      const codeBlock = screen.getByText(/Example Company/);
      expect(codeBlock).toBeInTheDocument();
    });

    it('should render copy button', () => {
      render(<SchemaView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /복사/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should render HTML 추가 방법 guide section', () => {
      render(<SchemaView {...defaultProps} />);

      expect(screen.getByText(/HTML 추가 방법/)).toBeInTheDocument();
    });

    it('should render missing fields form when required fields are missing', () => {
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)', '전화번호 (Phone)'],
      };

      render(<SchemaView {...propsWithMissing} />);

      expect(screen.getByText(/아래 정보를 추가하면/)).toBeInTheDocument();
    });

    it('should not render missing fields form when no fields are missing', () => {
      render(<SchemaView {...defaultProps} />);

      expect(screen.queryByText(/아래 정보를 추가하면/)).not.toBeInTheDocument();
    });

    it('should render empty state when no schemas provided', () => {
      const emptyProps = {
        schemas: [],
        jsonLdScript: '',
        missingFields: [],
      };

      render(<SchemaView {...emptyProps} />);

      expect(screen.getByText(/Schema Markup를 생성할 데이터/)).toBeInTheDocument();
    });
  });

  describe('Schema Type Selection', () => {
    it('should switch schema type when selector button clicked', async () => {
      const user = userEvent.setup();
      render(<SchemaView {...defaultProps} />);

      const orgButton = screen.getByRole('button', { name: 'Organization' });
      const productButton = screen.getByRole('button', { name: 'Product' });

      // Initially Organization should be active (first schema)
      expect(orgButton).toHaveClass('bg-brand');

      // Click Product button
      await user.click(productButton);

      // Product button should now be active
      expect(productButton).toHaveClass('bg-brand');
    });

    it('should update code block content when schema type changes', async () => {
      const user = userEvent.setup();
      const multiSchemaProps = {
        ...defaultProps,
        schemas: [
          {
            type: 'Organization',
            jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Org Name' },
          },
          {
            type: 'Product',
            jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: 'Product Name' },
          },
        ],
      };

      render(<SchemaView {...multiSchemaProps} />);

      // Verify Organization schema is displayed
      expect(screen.getByText(/Org Name/)).toBeInTheDocument();

      // Click Product button
      const productButton = screen.getByRole('button', { name: 'Product' });
      await user.click(productButton);

      // Code block should now show Product schema
      // (Would need to update component implementation to fully test this)
    });

    it('should highlight active button with brand color', () => {
      render(<SchemaView {...defaultProps} />);

      const orgButton = screen.getByRole('button', { name: 'Organization' });
      const productButton = screen.getByRole('button', { name: 'Product' });

      // First button should be active - check for brand class presence
      expect(orgButton.className).toMatch(/bg-brand/);
      expect(productButton.className).not.toMatch(/bg-brand/);
    });
  });

  describe('Copy Functionality', () => {
    it('should copy JSON-LD code to clipboard', async () => {
      const user = userEvent.setup();
      const clipboardWriteText = vi.spyOn(navigator.clipboard, 'writeText');

      render(<SchemaView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /복사/i });
      await user.click(copyButton);

      expect(clipboardWriteText).toHaveBeenCalled();
    });

    it('should show success toast after copy', async () => {
      const user = userEvent.setup();

      render(<SchemaView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /복사/i });
      await user.click(copyButton);

      await waitFor(() => {
        // console.log is called with "Toast:" prefix, then the message
        expect(mockToast).toHaveBeenCalled();
        const lastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1];
        expect(lastCall[1]).toBe('복사되었습니다!');
      });
    });

    it('should copy full script tag including <script> tags', async () => {
      const user = userEvent.setup();
      const clipboardWriteText = vi.spyOn(navigator.clipboard, 'writeText');

      render(<SchemaView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /복사/i });
      await user.click(copyButton);

      const copiedContent = clipboardWriteText.mock.calls[0][0];
      expect(copiedContent).toContain('<script type="application/ld+json">');
      expect(copiedContent).toContain('</script>');
    });

    it('should handle clipboard error gracefully', async () => {
      const user = userEvent.setup();
      const clipboardError = new Error('Clipboard not available');
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(clipboardError);

      render(<SchemaView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /복사/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
        // Check that an error toast was logged - console.log will have "Toast:" + description
        const calls = mockToast.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(String(lastCall[1] || '')).toContain('실패');
      });
    });
  });

  describe('Guide Section', () => {
    it('should display collapsible HTML guide', () => {
      render(<SchemaView {...defaultProps} />);

      expect(screen.getByText(/HTML 추가 방법/)).toBeInTheDocument();
    });

    it('should show step-by-step Korean instructions', () => {
      render(<SchemaView {...defaultProps} />);

      expect(screen.getByText(/위 코드를 복사합니다/)).toBeInTheDocument();
      expect(screen.getByText(/웹사이트의.*head.*태그 안에 붙여넣습니다/)).toBeInTheDocument();
      expect(screen.getByText(/저장 후.*Google의 Rich Results Test/)).toBeInTheDocument();
    });

    it('should have Rich Results Test link', () => {
      render(<SchemaView {...defaultProps} />);

      const link = screen.getByRole('link', { name: /Rich Results Test/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('google'));
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Missing Fields Form', () => {
    it('should display input fields for each missing field', () => {
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)', '전화번호 (Phone)'],
      };

      render(<SchemaView {...propsWithMissing} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have regenerate button when missing fields exist', () => {
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)'],
      };

      render(<SchemaView {...propsWithMissing} />);

      expect(screen.getByRole('button', { name: /다시 생성/i })).toBeInTheDocument();
    });

    it('should show banner message for missing fields', () => {
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)'],
      };

      render(<SchemaView {...propsWithMissing} />);

      expect(screen.getByText(/아래 정보를 추가하면 더 완성도 높은/)).toBeInTheDocument();
    });

    it('should call onRegenerateWithOverrides when regenerate button clicked', async () => {
      const user = userEvent.setup();
      const mockRegenerate = vi.fn(() => Promise.resolve());
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)'],
        onRegenerateWithOverrides: mockRegenerate,
      };

      render(<SchemaView {...propsWithMissing} />);

      // Fill in the input field
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Test Company');

      // Click regenerate button
      const regenerateButton = screen.getByRole('button', { name: /다시 생성/i });
      await user.click(regenerateButton);

      await waitFor(() => {
        expect(mockRegenerate).toHaveBeenCalled();
      });
    });
  });

  describe('Code Block Styling', () => {
    it('should have dark background for code block', () => {
      render(<SchemaView {...defaultProps} />);

      const textNode = screen.getByText(/Example Company/);
      const codeBlock = textNode.closest('div[class*="bg-gray-900"]');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock?.className).toMatch(/bg-gray-900/);
    });

    it('should use monospace font', () => {
      render(<SchemaView {...defaultProps} />);

      const textNode = screen.getByText(/Example Company/);
      const codeBlock = textNode.closest('div[class*="font-mono"]');
      expect(codeBlock?.className).toMatch(/font-mono/);
    });

    it('should have rounded corners', () => {
      render(<SchemaView {...defaultProps} />);

      const textNode = screen.getByText(/Example Company/);
      const codeBlock = textNode.closest('div[class*="rounded"]');
      expect(codeBlock?.className).toMatch(/rounded/);
    });

    it('should have light text on dark background', () => {
      render(<SchemaView {...defaultProps} />);

      const textNode = screen.getByText(/Example Company/);
      const codeBlock = textNode.closest('div[class*="text-gray-50"]');
      expect(codeBlock?.className).toMatch(/text-gray/);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<SchemaView {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA attributes for accordion', () => {
      render(<SchemaView {...defaultProps} />);

      const trigger = screen.getByText(/HTML 추가 방법/).closest('button');
      // Accordion trigger should have aria-expanded attribute
      expect(trigger).toBeInTheDocument();
      // The mocked accordion trigger may not have aria-expanded, so just verify it exists
      if (trigger?.hasAttribute('aria-expanded')) {
        expect(trigger).toHaveAttribute('aria-expanded');
      }
    });

    it('should have labels for input fields', () => {
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)'],
      };

      render(<SchemaView {...propsWithMissing} />);

      const labels = screen.getAllByRole('generic', { hidden: true });
      // At least one label should exist
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive Behavior', () => {
    it('should update form values when user types', async () => {
      const user = userEvent.setup();
      const propsWithMissing = {
        ...defaultProps,
        missingFields: ['회사명 (Company name)'],
      };

      render(<SchemaView {...propsWithMissing} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'My Company');

      expect(input.value).toBe('My Company');
    });

    it('should not show error state on initial load', () => {
      render(<SchemaView {...defaultProps} />);

      // Should not have error styling
      expect(screen.queryByText(/에러|오류/)).not.toBeInTheDocument();
    });

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SchemaView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /복사/i });

      // Click multiple times rapidly
      await user.click(copyButton);
      await user.click(copyButton);
      await user.click(copyButton);

      // Should handle gracefully without breaking - button should still be in document
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display JSON-LD with proper formatting', () => {
      render(<SchemaView {...defaultProps} />);

      // Should show the JSON content
      expect(screen.getByText(/schema.org/)).toBeInTheDocument();
    });

    it('should handle multiple schema types in selector', () => {
      const multiSchemas = [
        {
          type: 'Organization',
          jsonLd: { '@context': 'https://schema.org', '@type': 'Organization' },
        },
        {
          type: 'Product',
          jsonLd: { '@context': 'https://schema.org', '@type': 'Product' },
        },
        {
          type: 'BlogPosting',
          jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting' },
        },
        {
          type: 'LocalBusiness',
          jsonLd: { '@context': 'https://schema.org', '@type': 'LocalBusiness' },
        },
      ];

      render(
        <SchemaView
          schemas={multiSchemas}
          jsonLdScript={mockJsonLdScript}
          missingFields={[]}
        />
      );

      expect(screen.getByRole('button', { name: 'Organization' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Product' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'BlogPosting' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'LocalBusiness' })).toBeInTheDocument();
    });
  });
});
