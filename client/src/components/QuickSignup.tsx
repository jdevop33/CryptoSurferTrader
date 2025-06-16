import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Zap, 
  Gift, 
  Crown, 
  Sparkles,
  ArrowRight,
  Twitter,
  MessageCircle,
  Send,
  Users
} from 'lucide-react';

interface QuickSignupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userData: any) => void;
}

export function QuickSignup({ isOpen, onClose, onComplete }: QuickSignupProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const socialSignup = (provider: string) => {
    setIsCreating(true);
    // Simulate social signup
    setTimeout(() => {
      const userData = {
        username: `${provider}_user_${Math.floor(Math.random() * 1000)}`,
        provider,
        points: 100,
        level: 1
      };
      onComplete(userData);
    }, 1500);
  };

  const usernameSignup = () => {
    if (!username.trim()) return;
    
    setIsCreating(true);
    setTimeout(() => {
      const userData = {
        username: username.trim(),
        provider: 'username',
        points: 150,
        level: 1
      };
      onComplete(userData);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <CardContent className="p-8">
          {!isCreating ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Join 8Trader8Panda</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Start earning points and unlock premium features instantly
                </p>
              </div>

              {/* Instant Rewards Preview */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-400">Instant Rewards</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600">+150</div>
                    <div className="text-xs">Welcome Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">Level 1</div>
                    <div className="text-xs">Instant Unlock</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">Free</div>
                    <div className="text-xs">AI Signals</div>
                  </div>
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  {/* Social Signup Options */}
                  <div className="space-y-3">
                    <Button 
                      onClick={() => socialSignup('twitter')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Continue with Twitter
                      <Badge className="ml-auto bg-white/20">+50 bonus</Badge>
                    </Button>
                    
                    <Button 
                      onClick={() => socialSignup('discord')}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Continue with Discord
                      <Badge className="ml-auto bg-white/20">+50 bonus</Badge>
                    </Button>
                    
                    <Button 
                      onClick={() => socialSignup('telegram')}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Continue with Telegram
                      <Badge className="ml-auto bg-white/20">+50 bonus</Badge>
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white dark:bg-slate-900 px-3 text-slate-500">or</span>
                    </div>
                  </div>

                  {/* Username Option */}
                  <Button 
                    onClick={() => setStep(2)}
                    variant="outline" 
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create with Username
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Choose your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-center"
                      onKeyPress={(e) => e.key === 'Enter' && usernameSignup()}
                    />
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      This is how other traders will know you
                    </p>
                  </div>
                  
                  <Button 
                    onClick={usernameSignup}
                    disabled={!username.trim()}
                    className="w-full"
                  >
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button 
                    onClick={() => setStep(1)}
                    variant="ghost" 
                    className="w-full"
                  >
                    Back to social login
                  </Button>
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-xs text-slate-500">
                  No credit card required • Start trading in seconds
                </p>
              </div>
            </>
          ) : (
            /* Creating Account Animation */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Creating Your Account...</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Setting up your AI trading dashboard
              </p>
              <div className="space-y-2 text-sm text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Generating welcome rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Activating AI signals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Customizing dashboard</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}