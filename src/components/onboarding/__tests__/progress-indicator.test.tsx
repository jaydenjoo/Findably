import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProgressIndicator from "../progress-indicator";

describe("ProgressIndicator", () => {
  it("should render progress indicator with step 1", () => {
    render(<ProgressIndicator currentStep={1} totalSteps={3} />);
    expect(screen.getByText("단계 1 / 3")).toBeInTheDocument();
  });

  it("should render progress indicator with step 2", () => {
    render(<ProgressIndicator currentStep={2} totalSteps={3} />);
    expect(screen.getByText("단계 2 / 3")).toBeInTheDocument();
  });

  it("should render progress indicator with step 3", () => {
    render(<ProgressIndicator currentStep={3} totalSteps={3} />);
    expect(screen.getByText("단계 3 / 3")).toBeInTheDocument();
  });

  it("should render visual progress bar", () => {
    const { container } = render(<ProgressIndicator currentStep={2} totalSteps={3} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("should set progress bar to 33% for step 1", () => {
    const { container } = render(<ProgressIndicator currentStep={1} totalSteps={3} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute("aria-valuenow", "33");
  });

  it("should set progress bar to 67% for step 2", () => {
    const { container } = render(<ProgressIndicator currentStep={2} totalSteps={3} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute("aria-valuenow", "67");
  });

  it("should set progress bar to 100% for step 3", () => {
    const { container } = render(<ProgressIndicator currentStep={3} totalSteps={3} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("should display step labels", () => {
    render(<ProgressIndicator currentStep={1} totalSteps={3} />);
    expect(screen.getByText("URL 입력")).toBeInTheDocument();
    expect(screen.getByText("업종 선택")).toBeInTheDocument();
    expect(screen.getByText("규모 선택")).toBeInTheDocument();
  });

  it("should have brand color on progress bar fill", () => {
    const { container } = render(<ProgressIndicator currentStep={2} totalSteps={3} />);
    const fillElement = container.querySelector(".bg-brand");
    expect(fillElement).toBeInTheDocument();
  });

  it("should have gray background for unfilled progress", () => {
    const { container } = render(<ProgressIndicator currentStep={1} totalSteps={3} />);
    const backgroundElement = container.querySelector(".bg-gray-200");
    expect(backgroundElement).toBeInTheDocument();
  });

  it("should render step indicator container with proper styling", () => {
    const { container } = render(<ProgressIndicator currentStep={1} totalSteps={3} />);
    const stepIndicator = container.querySelector(".flex");
    expect(stepIndicator).toBeInTheDocument();
  });

  it("should render all three step labels in order", () => {
    const { container } = render(<ProgressIndicator currentStep={2} totalSteps={3} />);
    const text = container.textContent;
    expect(text).toContain("URL 입력");
    expect(text).toContain("업종 선택");
    expect(text).toContain("규모 선택");
  });

  it("should have proper accessibility attributes", () => {
    const { container } = render(<ProgressIndicator currentStep={1} totalSteps={3} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });
});
