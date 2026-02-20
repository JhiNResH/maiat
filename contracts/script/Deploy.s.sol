// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {TrustScoreOracle} from "../src/TrustScoreOracle.sol";
import {TrustGateHook} from "../src/TrustGateHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/// @title Deploy
/// @notice Deploys TrustScoreOracle + TrustGateHook
///
/// Usage:
///   # Dry run (no broadcast):
///   forge script script/Deploy.s.sol --rpc-url $RPC_URL -vvvv
///
///   # Deploy to Base Sepolia:
///   forge script script/Deploy.s.sol \
///     --rpc-url $BASE_SEPOLIA_RPC \
///     --private-key $PRIVATE_KEY \
///     --broadcast --verify \
///     --etherscan-api-key $BASESCAN_API_KEY \
///     -vvvv
///
/// Required env vars:
///   PRIVATE_KEY          — deployer private key
///   POOL_MANAGER_ADDRESS — Uniswap V4 PoolManager on target chain
///   BACKEND_UPDATER      — (optional) address to authorize as score updater
contract Deploy is Script {
    // Base Sepolia V4 PoolManager (update if different)
    // https://docs.uniswap.org/contracts/v4/deployments
    address constant BASE_SEPOLIA_POOL_MANAGER = 0x7Da1D65F8B249183667cdE74C5CBD46dD38aa829;

    function run() external {
        address poolManagerAddr = vm.envOr("POOL_MANAGER_ADDRESS", BASE_SEPOLIA_POOL_MANAGER);
        address backendUpdater = vm.envOr("BACKEND_UPDATER", address(0));
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console2.log("=== MAIAT Deployment ===");
        console2.log("Deployer:     ", deployer);
        console2.log("PoolManager:  ", poolManagerAddr);
        console2.log("BackendUpdater:", backendUpdater);
        console2.log("Chain ID:     ", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy TrustScoreOracle
        TrustScoreOracle oracle = new TrustScoreOracle(deployer);
        console2.log("TrustScoreOracle deployed:", address(oracle));

        // 2. Authorize backend updater (if provided)
        if (backendUpdater != address(0)) {
            oracle.setAuthorizedUpdater(backendUpdater, true);
            console2.log("Authorized updater:", backendUpdater);
        }

        // 3. Deploy TrustGateHook
        TrustGateHook hook = new TrustGateHook(
            oracle,
            IPoolManager(poolManagerAddr),
            deployer
        );
        console2.log("TrustGateHook deployed:", address(hook));
        console2.log("Default trust threshold:", hook.trustThreshold());

        vm.stopBroadcast();

        console2.log("\n=== Deployment Summary ===");
        console2.log("TrustScoreOracle:", address(oracle));
        console2.log("TrustGateHook:   ", address(hook));
        console2.log("\nNext steps:");
        console2.log("1. Set ORACLE_ADDRESS and HOOK_ADDRESS env vars");
        console2.log("2. Run Interact.s.sol to seed token scores");
        console2.log("3. Register hook with Uniswap V4 PoolManager");
    }
}
