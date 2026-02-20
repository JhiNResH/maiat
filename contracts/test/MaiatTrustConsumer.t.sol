// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2} from "forge-std/Test.sol";
import {MaiatTrustConsumer} from "../src/MaiatTrustConsumer.sol";

contract MaiatTrustConsumerTest is Test {
    MaiatTrustConsumer public consumer;

    address public owner     = address(this);
    address public forwarder = address(0xF0);
    address public attacker  = address(0xBAD);
    address public newOwner  = address(0x999);

    bytes32 constant PROJECT_A = keccak256("huckleberry-roasters");
    bytes32 constant PROJECT_B = keccak256("corvus-coffee");

    event TrustReportReceived(
        uint256 indexed reportId,
        uint256 reviewCount,
        uint256 avgTrustScore,
        uint256 timestamp
    );
    event ProjectTrustUpdated(
        bytes32 indexed projectId,
        uint256 newScore,
        uint256 totalReviews
    );
    event ForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        consumer = new MaiatTrustConsumer(forwarder);
    }

    // ─── Helpers ───────────────────────────────────────────────

    function _encodeReport(
        uint256 reviewCount,
        uint256 avgTrustScore,
        uint256 timestamp
    ) internal pure returns (bytes memory) {
        return abi.encode(MaiatTrustConsumer.TrustReport({
            reviewCount:   reviewCount,
            avgTrustScore: avgTrustScore,
            timestamp:     timestamp
        }));
    }

    // ─── Constructor ───────────────────────────────────────────

    function test_Constructor_SetsOwner() public view {
        assertEq(consumer.owner(), owner);
    }

    function test_Constructor_SetsForwarder() public view {
        assertEq(consumer.forwarder(), forwarder);
    }

    function test_Constructor_ReportCountZero() public view {
        assertEq(consumer.reportCount(), 0);
    }

    function test_Constructor_ZeroForwarderReverts() public {
        // [FIXED] Was HIGH audit finding — now reverts at constructor
        vm.expectRevert(MaiatTrustConsumer.MaiatTrustConsumer__ZeroAddress.selector);
        new MaiatTrustConsumer(address(0));
    }

    // ─── onReport ──────────────────────────────────────────────

    function test_OnReport_Success() public {
        bytes memory report = _encodeReport(10, 85, block.timestamp);

        vm.expectEmit(true, false, false, true);
        emit TrustReportReceived(1, 10, 85, block.timestamp);

        vm.prank(forwarder);
        consumer.onReport(report);

        assertEq(consumer.reportCount(), 1);

        (uint256 reviewCount, uint256 avgScore, uint256 ts) = consumer.getLatestReport();
        assertEq(reviewCount, 10);
        assertEq(avgScore,    85);
        assertEq(ts,          block.timestamp);
    }

    function test_OnReport_MaxValidScore() public {
        vm.prank(forwarder);
        consumer.onReport(_encodeReport(1, 100, block.timestamp));
        (, uint256 score,) = consumer.getLatestReport();
        assertEq(score, 100);
    }

    function test_OnReport_ZeroScore() public {
        vm.prank(forwarder);
        consumer.onReport(_encodeReport(1, 0, block.timestamp));
        (, uint256 score,) = consumer.getLatestReport();
        assertEq(score, 0);
    }

    function test_OnReport_ScoreOver100Reverts() public {
        // [FIXED] Was MEDIUM audit finding — now reverts
        bytes memory report = _encodeReport(1, 101, block.timestamp);
        vm.prank(forwarder);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__InvalidScore.selector, 101)
        );
        consumer.onReport(report);
    }

    function test_OnReport_Score999Reverts() public {
        bytes memory report = _encodeReport(1, 999, block.timestamp);
        vm.prank(forwarder);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__InvalidScore.selector, 999)
        );
        consumer.onReport(report);
    }

    function test_OnReport_MultipleReports_Increments() public {
        vm.startPrank(forwarder);
        consumer.onReport(_encodeReport(5,  70, block.timestamp));
        consumer.onReport(_encodeReport(10, 80, block.timestamp));
        consumer.onReport(_encodeReport(15, 90, block.timestamp));
        vm.stopPrank();

        assertEq(consumer.reportCount(), 3);
        (, uint256 score,) = consumer.getLatestReport();
        assertEq(score, 90);
    }

    function test_OnReport_StoresInMapping() public {
        vm.prank(forwarder);
        consumer.onReport(_encodeReport(7, 75, 12345));

        (uint256 reviewCount, uint256 avgTrustScore, uint256 ts) = consumer.reports(1);
        assertEq(reviewCount,   7);
        assertEq(avgTrustScore, 75);
        assertEq(ts,            12345);
    }

    function test_OnReport_NotForwarder_Reverts() public {
        bytes memory report = _encodeReport(5, 80, block.timestamp);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotForwarder.selector, address(this))
        );
        consumer.onReport(report);
    }

    function test_OnReport_AttackerReverts() public {
        bytes memory report = _encodeReport(5, 80, block.timestamp);
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotForwarder.selector, attacker)
        );
        consumer.onReport(report);
    }

    // ─── updateProjectTrust ────────────────────────────────────

    function test_UpdateProjectTrust_Success() public {
        vm.expectEmit(true, false, false, true);
        emit ProjectTrustUpdated(PROJECT_A, 88, 20);

        consumer.updateProjectTrust(PROJECT_A, 88, 20);

        (uint256 score, uint256 totalReviews,) = consumer.getProjectTrust(PROJECT_A);
        assertEq(score,        88);
        assertEq(totalReviews, 20);
    }

    function test_UpdateProjectTrust_ScoreOver100Reverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__InvalidScore.selector, 101)
        );
        consumer.updateProjectTrust(PROJECT_A, 101, 10);
    }

    function test_UpdateProjectTrust_AccumulatesReviews() public {
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
        consumer.updateProjectTrust(PROJECT_A, 85, 15);

        (uint256 score, uint256 totalReviews,) = consumer.getProjectTrust(PROJECT_A);
        assertEq(score,        85);  // overwritten
        assertEq(totalReviews, 25);  // accumulated
    }

    function test_UpdateProjectTrust_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotOwner.selector, attacker)
        );
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
    }

    function test_UpdateProjectTrust_MultipleProjects() public {
        consumer.updateProjectTrust(PROJECT_A, 90, 50);
        consumer.updateProjectTrust(PROJECT_B, 60, 12);

        (uint256 scoreA,,) = consumer.getProjectTrust(PROJECT_A);
        (uint256 scoreB,,) = consumer.getProjectTrust(PROJECT_B);

        assertEq(scoreA, 90);
        assertEq(scoreB, 60);
    }

    // ─── getProjectTrust ───────────────────────────────────────

    function test_GetProjectTrust_UnregisteredReturnsZero() public view {
        (uint256 score, uint256 reviews, uint256 ts) = consumer.getProjectTrust(
            keccak256("unknown-project")
        );
        assertEq(score,   0);
        assertEq(reviews, 0);
        assertEq(ts,      0);
    }

    function test_GetProjectTrust_UpdatesLastUpdated() public {
        uint256 before = block.timestamp;
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
        (,, uint256 ts) = consumer.getProjectTrust(PROJECT_A);
        assertEq(ts, before);
    }

    // ─── setForwarder ──────────────────────────────────────────

    function test_SetForwarder_Success() public {
        address newForwarder = address(0xAA);

        vm.expectEmit(true, true, false, false);
        emit ForwarderUpdated(forwarder, newForwarder);

        consumer.setForwarder(newForwarder);
        assertEq(consumer.forwarder(), newForwarder);
    }

    function test_SetForwarder_ZeroAddressReverts() public {
        vm.expectRevert(MaiatTrustConsumer.MaiatTrustConsumer__ZeroAddress.selector);
        consumer.setForwarder(address(0));
    }

    function test_SetForwarder_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotOwner.selector, attacker)
        );
        consumer.setForwarder(address(0xAA));
    }

    function test_SetForwarder_RotationWorks() public {
        address newForwarder = address(0xBB);
        consumer.setForwarder(newForwarder);

        // Old forwarder blocked
        vm.prank(forwarder);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotForwarder.selector, forwarder)
        );
        consumer.onReport(_encodeReport(5, 80, block.timestamp));

        // New forwarder works
        vm.prank(newForwarder);
        consumer.onReport(_encodeReport(5, 80, block.timestamp));
        assertEq(consumer.reportCount(), 1);
    }

    // ─── Two-step ownership ────────────────────────────────────

    function test_TransferOwnership_StartsTransfer() public {
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferStarted(owner, newOwner);

        consumer.transferOwnership(newOwner);
        assertEq(consumer.pendingOwner(), newOwner);
        assertEq(consumer.owner(),        owner); // still old owner
    }

    function test_AcceptOwnership_CompletesTransfer() public {
        consumer.transferOwnership(newOwner);

        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);

        vm.prank(newOwner);
        consumer.acceptOwnership();

        assertEq(consumer.owner(),        newOwner);
        assertEq(consumer.pendingOwner(), address(0));
    }

    function test_AcceptOwnership_NotPendingOwnerReverts() public {
        consumer.transferOwnership(newOwner);

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotPendingOwner.selector, attacker)
        );
        consumer.acceptOwnership();
    }

    function test_TransferOwnership_ZeroAddressReverts() public {
        // [FIXED] Was LOW audit finding — now reverts
        vm.expectRevert(MaiatTrustConsumer.MaiatTrustConsumer__ZeroAddress.selector);
        consumer.transferOwnership(address(0));
    }

    function test_TransferOwnership_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotOwner.selector, attacker)
        );
        consumer.transferOwnership(newOwner);
    }

    function test_TransferOwnership_OldOwnerRetainsAccessUntilAccepted() public {
        consumer.transferOwnership(newOwner);
        // Old owner still works until newOwner calls acceptOwnership
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
        assertEq(consumer.owner(), owner);
    }

    function test_TransferOwnership_OldOwnerLosesAccessAfterAccepted() public {
        consumer.transferOwnership(newOwner);
        vm.prank(newOwner);
        consumer.acceptOwnership();

        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__NotOwner.selector, owner)
        );
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
    }

    // ─── Fuzz ──────────────────────────────────────────────────

    function testFuzz_OnReport_ValidScoreRange(
        uint256 reviewCount,
        uint256 avgScore,
        uint256 timestamp
    ) public {
        avgScore = bound(avgScore, 0, 100);

        vm.prank(forwarder);
        consumer.onReport(_encodeReport(reviewCount, avgScore, timestamp));

        (, uint256 stored,) = consumer.getLatestReport();
        assertEq(stored, avgScore);
    }

    function testFuzz_OnReport_InvalidScoreReverts(uint256 avgScore) public {
        avgScore = bound(avgScore, 101, type(uint256).max);
        vm.prank(forwarder);
        vm.expectRevert(
            abi.encodeWithSelector(MaiatTrustConsumer.MaiatTrustConsumer__InvalidScore.selector, avgScore)
        );
        consumer.onReport(_encodeReport(1, avgScore, block.timestamp));
    }

    function testFuzz_ProjectTrust_AccumulationNeverOverflows(
        uint256 r1,
        uint256 r2
    ) public {
        r1 = bound(r1, 0, type(uint128).max);
        r2 = bound(r2, 0, type(uint128).max);

        consumer.updateProjectTrust(PROJECT_A, 80, r1);
        consumer.updateProjectTrust(PROJECT_A, 80, r2);

        (, uint256 total,) = consumer.getProjectTrust(PROJECT_A);
        assertEq(total, r1 + r2);
    }

    function testFuzz_ReportIdIncrementsMonotonically(uint8 n) public {
        n = uint8(bound(n, 1, 20));
        vm.startPrank(forwarder);
        for (uint256 i = 0; i < n; i++) {
            consumer.onReport(_encodeReport(i + 1, 70, block.timestamp + i));
        }
        vm.stopPrank();
        assertEq(consumer.reportCount(), n);
    }
}
