// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {BaseTestHooks} from "v4-core/test/BaseTestHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/types/BeforeSwapDelta.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {TrustScoreOracle} from "./TrustScoreOracle.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title TrustGateHook
/// @notice Uniswap V4 hook that checks token trust scores before allowing swaps
/// @dev Queries TrustScoreOracle and reverts if trust score is below threshold
/// @dev NOTE: Uses BaseTestHooks for hackathon demo. Production should use BaseHook from v4-periphery.
contract TrustGateHook is BaseTestHooks, Ownable {
    using BeforeSwapDeltaLibrary for BeforeSwapDelta;

    TrustScoreOracle public immutable oracle;
    IPoolManager public immutable poolManager;
    uint256 public trustThreshold;

    event TrustGateChecked(address indexed token, uint256 score, bool passed);
    event SwapBlocked(address indexed token, uint256 score, uint256 threshold);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    error TrustGateHook__TrustScoreTooLow(address token, uint256 score, uint256 threshold);
    error TrustGateHook__InvalidThreshold(uint256 threshold);
    error TrustGateHook__ZeroAddress();
    error TrustGateHook__NotPoolManager(address caller);

    // Keep old error name for backwards compat with tests
    error TrustScoreTooLow(address token, uint256 score, uint256 threshold);

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert TrustGateHook__NotPoolManager(msg.sender);
        _;
    }

    constructor(
        TrustScoreOracle _oracle,
        IPoolManager _poolManager,
        address initialOwner
    ) Ownable(initialOwner) {
        if (address(_oracle) == address(0)) revert TrustGateHook__ZeroAddress();
        if (address(_poolManager) == address(0)) revert TrustGateHook__ZeroAddress();
        if (initialOwner == address(0)) revert TrustGateHook__ZeroAddress();

        oracle = _oracle;
        poolManager = _poolManager;
        trustThreshold = 60; // Default: deny-by-default for unregistered tokens
    }

    /// @notice Update the trust score threshold (owner only)
    /// @param newThreshold New threshold value (0-100)
    function updateThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold > 100) revert TrustGateHook__InvalidThreshold(newThreshold);
        uint256 oldThreshold = trustThreshold;
        trustThreshold = newThreshold;
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }

    /// @notice Hook called before a swap — checks trust scores of both pool tokens
    /// @dev Only callable by the PoolManager
    function beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) external override onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
        // Check currency0 trust score (skip native ETH)
        address token0 = Currency.unwrap(key.currency0);
        if (token0 != address(0)) {
            uint256 score0 = oracle.getScore(token0);
            if (score0 < trustThreshold) {
                emit SwapBlocked(token0, score0, trustThreshold);
                revert TrustScoreTooLow(token0, score0, trustThreshold);
            }
            emit TrustGateChecked(token0, score0, true);
        }

        // Check currency1 trust score (skip native ETH)
        address token1 = Currency.unwrap(key.currency1);
        if (token1 != address(0)) {
            uint256 score1 = oracle.getScore(token1);
            if (score1 < trustThreshold) {
                emit SwapBlocked(token1, score1, trustThreshold);
                revert TrustScoreTooLow(token1, score1, trustThreshold);
            }
            emit TrustGateChecked(token1, score1, true);
        }

        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
