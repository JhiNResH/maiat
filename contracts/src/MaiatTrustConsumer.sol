// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MaiatTrustConsumer
 * @notice Receives verified trust score reports from Chainlink CRE workflow.
 * @dev Designed to work with the Maiat Trust Score Oracle CRE workflow.
 *      The workflow fetches reviews, verifies them with AI, and writes
 *      aggregate trust scores on-chain via this consumer.
 *
 * Hackathon: Chainlink Convergence (CRE & AI track)
 *
 * Security fixes applied (post-audit):
 * - [HIGH]   Zero address validation on constructor, setForwarder, transferOwnership
 * - [MEDIUM] avgTrustScore bounded 0-100 in onReport
 * - [MEDIUM] Events added for setForwarder and transferOwnership
 * - [LOW]    Two-step ownership transfer (pendingOwner pattern)
 * - [LOW]    Custom errors replacing require strings
 */
contract MaiatTrustConsumer {
    // ─── Structs ─────────────────────────────────────────────────────────

    struct TrustReport {
        uint256 reviewCount;
        uint256 avgTrustScore;    // 0-100
        uint256 timestamp;
    }

    struct ProjectTrust {
        uint256 totalReviews;
        uint256 currentTrustScore;
        uint256 lastUpdated;
        uint256 reportCount;
    }

    // ─── State ───────────────────────────────────────────────────────────

    address public owner;
    address public pendingOwner;  // two-step ownership
    address public forwarder;     // CRE forwarder address

    TrustReport public latestReport;
    uint256 public reportCount;
    mapping(uint256 => TrustReport) public reports;

    mapping(bytes32 => ProjectTrust) public projectTrust;

    // ─── Errors ──────────────────────────────────────────────────────────

    error MaiatTrustConsumer__NotForwarder(address caller);
    error MaiatTrustConsumer__NotOwner(address caller);
    error MaiatTrustConsumer__NotPendingOwner(address caller);
    error MaiatTrustConsumer__ZeroAddress();
    error MaiatTrustConsumer__InvalidScore(uint256 score);

    // ─── Events ──────────────────────────────────────────────────────────

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

    // ─── Modifiers ───────────────────────────────────────────────────────

    modifier onlyForwarder() {
        if (msg.sender != forwarder) revert MaiatTrustConsumer__NotForwarder(msg.sender);
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert MaiatTrustConsumer__NotOwner(msg.sender);
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────

    constructor(address _forwarder) {
        if (_forwarder == address(0)) revert MaiatTrustConsumer__ZeroAddress();
        owner = msg.sender;
        forwarder = _forwarder;
    }

    // ─── CRE Report Handler ─────────────────────────────────────────────

    /**
     * @notice Called by CRE forwarder with verified trust report data
     * @param report ABI-encoded TrustReport struct
     */
    function onReport(bytes calldata report) external onlyForwarder {
        TrustReport memory trustReport = abi.decode(report, (TrustReport));

        // [AUDIT FIX] Validate score is within bounds
        if (trustReport.avgTrustScore > 100)
            revert MaiatTrustConsumer__InvalidScore(trustReport.avgTrustScore);

        reportCount++;
        reports[reportCount] = trustReport;
        latestReport = trustReport;

        emit TrustReportReceived(
            reportCount,
            trustReport.reviewCount,
            trustReport.avgTrustScore,
            trustReport.timestamp
        );
    }

    /**
     * @notice Update trust score for a specific project (owner or CRE secondary workflow)
     */
    function updateProjectTrust(
        bytes32 _projectId,
        uint256 _trustScore,
        uint256 _reviewCount
    ) external onlyOwner {
        if (_trustScore > 100) revert MaiatTrustConsumer__InvalidScore(_trustScore);

        ProjectTrust storage pt = projectTrust[_projectId];
        pt.currentTrustScore = _trustScore;
        pt.totalReviews += _reviewCount;
        pt.lastUpdated = block.timestamp;
        pt.reportCount++;

        emit ProjectTrustUpdated(_projectId, _trustScore, pt.totalReviews);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getProjectTrust(bytes32 _projectId) external view returns (
        uint256 score,
        uint256 totalReviews,
        uint256 lastUpdated
    ) {
        ProjectTrust memory pt = projectTrust[_projectId];
        return (pt.currentTrustScore, pt.totalReviews, pt.lastUpdated);
    }

    function getLatestReport() external view returns (
        uint256 reviewCount,
        uint256 avgTrustScore,
        uint256 timestamp
    ) {
        return (
            latestReport.reviewCount,
            latestReport.avgTrustScore,
            latestReport.timestamp
        );
    }

    // ─── Admin ───────────────────────────────────────────────────────────

    /**
     * @notice Update the CRE forwarder address
     * @dev Call this after `cre login` to set the real CRE forwarder
     */
    function setForwarder(address _forwarder) external onlyOwner {
        if (_forwarder == address(0)) revert MaiatTrustConsumer__ZeroAddress();
        address old = forwarder;
        forwarder = _forwarder;
        emit ForwarderUpdated(old, _forwarder);
    }

    /**
     * @notice Initiate two-step ownership transfer
     * @dev New owner must call acceptOwnership() to complete
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert MaiatTrustConsumer__ZeroAddress();
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    /**
     * @notice Complete ownership transfer (called by pending owner)
     */
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert MaiatTrustConsumer__NotPendingOwner(msg.sender);
        address old = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(old, owner);
    }
}
