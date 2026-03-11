import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardHeader from "../dashboard-header";
import * as reDiagnosisHook from "@/hooks/use-re-diagnosis";

// Mock useReDiagnosis hook
vi.mock("@/hooks/use-re-diagnosis", () => ({
  useReDiagnosis: vi.fn(),
}));

describe("DashboardHeader Component", () => {
  const mockStartReDiagnosis = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reDiagnosisHook.useReDiagnosis).mockReturnValue({
      state: "idle",
      isLoading: false,
      error: null,
      startReDiagnosis: mockStartReDiagnosis,
      reset: mockReset,
    } as unknown as ReturnType<typeof reDiagnosisHook.useReDiagnosis>);
  });

  it("renders company name and URL", () => {
    render(
      <DashboardHeader
        companyName="TechStartup Inc"
        url="https://techstartup.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    expect(screen.getByText("TechStartup Inc")).toBeInTheDocument();
    expect(screen.getByText(/techstartup.com/)).toBeInTheDocument();
  });

  it("displays diagnostic timestamp", () => {
    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    // Check that date/time is displayed (format may vary by locale)
    const header = screen.getByText("Test Company").parentElement;
    expect(header?.textContent).toMatch(/기준/);
  });

  it("renders re-diagnose button", () => {
    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    const button = screen.getByRole("button", { name: /재진단/i });
    expect(button).toBeInTheDocument();
  });

  it("applies proper styling classes", () => {
    const { container } = render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    const header = container.querySelector("header");
    expect(header).toHaveClass("bg-white");
    expect(header).toHaveClass("border-b");
  });

  it("calls useReDiagnosis hook with companyId", () => {
    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={42}
      />,
    );

    expect(reDiagnosisHook.useReDiagnosis).toHaveBeenCalledWith(42);
  });

  it("disables button when re-diagnosis is loading", () => {
    vi.mocked(reDiagnosisHook.useReDiagnosis).mockReturnValue({
      state: "loading",
      isLoading: true,
      error: null,
      startReDiagnosis: mockStartReDiagnosis,
      reset: mockReset,
    } as unknown as ReturnType<typeof reDiagnosisHook.useReDiagnosis>);

    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    const button = screen.getByRole("button", { name: /재진단/i });
    expect(button).toBeDisabled();
  });

  it("calls startReDiagnosis when button is clicked", async () => {
    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    const button = screen.getByRole("button", { name: /재진단/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockStartReDiagnosis).toHaveBeenCalled();
    });
  });

  it("shows error message when re-diagnosis fails", () => {
    vi.mocked(reDiagnosisHook.useReDiagnosis).mockReturnValue({
      state: "error",
      isLoading: false,
      error: "진단이 최근 이루어졌습니다. 1시간 후에 다시 시도하세요",
      startReDiagnosis: mockStartReDiagnosis,
      reset: mockReset,
    } as unknown as ReturnType<typeof reDiagnosisHook.useReDiagnosis>);

    render(
      <DashboardHeader
        companyName="Test Company"
        url="https://test.com"
        diagnosedAt="2026-03-11T11:30:00Z"
        companyId={1}
      />,
    );

    expect(screen.getByText(/1시간 후/)).toBeInTheDocument();
  });
});
