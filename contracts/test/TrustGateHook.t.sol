// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {TrustGateHook} from "../src/TrustGateHook.sol";
import {TrustScoreOracle} from "../src/TrustScoreOracle.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";

contract TrustGateHookTest is Test {
    TrustGateHook public hook;
    TrustScoreOracle public oracle;
    
    address public owner = address(this);
    address public updater = address(0x1);
    address public token0 = address(0x2);
    address public token1 = address(0x3);
    
    function setUp() public {
        // Deploy oracle and hook
        oracle = new TrustScoreOracle(owner);
        hook = new TrustGateHook(oracle, owner);
        
        // Authorize updater
        oracle.setAuthorizedUpdater(updater, true);
    }
    
    function test_OracleUpdateScore() public {
        vm.prank(updater);
        oracle.updateScore(token0, 80);
        
        assertEq(oracle.getScore(token0), 80);
    }
    
    function test_OracleUpdateScoreUnauthorized() public {
        vm.expectRevert("TrustScoreOracle: not authorized");
        oracle.updateScore(token0, 80);
    }
    
    function test_OracleUpdateScoreInvalidScore() public {
        vm.prank(updater);
        vm.expectRevert("TrustScoreOracle: score must be <= 100");
        oracle.updateScore(token0, 101);
    }
    
    function test_OracleAuthorizeUpdater() public {
        address newUpdater = address(0x5);
        oracle.setAuthorizedUpdater(newUpdater, true);
        
        assertTrue(oracle.authorizedUpdaters(newUpdater));
    }
    
    function test_HookUpdateThreshold() public {
        hook.updateThreshold(70);
        assertEq(hook.trustThreshold(), 70);
    }
    
    function test_HookUpdateThresholdInvalid() public {
        vm.expectRevert("TrustGateHook: threshold must be <= 100");
        hook.updateThreshold(101);
    }
    
    function test_HookUpdateThresholdUnauthorized() public {
        vm.prank(address(0x999));
        vm.expectRevert();
        hook.updateThreshold(70);
    }
    
    function test_BeforeSwapHighScore() public {
        // Set high trust scores
        vm.startPrank(updater);
        oracle.updateScore(token0, 80);
        oracle.updateScore(token1, 90);
        vm.stopPrank();
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Call beforeSwap
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -100,
            sqrtPriceLimitX96: 0
        });
        
        (bytes4 selector,,) = hook.beforeSwap(address(0), key, params, "");
        assertEq(selector, IHooks.beforeSwap.selector);
    }
    
    function test_BeforeSwapLowScore() public {
        // Set low trust score for token0
        vm.startPrank(updater);
        oracle.updateScore(token0, 40); // Below threshold of 60
        oracle.updateScore(token1, 90);
        vm.stopPrank();
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Call beforeSwap - should revert
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -100,
            sqrtPriceLimitX96: 0
        });
        
        vm.expectRevert(
            abi.encodeWithSelector(
                TrustGateHook.TrustScoreTooLow.selector,
                token0,
                40,
                60
            )
        );
        hook.beforeSwap(address(0), key, params, "");
    }
    
    function test_BeforeSwapThresholdChange() public {
        // Set score at 50
        vm.startPrank(updater);
        oracle.updateScore(token0, 50);
        oracle.updateScore(token1, 50);
        vm.stopPrank();
        
        // Lower threshold to 40
        hook.updateThreshold(40);
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Should now pass
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -100,
            sqrtPriceLimitX96: 0
        });
        
        (bytes4 selector,,) = hook.beforeSwap(address(0), key, params, "");
        assertEq(selector, IHooks.beforeSwap.selector);
    }
    
    function test_BeforeSwapZeroScoreBlocks() public {
        // Don't set any scores (defaults to 0)
        
        // Create pool key
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Call beforeSwap - should revert because score 0 < threshold 60
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -100,
            sqrtPriceLimitX96: 0
        });
        
        vm.expectRevert(
            abi.encodeWithSelector(
                TrustGateHook.TrustScoreTooLow.selector,
                token0,
                0,
                60
            )
        );
        hook.beforeSwap(address(0), key, params, "");
    }
}
