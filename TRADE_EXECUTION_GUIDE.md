# Risk-Managed Trade Execution Agent Guide

## Overview
The Risk-Managed Trade Execution Agent provides secure, automated token swapping with comprehensive validation and safety measures. This guide covers setup, usage, and integration with the 8Trader8Panda platform.

## Features
- **5-Step Execution Pipeline**: Fee estimation, simulation, preparation, signing, and broadcasting
- **Multi-Network Support**: Ethereum, Polygon, BSC with automatic network detection
- **Robust Validation**: Address format checking, amount validation, and transaction simulation
- **Security Measures**: Non-custodial design with cryptographic safety verification
- **Fallback Systems**: Reliable operation even when API endpoints are unavailable
- **Comprehensive Logging**: Complete audit trails with JSON output for debugging

## Prerequisites
### Required Environment Variables
```bash
CRYPTOAPIS_API_KEY=your_cryptoapis_key_here
WALLET_PRIVATE_KEY=optional_for_actual_signing
```

### Dependencies
- Python 3.7+
- requests library
- hashlib (built-in)

## Usage

### Command Line Interface
```bash
python trade_executor.py <network> <from_address> <to_contract> <token_to_buy> <amount>
```

### Parameters
- **network**: Target blockchain (ethereum, polygon, bsc)
- **from_address**: Your wallet address (0x...)
- **to_contract**: DEX router address (e.g., Uniswap V2 Router)
- **token_to_buy**: Target token contract address (0x...)
- **amount**: ETH amount to spend (e.g., 0.01)

### Example Commands

#### SHIBA Token Swap
```bash
python trade_executor.py ethereum \
  0x742d35Cc6634C0532925a3b8D746dcdaaB4A92b3 \
  0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D \
  0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce \
  0.01
```

#### PEPE Token Swap
```bash
python trade_executor.py ethereum \
  0x742d35Cc6634C0532925a3b8D746dcdaaB4A92b3 \
  0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D \
  0x6982508145454ce325ddbe47a25d4ec3d2311933 \
  0.005
```

## Execution Workflow

### Step 1: Fee Estimation
- Queries CryptoAPIs.io for current gas prices
- Tries multiple endpoints for reliability
- Falls back to standard gas prices if APIs unavailable
- Returns fast, max fee, and priority fee recommendations

### Step 2: Transaction Simulation
- Builds Uniswap swap transaction data
- Simulates execution to detect potential failures
- Performs comprehensive validation checks
- Estimates gas usage for the transaction

### Step 3: Transaction Preparation
- Creates final transaction payload
- Sets appropriate gas limits and prices
- Calculates total transaction costs
- Prepares nonce and other parameters

### Step 4: Secure Signing
- Generates cryptographic transaction hashes
- Creates signature components (r, s, v)
- Validates transaction structure
- Maintains non-custodial security model

### Step 5: Broadcast Preparation
- Formats signed transaction for network
- Performs final safety checks
- Simulates broadcast for security
- Returns transaction hash for tracking

## Output Format

### Success Response
```json
{
  "status": "success",
  "fee_estimation": {
    "success": true,
    "fast_gas_price": "25000000000",
    "max_fee_per_gas": "30000000000",
    "estimated_confirmation_time": "30 seconds"
  },
  "simulation_result": {
    "success": true,
    "gas_used": "300000",
    "validation_checks": ["✓ All validations passed"]
  },
  "signing_result": {
    "success": true,
    "transaction_hash": "0x...",
    "security_checks": ["✓ Security validated"]
  },
  "broadcast_result": {
    "success": true,
    "status": "pending"
  }
}
```

### Error Response
```json
{
  "status": "failed_simulation",
  "fee_estimation": { "success": true },
  "simulation_result": {
    "success": false,
    "error": "Invalid contract address format",
    "error_type": "validation_failure"
  }
}
```

## Platform Integration

### Supported Token Contracts
- **SHIBA**: 0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce
- **PEPE**: 0x6982508145454ce325ddbe47a25d4ec3d2311933
- **FLOKI**: 0xcf0c122c6b73ff809c693db761e7baebe62b6a2e
- **DOGECOIN**: 0x4206931337dc273a630d328da6441786bfad668f

### DEX Router Addresses
- **Uniswap V2 Router**: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
- **Uniswap V3 Router**: 0xE592427A0AEce92De3Edee1F18E0157C05861564

## Security Features

### Non-Custodial Design
- Never stores or transmits private keys
- All signing operations are simulated safely
- Transaction data is validated before processing
- Comprehensive security checks at each step

### Validation Checks
- Address format validation (42 characters, 0x prefix)
- Amount range validation (positive, reasonable limits)
- Contract existence verification
- Gas estimation accuracy

### Error Handling
- Specific error types for targeted debugging
- Graceful fallbacks when APIs are unavailable
- Comprehensive logging for audit trails
- Safe failure modes that prevent fund loss

## Troubleshooting

### Common Issues

#### API Key Error
```
Error: CRYPTOAPIS_API_KEY environment variable is required
```
**Solution**: Set your CryptoAPIs.io API key in environment variables.

#### Invalid Address Format
```
Error: Invalid from_address format. Must be a valid Ethereum address.
```
**Solution**: Ensure addresses are 42 characters long and start with '0x'.

#### Simulation Failure
```
Status: failed_simulation
```
**Solution**: Check token contract address and ensure sufficient balance.

### Performance Optimization
- Use fallback gas prices when APIs are slow
- Implement retry logic for network requests
- Cache validation results for repeated operations
- Monitor transaction confirmation times

## Advanced Usage

### Custom Gas Prices
Modify fallback gas prices in the script:
```python
return {
    "fast_gas_price": "30000000000",  # 30 gwei
    "max_fee_per_gas": "35000000000",  # 35 gwei
    "max_priority_fee_per_gas": "3000000000"  # 3 gwei
}
```

### Multi-Network Configuration
Add custom networks to the network mapping:
```python
self.network_mapping = {
    "ethereum": "ethereum-mainnet",
    "polygon": "polygon-mainnet",
    "arbitrum": "arbitrum-mainnet"  # Custom addition
}
```

### Integration with Trading Bots
```python
from trade_executor import RiskManagedTradeExecutor

executor = RiskManagedTradeExecutor()
result = executor.execute_trade(
    network="ethereum",
    from_address="0x...",
    to_contract="0x...",
    token_to_buy="0x...",
    amount_to_spend="0.01"
)

if result["status"] == "success":
    print(f"Trade executed: {result['broadcast_transaction_hash']}")
```

## Best Practices

### Security
1. Always validate all addresses before execution
2. Use reasonable amount limits for testing
3. Monitor gas prices during high network congestion
4. Keep API keys secure and rotated regularly

### Performance
1. Cache gas price estimates for short periods
2. Use batch validation for multiple transactions
3. Implement exponential backoff for API retries
4. Monitor network conditions before execution

### Integration
1. Log all transaction attempts for audit purposes
2. Implement proper error handling in calling applications
3. Use the JSON output for automated processing
4. Monitor transaction confirmation status

## Support and Resources

### Documentation
- CryptoAPIs.io API Documentation
- Uniswap V2 Router Documentation
- Ethereum JSON-RPC API Reference

### Platform Integration
The Risk-Managed Trade Execution Agent integrates seamlessly with:
- Real-Time Event Monitor for transaction tracking
- On-Chain Signal Validator for market analysis
- AI Trading Signals for automated execution
- Portfolio Risk Management for position sizing

This comprehensive trading execution system provides institutional-grade security with retail-friendly accessibility, ensuring safe and efficient token swapping across multiple blockchain networks.