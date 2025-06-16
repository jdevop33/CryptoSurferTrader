import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet, 
  Trophy, 
  Zap, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  Gift,
  Sparkles,
  Crown,
  Star,
  Users,
  TrendingUp,
  Brain,
  Shield
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (userData: any) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    username: '',
    tradingExperience: '',
    interests: [],
    notifications: true,
    walletConnected: false
  });
  const [rewards, setRewards] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const experienceLevels = [
    { id: 'beginner', label: 'Complete Beginner', description: 'Never traded crypto before', reward: 50 },
    { id: 'casual', label: 'Casual Trader', description: 'Trade occasionally on exchanges', reward: 75 },
    { id: 'active', label: 'Active Trader', description: 'Trade regularly, know the basics', reward: 100 },
    { id: 'expert', label: 'Expert Trader', description: 'Professional/experienced trader', reward: 150 }
  ];

  const interests = [
    { id: 'memecoins', label: 'Meme Coins', icon: '🐕', reward: 25 },
    { id: 'defi', label: 'DeFi Protocols', icon: '🏦', reward: 25 },
    { id: 'nfts', label: 'NFTs', icon: '🎨', reward: 25 },
    { id: 'analytics', label: 'Technical Analysis', icon: '📊', reward: 25 },
    { id: 'news', label: 'Crypto News', icon: '📰', reward: 25 },
    { id: 'whales', label: 'Whale Tracking', icon: '🐋', reward: 25 }
  ];

  const addReward = (amount: number, badgeName?: string) => {
    setRewards(prev => prev + amount);
    if (badgeName) {
      setBadges(prev => [...prev, badgeName]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      addReward(20, step === 1 ? 'Quick Starter' : undefined);
    }
  };

  const handleExperienceSelect = (level: string) => {
    const selectedLevel = experienceLevels.find(l => l.id === level);
    setUserData(prev => ({ ...prev, tradingExperience: level }));
    addReward(selectedLevel?.reward || 0, 'Experience Badge');
    setTimeout(handleNext, 500);
  };

  const handleInterestToggle = (interestId: string) => {
    const interest = interests.find(i => i.id === interestId);
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(i => i !== interestId)
        : [...prev.interests, interestId]
    }));
    
    if (!userData.interests.includes(interestId)) {
      addReward(interest?.reward || 0);
    }
  };

  const connectWallet = async () => {
    // Simulate wallet connection
    setTimeout(() => {
      setUserData(prev => ({ ...prev, walletConnected: true }));
      addReward(200, 'Wallet Master');
      setTimeout(handleNext, 500);
    }, 1000);
  };

  const completeOnboarding = () => {
    addReward(500, 'Onboarding Champion');
    setTimeout(() => {
      onComplete({ ...userData, rewards, badges });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-green-900/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h1 className="text-3xl font-bold">Welcome to 8Trader8Panda</h1>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Rewards Display */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 px-4 py-2 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-800 dark:text-yellow-400">{rewards} Points</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/20 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-purple-800 dark:text-purple-400">{badges.length} Badges</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Choose Your Username</h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Pick something cool - this is how other traders will know you
                  </p>
                </div>
                <div className="max-w-md mx-auto">
                  <Input
                    placeholder="Your awesome username"
                    value={userData.username}
                    onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                    className="text-center text-lg"
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    💡 Tip: Creative usernames get bonus points!
                  </p>
                </div>
                <Button 
                  onClick={handleNext} 
                  disabled={!userData.username}
                  className="px-8 py-3 text-lg"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">What's Your Trading Experience?</h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    We'll customize your experience based on your level
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleExperienceSelect(level.id)}
                      className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{level.label}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{level.description}</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          +{level.reward} pts
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">What Interests You?</h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Select all that apply - we'll personalize your dashboard
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {interests.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => handleInterestToggle(interest.id)}
                      className={`p-4 border-2 rounded-lg transition-colors text-left ${
                        userData.interests.includes(interest.id)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{interest.icon}</span>
                          <span className="font-medium">{interest.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {userData.interests.includes(interest.id) && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          <Badge variant="secondary">+{interest.reward}</Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={handleNext}
                    disabled={userData.interests.length === 0}
                    className="px-8 py-3"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Connect MetaMask to unlock your personalized trading dashboard
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-400">100% Safe & Non-Custodial</span>
                  </div>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>✓ We never see your private keys</li>
                    <li>✓ You control your funds completely</li>
                    <li>✓ Disconnect anytime</li>
                  </ul>
                </div>

                <Button 
                  onClick={connectWallet}
                  disabled={userData.walletConnected}
                  className="px-8 py-3 text-lg bg-orange-600 hover:bg-orange-700"
                >
                  {userData.walletConnected ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Wallet Connected!
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect MetaMask (+200 pts)
                    </>
                  )}
                </Button>
                
                <button 
                  onClick={handleNext}
                  className="text-slate-500 underline"
                >
                  Skip for now (connect later)
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">You're All Set! 🎉</h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Welcome to the future of crypto trading
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">Your Rewards</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{rewards + 500}</div>
                      <div>Total Points Earned</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{badges.length + 1}</div>
                      <div>Badges Collected</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold">What you get FREE:</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Live AI trading signals
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Whale movement alerts
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Portfolio tracking
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Scam protection
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={completeOnboarding}
                  className="px-8 py-3 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Trading Smart
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom encouragement */}
        <div className="text-center text-sm text-slate-500">
          <p>Join 12,847+ smart traders already using 8Trader8Panda</p>
        </div>
      </div>
    </div>
  );
}