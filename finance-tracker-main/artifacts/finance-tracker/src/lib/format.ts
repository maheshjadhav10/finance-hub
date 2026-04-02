import { format, parseISO } from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatMonth(monthString: string): string {
  try {
    // Expecting YYYY-MM format
    return format(parseISO(`${monthString}-01`), 'MMMM yyyy');
  } catch {
    return monthString;
  }
}
