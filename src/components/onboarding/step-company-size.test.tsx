import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StepCompanySize from "./step-company-size";

describe("StepCompanySize", () => {
  const mockHandlers = {
    onCompanySizeChange: vi.fn(),
    onPrev: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render title and subtitle", () => {
      render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText("회사 규모를 선택하세요")).toBeInTheDocument();
      expect(
        screen.getByText("맞춤형 진단 기준을 설정하기 위해 필요합니다")
      ).toBeInTheDocument();
    });

    it("should render all 3 company size options", () => {
      render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText("1인")).toBeInTheDocument();
      expect(screen.getByText("소규모 (2-10명)")).toBeInTheDocument();
      expect(screen.getByText("중규모 (11-50명)")).toBeInTheDocument();
    });

    it("should render option descriptions", () => {
      render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      expect(
        screen.getByText("혼자 운영하는 비즈니스")
      ).toBeInTheDocument();
      expect(screen.getByText("2-10명 규모의 팀")).toBeInTheDocument();
      expect(screen.getByText("11-50명 규모의 조직")).toBeInTheDocument();
    });

    it("should render icons for each option", () => {
      const { container } = render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const icons = container.querySelectorAll("[data-testid='company-size-icon']");
      expect(icons.length).toBe(3);
    });

    it("should render Previous and Start buttons", () => {
      render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByTestId("prev-button")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("should highlight selected company size option", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const soloOption = screen.getByTestId("company-size-option-solo");
      expect(soloOption).toHaveClass("border-brand", "bg-brand-light");
    });

    it("should show checkmark for selected option", () => {
      render(
        <StepCompanySize
          companySize="small"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const checkmarks = screen.getAllByTestId("checkmark");
      expect(checkmarks.length).toBe(1);
    });

    it("should not show checkmark for unselected options", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      // Only one checkmark should exist (for solo)
      const checkmarks = screen.getAllByTestId("checkmark");
      expect(checkmarks.length).toBe(1);
    });

    it("should call onCompanySizeChange when option is clicked", () => {
      render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const smallOption = screen.getByTestId("company-size-option-small");
      fireEvent.click(smallOption);

      expect(mockHandlers.onCompanySizeChange).toHaveBeenCalledWith("small");
    });

    it("should handle multiple selections", () => {
      const { rerender } = render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      // Click solo
      fireEvent.click(screen.getByTestId("company-size-option-solo"));
      expect(mockHandlers.onCompanySizeChange).toHaveBeenCalledWith("solo");

      // Rerender with solo selected
      mockHandlers.onCompanySizeChange.mockClear();
      rerender(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      // Click medium - should deselect solo and select medium
      fireEvent.click(screen.getByTestId("company-size-option-medium"));
      expect(mockHandlers.onCompanySizeChange).toHaveBeenCalledWith("medium");
    });
  });

  describe("button behavior", () => {
    it("should call onPrev when Previous button is clicked", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      fireEvent.click(screen.getByTestId("prev-button"));
      expect(mockHandlers.onPrev).toHaveBeenCalledTimes(1);
    });

    it("should disable Submit button when no size is selected", () => {
      render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
    });

    it("should enable Submit button when size is selected", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).not.toBeDisabled();
    });

    it("should call onSubmit when Start button is clicked with selection", () => {
      render(
        <StepCompanySize
          companySize="medium"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      fireEvent.click(screen.getByTestId("submit-button"));
      expect(mockHandlers.onSubmit).toHaveBeenCalledTimes(1);
    });

    it("should show correct button text when not submitting", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      expect(screen.getByText("시작하기 →")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show loading text when isSubmitting is true", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByText("진단 시작 중...")).toBeInTheDocument();
    });

    it("should show spinner when isSubmitting is true", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("should disable all options when isSubmitting is true", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      const soloOption = screen.getByTestId("company-size-option-solo");
      expect(soloOption).toBeDisabled();
      expect(soloOption).toHaveClass("opacity-50", "cursor-not-allowed");
    });

    it("should disable Previous button when isSubmitting is true", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      const prevButton = screen.getByTestId("prev-button");
      expect(prevButton).toBeDisabled();
    });

    it("should disable Submit button when isSubmitting is true", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
    });

    it("should not call onCompanySizeChange when clicking option while submitting", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      const smallOption = screen.getByTestId("company-size-option-small");
      fireEvent.click(smallOption);

      expect(mockHandlers.onCompanySizeChange).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-disabled on options when submitting", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={true}
        />
      );

      const soloOption = screen.getByTestId("company-size-option-solo");
      expect(soloOption).toHaveAttribute("aria-disabled", "true");
    });

    it("should render all options in single column grid", () => {
      const { container } = render(
        <StepCompanySize
          companySize=""
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const grid = container.querySelector("[data-testid='company-size-grid']");
      expect(grid).toHaveClass("grid-cols-1");
    });
  });

  describe("styling", () => {
    it("should apply brand color to selected option", () => {
      render(
        <StepCompanySize
          companySize="medium"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const mediumOption = screen.getByTestId("company-size-option-medium");
      expect(mediumOption).toHaveClass("border-brand", "bg-brand-light");
    });

    it("should apply gray styling to unselected options", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const smallOption = screen.getByTestId("company-size-option-small");
      expect(smallOption).toHaveClass("border-gray-200", "bg-white");
    });

    it("should have minimum button height for accessibility", () => {
      render(
        <StepCompanySize
          companySize="solo"
          onCompanySizeChange={mockHandlers.onCompanySizeChange}
          onPrev={mockHandlers.onPrev}
          onSubmit={mockHandlers.onSubmit}
          isSubmitting={false}
        />
      );

      const prevButton = screen.getByTestId("prev-button");
      const submitButton = screen.getByTestId("submit-button");

      expect(prevButton).toHaveClass("min-h-[44px]");
      expect(submitButton).toHaveClass("min-h-[44px]");
    });
  });
});
