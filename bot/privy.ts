/**
 * Privy Server SDK integration for Telegram bot
 * Creates embedded wallets for Telegram users
 */

import { PrivyClient } from '@privy-io/server-auth'

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

interface WalletResult {
  userId: string
  walletAddress: string
  isNew: boolean
}

/**
 * Get or create a Privy user + embedded wallet from a Telegram ID
 */
export async function getOrCreateWallet(telegramId: string, displayName?: string): Promise<WalletResult | null> {
  try {
    // Try to find existing user by custom ID (telegram:{id})
    const customId = `telegram:${telegramId}`
    
    // Search for existing user
    let user: any = null
    try {
      user = await (privy as any).getUserByCustomId(customId)
    } catch (e) {
      // User doesn't exist yet
    }

    if (user) {
      // Find their embedded wallet
      const wallet = user.linkedAccounts?.find(
        (a: any) => a.type === 'wallet' && a.walletClientType === 'privy'
      )
      return {
        userId: user.id,
        walletAddress: (wallet as any)?.address || '',
        isNew: false,
      }
    }

    // Create new user with a custom ID linked account
    const newUser = await privy.importUser({
      linkedAccounts: [
        {
          type: 'custom_auth',
          custom_user_id: customId,
        } as any,
      ],
      createEthereumWallet: true,
    })

    // Get the created wallet
    const wallet = newUser.linkedAccounts?.find(
      (a: any) => a.type === 'wallet' && a.walletClientType === 'privy'
    )

    return {
      userId: newUser.id,
      walletAddress: (wallet as any)?.address || '',
      isNew: true,
    }
  } catch (error) {
    console.error('Privy wallet creation failed:', error)
    return null
  }
}
