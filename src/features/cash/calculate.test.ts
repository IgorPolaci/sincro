import { describe,expect,it } from "vitest";
import { calculateCashSummary } from "./calculate";

describe('calculateCashSummary',()=>{
  it('mantém suprimento e sangria conciliáveis',()=>{
    expect(calculateCashSummary([{amount:'100.00'},{amount:'25.50'},{amount:'-40.25'}]))
      .toEqual({entries:125.5,exits:40.25,balance:85.25});
  });

  it('evita erro binário na soma de centavos',()=>{
    expect(calculateCashSummary([{amount:0.1},{amount:0.2}]).balance).toBe(0.3);
  });
});
