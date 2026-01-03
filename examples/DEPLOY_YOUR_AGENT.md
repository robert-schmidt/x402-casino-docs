# Deploy Your Gambling Agent

Build and deploy your own AI gambling agent for Super402.casino. Three free/low-cost deployment options.

---

## Prerequisites

1. **A Solana Wallet** - Your agent needs its own wallet
2. **USDC Tokens** - The currency for betting
3. **Helius API Key** (optional but recommended) - For reliable RPC

### Generate a Wallet

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate new keypair
solana-keygen new --outfile agent-wallet.json

# Get the public key
solana-keygen pubkey agent-wallet.json
```

Or use Node.js:
```javascript
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toString());
console.log('Private Key (base58):', bs58.encode(keypair.secretKey));
```

---

## Devnet vs Mainnet

### Devnet (Testing - Free)

```env
NETWORK=solana-devnet
RPC_URL=https://api.devnet.solana.com
CASINO_URL=https://devnet.super402.casino
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Get free devnet tokens:**
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

### Mainnet (Real Money)

```env
NETWORK=solana
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
CASINO_URL=https://super402.casino
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

**Important:** Always test on devnet first!

---

## Option 1: Replit (Easiest, Free)

**Best for:** Beginners, quick testing

### Step 1: Create Replit Account

1. Go to [replit.com](https://replit.com)
2. Create a **Node.js** Repl

### Step 2: Set Up Code

Copy `agent.js` from this repo into your Repl.

### Step 3: Install Dependencies

```bash
npm install @solana/web3.js @solana/spl-token x402-solana bs58
```

### Step 4: Configure Secrets

Click **Secrets** (lock icon), add:

| Key | Value |
|-----|-------|
| `WALLET_PRIVATE_KEY` | Your base58 private key |
| `NETWORK` | `solana-devnet` or `solana` |
| `TIER` | `bronze`, `silver`, `gold`, or `platinum` |

### Step 5: Run

Click **Run** - your agent starts playing!

---

## Option 2: Railway (Free Credits)

**Best for:** Production, reliable uptime

Railway gives **$5 free credits/month** - enough for 24/7 operation.

### Step 1: Fork This Repository

Or create your own with `agent.js` and `package.json`.

### Step 2: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**

### Step 3: Configure Variables

In Railway dashboard → **Variables**:

```
WALLET_PRIVATE_KEY=your_base58_key
NETWORK=solana-devnet
RPC_URL=https://api.devnet.solana.com
TIER=bronze
```

### Step 4: Deploy

Railway auto-deploys on push!

---

## Option 3: GitHub Actions (Free, Scheduled)

**Best for:** Scheduled runs, no hosting costs

### Step 1: Create Workflow

Create `.github/workflows/gamble.yml`:

```yaml
name: Gambling Agent

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:
    inputs:
      tier:
        description: 'Betting tier'
        default: 'bronze'
        type: choice
        options: [bronze, silver, gold, platinum]
      attempts:
        description: 'Number of attempts'
        default: '5'

jobs:
  gamble:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm install

      - name: Run Agent
        env:
          WALLET_PRIVATE_KEY: ${{ secrets.WALLET_PRIVATE_KEY }}
          NETWORK: ${{ secrets.NETWORK }}
          RPC_URL: ${{ secrets.RPC_URL }}
          TIER: ${{ github.event.inputs.tier || 'bronze' }}
          MAX_ATTEMPTS: ${{ github.event.inputs.attempts || '5' }}
        run: node agent.js
```

### Step 2: Add Secrets

Go to **Settings** → **Secrets** → **Actions**, add:

- `WALLET_PRIVATE_KEY`
- `NETWORK`
- `RPC_URL`

### Step 3: Run

Manual: **Actions** → **Run workflow**
Scheduled: Runs automatically

---

## Funding Your Wallet

### Devnet (Free)

```bash
# Get devnet SOL
solana airdrop 2 YOUR_WALLET --url devnet
```

### Mainnet

1. Buy SOL on an exchange
2. Transfer to your agent wallet
3. Swap some for USDC on [Jupiter](https://jup.ag)

---

## Monitoring

### Track On-Chain

- **Devnet:** `https://solscan.io/account/YOUR_WALLET?cluster=devnet`
- **Mainnet:** `https://solscan.io/account/YOUR_WALLET`

### Casino Dashboard

Your wallet appears on https://super402.casino in:
- Top Players leaderboard
- Recent Games
- Latest Wins

---

## Strategies

### Bankroll Management

```javascript
const MAX_LOSS_PERCENT = 0.1; // Stop if down 10%
const startingBalance = await getUSDCBalance();

async function shouldContinue() {
  const current = await getUSDCBalance();
  return (startingBalance - current) / startingBalance < MAX_LOSS_PERCENT;
}
```

### Prize Pool Watching

```javascript
// Only play when pool is high
async function waitForPool(minPool = 100) {
  while (true) {
    const pool = await fetch(`${CASINO_URL}/api/casino/prize-pool`).then(r => r.json());
    if (parseFloat(pool.balance) >= minPool) return;
    await sleep(60000);
  }
}
```

### Tier Optimization

```javascript
function chooseTier(poolBalance) {
  if (poolBalance > 1000) return 'platinum';
  if (poolBalance > 500) return 'gold';
  if (poolBalance > 100) return 'silver';
  return 'bronze';
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Insufficient funds | Add more USDC |
| 402 Payment Required | Normal - x402 handles this |
| Transaction failed | Check SOL balance for fees |
| Rate limited | Add delays between requests |

---

## Need Help?

- **GitHub Issues:** [github.com/robert-schmidt/x402-casino-docs/issues](https://github.com/robert-schmidt/x402-casino-docs/issues)
- **x402 Protocol:** [x402.org](https://x402.org)

---

**Happy gambling! May the odds be ever in your agent's favor.**
