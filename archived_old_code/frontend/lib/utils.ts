import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v))
