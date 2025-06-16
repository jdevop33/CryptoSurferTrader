import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Webhook, 
  Plus, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Zap,
  Globe,
  Copy,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WebhookSubscription {
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

interface RealTimeEvent {
  contractId: string;
  eventType: string;
  blockNumber?: number;
  transactionHash?: string;
  amount?: string;
  from?: string;
  to?: string;
  timestamp: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800 border-green-200";
    case "error":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

export default function WebhookManager() {
  const [network, setNetwork] = useState("ethereum");
  const [contractAddress, setContractAddress] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [realTimeEvents, setRealTimeEvents] = useState<RealTimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection for real-time events
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected for real-time events');
        setIsConnected(true);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'crypto-event' || data.contractId) {
            setRealTimeEvents(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 events
            toast({
              title: "Real-Time Event",
              description: `New transaction detected for contract ${data.contractId?.slice(0, 8)}...`,
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [toast]);

  // Generate callback URL
  const generateCallbackUrl = async (address: string) => {
    try {
      const response = await apiRequest("GET", `/api/webhooks/generate-callback/${address}`);
      const data = await response.json();
      setCallbackUrl(data.callbackUrl);
      toast({
        title: "Callback URL Generated",
        description: "Ready to create webhook subscription",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate callback URL",
        variant: "destructive",
      });
    }
  };

  // Create single webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (params: { network: string; contractAddress: string; callbackUrl: string }) => {
      const response = await apiRequest("POST", "/api/webhooks/create", params);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook Created",
        description: "Real-time monitoring is now active",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      // Reset form
      setContractAddress("");
      setCallbackUrl("");
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create webhook: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Setup trading webhooks for all major tokens
  const setupTradingMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const response = await apiRequest("POST", "/api/webhooks/create-with-integration", {
        tokens: ["SHIBA", "PEPE", "FLOKI", "DOGECOIN"]
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trading Webhooks Setup",
        description: `${data.summary.successful}/${data.summary.total} webhooks created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: `Failed to setup trading webhooks: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateWebhook = () => {
    if (!contractAddress || !callbackUrl || !network) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    createWebhookMutation.mutate({ network, contractAddress, callbackUrl });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Real-Time Event Monitor
          </h2>
          <p className="text-gray-600 mt-1">
            Create and manage webhook subscriptions for real-time on-chain events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className={cn(
            isConnected ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"
          )}>
            <div className={cn("w-2 h-2 rounded-full mr-2", 
              isConnected ? "bg-green-500" : "bg-gray-400"
            )} />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Quick Setup */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 mb-4">
            Set up real-time monitoring for all major trading tokens with one click
          </p>
          <Button 
            onClick={() => setupTradingMutation.mutate()}
            disabled={setupTradingMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {setupTradingMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Setup Trading Webhooks
          </Button>
        </CardContent>
      </Card>

      {/* Manual Webhook Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Custom Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="binance-smart-chain">Binance Smart Chain</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract">Contract Address</Label>
              <div className="flex gap-2">
                <Input
                  id="contract"
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateCallbackUrl(contractAddress)}
                  disabled={!contractAddress}
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callback">Callback URL</Label>
            <div className="flex gap-2">
              <Input
                id="callback"
                placeholder="Generated automatically or enter custom URL"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(callbackUrl)}
                disabled={!callbackUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleCreateWebhook}
            disabled={createWebhookMutation.isPending || !contractAddress || !callbackUrl}
            className="w-full"
          >
            {createWebhookMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Webhook className="h-4 w-4 mr-2" />
            )}
            Create Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Real-Time Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Events Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          {realTimeEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No real-time events received yet</p>
              <p className="text-sm">Create webhooks to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {realTimeEvents.map((event, index) => (
                <div
                  key={`${event.contractId}-${event.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <div className="font-medium text-sm">
                        Contract: {event.contractId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.eventType} • {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  {event.transactionHash && (
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>1. Create Webhooks:</strong> Subscribe to real-time events for specific token contracts</p>
                <p><strong>2. Receive Events:</strong> CryptoAPIs sends transaction data to our callback URLs</p>
              </div>
              <div>
                <p><strong>3. Real-Time Processing:</strong> Events are processed and broadcasted via WebSocket</p>
                <p><strong>4. Live Updates:</strong> See transaction activity as it happens on-chain</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Note:</strong> Requires CRYPTOAPIS_API_KEY environment variable for webhook creation.
                Real-time events are displayed instantly when webhooks are active.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}