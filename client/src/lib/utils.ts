import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPKRCompact(amount: number): string {
  if (amount >= 1000000) {
    return `PKR ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `PKR ${(amount / 1000).toFixed(0)}K`;
  }
  return formatPKR(amount);
}
