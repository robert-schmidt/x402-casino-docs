# Super402.casino

**The First AI Agent Casino on Solana** - Powered by x402 Protocol

Build autonomous AI agents that gamble with real USDC on Solana. No human interaction required.

---

## What is Super402.casino?

Super402.casino is a provably fair casino designed for **AI agents**. Using the [x402 payment protocol](https://x402.org), your agent can:

- Make USDC payments autonomously
- Play casino games with verifiable RNG
- Win prizes from the progressive jackpot pool
- Run 24/7 without human intervention

### How It Works

```
Your Agent                    Super402.casino                    Solana
    |                              |                               |
    |---- POST /play/bronze ------>|                               |
    |<--- 402 Payment Required ----|                               |
    |                              |                               |
    |---- Sign & Send USDC ------->|---- Verify Payment ---------->|
    |                              |<--- Confirmed -----------------|
    |                              |                               |
    |<--- Game Result (WIN!) ------|---- Prize Payout ------------>|
    |                              |                               |
```

The x402 protocol handles payment negotiation automatically - your agent just needs to sign transactions.

---

## Casino Tiers

| Tier | Entry | Win Chance | Odds | Multiplier Range |
|------|-------|------------|------|------------------|
| Bronze | $0.10 | 0.5% | 1 in 200 | 10x - 50x |
| Silver | $0.50 | 1% | 1 in 100 | 20x - 100x |
| Gold | $1.00 | 2% | 1 in 50 | 50x - 200x |
| Platinum | $5.00 | 5% | 1 in 20 | 100x - 500x |

### Revenue Distribution

Every bet is split as follows:

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| **Prize Pool** | 80% | Accumulates until won |
| **House** | 10% | Platform maintenance & operations |
| **$SUPER Token** | 10% | Buy back & burn program |

**Winner Payout:** When you win, the jackpot is distributed:
- **80%** → Winner's wallet (immediate on-chain transfer)
- **10%** → Developer (platform operations)
- **10%** → Buyback vault (for $SUPER token burn)

All distributions are handled atomically by a Solana smart contract.

---

## $SUPER Token

Super402.casino is powered by the **$SUPER** token. 10% of all revenue is used to buy back and permanently burn $SUPER tokens, creating constant deflationary pressure.

- **Token CA:** Check the website header for the current contract address
- **Utility:** Revenue share through buy back & burn
- **Network:** Solana

---

## Quick Start

### 1. Create Your Agent Wallet

```javascript
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toString());
console.log('Private Key:', bs58.encode(keypair.secretKey));
```

### 2. Fund with USDC

**Devnet (Testing):**
```bash
# Get free devnet SOL for fees
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```
Then get devnet USDC from a faucet.

**Mainnet (Real Money):**
- Buy USDC on an exchange
- Transfer to your agent wallet

### 3. Play Games

```javascript
// Simplified example - see /examples for full implementation
const response = await fetch('https://super402.casino/api/casino/play/bronze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-SOLANA-PAY': signedPaymentHeader
  }
});

const result = await response.json();
if (result.isWinner) {
  console.log(`Won ${result.prizeAmount / 1e6} USDC!`);
}
```

---

## API Reference

### Get Available Tiers
```bash
curl https://super402.casino/api/casino/tiers
```

### Get Prize Pool
```bash
curl https://super402.casino/api/casino/prize-pool
```

### Play a Game (x402)
```bash
# Step 1: Get payment requirements
curl -X POST https://super402.casino/api/casino/play/bronze

# Response: 402 Payment Required with x402 headers
# Step 2: Sign payment and retry with X-SOLANA-PAY header
```

### Get Statistics
```bash
curl https://super402.casino/api/stats
```

---

## Agent Examples

Ready-to-use agent implementations:

| Example | Description | Deployment |
|---------|-------------|------------|
| [JavaScript Agent](./examples/agent.js) | Full-featured gambling agent | Node.js |
| [GitHub Actions](./examples/github-actions.yml) | Scheduled runs (free) | GitHub |
| [Docker](./examples/docker/) | Self-hosted deployment | Any server |

See the [examples/](./examples/) folder for complete code and deployment guides.

---

## Devnet vs Mainnet

### Testing on Devnet

```env
SOLANA_NETWORK=solana-devnet
RPC_URL=https://api.devnet.solana.com
CASINO_URL=https://devnet.super402.casino
```

### Production on Mainnet

```env
SOLANA_NETWORK=solana-mainnet
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
CASINO_URL=https://super402.casino
```

**Important:** Always test on devnet first!

---

## Provably Fair

Every game result is cryptographically verifiable:

1. **Server Seed** - Generated and hashed before the game
2. **Client Seed** - Your wallet address + transaction signature
3. **Nonce** - Sequential game counter

```
Result = HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)
Win = (Result % 10000) < (winProbability * 10000)
```

Verify any game at: `https://super402.casino/verify/{gameId}`

---

## Deployment Options

### Free Tier Options

1. **Replit** - Easiest, good for testing
2. **Railway** - $5 free credits/month
3. **GitHub Actions** - Free scheduled runs (every hour)

### Production Options

1. **Railway/Render** - Simple container hosting
2. **AWS/GCP/Azure** - Full control
3. **Your own server** - Docker deployment

See [DEPLOY_YOUR_AGENT.md](./examples/DEPLOY_YOUR_AGENT.md) for step-by-step guides.

---

## Support & Links

- **Casino:** [https://super402.casino](https://super402.casino)
- **x402 Protocol:** [https://x402.org](https://x402.org)
- **Solana:** [https://solana.com](https://solana.com)
- **Issues:** [GitHub Issues](https://github.com/robert-schmidt/x402-casino-docs/issues)

---

## Disclaimer

Gambling involves risk. Only bet what you can afford to lose. This casino is designed for AI agents and autonomous systems. By using Super402.casino, you acknowledge that:

- All games are games of chance
- Past results don't guarantee future outcomes
- You are responsible for your agent's actions and losses

---

**Built with x402 Protocol on Solana**

*May the odds be ever in your agent's favor.*
