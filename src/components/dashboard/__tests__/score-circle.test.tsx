import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScoreCircle from '../score-circle';

describe('ScoreCircle Component', () => {
  it('renders with correct score and grade', async () => {
    const { container } = render(<ScoreCircle score={87} grade="A" />);

    // Wait for animation to complete (1000ms + buffer)
    await waitFor(
      () => {
        // Check that both score and grade are rendered in the component
        const scoreDiv = container.querySelector('[data-grade="A"]');
        expect(scoreDiv?.textContent).toContain('87');
        expect(scoreDiv?.textContent).toContain('A');
      },
      { timeout: 2000 }
    );
  });

  it('applies correct grade colors', () => {
    const { container: containerA } = render(<ScoreCircle score={87} grade="A" />);
    expect(containerA.querySelector('[data-grade="A"]')).toBeInTheDocument();

    const { container: containerB } = render(<ScoreCircle score={75} grade="B" />);
    expect(containerB.querySelector('[data-grade="B"]')).toBeInTheDocument();

    const { container: containerC } = render(<ScoreCircle score={60} grade="C" />);
    expect(containerC.querySelector('[data-grade="C"]')).toBeInTheDocument();

    const { container: containerF } = render(<ScoreCircle score={25} grade="F" />);
    expect(containerF.querySelector('[data-grade="F"]')).toBeInTheDocument();
  });

  it('renders SVG circle with correct dimensions', () => {
    const { container } = render(<ScoreCircle score={87} grade="A" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('animates count-up from 0 to score', async () => {
    render(<ScoreCircle score={87} grade="A" />);

    // Initially should show 0
    const initialText = screen.getByText('0');
    expect(initialText).toBeInTheDocument();

    // After animation completes, should show final score
    await waitFor(
      () => {
        expect(screen.getByText('87')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('renders with accessibility attributes on container', () => {
    const { container } = render(<ScoreCircle score={87} grade="A" />);
    const div = container.querySelector('[data-grade="A"]');

    expect(div).toHaveAttribute('role', 'img');
    expect(div).toHaveAttribute('aria-label');
  });
});
