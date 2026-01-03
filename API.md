# Super402.casino API Reference

Base URL: `https://super402.casino`

---

## Public Endpoints

### Get Casino Tiers

Returns available betting tiers and their configurations.

```http
GET /api/casino/tiers
```

**Response:**
```json
{
  "tiers": [
    {
      "id": "bronze",
      "name": "Bronze",
      "price": "$0.10",
      "priceUSDC": "100000",
      "description": "Entry level - test your luck!",
      "winChance": "0.5%",
      "odds": "1 in 200",
      "minMultiplier": 10,
      "maxMultiplier": 50
    },
    {
      "id": "silver",
      "name": "Silver",
      "price": "$0.50",
      "priceUSDC": "500000",
      "description": "Better odds for bigger wins",
      "winChance": "1%",
      "odds": "1 in 100",
      "minMultiplier": 20,
      "maxMultiplier": 100
    }
  ]
}
```

---

### Get Prize Pool

Returns the current prize pool status.

```http
GET /api/casino/prize-pool
```

**Response:**
```json
{
  "balance": "156.42",
  "displayBalance": "125.14",
  "thresholdMet": true,
  "minThreshold": "10.00",
  "houseSplit": "20%",
  "winnerSplit": "80%"
}
```

| Field | Description |
|-------|-------------|
| `balance` | Total pool balance (USDC) |
| `displayBalance` | Winnable amount (80% of total) |
| `thresholdMet` | Whether minimum threshold is met for payouts |

---

### Get Statistics

Returns casino-wide statistics.

```http
GET /api/stats
```

**Response:**
```json
{
  "totalGamesPlayed": 1234,
  "totalWagered": "567.89",
  "totalPaidOut": "432.10",
  "totalPlayers": 42,
  "houseProfit": "135.79",
  "prizePoolBalance": "125.14",
  "lastPrize": {
    "amount": "12.50",
    "winner": "8xKy...3nPq",
    "tier": "gold",
    "timeAgo": "5m ago"
  },
  "topPlayersByVolume": [...],
  "latestWins": [...],
  "recentGames": [...]
}
```

---

### Get Player Stats

Returns statistics for a specific wallet.

```http
GET /api/casino/player/:walletAddress
```

**Response:**
```json
{
  "walletAddress": "8xKy...3nPq",
  "gamesPlayed": 50,
  "totalWagered": "15.00",
  "totalWon": "25.50",
  "wins": 3,
  "losses": 47,
  "winRate": "6%",
  "netProfit": "10.50",
  "lastPlayed": 1704123456789
}
```

---

## x402 Payment Endpoint

### Play Game

Plays a casino game. Requires x402 payment.

```http
POST /api/casino/play/:tierId
```

**Headers:**
```
Content-Type: application/json
```

**Step 1: Initial Request**

Returns 402 Payment Required with x402 payment information.

```http
HTTP/1.1 402 Payment Required
X-Payment-Scheme: x402
X-Payment-Network: solana-devnet
X-Payment-Amount: 100000
X-Payment-Token: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
X-Payment-Recipient: TREASURY_ADDRESS
```

**Step 2: Payment Request**

Sign the payment transaction and retry with the X-PAYMENT header.

```http
POST /api/casino/play/:tierId
X-PAYMENT: <signed-transaction-base64>
```

**Success Response:**
```json
{
  "gameId": "game_abc123",
  "isWinner": true,
  "betAmount": 100000,
  "prizeAmount": 2500000,
  "multiplier": 25.0,
  "winProbability": 0.005,
  "penaltyApplied": false,
  "randomValue": 0.0023,
  "threshold": 0.005,
  "transactionSignature": "5xyz...",
  "verificationUrl": "https://super402.casino/verify/game_abc123"
}
```

| Field | Description |
|-------|-------------|
| `isWinner` | Whether the game was won |
| `betAmount` | Amount wagered (micro-USDC) |
| `prizeAmount` | Amount won (micro-USDC, 0 if lost) |
| `multiplier` | Win multiplier applied |
| `winProbability` | Effective win chance |
| `penaltyApplied` | Whether whale penalty was applied |
| `transactionSignature` | On-chain payout TX (if winner) |
| `verificationUrl` | URL to verify game fairness |

---

## Using the x402 Client

The x402 client handles payment negotiation automatically:

```javascript
const { createX402Client } = require('x402-solana');

const client = createX402Client({
  wallet: walletAdapter,
  network: 'solana-devnet',
  rpcUrl: 'https://api.devnet.solana.com',
});

// The client automatically:
// 1. Makes initial request
// 2. Receives 402 response
// 3. Signs and submits payment
// 4. Retries with X-PAYMENT header
const response = await client.fetch('https://super402.casino/api/casino/play/bronze', {
  method: 'POST',
});

const result = await response.json();
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Public endpoints | 100 req/min |
| Play endpoints | 10 games/min per wallet |

---

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

| Code | Description |
|------|-------------|
| `INSUFFICIENT_FUNDS` | Wallet lacks USDC |
| `THRESHOLD_NOT_MET` | Prize pool below minimum |
| `INVALID_TIER` | Unknown tier ID |
| `PAYMENT_FAILED` | x402 payment verification failed |
| `RATE_LIMITED` | Too many requests |

---

## Webhook Support (Coming Soon)

Configure webhooks to receive real-time notifications:

- Game results
- Prize payouts
- Jackpot alerts

---

## Support

- **Docs:** [github.com/robert-schmidt/x402-casino-docs](https://github.com/robert-schmidt/x402-casino-docs)
- **x402 Protocol:** [x402.org](https://x402.org)
