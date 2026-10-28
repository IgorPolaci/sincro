import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CustomerTable, type CustomerRow } from "./customer-table";

const customer: CustomerRow = {
  id: "e478f4d0-9ea1-4b99-b512-494d53b2977c",
  name: "Ana Clara Martins",
  document: "390.111.220-01",
  phone: "11981112001",
  email: "ana.martins@sneakers.demo",
  active: true,
};

afterEach(cleanup);

describe("CustomerTable", () => {
  it("opens the customer actions menu with the expected links", () => {
    render(<CustomerTable data={[customer]} />);

    fireEvent.click(screen.getByRole("button", { name: `Ações para ${customer.name}` }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Ver detalhes" })).toHaveAttribute("href", `/clientes/${customer.id}`);
    expect(screen.getByRole("menuitem", { name: "Ligar" })).toHaveAttribute("href", `tel:${customer.phone}`);
    expect(screen.getByRole("menuitem", { name: "Enviar e-mail" })).toHaveAttribute("href", `mailto:${customer.email}`);
  });

  it("closes the actions menu with Escape", () => {
    render(<CustomerTable data={[customer]} />);

    const button = screen.getByRole("button", { name: `Ações para ${customer.name}` });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});
