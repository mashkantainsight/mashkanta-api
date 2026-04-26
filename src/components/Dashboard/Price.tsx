// Wraps a price in dir="ltr" so ₪ always appears on the visual left of the number,
// regardless of the surrounding RTL context.
export function Price({ amount, className }: { amount: number; className?: string }) {
  const formatted = amount.toLocaleString('he-IL');
  return (
    <p dir="ltr" className={`font-numeric text-right whitespace-nowrap ${className ?? ''}`}>
      ₪ {formatted}
    </p>
  );
}

export function PriceInline({ amount, className }: { amount: number; className?: string }) {
  const formatted = amount.toLocaleString('he-IL');
  return (
    <span dir="ltr" className={`font-numeric ${className ?? ''}`}>
      ₪ {formatted}
    </span>
  );
}
