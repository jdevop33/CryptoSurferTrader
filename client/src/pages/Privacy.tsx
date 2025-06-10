export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-lg dark:prose-invert">
          <h2>8Trader8Panda Privacy Policy</h2>
          <p>Last updated: June 2025</p>
          
          <h3>1. Information We Collect</h3>
          
          <h4>Social Media Data</h4>
          <ul>
            <li>Public tweets from cryptocurrency influencers and traders</li>
            <li>Social sentiment metrics and engagement data</li>
            <li>Hashtag trends and mention frequencies</li>
            <li>Public profile information for sentiment analysis</li>
          </ul>
          
          <h4>Market Data</h4>
          <ul>
            <li>Real-time cryptocurrency prices and trading volumes</li>
            <li>Market capitalization and liquidity data</li>
            <li>Historical price movements and technical indicators</li>
            <li>DEX trading pair information and order book data</li>
          </ul>
          
          <h4>User Trading Data</h4>
          <ul>
            <li>Trading preferences and risk tolerance settings</li>
            <li>Portfolio positions and transaction history</li>
            <li>Wallet addresses for trade execution (encrypted)</li>
            <li>Performance metrics and profit/loss calculations</li>
          </ul>
          
          <h3>2. How We Use Your Information</h3>
          
          <h4>AI-Powered Analysis</h4>
          <p>We use Alibaba Cloud Model Studio to process social sentiment data and generate trading signals. This involves:</p>
          <ul>
            <li>Multi-agent sentiment analysis of social media posts</li>
            <li>Risk assessment and confidence scoring</li>
            <li>Market trend identification and prediction</li>
            <li>Automated trading decision recommendations</li>
          </ul>
          
          <h4>Trading Execution</h4>
          <ul>
            <li>Executing trades based on your configured strategies</li>
            <li>Managing stop-loss and take-profit orders</li>
            <li>Portfolio rebalancing and risk management</li>
            <li>Real-time position monitoring and alerts</li>
          </ul>
          
          <h3>3. Data Storage and Security</h3>
          
          <h4>Storage Methods</h4>
          <ul>
            <li>Trading data stored in encrypted Redis cache</li>
            <li>Historical data maintained for performance analysis</li>
            <li>Wallet private keys encrypted with industry-standard methods</li>
            <li>Social media data processed in real-time, not permanently stored</li>
          </ul>
          
          <h4>Security Measures</h4>
          <ul>
            <li>End-to-end encryption for sensitive trading data</li>
            <li>Secure API connections with rate limiting</li>
            <li>Regular security audits and monitoring</li>
            <li>Emergency stop mechanisms for immediate trade halt</li>
          </ul>
          
          <h3>4. Third-Party Services</h3>
          
          <h4>Data Providers</h4>
          <ul>
            <li><strong>Twitter/X API:</strong> Social media sentiment data collection</li>
            <li><strong>CoinGecko:</strong> Real-time cryptocurrency market data</li>
            <li><strong>Alibaba Cloud:</strong> AI analysis and trading signal generation</li>
            <li><strong>Ethereum Network:</strong> DEX trading and transaction execution</li>
          </ul>
          
          <h4>Third-Party Policies</h4>
          <p>Your data may be subject to the privacy policies of these third-party services. We recommend reviewing their terms independently.</p>
          
          <h3>5. Data Retention</h3>
          <ul>
            <li>Active trading data: Retained while account is active</li>
            <li>Historical performance: Kept for 2 years for analysis</li>
            <li>Social media data: Processed in real-time, not stored</li>
            <li>Account deletion: All data permanently removed within 30 days</li>
          </ul>
          
          <h3>6. Your Rights</h3>
          <ul>
            <li>Access your stored trading data and performance metrics</li>
            <li>Modify trading preferences and risk settings</li>
            <li>Request data deletion and account termination</li>
            <li>Opt-out of specific data collection methods</li>
            <li>Export your trading history and performance data</li>
          </ul>
          
          <h3>7. Data Sharing</h3>
          <p>We do not sell or share your personal trading data. Limited data may be shared only for:</p>
          <ul>
            <li>Legal compliance and regulatory requirements</li>
            <li>Security investigations and fraud prevention</li>
            <li>Service providers essential for platform operation</li>
            <li>Aggregated, anonymized performance statistics</li>
          </ul>
          
          <h3>8. International Data Transfers</h3>
          <p>Your data may be processed in different countries through our cloud infrastructure. We ensure appropriate safeguards are in place for international transfers.</p>
          
          <h3>9. Updates to This Policy</h3>
          <p>We may update this privacy policy periodically. Significant changes will be communicated through the platform before taking effect.</p>
          
          <h3>10. Contact Us</h3>
          <p>For privacy-related questions or requests, contact us through:</p>
          <ul>
            <li>Platform support system</li>
            <li>Website: 8trader8panda8.xin</li>
            <li>Email support (when available)</li>
          </ul>
          
          <p className="mt-8 text-sm text-muted-foreground">
            By using 8Trader8Panda, you consent to the data practices described in this privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}