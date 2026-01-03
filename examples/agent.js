#!/usr/bin/env node
/**
 * Super402.casino Gambling Agent
 *
 * A fully functional agent that plays the casino using x402 payments on Solana.
 * Works on both devnet (testing) and mainnet (real money).
 *
 * Website: https://super402.casino
 * Protocol: https://x402.org
 */

const { Keypair, Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
const { createX402Client } = require('x402-solana');
const bs58 = require('bs58');

// ============================================================================
// CONFIGURATION - Edit these values or use environment variables
// ============================================================================

const CONFIG = {
  // Your wallet private key (base58 encoded) - REQUIRED
  walletKey: process.env.WALLET_PRIVATE_KEY,

  // Casino URL
  casinoUrl: process.env.CASINO_URL || 'https://super402.casino',

  // Network: 'solana-devnet' for testing, 'solana' for mainnet
  network: process.env.NETWORK || 'solana-devnet',

  // RPC URL - use Helius for production
  rpcUrl: process.env.RPC_URL || (
    process.env.NETWORK === 'solana'
      ? 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
      : 'https://api.devnet.solana.com'
  ),

  // Betting tier: bronze, silver, gold, or platinum
  tier: process.env.TIER || 'bronze',

  // Maximum games to play (0 = infinite)
  maxAttempts: parseInt(process.env.MAX_ATTEMPTS || '10'),

  // Delay between games (milliseconds)
  intervalMs: parseInt(process.env.INTERVAL_MS || '30000'),

  // Stop playing after first win?
  stopOnWin: process.env.STOP_ON_WIN === 'true',

  // Agent name (for logging)
  agentName: process.env.AGENT_NAME || 'Agent',

  // Minimum prize pool to play (0 = always play)
  minPoolBalance: parseFloat(process.env.MIN_POOL_BALANCE || '0'),

  // USDC Token Mint Address
  // Devnet: Use casino's devnet USDC
  // Mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  usdcMint: process.env.USDC_MINT || (
    process.env.NETWORK === 'solana'
      ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // Mainnet USDC
      : '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'   // Devnet USDC
  ),
};

// ============================================================================
// GAMBLING AGENT CLASS
// ============================================================================

class GamblingAgent {
  constructor(config) {
    this.config = config;
    this.wallet = Keypair.fromSecretKey(bs58.decode(config.walletKey));
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.running = false;
    this.x402Client = null;
    this.stats = {
      attempts: 0,
      wins: 0,
      losses: 0,
      totalWagered: 0,
      totalWon: 0,
      startTime: null,
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.config.agentName}] ${message}`);
  }

  async initialize() {
    this.log('Initializing x402 client...');

    // Create wallet adapter for x402
    const walletAdapter = {
      publicKey: this.wallet.publicKey,
      signTransaction: async (tx) => {
        tx.sign([this.wallet]);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.sign([this.wallet]));
        return txs;
      },
    };

    // Initialize x402 client
    this.x402Client = createX402Client({
      wallet: walletAdapter,
      network: this.config.network,
      rpcUrl: this.config.rpcUrl,
    });

    this.log('x402 client initialized');
  }

  async getSOLBalance() {
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / 1e9;
    } catch (error) {
      this.log(`Error getting SOL balance: ${error.message}`);
      return 0;
    }
  }

  async getUSDCBalance() {
    try {
      const usdcMint = new PublicKey(this.config.usdcMint);
      const ata = await getAssociatedTokenAddress(usdcMint, this.wallet.publicKey);
      const account = await getAccount(this.connection, ata);
      return Number(account.amount) / 1e6; // USDC has 6 decimals
    } catch (error) {
      return 0; // Account might not exist
    }
  }

  async getTiers() {
    const response = await fetch(`${this.config.casinoUrl}/api/casino/tiers`);
    if (!response.ok) throw new Error('Failed to fetch tiers');
    const data = await response.json();
    return data.tiers;
  }

  async getPrizePool() {
    const response = await fetch(`${this.config.casinoUrl}/api/casino/prize-pool`);
    if (!response.ok) throw new Error('Failed to fetch prize pool');
    return await response.json();
  }

  async playGame() {
    const url = `${this.config.casinoUrl}/api/casino/play/${this.config.tier}`;

    try {
      // x402 client automatically handles:
      // 1. Initial request
      // 2. Gets 402 response with payment requirements
      // 3. Creates and signs USDC payment
      // 4. Retries with X-PAYMENT header
      const response = await this.x402Client.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      if (error.message.includes('Insufficient')) {
        throw new Error('Insufficient USDC balance');
      }
      if (error.message.includes('402')) {
        throw new Error('Payment failed - check USDC balance and SOL for fees');
      }
      throw error;
    }
  }

  async runOnce() {
    this.stats.attempts++;

    try {
      // Check prize pool if minimum is set
      if (this.config.minPoolBalance > 0) {
        const pool = await this.getPrizePool();
        const poolBalance = parseFloat(pool.balance);

        if (poolBalance < this.config.minPoolBalance) {
          this.log(`Pool ($${poolBalance.toFixed(2)}) below minimum ($${this.config.minPoolBalance}), skipping...`);
          return { skipped: true, reason: 'pool_too_low' };
        }
      }

      // Check USDC balance before playing
      const usdcBalance = await this.getUSDCBalance();
      const tierPrices = { bronze: 0.1, silver: 0.5, gold: 1.0, platinum: 5.0 };
      const requiredAmount = tierPrices[this.config.tier] || 0.1;

      if (usdcBalance < requiredAmount) {
        this.log(`Insufficient USDC: ${usdcBalance.toFixed(2)} < ${requiredAmount} required`);
        return { error: 'insufficient_funds', balance: usdcBalance, required: requiredAmount };
      }

      this.log(`Playing ${this.config.tier} tier (attempt #${this.stats.attempts})...`);
      this.log(`   USDC Balance: $${usdcBalance.toFixed(2)}`);

      const result = await this.playGame();

      // Update stats
      if (result.betAmount) {
        this.stats.totalWagered += result.betAmount;
      }

      if (result.isWinner) {
        this.stats.wins++;
        this.stats.totalWon += result.prizeAmount || 0;
        const prizeUSDC = (result.prizeAmount / 1e6).toFixed(2);
        const multiplier = result.multiplier ? result.multiplier.toFixed(1) : '?';
        this.log(`WIN! Prize: $${prizeUSDC} USDC (${multiplier}x)`);
        this.log(`   TX: ${result.transactionSignature || 'N/A'}`);
        return { ...result, shouldStop: this.config.stopOnWin };
      } else {
        this.stats.losses++;
        const prob = result.winProbability ? (result.winProbability * 100).toFixed(2) : '?';
        this.log(`Loss. Win probability was ${prob}%`);
        return result;
      }

    } catch (error) {
      this.log(`Error: ${error.message}`);
      return { error: error.message };
    }
  }

  async run() {
    this.running = true;
    this.stats.startTime = new Date();

    this.log(`Starting gambling agent`);
    this.log(`========================================`);
    this.log(`   Wallet:   ${this.wallet.publicKey.toString()}`);
    this.log(`   Casino:   ${this.config.casinoUrl}`);
    this.log(`   Network:  ${this.config.network}`);
    this.log(`   Tier:     ${this.config.tier}`);
    this.log(`   Interval: ${this.config.intervalMs / 1000}s`);
    this.log(`   Max:      ${this.config.maxAttempts || 'unlimited'}`);

    // Initialize x402 client
    await this.initialize();

    // Check balances
    const solBalance = await this.getSOLBalance();
    const usdcBalance = await this.getUSDCBalance();
    this.log(`   SOL:      ${solBalance.toFixed(4)} SOL`);
    this.log(`   USDC:     $${usdcBalance.toFixed(2)}`);

    if (solBalance < 0.001) {
      this.log(`\nNot enough SOL for transaction fees!`);
      this.log(`   Get devnet SOL: solana airdrop 2 ${this.wallet.publicKey.toString()} --url devnet`);
      return;
    }

    if (usdcBalance < 0.1) {
      this.log(`\nNot enough USDC to play!`);
      this.log(`   You need at least $0.10 USDC for bronze tier`);
      return;
    }

    try {
      const pool = await this.getPrizePool();
      this.log(`   Pool:     $${pool.balance}`);
    } catch (e) {
      this.log(`   Pool:     (couldn't fetch)`);
    }

    this.log(`========================================`);
    this.log(`\nLet's gamble!\n`);

    let attempts = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    while (this.running) {
      attempts++;

      const result = await this.runOnce();

      if (result.error) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          this.log(`\nToo many consecutive errors (${maxConsecutiveErrors}), stopping...`);
          break;
        }
        await this.sleep(Math.min(this.config.intervalMs * 2, 60000));
        continue;
      } else {
        consecutiveErrors = 0;
      }

      if (result.shouldStop) {
        this.log(`\nWon! Stopping as configured...`);
        break;
      }

      if (result.error === 'insufficient_funds') {
        this.log(`\nOut of funds, stopping...`);
        break;
      }

      if (this.config.maxAttempts > 0 && attempts >= this.config.maxAttempts) {
        this.log(`\nMax attempts (${this.config.maxAttempts}) reached, stopping...`);
        break;
      }

      if (this.running && !result.skipped) {
        await this.sleep(this.config.intervalMs);
      } else if (result.skipped) {
        await this.sleep(60000);
      }
    }

    await this.printSummary();
  }

  stop() {
    this.log(`Stop signal received`);
    this.running = false;
  }

  async printSummary() {
    const runtime = this.stats.startTime
      ? Math.floor((Date.now() - this.stats.startTime) / 1000)
      : 0;

    const minutes = Math.floor(runtime / 60);
    const seconds = runtime % 60;

    const finalSOL = await this.getSOLBalance();
    const finalUSDC = await this.getUSDCBalance();

    this.log(`\nSession Summary`);
    this.log(`========================================`);
    this.log(`   Runtime:     ${minutes}m ${seconds}s`);
    this.log(`   Games:       ${this.stats.attempts}`);
    this.log(`   Wins:        ${this.stats.wins}`);
    this.log(`   Losses:      ${this.stats.losses}`);
    this.log(`   Win Rate:    ${this.stats.attempts > 0 ? ((this.stats.wins / this.stats.attempts) * 100).toFixed(1) : 0}%`);
    this.log(`   Wagered:     $${(this.stats.totalWagered / 1e6).toFixed(2)} USDC`);
    this.log(`   Won:         $${(this.stats.totalWon / 1e6).toFixed(2)} USDC`);
    this.log(`   Net:         $${((this.stats.totalWon - this.stats.totalWagered) / 1e6).toFixed(2)} USDC`);
    this.log(`   Final SOL:   ${finalSOL.toFixed(4)}`);
    this.log(`   Final USDC:  $${finalUSDC.toFixed(2)}`);
    this.log(`========================================`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════╗
║   Super402.casino Gambling Agent       ║
║   https://super402.casino              ║
╚════════════════════════════════════════╝
`);

  if (!CONFIG.walletKey) {
    console.error('WALLET_PRIVATE_KEY environment variable required\n');
    console.log('Usage:');
    console.log('  WALLET_PRIVATE_KEY=xxx TIER=bronze node agent.js\n');
    console.log('Environment variables:');
    console.log('  WALLET_PRIVATE_KEY  - Base58 private key (required)');
    console.log('  CASINO_URL          - Casino URL (default: https://super402.casino)');
    console.log('  RPC_URL             - Solana RPC URL');
    console.log('  NETWORK             - solana-devnet or solana (default: solana-devnet)');
    console.log('  TIER                - bronze|silver|gold|platinum (default: bronze)');
    console.log('  MAX_ATTEMPTS        - Max games, 0=infinite (default: 10)');
    console.log('  INTERVAL_MS         - Ms between games (default: 30000)');
    console.log('  STOP_ON_WIN         - Stop after winning (default: false)');
    console.log('  MIN_POOL_BALANCE    - Min pool to play (default: 0)');
    console.log('  USDC_MINT           - USDC token mint address');
    process.exit(1);
  }

  const agent = new GamblingAgent(CONFIG);

  // Graceful shutdown
  process.on('SIGINT', () => { console.log('\n'); agent.stop(); });
  process.on('SIGTERM', () => agent.stop());

  try {
    await agent.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
