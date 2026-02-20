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
    address public forwarder;  // CRE forwarder address

    TrustReport public latestReport;
    uint256 public reportCount;
    mapping(uint256 => TrustReport) public reports;

    // Project-level trust tracking
    mapping(bytes32 => ProjectTrust) public projectTrust;

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

    // ─── Modifiers ───────────────────────────────────────────────────────

    modifier onlyForwarder() {
        require(msg.sender == forwarder, "Only CRE forwarder");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────

    constructor(address _forwarder) {
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
     * @notice Update trust score for a specific project
     * @dev Called by the owner or a secondary CRE workflow for per-project updates
     */
    function updateProjectTrust(
        bytes32 _projectId,
        uint256 _trustScore,
        uint256 _reviewCount
    ) external onlyOwner {
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

    function setForwarder(address _forwarder) external onlyOwner {
        forwarder = _forwarder;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }
}
