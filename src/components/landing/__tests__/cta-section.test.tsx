import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CTASection from "../cta-section";

describe("CTASection", () => {
  it("should render CTA section with dark background", () => {
    const { container } = render(<CTASection />);
    const section = container.querySelector("section");
    expect(section).toHaveClass("bg-gray-900");
  });

  it("should display headline", () => {
    render(<CTASection />);
    expect(
      screen.getByText("지금 바로 무료 진단을 시작하세요")
    ).toBeInTheDocument();
  });

  it("should display subtitle", () => {
    render(<CTASection />);
    expect(
      screen.getByText(
        "URL만 입력하면 3분 안에 마케팅 진단 결과를 받아볼 수 있습니다"
      )
    ).toBeInTheDocument();
  });

  it("should render two CTA buttons", () => {
    render(<CTASection />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("should have primary button with correct text and styling", () => {
    render(<CTASection />);
    const primaryButton = screen.getByText("무료 진단 시작하기");
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton.closest("button")).toHaveClass("bg-white");
  });

  it("should have secondary button for pricing", () => {
    render(<CTASection />);
    const secondaryButton = screen.getByText("가격 플랜 보기");
    expect(secondaryButton).toBeInTheDocument();
  });

  it("should have rounded button styling", () => {
    render(<CTASection />);
    const primaryBtn = screen.getByText("무료 진단 시작하기").closest("button");
    expect(primaryBtn).toHaveClass("rounded-xl");
  });

  it("should contain brand blob decoration", () => {
    const { container } = render(<CTASection />);
    // Blob should exist (either as element or through inline style)
    expect(container.innerHTML).toContain("radial-gradient");
  });

  it("should have proper text color - white for dark section", () => {
    render(<CTASection />);
    const headline = screen.getByText("지금 바로 무료 진단을 시작하세요");
    expect(headline).toHaveClass("text-white");
  });

  it("should have subtitle in gray-300", () => {
    render(<CTASection />);
    const subtitle = screen.getByText(
      "URL만 입력하면 3분 안에 마케팅 진단 결과를 받아볼 수 있습니다"
    );
    expect(subtitle).toHaveClass("text-gray-300");
  });
});
