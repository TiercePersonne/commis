import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Home page", () => {
  it("renders", () => {
    render(<Page />);
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
