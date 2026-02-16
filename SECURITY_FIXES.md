# Security Fixes for PR #1

**Date:** 2026-02-16  
**Auditor:** Patrick (Bounty Hunter)  
**Original Audit:** `memory/audit-reports/PR1-onchain-verification-audit.md`

---

## Summary

Fixed **5 critical/high security vulnerabilities** in on-chain review verification:

1. ✅ **Wallet Signature Verification (CRITICAL)**
2. ✅ **Rate Limiting (CRITICAL)**  
3. ✅ **Verify Endpoint Authorization (HIGH)**
4. ✅ **Race Condition Protection (HIGH)**
5. ✅ **Input Validation (HIGH)**

---

## Fixes Implemented

### 🔴 CRITICAL #1: Wallet Signature Verification

**Problem:** Anyone could submit reviews with any arbitrary address (no proof of wallet ownership)

**Fix:**
- Added `src/lib/signature.ts` with `verifyWalletSignature()` using viem
- Modified `POST /api/reviews` to require valid wallet signature
- Signature message includes timestamp to prevent replay attacks (±5 minute window)
- User signs message client-side (no gas cost)

**New Flow:**
```typescript
// Client must provide:
{
  address: "0x...",
  projectId: "...",
  rating: 4,
  content: "...",
  signature: "0x...",  // NEW: EIP-191 signature
  timestamp: 1234567890  // NEW: Unix timestamp
}

// Server verifies signature before accepting review
```

**Files Changed:**
- `src/lib/signature.ts` (NEW)
- `src/lib/validation.ts` (NEW - signature message format)
- `src/app/api/reviews/route.ts` (signature verification)

---

### 🔴 CRITICAL #2: Rate Limiting

**Problem:** Attackers could:
- Spam review submissions (DoS)
- Drain gas relayer by repeatedly calling verify endpoint

**Fix:**
- Added `src/lib/ratelimit.ts` using Upstash Redis
- **Review submission:** 5 reviews/hour per address
- **On-chain verification:** 3 verifications/hour per review
- Returns 429 with `X-RateLimit-*` headers when exceeded
- Graceful degradation if Redis not configured

**Environment Variables Required:**
```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Files Changed:**
- `src/lib/ratelimit.ts` (NEW)
- `src/app/api/reviews/route.ts` (rate limiting)
- `src/app/api/reviews/[id]/verify/route.ts` (rate limiting)
- `.env.example` (documented new vars)

---

### 🟠 HIGH #3: Verify Endpoint Authorization

**Problem:** Anyone could call `POST /api/reviews/[id]/verify` and burn gas

**Fix:**
- Added optional `requesterAddress` in request body
- Only review owner can trigger verification
- Returns 403 if unauthorized address tries to verify

**Alternative Considered:**
- Could remove this endpoint entirely
- Or make it admin-only
- Current implementation allows review owner self-service

**Files Changed:**
- `src/app/api/reviews/[id]/verify/route.ts`

---

### 🟠 HIGH #4: Race Condition Protection

**Problem:** Concurrent requests could cause:
- Multiple on-chain submissions for same review (waste gas)
- Database inconsistency

**Fix:**
- Wrapped review fetch in Prisma transaction
- Used `updateMany` with `txHash: null` condition (optimistic locking)
- If update count is 0, return existing txHash (another request won)
- Graceful handling if race condition detected

**Files Changed:**
- `src/app/api/reviews/[id]/verify/route.ts`

---

### 🟠 HIGH #5: Input Validation

**Problem:** Missing Zod validation allowed:
- Invalid Ethereum addresses
- Oversized content (potential DoS)
- Malformed data

**Fix:**
- Added `src/lib/validation.ts` with Zod schemas
- `reviewSubmitSchema` validates all inputs:
  - Address: Must be valid Ethereum address (regex + checksum)
  - ProjectId: 1-100 chars
  - Rating: Integer 1-5
  - Content: Max 5000 chars
  - Signature: Valid hex string
- Returns 400 with detailed validation errors

**Files Changed:**
- `src/lib/validation.ts` (NEW)
- `src/app/api/reviews/route.ts` (Zod validation)

---

## Testing Checklist

Before merging, verify:

- [ ] Upstash Redis configured (or tests pass in degraded mode)
- [ ] Client-side signature generation works (EIP-191 personal_sign)
- [ ] Rate limiting triggers correctly (test 6th review in 1 hour)
- [ ] Verify endpoint rejects unauthorized addresses
- [ ] Race condition test: 2 concurrent verify requests → only 1 succeeds
- [ ] Invalid input rejected with proper error messages
- [ ] Existing functionality still works (review submission, voting, etc.)

---

## Dependencies Added

```json
{
  "@upstash/ratelimit": "^2.x",
  "@upstash/redis": "^1.x",
  "zod": "^3.x"
}
```

---

## Client-Side Changes Required

⚠️ **Frontend must be updated** to generate signatures:

```typescript
// Example client-side code (React + viem/wagmi)
import { useSignMessage } from 'wagmi'
import { getReviewSignatureMessage } from '@/lib/validation'

const { signMessage } = useSignMessage()

async function submitReview(projectId, rating, content) {
  const timestamp = Date.now()
  const message = getReviewSignatureMessage({
    address: userAddress,
    projectId,
    rating,
    content,
    timestamp
  })
  
  const signature = await signMessage({ message })
  
  await fetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      address: userAddress,
      projectId,
      rating,
      content,
      signature,
      timestamp
    })
  })
}
```

---

## Deployment Notes

1. **Upstash Redis Setup:**
   - Create account at https://upstash.com
   - Create Redis database (free tier OK)
   - Copy REST URL and token to `.env`

2. **Gas Relayer Monitoring:**
   - Set up alerts for relayer balance < 0.1 BNB
   - Rate limiting reduces risk, but monitoring still critical

3. **Signature Replay Prevention:**
   - ±5 minute timestamp window (configurable in `signature.ts`)
   - Could add nonce-based replay protection if needed

---

## Future Improvements

**Optional (not blocking merge):**

1. **Nonce-based replay protection:** Store used signatures in Redis
2. **Multi-sig relayer:** Use Gnosis Safe for on-chain submissions
3. **AWS KMS integration:** Store relayer private key in KMS instead of env var
4. **Admin dashboard:** Monitor rate limit hits and relayer balance
5. **Signature caching:** Cache verified signatures to reduce computation

---

## Files Modified

**New Files:**
- `src/lib/signature.ts`
- `src/lib/ratelimit.ts`
- `src/lib/validation.ts`
- `SECURITY_FIXES.md` (this file)

**Modified Files:**
- `src/app/api/reviews/route.ts`
- `src/app/api/reviews/[id]/verify/route.ts`
- `.env.example`
- `package.json` (dependencies)

---

**Audit Status:** ✅ **All CRITICAL and HIGH issues resolved**  
**Ready for:** Re-audit → Testing → Merge
