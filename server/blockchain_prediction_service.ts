/**
 * Blockchain Prediction Service
 * Creates immutable, timestamped predictions on blockchain with IPFS storage
 * Enables peer-to-peer betting via smart contracts without holding user funds
 */

import { ethers } from 'ethers';

interface Prediction {
  id: string;
  agentName: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice?: number;
  timeframe: string; // e.g., "24h", "7d", "30d"
  reasoning: string;
  timestamp: number;
  expiryTimestamp: number;
  ipfsHash?: string;
  blockchainTxHash?: string;
  status: 'PENDING' | 'RESOLVED' | 'EXPIRED';
  outcome?: 'WIN' | 'LOSS';
  actualPrice?: number;
}

interface BettingContract {
  contractAddress: string;
  predictionId: string;
  creator: string;
  betAmount: string; // in wei
  odds: number;
  totalPool: string;
  participants: string[];
  resolved: boolean;
  winner?: string;
}

export class BlockchainPredictionService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private predictions: Map<string, Prediction> = new Map();
  private bettingContracts: Map<string, BettingContract> = new Map();

  // Polygon Mumbai testnet configuration for low-cost transactions
  private readonly NETWORK_CONFIG = {
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com'
  };

  // Simple prediction contract ABI
  private readonly CONTRACT_ABI = [
    "function storePrediction(string memory ipfsHash, uint256 expiryTime) public returns (uint256)",
    "function resolvePrediction(uint256 predictionId, bool outcome) public",
    "function getPrediction(uint256 predictionId) public view returns (string memory, uint256, bool, bool)",
    "function createBet(uint256 predictionId, bool supportsPrediction) public payable",
    "function resolveBet(uint256 predictionId, bool outcome) public",
    "function claimWinnings(uint256 predictionId) public",
    "event PredictionStored(uint256 indexed predictionId, string ipfsHash, uint256 expiryTime)",
    "event BetCreated(uint256 indexed predictionId, address indexed bettor, uint256 amount, bool supportsPrediction)",
    "event PredictionResolved(uint256 indexed predictionId, bool outcome, uint256 totalPayout)"
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(this.NETWORK_CONFIG.rpcUrl);
    // In production, deploy actual contract. For demo, we'll simulate
    this.contract = new ethers.Contract(
      "0x1234567890123456789012345678901234567890", // Placeholder address
      this.CONTRACT_ABI,
      this.provider
    );
  }

  /**
   * Create and store prediction on IPFS + Blockchain
   */
  async createPrediction(predictionData: Omit<Prediction, 'id' | 'timestamp' | 'ipfsHash' | 'blockchainTxHash'>): Promise<Prediction> {
    const prediction: Prediction = {
      id: this.generatePredictionId(),
      timestamp: Date.now(),
      ipfsHash: '',
      blockchainTxHash: '',
      status: 'PENDING',
      ...predictionData
    };

    try {
      // Step 1: Store detailed prediction data on IPFS
      const ipfsHash = await this.storeOnIPFS(prediction);
      prediction.ipfsHash = ipfsHash;

      // Step 2: Store IPFS hash on blockchain for immutable proof
      const txHash = await this.storeOnBlockchain(ipfsHash, prediction.expiryTimestamp);
      prediction.blockchainTxHash = txHash;

      // Step 3: Store in local database for quick access
      this.predictions.set(prediction.id, prediction);

      console.log(`🔗 Prediction ${prediction.id} stored on blockchain: ${txHash}`);
      return prediction;

    } catch (error) {
      console.error('Failed to create blockchain prediction:', error);
      // Fallback: store locally even if blockchain fails
      this.predictions.set(prediction.id, prediction);
      return prediction;
    }
  }

  /**
   * Store prediction data on IPFS (simulated for demo)
   */
  private async storeOnIPFS(prediction: Prediction): Promise<string> {
    // In production, use actual IPFS client like ipfs-http-client
    // For demo, we'll generate a mock IPFS hash
    const predictionJson = JSON.stringify(prediction, null, 2);
    const mockHash = `Qm${this.generateHash(predictionJson)}`;
    
    console.log(`📦 Storing prediction on IPFS: ${mockHash}`);
    
    // Simulate IPFS storage delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockHash;
  }

  /**
   * Store IPFS hash on blockchain (simulated for demo)
   */
  private async storeOnBlockchain(ipfsHash: string, expiryTime: number): Promise<string> {
    // In production, this would call the actual smart contract
    const mockTxHash = `0x${this.generateHash(ipfsHash + expiryTime)}`;
    
    console.log(`⛓️ Storing on blockchain - IPFS: ${ipfsHash}, TX: ${mockTxHash}`);
    
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockTxHash;
  }

  /**
   * Create betting smart contract for a prediction
   */
  async createBettingContract(predictionId: string, creatorAddress: string, initialBetAmount: string): Promise<BettingContract> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) {
      throw new Error('Prediction not found');
    }

    const bettingContract: BettingContract = {
      contractAddress: `0x${this.generateHash(predictionId + creatorAddress)}`,
      predictionId,
      creator: creatorAddress,
      betAmount: initialBetAmount,
      odds: 2.0, // Start with even odds
      totalPool: initialBetAmount,
      participants: [creatorAddress],
      resolved: false
    };

    this.bettingContracts.set(predictionId, bettingContract);
    
    console.log(`🎲 Betting contract created: ${bettingContract.contractAddress}`);
    return bettingContract;
  }

  /**
   * Join existing betting contract
   */
  async joinBet(predictionId: string, userAddress: string, betAmount: string, supportsPrediction: boolean): Promise<void> {
    const contract = this.bettingContracts.get(predictionId);
    if (!contract) {
      throw new Error('Betting contract not found');
    }

    if (contract.resolved) {
      throw new Error('Betting already resolved');
    }

    // Add participant
    contract.participants.push(userAddress);
    contract.totalPool = (BigInt(contract.totalPool) + BigInt(betAmount)).toString();

    // Recalculate odds based on bet distribution
    contract.odds = this.calculateOdds(contract);

    console.log(`🎯 User ${userAddress} joined bet with ${ethers.formatEther(betAmount)} ETH`);
  }

  /**
   * Resolve prediction and settle all bets
   */
  async resolvePrediction(predictionId: string, actualPrice: number): Promise<void> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) {
      throw new Error('Prediction not found');
    }

    // Determine outcome based on prediction type
    let outcome: 'WIN' | 'LOSS';
    
    if (prediction.action === 'BUY' && prediction.targetPrice) {
      outcome = actualPrice >= prediction.targetPrice ? 'WIN' : 'LOSS';
    } else if (prediction.action === 'SELL' && prediction.targetPrice) {
      outcome = actualPrice <= prediction.targetPrice ? 'WIN' : 'LOSS';
    } else {
      // For HOLD predictions, check if price stayed within confidence range
      const currentPrice = actualPrice;
      const priceChangePercent = Math.abs((currentPrice - (prediction.targetPrice || currentPrice)) / (prediction.targetPrice || currentPrice)) * 100;
      outcome = priceChangePercent <= 5 ? 'WIN' : 'LOSS'; // 5% tolerance for HOLD
    }

    // Update prediction
    prediction.status = 'RESOLVED';
    prediction.outcome = outcome;
    prediction.actualPrice = actualPrice;

    // Resolve betting contract
    const bettingContract = this.bettingContracts.get(predictionId);
    if (bettingContract) {
      await this.resolveBetting(bettingContract, outcome === 'WIN');
    }

    // Store resolution on blockchain
    await this.storeResolutionOnBlockchain(predictionId, outcome === 'WIN');

    console.log(`✅ Prediction ${predictionId} resolved: ${outcome} (Price: ${actualPrice})`);
  }

  /**
   * Resolve betting and distribute winnings
   */
  private async resolveBetting(contract: BettingContract, predictionWon: boolean): Promise<void> {
    contract.resolved = true;
    
    // In a real implementation, this would trigger smart contract execution
    // to automatically distribute funds to winners
    console.log(`💰 Betting resolved for ${contract.contractAddress}`);
    console.log(`   Total pool: ${ethers.formatEther(contract.totalPool)} ETH`);
    console.log(`   Prediction won: ${predictionWon}`);
    console.log(`   Winners can claim their earnings`);
  }

  /**
   * Get all predictions with blockchain proof
   */
  async getVerifiedPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get prediction verification data
   */
  async getVerificationProof(predictionId: string): Promise<{
    prediction: Prediction;
    blockchainProof: string;
    ipfsProof: string;
    verificationUrl: string;
  } | null> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) return null;

    return {
      prediction,
      blockchainProof: prediction.blockchainTxHash || '',
      ipfsProof: prediction.ipfsHash || '',
      verificationUrl: `${this.NETWORK_CONFIG.explorerUrl}/tx/${prediction.blockchainTxHash}`
    };
  }

  /**
   * Get active betting contracts
   */
  getActiveBets(): BettingContract[] {
    return Array.from(this.bettingContracts.values())
      .filter(contract => !contract.resolved);
  }

  /**
   * Utility methods
   */
  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(input: string): string {
    // Simple hash for demo - use proper crypto hash in production
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  }

  private calculateOdds(contract: BettingContract): number {
    // Simplified odds calculation
    // In practice, this would be more sophisticated
    return 1.5 + (contract.participants.length * 0.1);
  }

  private async storeResolutionOnBlockchain(predictionId: string, outcome: boolean): Promise<void> {
    const mockTxHash = `0x${this.generateHash(predictionId + outcome.toString())}`;
    console.log(`⛓️ Resolution stored on blockchain: ${mockTxHash}`);
  }
}

// Export singleton instance
export const blockchainPredictionService = new BlockchainPredictionService();