import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Settings, 
  Bell, 
  Wallet, 
  Shield, 
  Gift,
  ChevronRight,
  Plus,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState({
    username: 'CryptoTrader_Pro',
    level: 12,
    xp: 2840,
    xpToNext: 3500,
    totalPoints: 15670,
    badges: [
      { id: 'first_trade', name: 'First Trade', icon: '🎯', rarity: 'common' },
      { id: 'whale_spotter', name: 'Whale Spotter', icon: '🐋', rarity: 'rare' },
      { id: 'profit_master', name: 'Profit Master', icon: '💰', rarity: 'epic' },
      { id: 'diamond_hands', name: 'Diamond Hands', icon: '💎', rarity: 'legendary' }
    ],
    streak: 14,
    rank: 847,
    totalUsers: 12847,
    connections: {
      twitter: { connected: true, username: '@cryptotrader_pro' },
      discord: { connected: false, username: null },
      telegram: { connected: true, username: 'cryptotrader_pro' },
      reddit: { connected: false, username: null }
    },
    notifications: {
      signals: true,
      whales: true,
      portfolio: true,
      social: false
    },
    achievements: [
      { id: 'perfect_week', name: 'Perfect Week', description: '7 days of profitable trades', progress: 5, max: 7, reward: 500 },
      { id: 'signal_master', name: 'Signal Master', description: 'Act on 50 AI signals', progress: 32, max: 50, reward: 1000 },
      { id: 'whale_hunter', name: 'Whale Hunter', description: 'Spot 25 whale movements', progress: 18, max: 25, reward: 750 }
    ]
  });

  const [copied, setCopied] = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  const referralLink = `https://8trader8panda.com/ref/${user.username}`;
  const xpPercentage = (user.xp / user.xpToNext) * 100;
  const rankPercentage = ((user.totalUsers - user.rank) / user.totalUsers) * 100;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectService = (service: string) => {
    // Simulate connecting to external service
    setUser(prev => ({
      ...prev,
      connections: {
        ...prev.connections,
        [service]: { connected: true, username: `@${prev.username}` }
      }
    }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Crown className="w-10 h-10 text-yellow-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{user.username}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className="bg-white/20 text-white">Level {user.level}</Badge>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>#{user.rank} of {user.totalUsers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{user.totalPoints.toLocaleString()}</div>
                <div className="text-white/80">Total Points</div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Level {user.level} Progress</span>
                <span>{user.xp} / {user.xpToNext} XP</span>
              </div>
              <Progress value={xpPercentage} className="h-3 bg-white/20" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">{user.streak}</div>
                <div className="text-sm text-white/80">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{user.badges.length}</div>
                <div className="text-sm text-white/80">Badges</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{Math.round(rankPercentage)}%</div>
                <div className="text-sm text-white/80">Top Trader</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-6">
          {/* Badges Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Badge Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {user.badges.map((badge) => (
                  <div key={badge.id} className={`p-4 rounded-lg border-2 ${getRarityColor(badge.rarity)}`}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className="font-bold text-sm">{badge.name}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <Plus className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm">More badges to unlock</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Active Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{achievement.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{achievement.description}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      +{achievement.reward} pts
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.max}</span>
                    </div>
                    <Progress value={(achievement.progress / achievement.max) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Connect Your Accounts
                <Badge className="bg-green-100 text-green-800">+50 pts each</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Twitter */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">𝕏</span>
                  </div>
                  <div>
                    <div className="font-medium">Twitter/X</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {user.connections.twitter.connected 
                        ? `Connected as ${user.connections.twitter.username}`
                        : 'Share your wins and get more followers'
                      }
                    </div>
                  </div>
                </div>
                <Button 
                  variant={user.connections.twitter.connected ? "outline" : "default"}
                  onClick={() => connectService('twitter')}
                >
                  {user.connections.twitter.connected ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>

              {/* Discord */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">D</span>
                  </div>
                  <div>
                    <div className="font-medium">Discord</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Join our trading community and get exclusive signals
                    </div>
                  </div>
                </div>
                <Button onClick={() => connectService('discord')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>

              {/* Telegram */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sky-600 font-bold">T</span>
                  </div>
                  <div>
                    <div className="font-medium">Telegram</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {user.connections.telegram.connected 
                        ? `Connected as ${user.connections.telegram.username}`
                        : 'Get instant notifications on your phone'
                      }
                    </div>
                  </div>
                </div>
                <Button 
                  variant={user.connections.telegram.connected ? "outline" : "default"}
                  onClick={() => connectService('telegram')}
                >
                  {user.connections.telegram.connected ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>

              {/* Reddit */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">R</span>
                  </div>
                  <div>
                    <div className="font-medium">Reddit</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Share insights with crypto communities
                    </div>
                  </div>
                </div>
                <Button onClick={() => connectService('reddit')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Invite Friends & Earn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-2">Earn 500 points for each friend!</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Your friends get instant access to all features, and you both get bonus points.
                </p>
                <div className="flex gap-2">
                  <Input 
                    value={referralLink} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button onClick={copyReferralLink} variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">23</div>
                    <div className="text-sm text-slate-600">Friends Invited</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">11,500</div>
                    <div className="text-sm text-slate-600">Points Earned</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">87%</div>
                    <div className="text-sm text-slate-600">Conversion Rate</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Username</h3>
                <Input value={user.username} onChange={(e) => setUser(prev => ({ ...prev, username: e.target.value }))} />
              </div>

              <div>
                <h3 className="font-medium mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Trading Signals</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Get notified of new AI signals</div>
                    </div>
                    <Switch 
                      checked={user.notifications.signals}
                      onCheckedChange={(checked) => setUser(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, signals: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Whale Movements</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Alert when whales move large amounts</div>
                    </div>
                    <Switch 
                      checked={user.notifications.whales}
                      onCheckedChange={(checked) => setUser(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, whales: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Portfolio Updates</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Daily portfolio performance summary</div>
                    </div>
                    <Switch 
                      checked={user.notifications.portfolio}
                      onCheckedChange={(checked) => setUser(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, portfolio: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Social Updates</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Community posts and achievements</div>
                    </div>
                    <Switch 
                      checked={user.notifications.social}
                      onCheckedChange={(checked) => setUser(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, social: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}