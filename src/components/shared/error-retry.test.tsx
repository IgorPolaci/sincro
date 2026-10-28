import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorRetry } from "./error-retry";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorRetry", () => {
  it("registra o erro original e tenta renderizar o segmento novamente", () => {
    const error = new Error("Falha de teste");
    const retry = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<ErrorRetry error={error} retry={retry} compact />);

    expect(consoleError).toHaveBeenCalledWith("Sincro page error", error);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
