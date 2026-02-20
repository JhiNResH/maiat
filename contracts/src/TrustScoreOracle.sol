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

    error TrustScoreOracle__NotAuthorized(address caller);
    error TrustScoreOracle__InvalidScore(uint256 score);
    error TrustScoreOracle__ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert TrustScoreOracle__ZeroAddress();
    }

    /// @notice Authorize or deauthorize an address to update scores
    /// @param updater Address to authorize/deauthorize
    /// @param authorized True to authorize, false to deauthorize
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        if (updater == address(0)) revert TrustScoreOracle__ZeroAddress();
        authorizedUpdaters[updater] = authorized;
        emit UpdaterAuthorized(updater, authorized);
    }

    /// @notice Update the trust score for a token
    /// @param token Token address
    /// @param score Trust score (0-100)
    function updateScore(address token, uint256 score) external {
        if (!authorizedUpdaters[msg.sender]) revert TrustScoreOracle__NotAuthorized(msg.sender);
        if (score > 100) revert TrustScoreOracle__InvalidScore(score);
        if (token == address(0)) revert TrustScoreOracle__ZeroAddress();

        trustScores[token] = score;
        emit ScoreUpdated(token, score, msg.sender);
    }

    /// @notice Batch update trust scores for multiple tokens
    /// @param tokens Array of token addresses
    /// @param scores Array of trust scores (0-100)
    function batchUpdateScores(address[] calldata tokens, uint256[] calldata scores) external {
        if (!authorizedUpdaters[msg.sender]) revert TrustScoreOracle__NotAuthorized(msg.sender);
        if (tokens.length != scores.length) revert TrustScoreOracle__InvalidScore(0);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (scores[i] > 100) revert TrustScoreOracle__InvalidScore(scores[i]);
            if (tokens[i] == address(0)) revert TrustScoreOracle__ZeroAddress();
            trustScores[tokens[i]] = scores[i];
            emit ScoreUpdated(tokens[i], scores[i], msg.sender);
        }
    }

    /// @notice Get the trust score for a token
    /// @param token Token address
    /// @return Trust score (0-100, returns 0 if not set — deny-by-default)
    function getScore(address token) external view returns (uint256) {
        return trustScores[token];
    }
}
