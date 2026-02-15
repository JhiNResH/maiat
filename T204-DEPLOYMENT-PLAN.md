# 📋 T204: BSC Contract Deployment - READY TO DEPLOY

**Status:** ⏳ Waiting for testnet BNB  
**Owner:** Patrick  
**Deadline:** Feb 17-18  
**Progress:** 90% (Code ready, awaiting funding)

---

## ✅ Completed Steps

1. **Contract Written** ✅
   - `contracts/ReviewRegistry.sol` (139 lines)
   - Minimal, demo-ready implementation
   - Features:
     - Submit review hashes on-chain
     - Verify review existence
     - Query reviews by user
     - Event emission for indexing

2. **Hardhat Setup** ✅
   - Dependencies installed (351 packages)
   - `hardhat.config.js` configured for:
     - BSC Testnet (Chain ID: 97)
     - opBNB Testnet (Chain ID: 5611)
   - Optimizer enabled (200 runs)

3. **Deployment Scripts** ✅
   - `scripts/deploy-review-registry.js` - Deploy + save info
   - `scripts/check-balance.js` - Check wallet balance
   - `scripts/test-review-submission.js` - Test deployed contract

4. **Test Wallet Generated** ✅
   - Address: `0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755`
   - Private key saved in `.env`
   - **⚠️ NEEDS FUNDING** (0.1 tBNB required)

5. **Documentation** ✅
   - `DEPLOYMENT.md` - Complete deployment guide
   - `T204-DEPLOYMENT-PLAN.md` - This file

---

## 🚀 Next Steps

### Step 1: Fund Wallet (5 min)

**Option A: BSC Testnet (Recommended)**
1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter address: `0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755`
3. Request **0.5 tBNB**
4. Wait ~30 seconds

**Option B: opBNB Testnet (Cheaper gas)**
- Requires BSC Testnet BNB first, then bridge
- Bridge: https://opbnb-testnet-bridge.bnbchain.org/deposit

### Step 2: Verify Balance (30 sec)

```bash
cd /Users/jhinresh/clawd/projects/maatV2
npx hardhat run scripts/check-balance.js --network bscTestnet
```

Expected output:
```
💰 Checking balance on bscTestnet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Address: 0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755
💵 Balance: 0.5 BNB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Balance OK! Ready to deploy
```

### Step 3: Deploy Contract (2 min)

```bash
npx hardhat run scripts/deploy-review-registry.js --network bscTestnet
```

Expected output:
```
🚀 Deploying ReviewRegistry to bscTestnet
📍 Deployer address: 0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755
💰 Balance: 0.5 BNB

📦 Deploying ReviewRegistry...
✅ ReviewRegistry deployed to: 0x...
```

**Result:** `deployment-info.json` created with contract address

### Step 4: Verify Contract (2 min)

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS>
```

### Step 5: Test Submission (1 min)

```bash
npx hardhat run scripts/test-review-submission.js --network bscTestnet
```

---

## 📊 Contract Details

**ReviewRegistry.sol:**
- **Purpose:** On-chain proof of Maat reviews
- **Functions:**
  - `submitReview(category, projectId, contentHash)` - Submit review
  - `verifyReview(reviewId)` - Check if review exists
  - `getReview(reviewId)` - Get review details
  - `getReviewsByReviewer(address)` - Get user's reviews
  - `getTotalReviews()` - Get total review count

**Events:**
- `ReviewSubmitted(reviewId, reviewer, category, projectId, contentHash, timestamp)`

**Gas Costs (Estimated):**
- Deploy: ~0.01 BNB
- Submit review: ~0.0001 BNB per tx
- Total needed: 0.1 BNB (for deployment + 50+ test submissions)

---

## 🎯 BNB Good Vibes Submission Requirements

**What we need:**
- ✅ Contract deployed to BSC Testnet or opBNB
- ✅ Contract verified on BscScan
- ✅ Transaction proof (deployment tx + test submission)
- ✅ GitHub repo link (github.com/JhiNResH/maatV2)
- ✅ Demo screenshots/video

**What we have ready:**
- Contract code ✅
- Deployment scripts ✅
- Test wallet ✅
- Documentation ✅

**What we're waiting for:**
- ⏳ Testnet BNB (0.1+ tBNB)

---

## 🔧 Troubleshooting

### "Insufficient funds" error
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network bscTestnet

# If 0 BNB, re-request from faucet
# BSC Testnet: https://testnet.bnbchain.org/faucet-smart
```

### "Transaction underpriced" error
```javascript
// Edit hardhat.config.js, increase gasPrice:
gasPrice: 20000000000, // 20 gwei (was 10)
```

### Verification fails
```bash
# Wait 1-2 minutes after deployment, then retry
npx hardhat verify --network bscTestnet <ADDRESS>

# If still fails, check constructor args match
```

---

## 📅 Timeline

| Step | Time | Status |
|------|------|--------|
| Write contract | 30 min | ✅ Done |
| Setup Hardhat | 15 min | ✅ Done |
| Write scripts | 20 min | ✅ Done |
| Generate wallet | 2 min | ✅ Done |
| **Get testnet BNB** | **5 min** | **⏳ In Progress** |
| Deploy contract | 2 min | ⏳ Queued |
| Verify contract | 2 min | ⏳ Queued |
| Test submission | 1 min | ⏳ Queued |
| **Total** | **~80 min** | **90% Complete** |

---

## 📍 Current Status

**✅ Code Complete (90%)**
- All scripts written and tested
- Contract ready for deployment
- Documentation complete
- Test wallet generated

**⏳ Awaiting Funding (10%)**
- Need 0.1+ tBNB to deploy
- Faucet link: https://testnet.bnbchain.org/faucet-smart
- Address: `0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755`

**🎯 ETA: 15 minutes after funding**
- Deploy: 2 min
- Verify: 2 min
- Test: 1 min
- Document: 10 min

---

## 🎉 Success Criteria

- [x] Contract code written
- [x] Hardhat configured
- [x] Deployment scripts ready
- [x] Test wallet generated
- [ ] Wallet funded (⏳ In Progress)
- [ ] Contract deployed to BSC Testnet
- [ ] Contract verified on BscScan
- [ ] Test transaction submitted
- [ ] Contract address added to `.env.local`
- [ ] `deployment-info.json` saved
- [ ] T204 marked as complete

---

**Next Action:** Fund wallet with 0.1+ tBNB from faucet, then run deployment script.

**Patrick Status:** ⏳ WAITING FOR TESTNET BNB
