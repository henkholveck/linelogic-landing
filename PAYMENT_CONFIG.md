# Payment Configuration

## Crypto Addresses
Please update the payment addresses in `/app/credits/page.tsx`:

### Bitcoin Address
Line 248: Replace `[BTC_ADDRESS_HERE]` with your actual Bitcoin address

### Ethereum Address  
Line 258: Replace `[ETH_ADDRESS_HERE]` with your actual Ethereum address

### Venmo Username
Line 23: Currently set to `linelogicpay` - update if needed

## Usage
Users will:
1. Select credit package
2. Choose payment method (Venmo, Bitcoin, or Ethereum)
3. Get payment instructions with generated links/addresses
4. Submit their payment verification (username for Venmo, transaction ID for crypto)
5. Admin manually verifies and adds credits through admin panel