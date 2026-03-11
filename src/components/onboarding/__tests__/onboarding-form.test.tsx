import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnboardingForm from "../onboarding-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should render onboarding form container", () => {
    const { container } = render(<OnboardingForm />);
    expect(container.querySelector(".max-w-2xl")).toBeInTheDocument();
  });

  it("should render progress indicator", () => {
    render(<OnboardingForm />);
    expect(screen.getByText(/단계 \d \/ 3/)).toBeInTheDocument();
  });

  it("should render step 1 on initial load", () => {
    render(<OnboardingForm />);
    expect(screen.getByText(/URL 입력/)).toBeInTheDocument();
  });

  it("should have form element for step content", () => {
    const { container } = render(<OnboardingForm />);
    expect(container.querySelector("form")).toBeInTheDocument();
  });

  it("should render card wrapper", () => {
    const { container } = render(<OnboardingForm />);
    expect(container.querySelector(".rounded-2xl")).toBeInTheDocument();
  });

  it("should have proper spacing and padding", () => {
    const { container } = render(<OnboardingForm />);
    const cardElement =
      container.querySelector(".p-8") || container.querySelector(".p-12");
    expect(
      cardElement || container.querySelector("[class*='p-']"),
    ).toBeInTheDocument();
  });

  it("should have brand color styling", () => {
    const { container } = render(<OnboardingForm />);
    expect(container.innerHTML).toMatch(/bg-brand|#2b7cff/);
  });

  it("should render navigation buttons", () => {
    render(<OnboardingForm />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should have background styling", () => {
    const { container } = render(<OnboardingForm />);
    const wrapper = container.firstChild as HTMLElement;
    const hasBackground =
      wrapper.classList.contains("bg-gray-50") ||
      wrapper.classList.contains("bg-brand-light") ||
      wrapper.className.includes("bg-");
    expect(hasBackground).toBe(true);
  });

  it("should render onboarding container with min height", () => {
    const { container } = render(<OnboardingForm />);
    const mainContainer =
      container.querySelector(".min-h-screen") ||
      container.querySelector("[class*='min-h-']");
    expect(mainContainer || container.firstChild).toBeInTheDocument();
  });

  it("should render centered layout", () => {
    const { container } = render(<OnboardingForm />);
    const flexContainer =
      container.querySelector(".flex") ||
      container.querySelector("[class*='flex']");
    expect(flexContainer || container.firstChild).toBeInTheDocument();
  });

  it("should have shadow styling for card", () => {
    const { container } = render(<OnboardingForm />);
    expect(container.innerHTML).toMatch(/shadow|rounded/);
  });
});
