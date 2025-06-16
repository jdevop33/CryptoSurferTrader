import { spawn } from "child_process";
import path from "path";

export interface OnChainValidationResult {
  tokenName: string;
  tokenSymbol: string;
  totalHolders: number;
  recentVolumeUsd: number;
  top5LargeTransactions: number[];
  whaleActivity: {
    whaleThreshold: number;
    whaleCount: number;
    averageTransaction: number;
  };
  transactionCount: number;
  validationStatus: "STRONG_VALIDATION" | "MODERATE_VALIDATION" | "WEAK_VALIDATION" | "NO_VALIDATION";
}

export interface TokenContractMapping {
  [symbol: string]: {
    ethereum?: string;
    polygon?: string;
    binanceSmartChain?: string;
  };
}

// Token contract addresses for major cryptocurrencies
const TOKEN_CONTRACTS: TokenContractMapping = {
  DOGECOIN: {
    // Note: DOGECOIN is native, but wrapped versions exist on other chains
    ethereum: "0x4206931337dc273a630d328da6441786bfad668f", // DOGE on Ethereum
    polygon: "0x7c4fd725c9e2d3863ea3df20b6b0e31e83a4b6a0", // DOGE on Polygon
  },
  SHIBA: {
    ethereum: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce", // SHIB
    polygon: "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec", // SHIB on Polygon
  },
  PEPE: {
    ethereum: "0x6982508145454ce325ddbe47a25d4ec3d2311933", // PEPE
  },
  FLOKI: {
    ethereum: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e", // FLOKI
    binanceSmartChain: "0xfb5b838b6cfeedc2873ab27866079ac55363d37e", // FLOKI on BSC
  },
};

export class OnChainValidatorService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), "signal_validator.py");
  }

  /**
   * Validate a trading signal using on-chain data
   */
  async validateSignal(
    symbol: string, 
    network: string = "ethereum"
  ): Promise<OnChainValidationResult | null> {
    const contractAddress = this.getContractAddress(symbol, network);
    if (!contractAddress) {
      console.warn(`No contract address found for ${symbol} on ${network}`);
      return null;
    }

    try {
      const result = await this.runPythonValidator(network, contractAddress);
      return this.parseValidationResult(result);
    } catch (error) {
      console.error(`On-chain validation failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Validate multiple signals in parallel
   */
  async validateMultipleSignals(
    signals: Array<{ symbol: string; network?: string }>
  ): Promise<Record<string, OnChainValidationResult | null>> {
    const validationPromises = signals.map(async ({ symbol, network = "ethereum" }) => {
      const result = await this.validateSignal(symbol, network);
      return { symbol, result };
    });

    const results = await Promise.all(validationPromises);
    
    const validationMap: Record<string, OnChainValidationResult | null> = {};
    results.forEach(({ symbol, result }) => {
      validationMap[symbol] = result;
    });

    return validationMap;
  }

  /**
   * Get signal validation score (0-1) based on on-chain activity
   */
  getValidationScore(validation: OnChainValidationResult): number {
    switch (validation.validationStatus) {
      case "STRONG_VALIDATION":
        return 0.9;
      case "MODERATE_VALIDATION":
        return 0.7;
      case "WEAK_VALIDATION":
        return 0.4;
      case "NO_VALIDATION":
      default:
        return 0.1;
    }
  }

  /**
   * Enhanced signal analysis combining sentiment and on-chain data
   */
  async getEnhancedSignalAnalysis(
    symbol: string,
    sentimentSignal: string,
    confidence: number,
    network: string = "ethereum"
  ): Promise<{
    originalSignal: string;
    originalConfidence: number;
    onChainValidation: OnChainValidationResult | null;
    enhancedSignal: string;
    enhancedConfidence: number;
    recommendation: string;
  }> {
    const onChainValidation = await this.validateSignal(symbol, network);
    
    let enhancedSignal = sentimentSignal;
    let enhancedConfidence = confidence;
    let recommendation = "Monitor for further signals";

    if (onChainValidation) {
      const validationScore = this.getValidationScore(onChainValidation);
      
      // Adjust confidence based on on-chain validation
      enhancedConfidence = Math.min(0.95, confidence * (0.7 + 0.3 * validationScore));
      
      // Adjust signal strength based on validation
      if (validationScore > 0.7 && sentimentSignal === "BUY") {
        enhancedSignal = "STRONG_BUY";
        recommendation = "Strong buy signal confirmed by on-chain whale activity";
      } else if (validationScore > 0.7 && sentimentSignal === "SELL") {
        enhancedSignal = "STRONG_SELL";
        recommendation = "Strong sell signal confirmed by on-chain distribution";
      } else if (validationScore < 0.3) {
        enhancedSignal = "HOLD";
        enhancedConfidence = Math.min(enhancedConfidence, 0.5);
        recommendation = "Signal not supported by on-chain activity - exercise caution";
      }
    }

    return {
      originalSignal: sentimentSignal,
      originalConfidence: confidence,
      onChainValidation,
      enhancedSignal,
      enhancedConfidence,
      recommendation,
    };
  }

  private getContractAddress(symbol: string, network: string): string | null {
    const tokenConfig = TOKEN_CONTRACTS[symbol.toUpperCase()];
    if (!tokenConfig) return null;

    const networkKey = this.normalizeNetworkName(network);
    return tokenConfig[networkKey as keyof typeof tokenConfig] || null;
  }

  private normalizeNetworkName(network: string): string {
    const networkMap: Record<string, string> = {
      "ethereum": "ethereum",
      "eth": "ethereum",
      "polygon": "polygon",
      "matic": "polygon",
      "binance-smart-chain": "binanceSmartChain",
      "bsc": "binanceSmartChain",
      "avalanche": "avalanche",
      "avax": "avalanche",
    };

    return networkMap[network.toLowerCase()] || network;
  }

  private runPythonValidator(network: string, contractAddress: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python3", [
        this.pythonScriptPath,
        network,
        contractAddress
      ]);

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  private parseValidationResult(jsonOutput: string): OnChainValidationResult {
    try {
      const parsed = JSON.parse(jsonOutput);
      
      return {
        tokenName: parsed.token_name,
        tokenSymbol: parsed.token_symbol,
        totalHolders: parsed.total_holders,
        recentVolumeUsd: parsed.recent_volume_usd,
        top5LargeTransactions: parsed.top_5_large_transactions,
        whaleActivity: parsed.whale_activity,
        transactionCount: parsed.transaction_count,
        validationStatus: parsed.validation_status,
      };
    } catch (error) {
      throw new Error(`Failed to parse validation result: ${error}`);
    }
  }
}

export const onChainValidatorService = new OnChainValidatorService();