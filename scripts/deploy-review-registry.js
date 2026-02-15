const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ReviewRegistry to", hre.network.name);
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "BNB");
  
  if (balance === 0n) {
    console.error("❌ No BNB! Get testnet BNB from:");
    console.error("   BSC Testnet: https://testnet.bnbchain.org/faucet-smart");
    console.error("   opBNB Testnet: https://opbnb-testnet-bridge.bnbchain.org/deposit");
    process.exit(1);
  }
  
  // Deploy
  console.log("\n📦 Deploying ReviewRegistry...");
  const ReviewRegistry = await hre.ethers.getContractFactory("ReviewRegistry");
  const registry = await ReviewRegistry.deploy();
  
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  
  console.log("✅ ReviewRegistry deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${address}`);
  console.log("\n2. Add to frontend (.env.local):");
  console.log(`   NEXT_PUBLIC_REVIEW_REGISTRY_ADDRESS=${address}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=${hre.network.config.chainId}`);
  console.log("\n3. Test submission:");
  console.log("   Visit https://testnet.bscscan.com/address/" + address);
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contract: "ReviewRegistry",
    address: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };
  
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
