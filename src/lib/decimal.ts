import { decimalStringSchema } from '@/api/types/common'

const DECIMAL_SCALE = 18
const SCALE_FACTOR = 10n ** BigInt(DECIMAL_SCALE)

export function decimalToUnits(value: string): bigint {
  const validated = decimalStringSchema.parse(value)
  const [whole = '0', fraction = ''] = validated.split('.')
  if (fraction.length > DECIMAL_SCALE) {
    throw new RangeError('Decimal precision exceeds supported scale')
  }
  return (
    BigInt(whole) * SCALE_FACTOR +
    BigInt(fraction.padEnd(DECIMAL_SCALE, '0') || '0')
  )
}

export function unitsToDecimal(value: bigint): string {
  if (value < 0n)
    throw new RangeError('Negative decimal amounts are not supported')
  const whole = value / SCALE_FACTOR
  const fraction = (value % SCALE_FACTOR)
    .toString()
    .padStart(DECIMAL_SCALE, '0')
  const trimmedFraction = fraction.replace(/0+$/, '')
  return trimmedFraction
    ? `${whole.toString()}.${trimmedFraction}`
    : whole.toString()
}

export function addDecimalStrings(left: string, right: string): string {
  return unitsToDecimal(decimalToUnits(left) + decimalToUnits(right))
}

export function multiplyDecimalString(
  value: string,
  multiplier: number,
): string {
  if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
    throw new RangeError('Multiplier must be a non-negative safe integer')
  }
  return unitsToDecimal(decimalToUnits(value) * BigInt(multiplier))
}

export function subtractDecimalStrings(left: string, right: string): string {
  return unitsToDecimal(decimalToUnits(left) - decimalToUnits(right))
}

export function percentageOfDecimal(value: string, percentage: string): string {
  const percentageUnits = BigInt(percentage)
  return unitsToDecimal((decimalToUnits(value) * percentageUnits) / 100n)
}
