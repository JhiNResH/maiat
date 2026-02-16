/**
 * Zod validation schemas for API endpoints
 * Prevents injection attacks and invalid data
 */

import { z } from 'zod'

/**
 * Ethereum address (0x + 40 hex chars)
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  .transform((addr) => addr.toLowerCase() as `0x${string}`)

/**
 * Review submission schema
 */
export const reviewSubmitSchema = z.object({
  address: ethereumAddressSchema,
  projectId: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(5000).optional(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature'),
})

/**
 * Signature message format for review submission
 * User must sign this exact message to prove wallet ownership
 */
export function getReviewSignatureMessage(params: {
  address: string
  projectId: string
  rating: number
  content: string
  timestamp: number
}): string {
  return `Sign this message to submit a review on Maat:

Project: ${params.projectId}
Rating: ${params.rating}/5
Content: ${params.content.substring(0, 100)}${params.content.length > 100 ? '...' : ''}

Wallet: ${params.address}
Timestamp: ${params.timestamp}

This signature will not trigger a blockchain transaction or cost gas.`
}

/**
 * Verification request schema
 */
export const verifyRequestSchema = z.object({
  reviewId: z.string().uuid(),
  requesterAddress: ethereumAddressSchema.optional(),
})
