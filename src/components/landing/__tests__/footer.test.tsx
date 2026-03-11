import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Footer from "../footer";

describe("Footer", () => {
  it("should render footer with dark gray-900 background", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toHaveClass("bg-gray-900");
  });

  it("should display copyright text", () => {
    render(<Footer />);
    expect(
      screen.getByText("© 2026 Findably. All rights reserved.")
    ).toBeInTheDocument();
  });

  it("should render three footer links", () => {
    render(<Footer />);
    expect(screen.getByText("이용약관")).toBeInTheDocument();
    expect(screen.getByText("개인정보처리방침")).toBeInTheDocument();
    expect(screen.getByText("문의하기")).toBeInTheDocument();
  });

  it("should have gray-400 text color for links", () => {
    render(<Footer />);
    const link = screen.getByText("이용약관");
    expect(link).toHaveClass("text-gray-400");
  });

  it("should have proper footer container styling", () => {
    const { container } = render(<Footer />);
    const contentContainer = container.querySelector(".max-w-6xl");
    expect(contentContainer).toBeInTheDocument();
  });

  it("should display footer in single row layout", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    // Check that footer has the div with flex and justify-between
    const contentDiv = footer?.querySelector("div > div");
    expect(contentDiv).toHaveClass("flex");
    expect(contentDiv).toHaveClass("justify-between");
  });

  it("should have proper padding for footer", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toHaveClass("py-8");
    expect(footer).toHaveClass("sm:py-10");
    expect(footer).toHaveClass("lg:py-12");
  });

  it("should render footer as semantic HTML element", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer?.tagName).toBe("FOOTER");
  });

  it("should group links with separator pipes", () => {
    const { container } = render(<Footer />);
    // Links should be separated by |
    const linksText = container.textContent;
    expect(linksText).toContain("|");
  });
});
