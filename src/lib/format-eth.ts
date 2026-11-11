const decimalPattern = /^(\d+)(?:\.(\d+))?$/

export function formatEthPrice(price: string): string {
  const match = decimalPattern.exec(price)
  if (!match) {
    throw new RangeError('Price must be a decimal string')
  }

  let whole = BigInt(match[1] ?? '0')
  const fraction = match[2] ?? ''
  let cents = BigInt(fraction.padEnd(2, '0').slice(0, 2))
  const thirdDigit = fraction.charAt(2)

  if (thirdDigit >= '5') {
    cents += 1n
  }
  if (cents === 100n) {
    whole += 1n
    cents = 0n
  }

  return `${whole.toString()}.${cents.toString().padStart(2, '0')} ETH`
}
