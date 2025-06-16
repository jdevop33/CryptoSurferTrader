import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Mail, User, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMetaMask } from '@/hooks/useMetaMask';
import { apiRequest } from '@/lib/queryClient';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>('');
  const { toast } = useToast();
  const { isConnected, account, connect } = useMetaMask();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  useEffect(() => {
    // Check for upgrade intent from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const upgrade = urlParams.get('upgrade');
    const feature = urlParams.get('feature');
    
    if (upgrade === 'true' && feature) {
      setUpgradeFeature(feature);
    }
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // First, ensure wallet is connected for linking
      if (!isConnected) {
        await connect();
        if (!account) {
          toast({
            title: "Wallet Required",
            description: "Please connect your wallet to link your account",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Register user with email/password and wallet link
      const registrationData = {
        ...data,
        walletAddress: account,
        subscriptionStatus: 'free'
      };

      const response = await apiRequest('POST', '/api/auth/register', registrationData);
      
      if (response.ok) {
        const user = await response.json();
        
        // If this is an upgrade registration, create Stripe checkout
        if (upgradeFeature) {
          await initiateStripeCheckout(user.id, user.email);
        } else {
          toast({
            title: "Registration Successful",
            description: "Your account has been created successfully",
          });
          // Redirect to dashboard
          window.location.href = '/';
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateStripeCheckout = async (userId: string, email: string) => {
    try {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        userId,
        email,
        priceId: process.env.VITE_STRIPE_PRICE_ID || 'price_1234567890', // This should be set in environment
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/register?upgrade=true&feature=${encodeURIComponent(upgradeFeature)}`,
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {upgradeFeature ? (
              <>
                <Crown className="h-6 w-6 text-yellow-500" />
                <CardTitle>Upgrade to Pro</CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Premium
                </Badge>
              </>
            ) : (
              <>
                <User className="h-6 w-6 text-blue-500" />
                <CardTitle>Create Account</CardTitle>
              </>
            )}
          </div>
          <CardDescription>
            {upgradeFeature 
              ? `Create your account and unlock ${upgradeFeature}` 
              : "Join the advanced crypto trading platform"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Wallet Connection Status */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Wallet Connection</span>
            </div>
            {isConnected ? (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
            ) : (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Wallet will be connected during registration
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          className="pl-9"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-9"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {upgradeFeature && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Pro Features Included:
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Advanced AI analytics, institutional tools, and premium support for $15/month
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : 
                 upgradeFeature ? "Create Account & Upgrade" : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}