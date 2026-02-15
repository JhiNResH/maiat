const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🧪 Testing ReviewRegistry on", hre.network.name);
  
  // Load deployment info
  if (!fs.existsSync("deployment-info.json")) {
    console.error("❌ No deployment-info.json found!");
    console.error("   Run deploy-review-registry.js first");
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const registryAddress = deploymentInfo.address;
  
  console.log("📍 Registry Address:", registryAddress);
  
  // Get contract
  const ReviewRegistry = await hre.ethers.getContractFactory("ReviewRegistry");
  const registry = ReviewRegistry.attach(registryAddress);
  
  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Signer:", signer.address);
  
  // Test data
  const category = "m/openclaw-skills";
  const projectId = "skill-example-123";
  const reviewContent = "This is a test review for BNB Good Vibes demo!";
  const contentHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(reviewContent));
  
  console.log("\n📝 Submitting test review...");
  console.log("   Category:", category);
  console.log("   Project ID:", projectId);
  console.log("   Content:", reviewContent);
  console.log("   Content Hash:", contentHash);
  
  // Submit review
  const tx = await registry.submitReview(category, projectId, contentHash);
  console.log("\n⏳ Transaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed.toString());
  
  // Get review ID from event
  const event = receipt.logs.find(log => {
    try {
      return registry.interface.parseLog(log).name === "ReviewSubmitted";
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsedEvent = registry.interface.parseLog(event);
    const reviewId = parsedEvent.args.reviewId;
    
    console.log("\n📋 Review Details:");
    console.log("   Review ID:", reviewId);
    
    // Verify review
    const exists = await registry.verifyReview(reviewId);
    console.log("   Verified:", exists ? "✅ YES" : "❌ NO");
    
    // Get review data
    const review = await registry.getReview(reviewId);
    console.log("   Reviewer:", review.reviewer);
    console.log("   Category:", review.category);
    console.log("   Project ID:", review.projectId);
    console.log("   Timestamp:", new Date(Number(review.timestamp) * 1000).toISOString());
  }
  
  // Get total reviews
  const total = await registry.getTotalReviews();
  console.log("\n📊 Total Reviews:", total.toString());
  
  // Get reviews by signer
  const userReviews = await registry.getReviewsByReviewer(signer.address);
  console.log("👤 Your Reviews:", userReviews.length);
  
  console.log("\n🎉 Test complete!");
  console.log("\n📍 View on BscScan:");
  console.log("   https://testnet.bscscan.com/address/" + registryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
