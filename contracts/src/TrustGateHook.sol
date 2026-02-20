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
contract TrustGateHook is BaseTestHooks, Ownable {
    using BeforeSwapDeltaLibrary for BeforeSwapDelta;
    
    TrustScoreOracle public immutable oracle;
    uint256 public trustThreshold;
    
    event TrustGateChecked(address indexed token, uint256 score, bool passed);
    event SwapBlocked(address indexed token, uint256 score, uint256 threshold);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    
    error TrustScoreTooLow(address token, uint256 score, uint256 threshold);
    
    constructor(
        TrustScoreOracle _oracle,
        address initialOwner
    ) Ownable(initialOwner) {
        oracle = _oracle;
        trustThreshold = 60; // Default threshold
    }
    
    /// @notice Update the trust score threshold
    /// @param newThreshold New threshold value (0-100)
    function updateThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 100, "TrustGateHook: threshold must be <= 100");
        uint256 oldThreshold = trustThreshold;
        trustThreshold = newThreshold;
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /// @notice Hook called before a swap
    /// @dev Checks trust scores of both tokens in the pool
    function beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        // Check currency0 trust score
        address token0 = Currency.unwrap(key.currency0);
        if (token0 != address(0)) { // Skip native ETH
            uint256 score0 = oracle.getScore(token0);
            if (score0 < trustThreshold) {
                emit SwapBlocked(token0, score0, trustThreshold);
                revert TrustScoreTooLow(token0, score0, trustThreshold);
            }
            emit TrustGateChecked(token0, score0, true);
        }
        
        // Check currency1 trust score
        address token1 = Currency.unwrap(key.currency1);
        if (token1 != address(0)) { // Skip native ETH
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
