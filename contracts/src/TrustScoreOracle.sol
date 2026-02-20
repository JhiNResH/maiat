// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title TrustScoreOracle
/// @notice Oracle that stores and manages trust scores for tokens
/// @dev Only authorized updaters can modify trust scores
contract TrustScoreOracle is Ownable {
    // Mapping from token address to trust score (0-100)
    mapping(address => uint256) private trustScores;
    
    // Mapping of authorized updaters (e.g., Maat backend)
    mapping(address => bool) public authorizedUpdaters;
    
    event ScoreUpdated(address indexed token, uint256 score, address indexed updater);
    event UpdaterAuthorized(address indexed updater, bool authorized);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /// @notice Authorize or deauthorize an address to update scores
    /// @param updater Address to authorize/deauthorize
    /// @param authorized True to authorize, false to deauthorize
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit UpdaterAuthorized(updater, authorized);
    }
    
    /// @notice Update the trust score for a token
    /// @param token Token address
    /// @param score Trust score (0-100)
    function updateScore(address token, uint256 score) external {
        require(authorizedUpdaters[msg.sender], "TrustScoreOracle: not authorized");
        require(score <= 100, "TrustScoreOracle: score must be <= 100");
        
        trustScores[token] = score;
        emit ScoreUpdated(token, score, msg.sender);
    }
    
    /// @notice Get the trust score for a token
    /// @param token Token address
    /// @return Trust score (0-100, returns 0 if not set)
    function getScore(address token) external view returns (uint256) {
        return trustScores[token];
    }
}
