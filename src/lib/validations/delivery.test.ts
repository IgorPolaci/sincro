import { describe, expect, it } from "vitest";
import {
  couponSchema,
  deliveryZoneSchema,
  openingHoursSchema,
  publicOrderSchema,
  transitionOrderSchema,
} from "./delivery";

const base = {
  slug: "minha-loja",
  customerName: "Cliente",
  customerPhone: "44999999999",
  fulfillment: "PICKUP" as const,
  deliveryZoneId: null,
  address: null,
  paymentMethod: "PIX" as const,
  cashChangeFor: null,
  couponCode: "",
  notes: "",
  items: [{ product_id: "00000000-0000-4000-8000-000000000001", quantity: 1 }],
};
describe("delivery validation", () => {
  it("accepts a pickup order", () => expect(publicOrderSchema.safeParse(base).success).toBe(true));
  it("requires address and zone for delivery", () =>
    expect(publicOrderSchema.safeParse({ ...base, fulfillment: "DELIVERY" }).success).toBe(false));
  it("rejects an invalid status transition payload", () =>
    expect(transitionOrderSchema.safeParse({ orderId: "x", status: "HACKED" }).success).toBe(false));
  it("normalizes coupon codes", () =>
    expect(
      couponSchema.parse({
        code: " promo10 ",
        discountType: "PERCENT",
        discountValue: "10",
        minimumOrder: "0",
        usageLimit: "",
      }).code,
    ).toBe("PROMO10"));
  it("rejects negative delivery fees", () =>
    expect(
      deliveryZoneSchema.safeParse({ name: "Centro", neighborhood: "Centro", fee: "-1", minimumOrder: "0" }).success,
    ).toBe(false));
  it("validates all weekly opening intervals", () => {
    const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      openingTime: "09:00",
      closingTime: "18:00",
      closedAllDay: dayOfWeek === 0,
    }));
    expect(openingHoursSchema.safeParse({ days }).success).toBe(true);
    expect(
      openingHoursSchema.safeParse({
        days: days.map((day) => (day.dayOfWeek === 1 ? { ...day, openingTime: "19:00" } : day)),
      }).success,
    ).toBe(false);
  });
});
