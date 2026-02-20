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

    // ─── [AUDIT] Constructor: zero forwarder accepted (known risk) ─

    function test_Audit_ZeroForwarder_BricksOnReport() public {
        // If forwarder is address(0), onReport can never be called by a real address
        // because no EOA/contract has msg.sender == address(0) in production
        MaiatTrustConsumer broken = new MaiatTrustConsumer(address(0));
        assertEq(broken.forwarder(), address(0));

        bytes memory report = _encodeReport(5, 80, block.timestamp);

        // Any real caller (forwarder, owner, attacker) is blocked
        vm.prank(forwarder);
        vm.expectRevert("Only CRE forwarder");
        broken.onReport(report);

        vm.prank(owner);
        vm.expectRevert("Only CRE forwarder");
        broken.onReport(report);

        vm.prank(attacker);
        vm.expectRevert("Only CRE forwarder");
        broken.onReport(report);

        // Only fix is to call setForwarder() to update it (owner can still do that)
        broken.setForwarder(forwarder);
        vm.prank(forwarder);
        broken.onReport(report); // now works
        assertEq(broken.reportCount(), 1);
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

    function test_OnReport_MultipleReports_Increments() public {
        vm.startPrank(forwarder);
        consumer.onReport(_encodeReport(5,  70, block.timestamp));
        consumer.onReport(_encodeReport(10, 80, block.timestamp));
        consumer.onReport(_encodeReport(15, 90, block.timestamp));
        vm.stopPrank();

        assertEq(consumer.reportCount(), 3);

        (uint256 count, uint256 score,) = consumer.getLatestReport();
        assertEq(count, 15);
        assertEq(score, 90);
    }

    function test_OnReport_StoresInMapping() public {
        bytes memory report = _encodeReport(7, 75, 12345);

        vm.prank(forwarder);
        consumer.onReport(report);

        // Public mapping getter returns tuple fields
        (uint256 reviewCount, uint256 avgTrustScore, uint256 ts) = consumer.reports(1);
        assertEq(reviewCount,   7);
        assertEq(avgTrustScore, 75);
        assertEq(ts,            12345);
    }

    function test_OnReport_NotForwarder_Reverts() public {
        bytes memory report = _encodeReport(5, 80, block.timestamp);

        vm.expectRevert("Only CRE forwarder");
        consumer.onReport(report);
    }

    function test_OnReport_AttackerReverts() public {
        bytes memory report = _encodeReport(5, 80, block.timestamp);

        vm.prank(attacker);
        vm.expectRevert("Only CRE forwarder");
        consumer.onReport(report);
    }

    // ─── [AUDIT] onReport: no score bounds validation ──────────

    function test_Audit_OnReport_NoScoreValidation() public {
        // KNOWN RISK: avgTrustScore > 100 accepted without revert
        // Malicious forwarder can write garbage scores on-chain
        bytes memory report = _encodeReport(1, 999, block.timestamp);

        vm.prank(forwarder);
        consumer.onReport(report); // does NOT revert — intentional audit finding

        (, uint256 score,) = consumer.getLatestReport();
        assertEq(score, 999); // score > 100 stored unchecked
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

    function test_UpdateProjectTrust_AccumulatesReviews() public {
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
        consumer.updateProjectTrust(PROJECT_A, 85, 15); // += 15

        (uint256 score, uint256 totalReviews,) = consumer.getProjectTrust(PROJECT_A);
        assertEq(score,        85);   // overwritten
        assertEq(totalReviews, 25);   // accumulated
    }

    function test_UpdateProjectTrust_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert("Only owner");
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
        consumer.setForwarder(newForwarder);
        assertEq(consumer.forwarder(), newForwarder);
    }

    function test_SetForwarder_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert("Only owner");
        consumer.setForwarder(address(0xAA));
    }

    function test_SetForwarder_ChangesTakeEffect() public {
        address newForwarder = address(0xBB);
        consumer.setForwarder(newForwarder);

        // Old forwarder can no longer call onReport
        vm.prank(forwarder);
        vm.expectRevert("Only CRE forwarder");
        consumer.onReport(_encodeReport(5, 80, block.timestamp));

        // New forwarder can
        vm.prank(newForwarder);
        consumer.onReport(_encodeReport(5, 80, block.timestamp));
        assertEq(consumer.reportCount(), 1);
    }

    // ─── transferOwnership ─────────────────────────────────────

    function test_TransferOwnership_Success() public {
        consumer.transferOwnership(newOwner);
        assertEq(consumer.owner(), newOwner);
    }

    function test_TransferOwnership_NotOwnerReverts() public {
        vm.prank(attacker);
        vm.expectRevert("Only owner");
        consumer.transferOwnership(attacker);
    }

    function test_TransferOwnership_OldOwnerLosesAccess() public {
        consumer.transferOwnership(newOwner);

        vm.expectRevert("Only owner");
        consumer.updateProjectTrust(PROJECT_A, 80, 10);
    }

    // ─── [AUDIT] transferOwnership: one-step, typo = locked ───

    function test_Audit_TransferOwnership_NoZeroCheck() public {
        // KNOWN RISK: transferring to address(0) loses contract control forever
        consumer.transferOwnership(address(0));
        assertEq(consumer.owner(), address(0)); // bricked
    }

    // ─── Fuzz ──────────────────────────────────────────────────

    function testFuzz_OnReport_AnyValues(
        uint256 reviewCount,
        uint256 avgScore,
        uint256 timestamp
    ) public {
        bytes memory report = _encodeReport(reviewCount, avgScore, timestamp);

        vm.prank(forwarder);
        consumer.onReport(report);

        (, uint256 storedScore,) = consumer.getLatestReport();
        assertEq(storedScore, avgScore); // stored as-is (no validation)
    }

    function testFuzz_ProjectTrust_AccumulationNeverOverflows(
        uint256 r1,
        uint256 r2
    ) public {
        // Bound to safe values to avoid uint256 overflow in totalReviews
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
