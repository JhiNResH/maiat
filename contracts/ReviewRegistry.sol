// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReviewRegistry
 * @notice Minimal on-chain proof for Maat reviews (BNB Good Vibes demo)
 * @dev Stores review hashes on BSC Testnet for verification
 */
contract ReviewRegistry {
    // Review struct
    struct Review {
        address reviewer;
        string category; // e.g., "m/openclaw-skills"
        string projectId; // e.g., "skill-123"
        bytes32 contentHash; // keccak256(review content)
        uint256 timestamp;
        bool exists;
    }
    
    // Mapping: reviewId => Review
    mapping(bytes32 => Review) public reviews;
    
    // Array of all review IDs (for enumeration)
    bytes32[] public reviewIds;
    
    // Mapping: reviewer => their review IDs
    mapping(address => bytes32[]) public reviewerToReviews;
    
    // Events
    event ReviewSubmitted(
        bytes32 indexed reviewId,
        address indexed reviewer,
        string category,
        string projectId,
        bytes32 contentHash,
        uint256 timestamp
    );
    
    /**
     * @notice Submit a review hash to the registry
     * @param category The category (e.g., "m/openclaw-skills")
     * @param projectId The project being reviewed
     * @param contentHash keccak256 of the review content
     */
    function submitReview(
        string calldata category,
        string calldata projectId,
        bytes32 contentHash
    ) external returns (bytes32 reviewId) {
        // Generate unique review ID
        reviewId = keccak256(
            abi.encodePacked(
                msg.sender,
                category,
                projectId,
                contentHash,
                block.timestamp
            )
        );
        
        // Store review
        reviews[reviewId] = Review({
            reviewer: msg.sender,
            category: category,
            projectId: projectId,
            contentHash: contentHash,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Add to arrays
        reviewIds.push(reviewId);
        reviewerToReviews[msg.sender].push(reviewId);
        
        // Emit event
        emit ReviewSubmitted(
            reviewId,
            msg.sender,
            category,
            projectId,
            contentHash,
            block.timestamp
        );
        
        return reviewId;
    }
    
    /**
     * @notice Verify if a review exists
     * @param reviewId The review ID to check
     */
    function verifyReview(bytes32 reviewId) external view returns (bool) {
        return reviews[reviewId].exists;
    }
    
    /**
     * @notice Get review details
     * @param reviewId The review ID
     */
    function getReview(bytes32 reviewId) external view returns (
        address reviewer,
        string memory category,
        string memory projectId,
        bytes32 contentHash,
        uint256 timestamp
    ) {
        Review memory r = reviews[reviewId];
        require(r.exists, "Review does not exist");
        return (r.reviewer, r.category, r.projectId, r.contentHash, r.timestamp);
    }
    
    /**
     * @notice Get all reviews by a reviewer
     * @param reviewer The reviewer address
     */
    function getReviewsByReviewer(address reviewer) external view returns (bytes32[] memory) {
        return reviewerToReviews[reviewer];
    }
    
    /**
     * @notice Get total number of reviews
     */
    function getTotalReviews() external view returns (uint256) {
        return reviewIds.length;
    }
}
