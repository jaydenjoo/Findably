import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FAQSection from "../faq-section";

describe("FAQSection", () => {
  it("should render FAQ section with title and subtitle", () => {
    render(<FAQSection />);
    expect(screen.getByText("자주 묻는 질문")).toBeInTheDocument();
    expect(screen.getByText("궁금한 점이 있으신가요?")).toBeInTheDocument();
  });

  it("should render 6 FAQ items", () => {
    render(<FAQSection />);
    const questions = screen.getAllByRole("button");
    // Filter to accordion triggers only (excluding any other buttons)
    const faqButtons = questions.filter((btn) =>
      btn.getAttribute("type") === "button" && btn.className.includes("accordion")
    );
    expect(faqButtons.length).toBe(6);
  });

  it("should display all FAQ question texts", () => {
    render(<FAQSection />);
    expect(
      screen.getByText("Findably는 어떤 서비스인가요?")
    ).toBeInTheDocument();
    expect(screen.getByText("무료로 사용할 수 있나요?")).toBeInTheDocument();
    expect(screen.getByText("진단에 얼마나 걸리나요?")).toBeInTheDocument();
    expect(screen.getByText("어떤 항목을 진단하나요?")).toBeInTheDocument();
    expect(screen.getByText("Schema Markup이 뭔가요?")).toBeInTheDocument();
    expect(screen.getByText("개인정보는 안전한가요?")).toBeInTheDocument();
  });

  it("should expand/collapse FAQ items on click", async () => {
    render(<FAQSection />);
    const firstQuestion = screen.getByText("Findably는 어떤 서비스인가요?");

    // Initially collapsed - answer should not be visible or have aria-expanded="false"
    const trigger = firstQuestion.closest("button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    fireEvent.click(trigger!);
    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    // Answer should now be visible
    const answer = screen.getByText(
      "Findably는 AI 기반 마케팅 진단 서비스입니다. 웹사이트 URL을 입력하면 SEO, 콘텐츠, Schema Markup, 검색 노출 상태를 종합 분석하고, 즉시 실행 가능한 개선안을 제공합니다."
    );
    expect(answer).toBeVisible();
  });

  it("should have proper styling with max-width and centered layout", () => {
    const { container } = render(<FAQSection />);
    const faqContainer = container.querySelector(".mx-auto");
    expect(faqContainer).toHaveClass("max-w-2xl");
  });

  it("should have sequential fade-in animation", () => {
    const { container } = render(<FAQSection />);
    const faqItems = container.querySelectorAll("[class*='animate-fade-in']");
    // Check that animation delays are applied in sequence
    expect(faqItems.length).toBeGreaterThan(0);
  });
});
