// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {TrustGateHook} from "../src/TrustGateHook.sol";
import {TrustScoreOracle} from "../src/TrustScoreOracle.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";

contract TrustGateHookTest is Test {
    TrustGateHook public hook;
    TrustScoreOracle public oracle;

    address public owner = address(this);
    address public updater = address(0x1);
    address public token0 = address(0x2);
    address public token1 = address(0x3);

    // Mock poolManager — beforeSwap now requires msg.sender == poolManager
    address public mockPoolManager = address(0xBEEF);

    function setUp() public {
        oracle = new TrustScoreOracle(owner);
        hook = new TrustGateHook(oracle, IPoolManager(mockPoolManager), owner);

        oracle.setAuthorizedUpdater(updater, true);
    }

    // ─── Oracle tests ──────────────────────────────────────────

    function test_OracleUpdateScore() public {
        vm.prank(updater);
        oracle.updateScore(token0, 80);
        assertEq(oracle.getScore(token0), 80);
    }

    function test_OracleUpdateScoreUnauthorized() public {
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__NotAuthorized.selector, address(this))
        );
        oracle.updateScore(token0, 80);
    }

    function test_OracleUpdateScoreInvalidScore() public {
        vm.prank(updater);
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__InvalidScore.selector, 101)
        );
        oracle.updateScore(token0, 101);
    }

    function test_OracleAuthorizeUpdater() public {
        address newUpdater = address(0x5);
        oracle.setAuthorizedUpdater(newUpdater, true);
        assertTrue(oracle.authorizedUpdaters(newUpdater));
    }

    function test_OracleZeroAddressUpdater() public {
        vm.expectRevert(TrustScoreOracle.TrustScoreOracle__ZeroAddress.selector);
        oracle.setAuthorizedUpdater(address(0), true);
    }

    function test_OracleBatchUpdateScores() public {
        address[] memory tokens = new address[](2);
        uint256[] memory scores = new uint256[](2);
        tokens[0] = token0;
        tokens[1] = token1;
        scores[0] = 75;
        scores[1] = 85;

        vm.prank(updater);
        oracle.batchUpdateScores(tokens, scores);

        assertEq(oracle.getScore(token0), 75);
        assertEq(oracle.getScore(token1), 85);
    }

    // ─── Hook threshold tests ──────────────────────────────────

    function test_HookUpdateThreshold() public {
        hook.updateThreshold(70);
        assertEq(hook.trustThreshold(), 70);
    }

    function test_HookUpdateThresholdInvalid() public {
        vm.expectRevert(
            abi.encodeWithSelector(TrustGateHook.TrustGateHook__InvalidThreshold.selector, 101)
        );
        hook.updateThreshold(101);
    }

    function test_HookUpdateThresholdUnauthorized() public {
        vm.prank(address(0x999));
        vm.expectRevert();
        hook.updateThreshold(70);
    }

    // ─── Hook beforeSwap tests ─────────────────────────────────

    function _makeKey() internal view returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
    }

    function _makeParams() internal pure returns (SwapParams memory) {
        return SwapParams({zeroForOne: true, amountSpecified: -100, sqrtPriceLimitX96: 0});
    }

    function test_BeforeSwapHighScore() public {
        vm.startPrank(updater);
        oracle.updateScore(token0, 80);
        oracle.updateScore(token1, 90);
        vm.stopPrank();

        vm.prank(mockPoolManager);
        (bytes4 selector,,) = hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
        assertEq(selector, IHooks.beforeSwap.selector);
    }

    function test_BeforeSwapLowScore() public {
        vm.startPrank(updater);
        oracle.updateScore(token0, 40); // Below threshold of 60
        oracle.updateScore(token1, 90);
        vm.stopPrank();

        vm.prank(mockPoolManager);
        vm.expectRevert(
            abi.encodeWithSelector(TrustGateHook.TrustScoreTooLow.selector, token0, 40, 60)
        );
        hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
    }

    function test_BeforeSwapNotPoolManager() public {
        vm.startPrank(updater);
        oracle.updateScore(token0, 80);
        oracle.updateScore(token1, 80);
        vm.stopPrank();

        // Anyone other than poolManager should revert
        vm.expectRevert(
            abi.encodeWithSelector(TrustGateHook.TrustGateHook__NotPoolManager.selector, address(this))
        );
        hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
    }

    function test_BeforeSwapThresholdChange() public {
        vm.startPrank(updater);
        oracle.updateScore(token0, 50);
        oracle.updateScore(token1, 50);
        vm.stopPrank();

        hook.updateThreshold(40);

        vm.prank(mockPoolManager);
        (bytes4 selector,,) = hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
        assertEq(selector, IHooks.beforeSwap.selector);
    }

    function test_BeforeSwapZeroScoreBlocks() public {
        // Unregistered tokens default to score 0 — deny-by-default
        vm.prank(mockPoolManager);
        vm.expectRevert(
            abi.encodeWithSelector(TrustGateHook.TrustScoreTooLow.selector, token0, 0, 60)
        );
        hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
    }

    // ─── Fuzz tests ────────────────────────────────────────────

    function testFuzz_ScoreThreshold(uint256 score, uint256 threshold) public {
        score = bound(score, 0, 100);
        threshold = bound(threshold, 0, 100);

        vm.prank(updater);
        oracle.updateScore(token0, score);
        vm.prank(updater);
        oracle.updateScore(token1, score);

        hook.updateThreshold(threshold);

        vm.prank(mockPoolManager);
        if (score >= threshold) {
            (bytes4 selector,,) = hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
            assertEq(selector, IHooks.beforeSwap.selector);
        } else {
            vm.expectRevert();
            hook.beforeSwap(address(0), _makeKey(), _makeParams(), "");
        }
    }

    function testFuzz_OracleScoreRange(uint256 score) public {
        if (score > 100) {
            vm.prank(updater);
            vm.expectRevert();
            oracle.updateScore(token0, score);
        } else {
            vm.prank(updater);
            oracle.updateScore(token0, score);
            assertEq(oracle.getScore(token0), score);
        }
    }
}
