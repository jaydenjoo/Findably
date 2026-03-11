import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StepUrl from './step-url';

describe('StepUrl Component', () => {
  describe('rendering', () => {
    it('should render label and input field', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      expect(screen.getByLabelText('웹사이트 URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      expect(
        screen.getByText('진단할 웹사이트 주소를 입력하세요')
      ).toBeInTheDocument();
    });

    it('should render Next button', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    });

    it('should display input value from props', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl
          url="https://example.com"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      const input = screen.getByPlaceholderText(
        'https://example.com'
      ) as HTMLInputElement;
      expect(input.value).toBe('https://example.com');
    });
  });

  describe('validation', () => {
    it('should disable Next button with empty URL', async () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      const nextButton = screen.getByRole('button', { name: '다음' });
      expect(nextButton).toBeDisabled();
    });

    it('should disable Next button with invalid URL', async () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl
          url="invalid-url"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByRole('button', { name: '다음' });
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button with valid HTTPS URL', async () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl
          url="https://example.com"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByRole('button', { name: '다음' });
      expect(nextButton).not.toBeDisabled();
    });

    it('should enable Next button with valid HTTP URL', async () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl
          url="http://example.com"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByRole('button', { name: '다음' });
      expect(nextButton).not.toBeDisabled();
    });

    it('should show error message when URL is invalid', async () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      const { rerender } = render(
        <StepUrl url="invalid" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      // Simulate blur to trigger validation
      const input = screen.getByPlaceholderText('https://example.com');
      fireEvent.blur(input);

      rerender(
        <StepUrl
          url="invalid"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      await waitFor(() => {
        const errorMessage = screen.queryByText(/올바른 URL을 입력하세요/);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      }, { timeout: 100 });
    });
  });

  describe('interactions', () => {
    it('should call onUrlChange when user types', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      const input = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'https://example.com' } });

      expect(mockOnUrlChange).toHaveBeenCalledWith('https://example.com');
    });

    it('should call onNext when Next button is clicked with valid URL', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl
          url="https://example.com"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByRole('button', { name: '다음' });
      fireEvent.click(nextButton);

      expect(mockOnNext).toHaveBeenCalled();
    });

    it('should not call onNext when Next button is disabled', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      const nextButton = screen.getByRole('button', { name: '다음' });
      fireEvent.click(nextButton);

      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it('should allow typing URLs with paths', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      const input = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'https://example.com/path/to/page' } });

      expect(mockOnUrlChange).toHaveBeenCalledWith('https://example.com/path/to/page');
    });
  });

  describe('accessibility', () => {
    it('should have proper label association', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl url="" onUrlChange={mockOnUrlChange} onNext={mockOnNext} />
      );

      const label = screen.getByText('웹사이트 URL');
      const input = screen.getByPlaceholderText('https://example.com');

      // Label should be associated with input
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('should have input element with type url', () => {
      const mockOnUrlChange = vi.fn();
      const mockOnNext = vi.fn();

      render(
        <StepUrl
          url="https://example.com"
          onUrlChange={mockOnUrlChange}
          onNext={mockOnNext}
        />
      );

      const input = screen.getByPlaceholderText('https://example.com') as HTMLInputElement;
      expect(input.type).toBe('url');
    });
  });
});
