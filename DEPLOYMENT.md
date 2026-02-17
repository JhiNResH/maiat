# 🚀 BSC Testnet Deployment Guide

## ✅ Deployed Contract Info

**Contract Address:** `0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37`  
**Deployer Address:** `0x872989F7fCd4048acA370161989d3904E37A3cB3`  
**Network:** BSC Testnet (Chain ID: 97)  
**Contract:** ReviewRegistry  
**BscScan:** https://testnet.bscscan.com/address/0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37

**Deployment Status:** ✅ Live on BSC Testnet

---

## 📦 Repository Info

**GitHub:** https://github.com/JhiNResH/maiat  
**Local Path:** `/Users/jhinresh/maiat`

---

## 🔧 Configuration

Add to your `.env.local`:

```env
NEXT_PUBLIC_REVIEW_REGISTRY_ADDRESS=0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37
NEXT_PUBLIC_CHAIN_ID=97
```

---

## 🎯 Project Categories

Current supported categories:
- **AI Agents**
- **DeFi**

---

## 🔐 Authentication

**Privy Integration:** Configured  
**App ID:** (stored in `.env.local`)

---

## 🧪 Testing the Contract

### Check Contract on BscScan

Visit: https://testnet.bscscan.com/address/0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37

### Test Review Submission

```bash
npx hardhat run scripts/test-review-submission.js --network bscTestnet
```

Example call:
```javascript
await registry.submitReview(
  "AI Agents",
  "project-xyz",
  ethers.keccak256(ethers.toUtf8Bytes("Great AI agent!"))
);
```

---

## 📋 Contract Functions

**ReviewRegistry.sol:**

| Function | Description |
|----------|-------------|
| `submitReview(category, projectId, contentHash)` | Submit a new review to the blockchain |
| `verifyReview(reviewId)` | Check if a review exists |
| `getReview(reviewId)` | Get review details |
| `getReviewsByReviewer(address)` | Get all reviews by a specific reviewer |
| `getTotalReviews()` | Get total number of reviews |

**Events:**
- `ReviewSubmitted(reviewId, reviewer, category, projectId, contentHash, timestamp)`

---

## 🆘 Troubleshooting

**Need testnet BNB?**
1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Request 0.5 tBNB

**Can't interact with contract?**
- Check `.env.local` has correct `NEXT_PUBLIC_REVIEW_REGISTRY_ADDRESS`
- Verify you're on BSC Testnet (Chain ID: 97)
- Ensure wallet has sufficient tBNB for gas

**Verification Issues?**
```bash
npx hardhat verify --network bscTestnet 0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37
```

---

## 📊 Gas Costs

- Submit review: ~0.0001 BNB per transaction
- Recommended balance: 0.1 tBNB for testing

---

## 🎯 Next Steps

- [ ] Update UI to use deployed contract address
- [ ] Test review submission from frontend
- [ ] Configure category filters (AI Agents + DeFi)
- [ ] Set up event listeners for ReviewSubmitted
- [ ] Add transaction confirmation UI

---

**Last Updated:** 2026-02-16  
**Maintained by:** Patrick (Bounty Hunter 🛡️)
