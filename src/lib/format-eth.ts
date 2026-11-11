const decimalPattern = /^(\d+)(?:\.(\d+))?$/

export function formatEthPrice(price: string): string {
  const match = decimalPattern.exec(price)
  if (!match) {
    throw new RangeError('Price must be a decimal string')
  }

  const whole = BigInt(match[1] ?? '0').toString()
  const fraction = (match[2] ?? '').replace(/0+$/, '')
  const displayFraction =
    fraction.length < 2 ? fraction.padEnd(2, '0') : fraction

  return `${whole}.${displayFraction} ETH`
}
