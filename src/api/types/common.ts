import { z } from 'zod'

export const networkSchema = z.enum(['Ethereum', 'Polygon', 'Solana'])
export type Network = z.infer<typeof networkSchema>

export const decimalStringSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/)
export type DecimalString = z.infer<typeof decimalStringSchema>
