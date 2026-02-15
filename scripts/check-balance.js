const hre = require("hardhat");

async function main() {
  console.log("💰 Checking balance on", hre.network.name);
  console.log("━".repeat(50));
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInBNB = hre.ethers.formatEther(balance);
  
  console.log("💵 Balance:", balanceInBNB, "BNB");
  console.log("━".repeat(50));
  
  if (balance === 0n) {
    console.log("\n❌ No BNB! Get testnet BNB from:");
    console.log("   https://testnet.bnbchain.org/faucet-smart");
    console.log("   Address:", deployer.address);
    process.exit(1);
  } else if (parseFloat(balanceInBNB) < 0.01) {
    console.log("\n⚠️  Low balance! Consider getting more tBNB");
    console.log("   Current:", balanceInBNB, "BNB");
    console.log("   Recommended: 0.1+ BNB");
  } else {
    console.log("\n✅ Balance OK! Ready to deploy");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
