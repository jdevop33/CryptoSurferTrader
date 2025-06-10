# 8trader8panda8.xin Domain Setup for Twitter API

## DNS Configuration

### Required DNS Records
```
Type: A
Name: @
Value: 0.0.0.0 (Will be updated with Replit deployment IP)
TTL: 300

Type: A  
Name: www
Value: 0.0.0.0 (Will be updated with Replit deployment IP)
TTL: 300

Type: CNAME
Name: api
Value: 8trader8panda8.xin
TTL: 300
```

### SSL/TLS Settings
- Enable HTTPS redirect
- Set SSL mode to "Full (strict)" if using Cloudflare
- Enable HSTS (HTTP Strict Transport Security)

## Twitter Developer Portal Configuration

### App Permissions
**Select: Read and write and Direct message**
- This enables monitoring tweets and posting updates
- Required for comprehensive social sentiment analysis
- Allows direct messaging for alerts (optional)

### Request Email from Users
**Leave unchecked for now** - Not needed for automated trading

### Type of App
**Select: Web App, Automated App or Bot**
- This is a confidential client
- Enables OAuth 2.0 for secure authentication
- Required for v2 API streaming endpoints

### App Info Configuration

#### Callback URI / Redirect URL
```
https://8trader8panda8.xin/auth/twitter/callback
```

#### Website URL
```
https://8trader8panda8.xin
```

#### Organization Name
```
8Trader8Panda - Automated Crypto Trading
```

#### Organization URL
```
https://8trader8panda8.xin
```

#### Terms of Service
```
https://8trader8panda8.xin/terms
```

#### Privacy Policy
```
https://8trader8panda8.xin/privacy
```

## Required Pages to Create

### Terms of Service Page
- Automated trading disclaimer
- Risk warnings for cryptocurrency trading
- User responsibilities and limitations
- Service availability terms

### Privacy Policy Page
- Data collection practices (Twitter data, trading data)
- How social sentiment data is processed
- User data retention policies
- Third-party integrations (Alibaba AI, market data)

## Replit Deployment Configuration

### Environment Variables for Production
```
DOMAIN=8trader8panda8.xin
TWITTER_CLIENT_ID=[from Twitter Developer Portal]
TWITTER_CLIENT_SECRET=[from Twitter Developer Portal]
CALLBACK_URL=https://8trader8panda8.xin/auth/twitter/callback
```

### Custom Domain Setup
1. Deploy app on Replit
2. Get deployment IP address
3. Update DNS A records with actual IP
4. Configure SSL certificate
5. Test domain resolution

## Post-Setup Verification

### Test Endpoints
```
https://8trader8panda8.xin/api/system/health
https://8trader8panda8.xin/auth/twitter/callback
https://8trader8panda8.xin/terms
https://8trader8panda8.xin/privacy
```

### Twitter API Testing
```
curl -H "Authorization: Bearer YOUR_TOKEN" \
https://api.twitter.com/2/tweets/search/stream/rules
```

This configuration will enable:
- Twitter v2 streaming API access
- Professional appearance for users
- Secure OAuth 2.0 authentication
- Compliance with Twitter Developer Policy