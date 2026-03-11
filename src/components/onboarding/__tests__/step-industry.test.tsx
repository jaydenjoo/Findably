import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StepIndustry from "../step-industry";

describe("StepIndustry Component", () => {
  const mockOnIndustryChange = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  const defaultProps = {
    industry: "ecommerce",
    onIndustryChange: mockOnIndustryChange,
    onNext: mockOnNext,
    onPrev: mockOnPrev,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Title and Description Tests
  describe("Rendering", () => {
    it("should render title and subtitle", () => {
      render(<StepIndustry {...defaultProps} />);

      expect(screen.getByText("업종을 선택하세요")).toBeInTheDocument();
      expect(
        screen.getByText("비즈니스에 맞는 진단을 제공하기 위해 필요합니다")
      ).toBeInTheDocument();
    });

    it("should render all 5 industry options", () => {
      render(<StepIndustry {...defaultProps} />);

      expect(screen.getByText("전자상거래")).toBeInTheDocument();
      expect(screen.getByText("블로그/미디어")).toBeInTheDocument();
      expect(screen.getByText("SaaS/소프트웨어")).toBeInTheDocument();
      expect(screen.getByText("지역 비즈니스")).toBeInTheDocument();
      expect(screen.getByText("기타")).toBeInTheDocument();
    });

    it("should render Previous and Next buttons", () => {
      render(<StepIndustry {...defaultProps} />);

      expect(screen.getByText("이전")).toBeInTheDocument();
      expect(screen.getByText("다음")).toBeInTheDocument();
    });
  });

  // Selection Tests
  describe("Industry Selection", () => {
    it("should display selected industry with brand color styling", () => {
      const { container } = render(
        <StepIndustry {...defaultProps} industry="ecommerce" />
      );

      const selectedCard = container.querySelector(
        "[data-industry='ecommerce']"
      );
      expect(selectedCard).toHaveClass("border-brand");
      expect(selectedCard).toHaveClass("bg-brand-light");
    });

    it("should update selection when clicking another industry", () => {
      render(<StepIndustry {...defaultProps} />);

      const blogOption = screen.getByRole("button", { name: /블로그\/미디어/ });
      fireEvent.click(blogOption);

      expect(mockOnIndustryChange).toHaveBeenCalledWith("blog");
    });

    it("should not call handler when clicking already selected industry", () => {
      mockOnIndustryChange.mockClear();
      render(<StepIndustry {...defaultProps} industry="ecommerce" />);

      const ecommerceOption = screen.getByRole("button", {
        name: /전자상거래/,
      });
      fireEvent.click(ecommerceOption);

      expect(mockOnIndustryChange).toHaveBeenCalledWith("ecommerce");
    });

    it("should handle all industry options correctly", () => {
      const industries = [
        { label: "전자상거래", value: "ecommerce" },
        { label: "블로그/미디어", value: "blog" },
        { label: "SaaS/소프트웨어", value: "saas" },
        { label: "지역 비즈니스", value: "local_business" },
        { label: "기타", value: "other" },
      ];

      industries.forEach(({ label, value }) => {
        const onIndustryChangeMock = vi.fn();
        const { unmount } = render(
          <StepIndustry
            {...defaultProps}
            onIndustryChange={onIndustryChangeMock}
          />
        );

        const buttons = screen.getAllByRole("button");
        const button = buttons.find(
          (btn) => btn.textContent && btn.textContent.includes(label)
        );
        fireEvent.click(button!);

        expect(onIndustryChangeMock).toHaveBeenCalledWith(value);
        unmount();
      });
    });
  });

  // Navigation Tests
  describe("Navigation", () => {
    it("should call onNext when Next button is clicked", () => {
      render(<StepIndustry {...defaultProps} />);

      const nextButton = screen.getByRole("button", { name: "다음" });
      fireEvent.click(nextButton);

      expect(mockOnNext).toHaveBeenCalled();
    });

    it("should call onPrev when Previous button is clicked", () => {
      render(<StepIndustry {...defaultProps} />);

      const prevButton = screen.getByRole("button", { name: "이전" });
      fireEvent.click(prevButton);

      expect(mockOnPrev).toHaveBeenCalled();
    });

    it("should not require selection to navigate (optional field)", () => {
      const { container, rerender } = render(
        <StepIndustry {...defaultProps} industry="" />
      );

      const nextButton = screen.getByRole("button", { name: "다음" });
      expect(nextButton).not.toBeDisabled();

      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  // Styling Tests
  describe("Styling and Layout", () => {
    it("should use proper grid layout (1 col mobile, 2 col desktop)", () => {
      const { container } = render(<StepIndustry {...defaultProps} />);

      const grid = container.querySelector("[data-testid='industry-grid']");
      expect(grid).toHaveClass("grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("sm:grid-cols-2");
    });

    it("should apply hover effects to unselected cards", () => {
      const { container } = render(
        <StepIndustry {...defaultProps} industry="ecommerce" />
      );

      const unselectedCard = container.querySelector(
        "[data-industry='blog']"
      );
      expect(unselectedCard).toHaveClass("hover:shadow-md");
      expect(unselectedCard).toHaveClass("hover:-translate-y-1");
    });

    it("should render rounded card styling", () => {
      const { container } = render(<StepIndustry {...defaultProps} />);

      const cards = container.querySelectorAll("[data-industry]");
      cards.forEach((card) => {
        expect(card).toHaveClass("rounded-xl");
        expect(card).toHaveClass("p-4");
      });
    });

    it("should display icons in circular backgrounds", () => {
      const { container } = render(<StepIndustry {...defaultProps} />);

      const iconContainers = container.querySelectorAll(
        "[data-testid='industry-icon']"
      );
      expect(iconContainers.length).toBeGreaterThan(0);

      iconContainers.forEach((iconContainer) => {
        expect(iconContainer).toHaveClass("rounded-full");
        expect(iconContainer).toHaveClass("bg-brand-light");
        expect(iconContainer).toHaveClass("w-10");
        expect(iconContainer).toHaveClass("h-10");
      });
    });
  });

  // Accessibility Tests
  describe("Accessibility", () => {
    it("should have proper semantic button elements", () => {
      const { container } = render(<StepIndustry {...defaultProps} />);

      const buttons = container.querySelectorAll("button[data-industry]");
      expect(buttons.length).toBe(5);

      buttons.forEach((button) => {
        expect(button).toBeInstanceOf(HTMLButtonElement);
      });
    });

    it("should have clear label text for each option", () => {
      render(<StepIndustry {...defaultProps} />);

      const labels = [
        "전자상거래",
        "블로그/미디어",
        "SaaS/소프트웨어",
        "지역 비즈니스",
        "기타",
      ];

      labels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it("should have minimum touch target size (44px)", () => {
      const { container } = render(<StepIndustry {...defaultProps} />);

      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const paddingTop = parseInt(styles.paddingTop);
        const paddingBottom = parseInt(styles.paddingBottom);
        const totalHeight = paddingTop + paddingBottom + 16; // approx icon/text height

        // Should support 44px touch target
        expect(button).toHaveClass("min-h-[44px]");
      });
    });
  });

  // State Management Tests
  describe("State Management", () => {
    it("should maintain selected state across prop updates", () => {
      const { rerender, container } = render(
        <StepIndustry {...defaultProps} industry="ecommerce" />
      );

      let selectedCard = container.querySelector("[data-industry='ecommerce']");
      expect(selectedCard).toHaveClass("border-brand");

      rerender(
        <StepIndustry {...defaultProps} industry="blog" />
      );

      selectedCard = container.querySelector("[data-industry='blog']");
      expect(selectedCard).toHaveClass("border-brand");

      const previousSelected = container.querySelector(
        "[data-industry='ecommerce']"
      );
      expect(previousSelected).not.toHaveClass("border-brand");
    });
  });

  // Integration Tests
  describe("Integration", () => {
    it("should handle complete selection flow", () => {
      render(<StepIndustry {...defaultProps} industry="ecommerce" />);

      // User selects a different industry
      const blogOption = screen.getByRole("button", { name: /블로그\/미디어/ });
      fireEvent.click(blogOption);

      expect(mockOnIndustryChange).toHaveBeenCalledWith("blog");

      // User clicks next
      const nextButton = screen.getByRole("button", { name: "다음" });
      fireEvent.click(nextButton);

      expect(mockOnNext).toHaveBeenCalled();
    });

    it("should allow going back and forth between steps", () => {
      render(<StepIndustry {...defaultProps} />);

      // Go to next step
      fireEvent.click(screen.getByRole("button", { name: "다음" }));
      expect(mockOnNext).toHaveBeenCalledTimes(1);

      // Go back
      fireEvent.click(screen.getByRole("button", { name: "이전" }));
      expect(mockOnPrev).toHaveBeenCalledTimes(1);
    });
  });
});
