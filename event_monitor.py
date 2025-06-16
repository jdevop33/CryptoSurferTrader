#!/usr/bin/env python3
"""
Real-Time Event Monitor (The Tripwire)
Creates webhook subscriptions for real-time on-chain transaction monitoring
Uses CryptoAPIs.io Blockchain Events API to trigger on new transactions
"""

import os
import requests
import json
import sys
from typing import Dict, Any, Optional

class CryptoAPIEventMonitor:
    def __init__(self):
        self.api_key = os.getenv("CRYPTOAPIS_API_KEY")
        if not self.api_key:
            raise ValueError("CRYPTOAPIS_API_KEY environment variable is required")
        
        self.base_url = "https://rest.cryptoapis.io/v2"
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key
        }
    
    def create_transaction_webhook(self, network: str, contract_address: str, callback_url: str) -> Dict[str, Any]:
        """
        Create a webhook subscription for new mined transactions on a specific token contract
        """
        # Normalize network name for API
        network_mapping = {
            "ethereum": "ethereum-mainnet",
            "eth": "ethereum-mainnet", 
            "polygon": "polygon-mainnet",
            "matic": "polygon-mainnet",
            "binance-smart-chain": "binance-smart-chain-mainnet",
            "bsc": "binance-smart-chain-mainnet",
            "avalanche": "avalanche-mainnet",
            "avax": "avalanche-mainnet"
        }
        
        normalized_network = network_mapping.get(network.lower(), network)
        
        # Use the correct CryptoAPIs endpoint for blockchain events
        endpoint = f"{self.base_url}/blockchain-events/{normalized_network}"
        
        # Prepare the request payload for address transactions webhook
        payload = {
            "item": {
                "allowDuplicates": False,
                "callbackSecretKey": f"webhook_secret_{contract_address[:10]}",
                "callbackUrl": callback_url,
                "confirmationsCount": 3,
                "address": contract_address,
                "eventType": "ADDRESS_COINS_TRANSACTION_CONFIRMED"
            }
        }
        
        try:
            response = requests.post(endpoint, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract relevant information from the response
            item_data = data.get("data", {}).get("item", {})
            
            result = {
                "status": "success",
                "subscription_id": item_data.get("referenceId", "unknown"),
                "monitored_contract": contract_address,
                "callback_url": callback_url,
                "network": normalized_network,
                "webhook_details": {
                    "confirmations_required": item_data.get("confirmationsCount", 3),
                    "allow_duplicates": item_data.get("allowDuplicates", False),
                    "secret_key": item_data.get("callbackSecretKey", ""),
                    "created_timestamp": item_data.get("createdTimestamp"),
                    "is_active": item_data.get("isActive", True)
                },
                "raw_response": data
            }
            
            return result
            
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                pass
                
            return {
                "status": "error",
                "error_code": e.response.status_code,
                "error_message": f"HTTP {e.response.status_code}: {e.response.reason}",
                "error_details": error_data,
                "monitored_contract": contract_address,
                "callback_url": callback_url,
                "network": normalized_network,
                "note": "Webhook creation failed - API endpoint may require different parameters or subscription plan",
                "fallback_available": True
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "error_message": f"Request failed: {str(e)}",
                "monitored_contract": contract_address,
                "callback_url": callback_url,
                "network": normalized_network
            }
    
    def create_address_transaction_webhook(self, network: str, address: str, callback_url: str) -> Dict[str, Any]:
        """
        Alternative method: Create webhook for all transactions involving a specific address
        """
        network_mapping = {
            "ethereum": "ethereum-mainnet",
            "eth": "ethereum-mainnet",
            "polygon": "polygon-mainnet", 
            "matic": "polygon-mainnet",
            "binance-smart-chain": "binance-smart-chain-mainnet",
            "bsc": "binance-smart-chain-mainnet",
            "avalanche": "avalanche-mainnet",
            "avax": "avalanche-mainnet"
        }
        
        normalized_network = network_mapping.get(network.lower(), network)
        endpoint = f"{self.base_url}/blockchain-events/{normalized_network}/addresses/{address}/transactions"
        
        payload = {
            "item": {
                "allowDuplicates": False,
                "callbackSecretKey": f"addr_webhook_{address[:10]}",
                "callbackUrl": callback_url,
                "confirmationsCount": 3
            }
        }
        
        try:
            response = requests.post(endpoint, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            item_data = data.get("data", {}).get("item", {})
            
            return {
                "status": "success",
                "subscription_id": item_data.get("referenceId", "unknown"),
                "monitored_contract": address,
                "callback_url": callback_url,
                "network": normalized_network,
                "subscription_type": "address_transactions",
                "webhook_details": {
                    "confirmations_required": item_data.get("confirmationsCount", 3),
                    "allow_duplicates": item_data.get("allowDuplicates", False),
                    "secret_key": item_data.get("callbackSecretKey", ""),
                    "created_timestamp": item_data.get("createdTimestamp"),
                    "is_active": item_data.get("isActive", True)
                },
                "raw_response": data
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "status": "error", 
                "error_message": f"Failed to create address webhook: {str(e)}",
                "monitored_contract": address,
                "callback_url": callback_url,
                "network": normalized_network
            }
    
    def list_active_webhooks(self, network: str) -> Dict[str, Any]:
        """
        List all active webhook subscriptions for a network
        """
        network_mapping = {
            "ethereum": "ethereum-mainnet",
            "eth": "ethereum-mainnet",
            "polygon": "polygon-mainnet",
            "matic": "polygon-mainnet", 
            "binance-smart-chain": "binance-smart-chain-mainnet",
            "bsc": "binance-smart-chain-mainnet",
            "avalanche": "avalanche-mainnet",
            "avax": "avalanche-mainnet"
        }
        
        normalized_network = network_mapping.get(network.lower(), network)
        endpoint = f"{self.base_url}/blockchain-events/{normalized_network}"
        
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "status": "success",
                "network": normalized_network,
                "active_webhooks": data.get("data", {}).get("items", []),
                "total_count": len(data.get("data", {}).get("items", []))
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "error_message": f"Failed to list webhooks: {str(e)}",
                "network": normalized_network
            }

def validate_inputs(network: str, contract_address: str, callback_url: str) -> bool:
    """
    Validate input parameters
    """
    # Validate network
    supported_networks = ["ethereum", "eth", "polygon", "matic", "binance-smart-chain", "bsc", "avalanche", "avax"]
    if network.lower() not in supported_networks:
        print(f"Error: Unsupported network '{network}'. Supported: {', '.join(supported_networks)}", file=sys.stderr)
        return False
    
    # Validate contract address (basic check)
    if not contract_address.startswith("0x") or len(contract_address) != 42:
        print(f"Error: Invalid contract address format '{contract_address}'. Must be 42-character hex string starting with 0x", file=sys.stderr)
        return False
    
    # Validate callback URL (basic check)
    if not callback_url.startswith(("http://", "https://")):
        print(f"Error: Invalid callback URL '{callback_url}'. Must start with http:// or https://", file=sys.stderr)
        return False
    
    return True

def main():
    """
    Main function to handle command line execution
    """
    if len(sys.argv) != 4:
        print("Usage: python event_monitor.py <network> <contract_address> <callback_url>", file=sys.stderr)
        print("Example: python event_monitor.py ethereum 0x1234567890abcdef1234567890abcdef12345678 https://webhook.site/unique-id", file=sys.stderr)
        print("\nSupported networks: ethereum, polygon, binance-smart-chain, avalanche", file=sys.stderr)
        sys.exit(1)
    
    network = sys.argv[1]
    contract_address = sys.argv[2]
    callback_url = sys.argv[3]
    
    # Validate inputs
    if not validate_inputs(network, contract_address, callback_url):
        sys.exit(1)
    
    try:
        monitor = CryptoAPIEventMonitor()
        
        print(f"Creating webhook subscription for {contract_address} on {network}...", file=sys.stderr)
        print(f"Callback URL: {callback_url}", file=sys.stderr)
        
        # Try token-specific webhook first
        result = monitor.create_transaction_webhook(network, contract_address, callback_url)
        
        # If token webhook fails, try address-based webhook as fallback
        if result.get("status") == "error" and "token" in result.get("error_message", "").lower():
            print("Token webhook failed, trying address-based webhook...", file=sys.stderr)
            result = monitor.create_address_transaction_webhook(network, contract_address, callback_url)
        
        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        if result.get("status") == "success":
            print(f"✅ Webhook created successfully! Subscription ID: {result.get('subscription_id')}", file=sys.stderr)
            sys.exit(0)
        else:
            print(f"❌ Failed to create webhook: {result.get('error_message', 'Unknown error')}", file=sys.stderr)
            sys.exit(1)
            
    except ValueError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()