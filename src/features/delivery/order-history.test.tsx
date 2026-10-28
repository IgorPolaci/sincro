import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OrderHistory, type OrderHistoryRow } from "./order-history";

const order: OrderHistoryRow = {
  id: "2d0e29ab-af5a-4a0a-a490-adc34af30453",
  number: "1042",
  public_code: "pedido-publico-1042",
  customer_id: "e478f4d0-9ea1-4b99-b512-494d53b2977c",
  customer_name: "Ana Clara Martins",
  customer_phone: "11981112001",
  fulfillment: "DELIVERY",
  status: "DELIVERED",
  total: 549.9,
  payment_method: "PIX",
  created_at: "2026-10-20T15:00:00.000Z",
  delivered_at: "2026-10-20T16:30:00.000Z",
  cancelled_at: null,
  cancellation_reason: null,
  online_order_items: [
    { id: "item-1", product_name: "Tênis Urban Move", quantity: 1 },
    { id: "item-2", product_name: "Meia Performance", quantity: 2 },
  ],
};

const filters = { q: "Ana", status: "DELIVERED", from: "2026-10-01", to: "2026-10-31", page: 2 };

afterEach(cleanup);

describe("OrderHistory", () => {
  it("shows completed sales with customer, item and tracking access", () => {
    render(
      <OrderHistory
        rows={[order]}
        filters={filters}
        total={26}
        counts={{ active: 4, delivered: 21, cancelled: 1 }}
        pageSize={25}
      />,
    );

    const row = screen.getByText("Pedido #1042").closest("article");
    expect(row).not.toBeNull();
    expect(screen.getByRole("link", { name: order.customer_name })).toHaveAttribute(
      "href",
      `/clientes/${order.customer_id}?aba=compras`,
    );
    expect(screen.getByText("1× Tênis Urban Move · 2× Meia Performance")).toBeInTheDocument();
    expect(within(row!).getByText("Entregue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acompanhar pedido 1042" })).toHaveAttribute(
      "href",
      `/pedido/${order.public_code}`,
    );
  });

  it("keeps the active filters in pagination links", () => {
    render(
      <OrderHistory
        rows={[order]}
        filters={filters}
        total={76}
        counts={{ active: 4, delivered: 71, cancelled: 1 }}
        pageSize={25}
      />,
    );

    expect(screen.getByText("2 de 4")).toBeInTheDocument();
    const next = screen.getByRole("link", { name: "Próxima página" });
    expect(next).toHaveAttribute("href", expect.stringContaining("visualizacao=historico"));
    expect(next).toHaveAttribute("href", expect.stringContaining("q=Ana"));
    expect(next).toHaveAttribute("href", expect.stringContaining("status=DELIVERED"));
    expect(next).toHaveAttribute("href", expect.stringContaining("page=3"));
  });
});
