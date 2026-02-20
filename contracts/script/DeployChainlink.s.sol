// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {MaiatTrustConsumer} from "../src/MaiatTrustConsumer.sol";

/// @title DeployChainlink
/// @notice Deploys MaiatTrustConsumer for Chainlink CRE Trust Score Oracle workflow
///
/// Usage:
///   # Dry run (Sepolia):
///   forge script script/DeployChainlink.s.sol --rpc-url $SEPOLIA_RPC -vvvv
///
///   # Deploy to Sepolia (Chainlink target network):
///   forge script script/DeployChainlink.s.sol \
///     --rpc-url $SEPOLIA_RPC \
///     --private-key $PRIVATE_KEY \
///     --broadcast --verify \
///     --etherscan-api-key $ETHERSCAN_API_KEY \
///     -vvvv
///
///   # Read deployed state:
///   CONSUMER_ADDRESS=0x... forge script script/DeployChainlink.s.sol:ReadConsumerState \
///     --rpc-url $SEPOLIA_RPC -vvvv
///
/// Required env vars:
///   PRIVATE_KEY       — deployer private key
///   CRE_FORWARDER     — Chainlink CRE forwarder address (from cre login output)
///
/// Optional:
///   CONSUMER_ADDRESS  — deployed contract address (for ReadConsumerState)
contract DeployChainlink is Script {
    function run() external {
        address creForwarder = vm.envOr("CRE_FORWARDER", address(0));
        uint256 deployerKey  = vm.envUint("PRIVATE_KEY");
        address deployer     = vm.addr(deployerKey);

        console2.log("=== MaiatTrustConsumer Deployment ===");
        console2.log("Deployer:      ", deployer);
        console2.log("CRE Forwarder: ", creForwarder);
        console2.log("Chain ID:      ", block.chainid);

        if (creForwarder == address(0)) {
            console2.log("[WARN] CRE_FORWARDER is address(0)!");
            console2.log("[WARN] onReport() will be permanently inaccessible.");
            console2.log("[WARN] Set CRE_FORWARDER after 'cre login' to get the real address.");
        }

        vm.startBroadcast(deployerKey);

        MaiatTrustConsumer consumer = new MaiatTrustConsumer(creForwarder);
        console2.log("MaiatTrustConsumer deployed:", address(consumer));

        vm.stopBroadcast();

        console2.log("\n=== Deployment Summary ===");
        console2.log("MaiatTrustConsumer: ", address(consumer));
        console2.log("Owner:             ", consumer.owner());
        console2.log("Forwarder:         ", consumer.forwarder());
        console2.log("\nNext steps:");
        console2.log("1. Update chainlink-cre/maiat-trust-oracle/trust-score-workflow/config.staging.json");
        console2.log("   trustScoreOracleAddress:", address(consumer));
        console2.log("2. Run: cre deploy --env staging");
        console2.log("3. Get CRE forwarder address, call setForwarder(forwarderAddr)");
        console2.log("4. Seed test project trust scores with SeedProjectScores script");
    }
}

// ─── Seed project scores after deployment ───────────────────────────────────

contract SeedProjectScores is Script {
    function run() external {
        address consumerAddr = vm.envAddress("CONSUMER_ADDRESS");
        uint256 callerKey    = vm.envUint("PRIVATE_KEY");

        MaiatTrustConsumer consumer = MaiatTrustConsumer(consumerAddr);

        // Maiat demo projects
        bytes32[] memory projects = new bytes32[](5);
        uint256[] memory scores   = new uint256[](5);
        uint256[] memory reviews  = new uint256[](5);

        projects[0] = keccak256("huckleberry-roasters"); scores[0] = 88; reviews[0] = 24;
        projects[1] = keccak256("corvus-coffee");        scores[1] = 82; reviews[1] = 18;
        projects[2] = keccak256("uniswap");              scores[2] = 95; reviews[2] = 312;
        projects[3] = keccak256("aave");                 scores[3] = 91; reviews[3] = 205;
        projects[4] = keccak256("chainlink");            scores[4] = 96; reviews[4] = 418;

        console2.log("Seeding project trust scores on:", consumerAddr);
        console2.log("Caller:", vm.addr(callerKey));

        vm.startBroadcast(callerKey);
        for (uint256 i = 0; i < projects.length; i++) {
            consumer.updateProjectTrust(projects[i], scores[i], reviews[i]);
            console2.log("  seeded project score:", scores[i]);
        }
        vm.stopBroadcast();

        console2.log("Done. Verifying:");
        (uint256 s, uint256 r,) = consumer.getProjectTrust(keccak256("uniswap"));
        console2.log("  uniswap -> score:", s, "reviews:", r);
    }
}

// ─── Update forwarder post-deploy ────────────────────────────────────────────

contract SetCREForwarder is Script {
    function run() external {
        address consumerAddr   = vm.envAddress("CONSUMER_ADDRESS");
        address newForwarder   = vm.envAddress("CRE_FORWARDER");
        uint256 callerKey      = vm.envUint("PRIVATE_KEY");

        MaiatTrustConsumer consumer = MaiatTrustConsumer(consumerAddr);

        console2.log("Setting CRE forwarder...");
        console2.log("Consumer:     ", consumerAddr);
        console2.log("Old forwarder:", consumer.forwarder());
        console2.log("New forwarder:", newForwarder);

        vm.startBroadcast(callerKey);
        consumer.setForwarder(newForwarder);
        vm.stopBroadcast();

        console2.log("Done. Current forwarder:", consumer.forwarder());
    }
}

// ─── Read deployed state ─────────────────────────────────────────────────────

contract ReadConsumerState is Script {
    function run() external view {
        address consumerAddr = vm.envAddress("CONSUMER_ADDRESS");
        MaiatTrustConsumer consumer = MaiatTrustConsumer(consumerAddr);

        (uint256 count, uint256 score, uint256 ts) = consumer.getLatestReport();

        console2.log("=== MaiatTrustConsumer State ===");
        console2.log("Contract:    ", consumerAddr);
        console2.log("Owner:       ", consumer.owner());
        console2.log("Forwarder:   ", consumer.forwarder());
        console2.log("Report count:", consumer.reportCount());
        console2.log("\n--- Latest Report ---");
        console2.log("Review count:    ", count);
        console2.log("Avg trust score: ", score);
        console2.log("Timestamp:       ", ts);
        console2.log("\n--- Demo Projects ---");

        bytes32[3] memory projects = [
            keccak256("huckleberry-roasters"),
            keccak256("uniswap"),
            keccak256("chainlink")
        ];
        string[3] memory names = ["huckleberry-roasters", "uniswap", "chainlink"];

        for (uint256 i = 0; i < projects.length; i++) {
            (uint256 s, uint256 r, uint256 t) = consumer.getProjectTrust(projects[i]);
            console2.log(names[i]);
            console2.log("  score:", s);
            console2.log("  reviews:", r);
            console2.log("  updated:", t);
        }
    }
}
