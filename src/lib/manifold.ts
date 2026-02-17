/**
 * Manifold.xyz Integration
 * 
 * Verify NFT ownership for review gating
 * Only users who purchased the merch (NFT holders) can leave reviews
 */

import { ethers } from 'ethers'

// ERC721 ABI (只需要 balanceOf)
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]

interface ManifoldNFT {
  contractAddress: string
  chainId: number
  name: string
  image?: string
}

/**
 * Check if wallet owns any NFT from the contract
 */
export async function checkNFTOwnership(
  walletAddress: string,
  nftContractAddress: string,
  rpcUrl: string
): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(nftContractAddress, ERC721_ABI, provider)
    
    const balance = await contract.balanceOf(walletAddress)
    return balance > 0n
  } catch (error) {
    console.error('Failed to check NFT ownership:', error)
    return false
  }
}

/**
 * Get Manifold contract metadata
 */
export async function getManifoldNFTInfo(
  contractAddress: string,
  rpcUrl: string
): Promise<ManifoldNFT | null> {
  try {
    // Basic info - in production, fetch from Manifold API or contract
    return {
      contractAddress,
      chainId: 8453, // Base mainnet
      name: 'ETHDenver Merch Collection',
    }
  } catch (error) {
    console.error('Failed to fetch Manifold NFT info:', error)
    return null
  }
}

/**
 * Example Manifold contract addresses for your friend's merch
 * Replace with actual deployed addresses
 */
export const MANIFOLD_MERCH_CONTRACTS = {
  base: '0x...', // Base mainnet contract
  baseTestnet: '0x...', // Base Sepolia testnet
}
