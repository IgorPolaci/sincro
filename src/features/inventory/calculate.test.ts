import {describe,expect,it} from 'vitest';import {calculateStock} from './calculate';
describe('calculateStock',()=>{it('baixa duas unidades de dez',()=>expect(calculateStock(10,-2)).toBe(8));it('reverte a baixa',()=>expect(calculateStock(8,2)).toBe(10));it('impede saldo negativo',()=>expect(()=>calculateStock(1,-2)).toThrow('insuficiente'))});
