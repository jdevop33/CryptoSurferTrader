import { spawn } from "child_process";
import path from "path";

export interface WebhookSubscription {
  status: string;
  subscription_id: string;
  monitored_contract: string;
  callback_url: string;
  network: string;
  webhook_details?: {
    confirmations_required: number;
    allow_duplicates: boolean;
    secret_key: string;
    created_timestamp?: string;
    is_active: boolean;
  };
  subscription_type?: string;
  error_message?: string;
  error_code?: number;
}

export interface ActiveWebhook {
  referenceId: string;
  callbackUrl: string;
  confirmationsCount: number;
  allowDuplicates: boolean;
  isActive: boolean;
  createdTimestamp: string;
  eventType: string;
}

export interface WebhookListResponse {
  status: string;
  network: string;
  active_webhooks: ActiveWebhook[];
  total_count: number;
  error_message?: string;
}

export class EventMonitorService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), "event_monitor.py");
  }

  /**
   * Create a webhook subscription for real-time transaction monitoring
   */
  async createWebhookSubscription(
    network: string,
    contractAddress: string,
    callbackUrl: string
  ): Promise<WebhookSubscription> {
    try {
      const result = await this.runEventMonitorScript(network, contractAddress, callbackUrl);
      return this.parseWebhookResult(result);
    } catch (error) {
      console.error(`Webhook creation failed for ${contractAddress}:`, error);
      return {
        status: "error",
        subscription_id: "",
        monitored_contract: contractAddress,
        callback_url: callbackUrl,
        network,
        error_message: `Failed to create webhook: ${error}`
      };
    }
  }

  /**
   * Create multiple webhook subscriptions in parallel
   */
  async createMultipleWebhooks(
    subscriptions: Array<{
      network: string;
      contractAddress: string;
      callbackUrl: string;
    }>
  ): Promise<Record<string, WebhookSubscription>> {
    const webhookPromises = subscriptions.map(async ({ network, contractAddress, callbackUrl }) => {
      const result = await this.createWebhookSubscription(network, contractAddress, callbackUrl);
      return { contractAddress, result };
    });

    const results = await Promise.all(webhookPromises);
    
    const webhookMap: Record<string, WebhookSubscription> = {};
    results.forEach(({ contractAddress, result }) => {
      webhookMap[contractAddress] = result;
    });

    return webhookMap;
  }

  /**
   * Get webhook subscriptions for major tokens
   */
  async setupTradingWebhooks(baseCallbackUrl: string): Promise<{
    subscriptions: Record<string, WebhookSubscription>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const tokenContracts = [
      { symbol: "SHIBA", network: "ethereum", address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce" },
      { symbol: "PEPE", network: "ethereum", address: "0x6982508145454ce325ddbe47a25d4ec3d2311933" },
      { symbol: "FLOKI", network: "ethereum", address: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e" },
      { symbol: "DOGECOIN_WRAPPED", network: "ethereum", address: "0x4206931337dc273a630d328da6441786bfad668f" }
    ];

    const subscriptions = tokenContracts.map(token => ({
      network: token.network,
      contractAddress: token.address,
      callbackUrl: `${baseCallbackUrl}/webhook/${token.symbol.toLowerCase()}`
    }));

    const results = await this.createMultipleWebhooks(subscriptions);

    const successful = Object.values(results).filter(r => r.status === "success").length;
    const failed = Object.values(results).filter(r => r.status === "error").length;

    return {
      subscriptions: results,
      summary: {
        total: subscriptions.length,
        successful,
        failed
      }
    };
  }

  /**
   * Generate a comprehensive webhook endpoint for our platform
   */
  generateCallbackUrl(baseUrl: string, contractAddress: string): string {
    // Create a unique endpoint for each contract
    const contractId = contractAddress.slice(2, 10); // Use first 8 chars after 0x
    return `${baseUrl}/api/webhooks/crypto-events/${contractId}`;
  }

  /**
   * Validate webhook creation parameters
   */
  validateWebhookParams(network: string, contractAddress: string, callbackUrl: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate network
    const supportedNetworks = ["ethereum", "polygon", "binance-smart-chain", "avalanche"];
    if (!supportedNetworks.includes(network.toLowerCase())) {
      errors.push(`Unsupported network: ${network}`);
    }

    // Validate contract address
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push(`Invalid contract address format: ${contractAddress}`);
    }

    // Validate callback URL
    if (!callbackUrl.match(/^https?:\/\/.+/)) {
      errors.push(`Invalid callback URL format: ${callbackUrl}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private runEventMonitorScript(
    network: string, 
    contractAddress: string, 
    callbackUrl: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python3", [
        this.pythonScriptPath,
        network,
        contractAddress,
        callbackUrl
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
          reject(new Error(`Event monitor script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  private parseWebhookResult(jsonOutput: string): WebhookSubscription {
    try {
      const parsed = JSON.parse(jsonOutput);
      
      return {
        status: parsed.status,
        subscription_id: parsed.subscription_id,
        monitored_contract: parsed.monitored_contract,
        callback_url: parsed.callback_url,
        network: parsed.network,
        webhook_details: parsed.webhook_details,
        subscription_type: parsed.subscription_type,
        error_message: parsed.error_message,
        error_code: parsed.error_code
      };
    } catch (error) {
      throw new Error(`Failed to parse webhook result: ${error}`);
    }
  }
}

export const eventMonitorService = new EventMonitorService();