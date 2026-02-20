// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {TrustScoreOracle} from "../src/TrustScoreOracle.sol";

contract TrustScoreOracleTest is Test {
    TrustScoreOracle public oracle;

    address public owner = address(this);
    address public updater = address(0x1);
    address public attacker = address(0x2);
    address public token = address(0x100);
    address public token2 = address(0x200);

    event ScoreUpdated(address indexed token, uint256 score, address indexed updater);
    event UpdaterAuthorized(address indexed updater, bool authorized);

    function setUp() public {
        oracle = new TrustScoreOracle(owner);
        oracle.setAuthorizedUpdater(updater, true);
    }

    // ─── Constructor ───────────────────────────────────────────

    function test_Constructor_ZeroOwnerReverts() public {
        vm.expectRevert(TrustScoreOracle.TrustScoreOracle__ZeroAddress.selector);
        new TrustScoreOracle(address(0));
    }

    function test_Constructor_SetsOwner() public view {
        assertEq(oracle.owner(), owner);
    }

    // ─── setAuthorizedUpdater ──────────────────────────────────

    function test_SetUpdater_Authorize() public {
        address newUpdater = address(0x99);
        vm.expectEmit(true, false, false, true);
        emit UpdaterAuthorized(newUpdater, true);
        oracle.setAuthorizedUpdater(newUpdater, true);
        assertTrue(oracle.authorizedUpdaters(newUpdater));
    }

    function test_SetUpdater_Deauthorize() public {
        oracle.setAuthorizedUpdater(updater, false);
        assertFalse(oracle.authorizedUpdaters(updater));
    }

    function test_SetUpdater_ZeroAddressReverts() public {
        vm.expectRevert(TrustScoreOracle.TrustScoreOracle__ZeroAddress.selector);
        oracle.setAuthorizedUpdater(address(0), true);
    }

    function test_SetUpdater_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert();
        oracle.setAuthorizedUpdater(attacker, true);
    }

    // ─── updateScore ───────────────────────────────────────────

    function test_UpdateScore_Success() public {
        vm.expectEmit(true, false, true, true);
        emit ScoreUpdated(token, 85, updater);

        vm.prank(updater);
        oracle.updateScore(token, 85);

        assertEq(oracle.getScore(token), 85);
    }

    function test_UpdateScore_Zero() public {
        vm.prank(updater);
        oracle.updateScore(token, 0);
        assertEq(oracle.getScore(token), 0);
    }

    function test_UpdateScore_MaxScore() public {
        vm.prank(updater);
        oracle.updateScore(token, 100);
        assertEq(oracle.getScore(token), 100);
    }

    function test_UpdateScore_OverMaxReverts() public {
        vm.prank(updater);
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__InvalidScore.selector, 101)
        );
        oracle.updateScore(token, 101);
    }

    function test_UpdateScore_UnauthorizedReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__NotAuthorized.selector, address(this))
        );
        oracle.updateScore(token, 80);
    }

    function test_UpdateScore_AttackerReverts() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__NotAuthorized.selector, attacker)
        );
        oracle.updateScore(token, 80);
    }

    function test_UpdateScore_ZeroTokenReverts() public {
        vm.prank(updater);
        vm.expectRevert(TrustScoreOracle.TrustScoreOracle__ZeroAddress.selector);
        oracle.updateScore(address(0), 80);
    }

    function test_UpdateScore_Overwrite() public {
        vm.startPrank(updater);
        oracle.updateScore(token, 50);
        oracle.updateScore(token, 90);
        vm.stopPrank();
        assertEq(oracle.getScore(token), 90);
    }

    // ─── batchUpdateScores ─────────────────────────────────────

    function test_BatchUpdate_Success() public {
        address[] memory tokens = new address[](3);
        uint256[] memory scores = new uint256[](3);
        tokens[0] = address(0x100);
        tokens[1] = address(0x200);
        tokens[2] = address(0x300);
        scores[0] = 70;
        scores[1] = 85;
        scores[2] = 95;

        vm.prank(updater);
        oracle.batchUpdateScores(tokens, scores);

        assertEq(oracle.getScore(tokens[0]), 70);
        assertEq(oracle.getScore(tokens[1]), 85);
        assertEq(oracle.getScore(tokens[2]), 95);
    }

    function test_BatchUpdate_LengthMismatchReverts() public {
        address[] memory tokens = new address[](2);
        uint256[] memory scores = new uint256[](3);
        tokens[0] = token;
        tokens[1] = token2;
        scores[0] = 70;
        scores[1] = 85;
        scores[2] = 90;

        vm.prank(updater);
        vm.expectRevert();
        oracle.batchUpdateScores(tokens, scores);
    }

    function test_BatchUpdate_UnauthorizedReverts() public {
        address[] memory tokens = new address[](1);
        uint256[] memory scores = new uint256[](1);
        tokens[0] = token;
        scores[0] = 80;

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__NotAuthorized.selector, attacker)
        );
        oracle.batchUpdateScores(tokens, scores);
    }

    // ─── getScore ──────────────────────────────────────────────

    function test_GetScore_UnregisteredReturnsZero() public view {
        assertEq(oracle.getScore(address(0xDEAD)), 0);
    }

    // ─── Fuzz ──────────────────────────────────────────────────

    function testFuzz_UpdateScore_ValidRange(uint256 score) public {
        score = bound(score, 0, 100);
        vm.prank(updater);
        oracle.updateScore(token, score);
        assertEq(oracle.getScore(token), score);
    }

    function testFuzz_UpdateScore_InvalidRange(uint256 score) public {
        score = bound(score, 101, type(uint256).max);
        vm.prank(updater);
        vm.expectRevert(
            abi.encodeWithSelector(TrustScoreOracle.TrustScoreOracle__InvalidScore.selector, score)
        );
        oracle.updateScore(token, score);
    }

    function testFuzz_MultipleTokens(address tok, uint256 score) public {
        vm.assume(tok != address(0));
        score = bound(score, 0, 100);
        vm.prank(updater);
        oracle.updateScore(tok, score);
        assertEq(oracle.getScore(tok), score);
    }
}
