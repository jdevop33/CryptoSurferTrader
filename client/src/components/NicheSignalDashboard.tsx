import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Target, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Eye,
  Sparkles
} from 'lucide-react';
import { FeatureGate } from './FeatureGate';

interface CommunityInsight {
  communityName: string;
  platform: string;
  memberCount: number;
  growthRate: number;
  sentimentScore: number;
  topTopics: string[];
  influentialMembers: string[];
  viralityPotential: number;
  marketRelevance: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MarketIntelligence {
  emergingNarratives: string[];
  communityShifts: CommunityInsight[];
  sentimentTrends: {
    symbol: string;
    sentiment: number;
    momentum: number;
    communityBuzz: number;
  }[];
  actionableInsights: string[];
}

export function NicheSignalDashboard() {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityInsight | null>(null);

  const { data: marketIntelligence, isLoading: isLoadingIntelligence } = useQuery<MarketIntelligence>({
    queryKey: ['/api/niche-signal/market-intelligence'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: communityInsights, isLoading: isLoadingCommunities } = useQuery<CommunityInsight[]>({
    queryKey: ['/api/niche-signal/community-insights'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.7) return 'text-green-600';
    if (sentiment >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoadingIntelligence || isLoadingCommunities) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <FeatureGate feature="marketIntelligence" tier="PRO">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">NicheSignal AI Market Intelligence</h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Qwen AI
          </Badge>
        </div>

        <Tabs defaultValue="intelligence" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
            <TabsTrigger value="communities">Community Discovery</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Trends</TabsTrigger>
            <TabsTrigger value="insights">Actionable Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="intelligence" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Emerging Narratives
                  </CardTitle>
                  <CardDescription>
                    Hot topics driving crypto market conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketIntelligence?.emergingNarratives.map((narrative, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-2 w-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium">{narrative}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Shifts
                  </CardTitle>
                  <CardDescription>
                    Top performing crypto communities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketIntelligence?.communityShifts.slice(0, 3).map((community, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setSelectedCommunity(community)}
                      >
                        <div>
                          <p className="font-medium">{community.communityName}</p>
                          <p className="text-sm text-gray-600">{formatNumber(community.memberCount)} members</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${community.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {community.growthRate > 0 ? '+' : ''}{community.growthRate.toFixed(1)}%
                          </p>
                          <Badge className={getRiskColor(community.riskLevel)} variant="outline">
                            {community.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communities" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Discovery</CardTitle>
                  <CardDescription>
                    Emerging crypto communities with high growth potential
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {communityInsights?.map((community, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedCommunity?.communityName === community.communityName 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCommunity(community)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{community.communityName}</h3>
                          <Badge variant="outline">{community.platform}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Members</p>
                            <p className="font-medium">{formatNumber(community.memberCount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Growth Rate</p>
                            <p className={`font-medium ${community.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {community.growthRate > 0 ? '+' : ''}{community.growthRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Sentiment Score</span>
                            <span className={`text-xs font-medium ${getSentimentColor(community.sentimentScore)}`}>
                              {(community.sentimentScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={community.sentimentScore * 100} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Virality: {(community.viralityPotential * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Badge className={getRiskColor(community.riskLevel)} variant="outline">
                            {community.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedCommunity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      {selectedCommunity.communityName} Details
                    </CardTitle>
                    <CardDescription>
                      Deep insights into community dynamics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Top Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCommunity.topTopics.map((topic, index) => (
                            <Badge key={index} variant="secondary">
                              {topic.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Influential Members</h4>
                        <div className="space-y-2">
                          {selectedCommunity.influentialMembers.map((member, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              <span>{member}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Market Relevance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedCommunity.marketRelevance * 100} className="h-2 flex-1" />
                            <span className="text-sm font-medium">
                              {(selectedCommunity.marketRelevance * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Virality Potential</p>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedCommunity.viralityPotential * 100} className="h-2 flex-1" />
                            <span className="text-sm font-medium">
                              {(selectedCommunity.viralityPotential * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sentiment Trends
                </CardTitle>
                <CardDescription>
                  Real-time sentiment analysis across major crypto assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketIntelligence?.sentimentTrends.map((trend, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{trend.symbol}</h3>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">Live Analysis</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Sentiment</p>
                          <div className="flex items-center gap-2">
                            <Progress value={trend.sentiment * 100} className="h-2 flex-1" />
                            <span className={`text-sm font-medium ${getSentimentColor(trend.sentiment)}`}>
                              {(trend.sentiment * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Momentum</p>
                          <div className="flex items-center gap-2">
                            <Progress value={trend.momentum * 100} className="h-2 flex-1" />
                            <span className="text-sm font-medium">
                              {(trend.momentum * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Community Buzz</p>
                          <div className="flex items-center gap-2">
                            <Progress value={trend.communityBuzz * 100} className="h-2 flex-1" />
                            <span className="text-sm font-medium">
                              {(trend.communityBuzz * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Actionable Insights
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations for your trading strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketIntelligence?.actionableInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{insight}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600">Generated by AI analysis</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  );
}