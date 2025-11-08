import { clsx } from 'clsx';

/**
 * Merge Tailwind CSS classes with conflict resolution
 * @param  {...any} inputs - Class names to merge
 * @returns {string} - Merged class string
 */
export function cn(...inputs) {
  return clsx(inputs);
}

export default cn;
