# 🚀 BSC Testnet Deployment Guide

## 1️⃣ Wallet Info

**Deployment Address:** `0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755`

**Private Key:** (stored in `.env`)

---

## 2️⃣ Get Testnet BNB

### Option A: BSC Testnet (Recommended)
1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter address: `0x9028aBD05cA6ec95Bbe0F51a677b9e8E613D3755`
3. Request **0.5 tBNB** (enough for multiple deployments)
4. Wait ~30 seconds for confirmation

### Option B: opBNB Testnet (Cheaper gas, but requires BSC Testnet BNB first)
1. Get tBNB from BSC Testnet faucet first
2. Bridge to opBNB: https://opbnb-testnet-bridge.bnbchain.org/deposit
3. Amount: 0.1 tBNB is enough

---

## 3️⃣ Deploy Contract

Once funded, run:

```bash
# Check balance first
npx hardhat run scripts/check-balance.js --network bscTestnet

# Deploy to BSC Testnet
npx hardhat run scripts/deploy-review-registry.js --network bscTestnet

# OR deploy to opBNB Testnet (cheaper)
npx hardhat run scripts/deploy-review-registry.js --network opBNBTestnet
```

---

## 4️⃣ Verify Contract

After deployment, verify on BscScan:

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS>
```

---

## 5️⃣ Test Submission

Once deployed, you can test by calling `submitReview()`:

```javascript
// Example call
await registry.submitReview(
  "m/openclaw-skills",
  "skill-123",
  ethers.keccak256(ethers.toUtf8Bytes("Great skill!"))
);
```

---

## 📋 Deployment Checklist

- [ ] Testnet BNB obtained (0.1+ tBNB)
- [ ] Balance confirmed (`check-balance.js`)
- [ ] Contract deployed (`deploy-review-registry.js`)
- [ ] Contract verified on BscScan
- [ ] Test transaction submitted
- [ ] Contract address added to `.env.local`:
  - `NEXT_PUBLIC_REVIEW_REGISTRY_ADDRESS=<address>`
  - `NEXT_PUBLIC_CHAIN_ID=97` (BSC Testnet) or `5611` (opBNB)

---

## 🎯 For BNB Good Vibes Submission

**Required Info:**
- Contract Address: (will be saved in `deployment-info.json`)
- Network: BSC Testnet (Chain ID: 97)
- BscScan Link: https://testnet.bscscan.com/address/`<CONTRACT_ADDRESS>`
- Deployment Tx: (from deployment output)

---

## 🆘 Troubleshooting

**"No BNB" error?**
- Check balance: `npx hardhat run scripts/check-balance.js --network bscTestnet`
- Re-request from faucet (24h cooldown)

**Deployment fails?**
- Increase gas limit in `hardhat.config.js`
- Try opBNB Testnet (much cheaper)

**Can't verify?**
- Wait 1-2 minutes after deployment
- Check constructor args match deployment
- Get BscScan API key: https://bscscan.com/myapikey

---

**Status:** ⏳ Waiting for testnet BNB
