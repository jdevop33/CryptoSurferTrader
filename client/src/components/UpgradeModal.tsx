import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Star, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Redirect to registration page with upgrade intent
      window.location.href = '/register?upgrade=true&feature=' + encodeURIComponent(feature);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate upgrade process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proFeatures = [
    "Advanced AI Market Intelligence",
    "GS Quant Risk Analytics",
    "Real-time Trading Signals",
    "Portfolio Risk Dashboard",
    "Strategy Simulator",
    "Social Sentiment Analysis",
    "Institutional-grade Tools",
    "Priority Support"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Unlock {feature} and all premium features
          </DialogDescription>
        </DialogHeader>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-purple-500" />
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Popular
              </Badge>
            </div>
            <CardDescription>
              <span className="text-3xl font-bold">$15</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Institutional-Grade Analytics</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Access Goldman Sachs quantitative finance tools and real-time market intelligence
              </p>
            </div>

            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Upgrade to Pro"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              30-day money-back guarantee • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}