/**
 * HD App currency formatting
 * Fixed conversion: 1 USD = 15,500 IDR
 */

export type Currency = 'IDR' | 'USD'

const USD_RATE = 15500

/**
 * Format an IDR price value into the display currency.
 *
 * Examples:
 *   formatPrice(75000, 'IDR')  → "Rp 75.000"
 *   formatPrice(75000, 'USD')  → "$4.84"
 */
export function formatPrice(idr: number, currency: Currency): string {
  if (currency === 'USD') {
    const usd = idr / USD_RATE
    return '$' + usd.toFixed(2)
  }

  // IDR: Indonesian dot-separated thousands
  const rounded = Math.round(idr).toString()
  let result = ''
  let count = 0
  for (let i = rounded.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) result = '.' + result
    result = rounded[i] + result
    count++
  }
  return 'Rp ' + result
}
