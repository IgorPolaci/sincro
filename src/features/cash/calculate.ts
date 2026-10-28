type CashAmount={amount:number|string};

export function calculateCashSummary(movements:CashAmount[]){
  const cents=movements.map(movement=>Math.round(Number(movement.amount)*100));
  const entries=cents.filter(amount=>amount>0).reduce((sum,amount)=>sum+amount,0);
  const exits=cents.filter(amount=>amount<0).reduce((sum,amount)=>sum+Math.abs(amount),0);
  return {entries:entries/100,exits:exits/100,balance:(entries-exits)/100};
}
