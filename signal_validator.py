#!/usr/bin/env python3
"""
On-Chain Signal Validator
Validates social media sentiment spikes with authentic on-chain transaction data
Uses CryptoAPIs.io to fetch real blockchain data for comprehensive analysis
"""

import os
import requests
import json
import sys
from typing import Dict, List, Any, Optional
import statistics

class OnChainSignalValidator:
    def __init__(self):
        self.api_key = os.getenv("CRYPTOAPIS_API_KEY")
        if not self.api_key:
            raise ValueError("CRYPTOAPIS_API_KEY environment variable is required")
        
        self.base_url = "https://rest.cryptoapis.io/v2"
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_token_details(self, network: str, contract_address: str) -> Dict[str, Any]:
        """Fetch token details including total supply and holder count"""
        endpoint = f"{self.base_url}/blockchain-data/{network}/addresses/{contract_address}/token-details"
        
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            return {
                "name": data.get("data", {}).get("item", {}).get("name", "Unknown"),
                "symbol": data.get("data", {}).get("item", {}).get("symbol", "UNKNOWN"),
                "total_supply": data.get("data", {}).get("item", {}).get("totalSupply", "0"),
                "holders_count": data.get("data", {}).get("item", {}).get("holdersCount", 0)
            }
        except requests.exceptions.RequestException as e:
            print(f"Error fetching token details: {e}", file=sys.stderr)
            return {
                "name": "Unknown Token",
                "symbol": "UNKNOWN",
                "total_supply": "0",
                "holders_count": 0
            }
    
    def fetch_recent_transactions(self, network: str, contract_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch recent token transfer transactions"""
        endpoint = f"{self.base_url}/blockchain-data/{network}/addresses/{contract_address}/token-transfers"
        params = {
            "limit": limit,
            "context": "yourExampleString"
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            transactions = data.get("data", {}).get("items", [])
            return transactions
        except requests.exceptions.RequestException as e:
            print(f"Error fetching transactions: {e}", file=sys.stderr)
            return []
    
    def calculate_transaction_volume(self, transactions: List[Dict[str, Any]]) -> float:
        """Calculate total transaction volume from recent transfers"""
        total_volume = 0.0
        
        for tx in transactions:
            try:
                # Get token amount and convert to float
                token_amount = float(tx.get("contractAddress", {}).get("amount", 0))
                
                # For this MVP, we'll simulate USD conversion
                # In production, you'd fetch current token price from price API
                simulated_usd_price = 0.001  # Placeholder price
                usd_value = token_amount * simulated_usd_price
                total_volume += usd_value
            except (ValueError, TypeError):
                continue
        
        return total_volume
    
    def identify_whale_transactions(self, transactions: List[Dict[str, Any]]) -> List[float]:
        """Identify the top 5 largest transactions (whale activity)"""
        transaction_amounts = []
        
        for tx in transactions:
            try:
                amount = float(tx.get("contractAddress", {}).get("amount", 0))
                transaction_amounts.append(amount)
            except (ValueError, TypeError):
                continue
        
        # Sort in descending order and get top 5
        transaction_amounts.sort(reverse=True)
        return transaction_amounts[:5]
    
    def analyze_whale_activity(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze whale activity patterns"""
        amounts = []
        for tx in transactions:
            try:
                amount = float(tx.get("contractAddress", {}).get("amount", 0))
                amounts.append(amount)
            except (ValueError, TypeError):
                continue
        
        if not amounts:
            return {
                "whale_threshold": 0,
                "whale_count": 0,
                "average_transaction": 0
            }
        
        # Calculate statistics
        avg_amount = statistics.mean(amounts)
        std_dev = statistics.stdev(amounts) if len(amounts) > 1 else 0
        
        # Define whale threshold as transactions > average + 2 standard deviations
        whale_threshold = avg_amount + (2 * std_dev)
        whale_count = sum(1 for amount in amounts if amount > whale_threshold)
        
        return {
            "whale_threshold": whale_threshold,
            "whale_count": whale_count,
            "average_transaction": avg_amount
        }
    
    def validate_signal(self, network: str, contract_address: str) -> Dict[str, Any]:
        """Main validation function that combines all metrics"""
        
        # Fetch token details
        token_details = self.fetch_token_details(network, contract_address)
        
        # Fetch recent transactions
        transactions = self.fetch_recent_transactions(network, contract_address)
        
        # Calculate metrics
        recent_volume = self.calculate_transaction_volume(transactions)
        top_5_transactions = self.identify_whale_transactions(transactions)
        whale_analysis = self.analyze_whale_activity(transactions)
        
        # Prepare output
        result = {
            "token_name": token_details["name"],
            "token_symbol": token_details["symbol"],
            "total_holders": token_details["holders_count"],
            "recent_volume_usd": round(recent_volume, 2),
            "top_5_large_transactions": top_5_transactions,
            "whale_activity": {
                "whale_threshold": round(whale_analysis["whale_threshold"], 2),
                "whale_count": whale_analysis["whale_count"],
                "average_transaction": round(whale_analysis["average_transaction"], 2)
            },
            "transaction_count": len(transactions),
            "validation_status": self.determine_validation_status(
                len(transactions), 
                whale_analysis["whale_count"], 
                recent_volume
            )
        }
        
        return result
    
    def determine_validation_status(self, tx_count: int, whale_count: int, volume: float) -> str:
        """Determine if on-chain activity validates the sentiment signal"""
        
        # Simple validation logic - can be enhanced with more sophisticated rules
        if tx_count > 30 and whale_count > 2 and volume > 1000:
            return "STRONG_VALIDATION"
        elif tx_count > 20 and whale_count > 1 and volume > 500:
            return "MODERATE_VALIDATION"
        elif tx_count > 10 and volume > 100:
            return "WEAK_VALIDATION"
        else:
            return "NO_VALIDATION"

def main():
    """Main function to handle command line execution"""
    if len(sys.argv) != 3:
        print("Usage: python signal_validator.py <network> <contract_address>", file=sys.stderr)
        print("Example: python signal_validator.py ethereum 0x1234567890abcdef1234567890abcdef12345678", file=sys.stderr)
        sys.exit(1)
    
    network = sys.argv[1].lower()
    contract_address = sys.argv[2]
    
    # Validate network
    supported_networks = ["ethereum", "polygon", "binance-smart-chain", "avalanche"]
    if network not in supported_networks:
        print(f"Unsupported network: {network}", file=sys.stderr)
        print(f"Supported networks: {', '.join(supported_networks)}", file=sys.stderr)
        sys.exit(1)
    
    try:
        validator = OnChainSignalValidator()
        result = validator.validate_signal(network, contract_address)
        
        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        
    except ValueError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()