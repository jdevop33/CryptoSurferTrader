import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Copy, Server, Database, Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeploymentResource {
  id: string;
  type: string;
  status: 'creating' | 'running' | 'failed';
  endpoint?: string;
  cost?: string;
}

interface DeploymentStatusProps {
  deploymentId: string;
  onComplete: (url: string) => void;
}

export function DeploymentStatus({ deploymentId, onComplete }: DeploymentStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!deploymentId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/deploy/status/${deploymentId}`);
        const data = await response.json();
        
        setStatus(data);
        setProgress(data.progress || 0);
        
        if (data.status === 'completed') {
          setIsPolling(false);
          onComplete(data.url);
        } else if (data.status === 'failed') {
          setIsPolling(false);
          toast({
            title: "Deployment Failed",
            description: "Infrastructure creation encountered an error",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    pollStatus(); // Initial call

    return () => {
      clearInterval(interval);
      if (isPolling) setIsPolling(false);
    };
  }, [deploymentId, isPolling, onComplete, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Resource endpoint copied successfully"
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'ecs': return <Server className="w-4 h-4" />;
      case 'redis': return <Database className="w-4 h-4" />;
      case 'slb': return <Shield className="w-4 h-4" />;
      case 'vpc': return <Globe className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'creating':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading deployment status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Deployment Progress
            <Badge variant={status.status === 'completed' ? 'default' : 'secondary'}>
              {status.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Infrastructure deployment in Singapore region
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {status.url && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                Deployment complete! Your trading system is live at:
                <a
                  href={status.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {status.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {status.resources && (
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Resources</CardTitle>
            <CardDescription>
              Created Alibaba Cloud resources for your trading platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {status.resources.map((resource: DeploymentResource) => (
                <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getResourceIcon(resource.type)}
                    <div>
                      <div className="font-medium">{resource.type.toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">{resource.id}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {resource.cost && (
                      <Badge variant="outline">{resource.cost}</Badge>
                    )}
                    {resource.endpoint && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(resource.endpoint!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                    {getStatusIcon(resource.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Infrastructure deployed successfully</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Trading application containerized and running</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>SSL certificate configured for HTTPS</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>DNS propagation (5-15 minutes)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Upgrade Twitter Developer account for live trading</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>ECS Instance (2 vCPU, 4GB)</span>
              <span>$40/month</span>
            </div>
            <div className="flex justify-between">
              <span>Redis Database (1GB)</span>
              <span>$25/month</span>
            </div>
            <div className="flex justify-between">
              <span>Load Balancer + SSL</span>
              <span>$20/month</span>
            </div>
            <div className="flex justify-between">
              <span>VPC + Networking</span>
              <span>$5/month</span>
            </div>
            <hr />
            <div className="flex justify-between font-medium">
              <span>Total Monthly Cost</span>
              <span>$90/month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}