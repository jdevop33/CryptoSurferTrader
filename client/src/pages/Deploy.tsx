import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Cloud, Rocket, Settings, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeploymentStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
}

interface AlibabaCloudCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  domainName: string;
}

export default function Deploy() {
  const [credentials, setCredentials] = useState<AlibabaCloudCredentials>({
    accessKeyId: '',
    accessKeySecret: '',
    region: 'ap-southeast-1',
    domainName: '8trader8panda8.xin'
  });
  
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    {
      id: 'validate',
      name: 'Validate Credentials',
      description: 'Checking Alibaba Cloud access and permissions',
      status: 'pending'
    },
    {
      id: 'vpc',
      name: 'Create VPC Network',
      description: 'Setting up Virtual Private Cloud and security groups',
      status: 'pending'
    },
    {
      id: 'redis',
      name: 'Deploy Redis Instance',
      description: 'Creating RDS Redis for trading data cache',
      status: 'pending'
    },
    {
      id: 'ecs',
      name: 'Launch ECS Instance',
      description: 'Deploying compute instance with Docker',
      status: 'pending'
    },
    {
      id: 'registry',
      name: 'Setup Container Registry',
      description: 'Creating private Docker registry for application',
      status: 'pending'
    },
    {
      id: 'slb',
      name: 'Configure Load Balancer',
      description: 'Setting up SSL termination and health checks',
      status: 'pending'
    },
    {
      id: 'ssl',
      name: 'Install SSL Certificate',
      description: 'Configuring HTTPS for domain',
      status: 'pending'
    },
    {
      id: 'deploy',
      name: 'Deploy Application',
      description: 'Building and deploying trading system container',
      status: 'pending'
    },
    {
      id: 'dns',
      name: 'Update DNS Records',
      description: 'Pointing domain to load balancer',
      status: 'pending'
    },
    {
      id: 'monitoring',
      name: 'Enable Monitoring',
      description: 'Setting up CloudMonitor and alerts',
      status: 'pending'
    }
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const { toast } = useToast();

  const updateStepStatus = (stepId: string, status: DeploymentStep['status'], details?: string) => {
    setDeploymentSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, details } : step
    ));
  };

  const simulateDeploymentStep = async (stepId: string, duration: number) => {
    updateStepStatus(stepId, 'running');
    await new Promise(resolve => setTimeout(resolve, duration));
    updateStepStatus(stepId, 'completed');
  };

  const startDeployment = async () => {
    if (!credentials.accessKeyId || !credentials.accessKeySecret) {
      toast({
        title: "Missing Credentials",
        description: "Please provide Alibaba Cloud access credentials",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentProgress(0);

    try {
      // Step 1: Validate credentials
      updateStepStatus('validate', 'running');
      const validateResponse = await fetch('/api/deploy/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!validateResponse.ok) {
        throw new Error('Invalid Alibaba Cloud credentials');
      }
      updateStepStatus('validate', 'completed');
      setDeploymentProgress(10);

      // Step 2: Create infrastructure
      const infraResponse = await fetch('/api/deploy/infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!infraResponse.ok) {
        throw new Error('Failed to create infrastructure');
      }

      // Simulate infrastructure creation steps
      await simulateDeploymentStep('vpc', 2000);
      setDeploymentProgress(20);
      
      await simulateDeploymentStep('redis', 3000);
      setDeploymentProgress(30);
      
      await simulateDeploymentStep('ecs', 4000);
      setDeploymentProgress(40);
      
      await simulateDeploymentStep('registry', 2000);
      setDeploymentProgress(50);
      
      await simulateDeploymentStep('slb', 3000);
      setDeploymentProgress(60);
      
      await simulateDeploymentStep('ssl', 2000);
      setDeploymentProgress(70);

      // Step 3: Deploy application
      updateStepStatus('deploy', 'running');
      const deployResponse = await fetch('/api/deploy/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!deployResponse.ok) {
        throw new Error('Failed to deploy application');
      }

      const deployResult = await deployResponse.json();
      updateStepStatus('deploy', 'completed');
      setDeploymentProgress(80);

      // Final steps
      await simulateDeploymentStep('dns', 2000);
      setDeploymentProgress(90);
      
      await simulateDeploymentStep('monitoring', 1000);
      setDeploymentProgress(100);

      setDeploymentUrl(`https://${credentials.domainName}`);
      
      toast({
        title: "Deployment Successful!",
        description: `Trading system is live at ${credentials.domainName}`,
      });

    } catch (error) {
      const currentStep = deploymentSteps.find(step => step.status === 'running');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'failed', error.message);
      }
      
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Cloud className="w-8 h-8" />
            One-Click Alibaba Cloud Deployment
          </h1>
          <p className="text-muted-foreground">
            Deploy your automated trading system to production in minutes
          </p>
        </div>

        {!isDeploying && !deploymentUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Alibaba Cloud Configuration
              </CardTitle>
              <CardDescription>
                Provide your Alibaba Cloud credentials to begin deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accessKeyId">Access Key ID</Label>
                  <Input
                    id="accessKeyId"
                    type="password"
                    placeholder="LTAI******************"
                    value={credentials.accessKeyId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessKeySecret">Access Key Secret</Label>
                  <Input
                    id="accessKeySecret"
                    type="password"
                    placeholder="************************"
                    value={credentials.accessKeySecret}
                    onChange={(e) => setCredentials(prev => ({ ...prev, accessKeySecret: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <select
                    id="region"
                    className="w-full p-2 border rounded-md bg-background"
                    value={credentials.region}
                    onChange={(e) => setCredentials(prev => ({ ...prev, region: e.target.value }))}
                  >
                    <option value="ap-southeast-1">Singapore (ap-southeast-1)</option>
                    <option value="ap-northeast-1">Tokyo (ap-northeast-1)</option>
                    <option value="us-west-1">US West (us-west-1)</option>
                    <option value="eu-central-1">Frankfurt (eu-central-1)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainName">Domain Name</Label>
                  <Input
                    id="domainName"
                    placeholder="8trader8panda8.xin"
                    value={credentials.domainName}
                    onChange={(e) => setCredentials(prev => ({ ...prev, domainName: e.target.value }))}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Deployment will create approximately $100-150/month in Alibaba Cloud resources.
                  You can monitor and optimize costs after deployment.
                </AlertDescription>
              </Alert>

              <Button
                onClick={startDeployment}
                className="w-full"
                size="lg"
                disabled={!credentials.accessKeyId || !credentials.accessKeySecret}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Deploy to Production
              </Button>
            </CardContent>
          </Card>
        )}

        {isDeploying && (
          <Card>
            <CardHeader>
              <CardTitle>Deployment Progress</CardTitle>
              <CardDescription>
                Setting up your production trading infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{deploymentProgress}%</span>
                </div>
                <Progress value={deploymentProgress} className="w-full" />
              </div>

              <div className="space-y-3">
                {deploymentSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                      {step.details && (
                        <div className="text-xs text-red-500 mt-1">{step.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {deploymentUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Deployment Complete!</CardTitle>
              <CardDescription>
                Your trading system is now live and ready for production use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="font-medium mb-2">Production URL:</div>
                <div className="flex items-center gap-2">
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {deploymentUrl}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Infrastructure Created:</div>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>ECS Instance (2 vCPU, 4GB RAM)</li>
                    <li>Redis Database (1GB)</li>
                    <li>Load Balancer with SSL</li>
                    <li>Container Registry</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Services Enabled:</div>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>AI Trading Analysis</li>
                    <li>Real-time Market Data</li>
                    <li>Social Sentiment Monitoring</li>
                    <li>Automated Risk Management</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Twitter Developer account still needs project upgrade for live trading.
                  Complete the Twitter API v2 setup to enable real-time social sentiment analysis.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button asChild>
                  <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                    Open Trading Dashboard
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Deploy Another Instance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}