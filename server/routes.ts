import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { dataService } from "./data_service";
import { alibabaAIService } from "./alibaba_ai_service";
import { twitterService } from "./twitter_service";
import { dexTradingService } from "./dex_trading_service";
import { backtestingService } from "./backtesting_service";
import { productionTestingService } from "./production_testing_service";
import { z } from "zod";
import { insertTradingPositionSchema, insertTradingSettingsSchema } from "@shared/schema";
import { spawn } from "child_process";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('subscribe-updates', (userId: number) => {
      socket.join(`user-${userId}`);
    });
  });

  // Store io instance for use in other modules
  (app as any).io = io;

  // Start Python trading service
  let pythonProcess: any = null;
  try {
    pythonProcess = spawn('python3', ['python_service.py'], { 
      cwd: process.cwd() + '/server',
      detached: false,
      stdio: 'pipe'
    });
    
    pythonProcess.stdout?.on('data', (data: any) => {
      console.log(`Python Service: ${data}`);
    });
    
    pythonProcess.stderr?.on('data', (data: any) => {
      console.error(`Python Service Error: ${data}`);
    });
    
    console.log('Python trading service started');
  } catch (error) {
    console.error('Failed to start Python service:', error);
  }

  // Portfolio endpoints - using authenticated market data service
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const portfolio = await dataService.getPortfolio(userId);
      const positions = await dataService.getPositions(userId);

      res.json({
        totalValue: portfolio.totalValue,
        dailyPnL: portfolio.dailyPnL,
        unrealizedPnL: portfolio.unrealizedPnL,
        realizedPnL: portfolio.realizedPnL,
        availableBalance: portfolio.availableBalance,
        marginUsed: portfolio.marginUsed,
        activePositions: parseInt(portfolio.activePositions),
        positions
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Trading positions endpoints
  app.get("/api/positions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const positions = await dataService.getPositions(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    try {
      const positionData = insertTradingPositionSchema.parse(req.body);
      const position = await storage.createPosition(positionData);
      
      // Emit real-time update
      io.to(`user-${position.userId}`).emit('position-update', position);
      
      res.json(position);
    } catch (error) {
      res.status(400).json({ error: "Invalid position data" });
    }
  });

  app.patch("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const position = await storage.updatePosition(id, updates);
      
      if (position) {
        // Emit real-time update
        io.to(`user-${position.userId}`).emit('position-update', position);
        res.json(position);
      } else {
        res.status(404).json({ error: "Position not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update position" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.closePosition(id);
      
      if (success) {
        // Emit real-time update
        io.emit('position-closed', id);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Position not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to close position" });
    }
  });

  // Trade history endpoints
  app.get("/api/trades/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await dataService.getTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade history" });
    }
  });

  // Social sentiment endpoints
  app.get("/api/sentiment", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      const symbolList = symbols ? symbols.split(',') : [];
      const sentiment = await dataService.getSentiment(symbolList.length > 0 ? symbolList : undefined);
      res.json(sentiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sentiment data" });
    }
  });

  // Trading settings endpoints
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await dataService.getSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading settings" });
    }
  });

  app.patch("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      const settings = await dataService.updateSettings(userId, updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trading settings" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await dataService.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationRead(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Trading control endpoints
  app.post("/api/trading/toggle/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { enabled } = req.body;
      const settings = await storage.updateTradingSettings(userId, { autoTradingEnabled: enabled });
      
      // Emit real-time update
      io.to(`user-${userId}`).emit('trading-status-change', { enabled });
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle trading" });
    }
  });

  app.post("/api/trading/emergency-stop/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Execute emergency stop using authenticated data service
      const result = await dataService.emergencyStop(userId);
      
      // Emit emergency stop notification
      io.to(`user-${userId}`).emit('emergency-stop');
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute emergency stop" });
    }
  });

  // AI-powered trading recommendations using Alibaba Cloud Model Studio
  app.get("/api/ai/recommendations", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      const symbolList = symbols ? symbols.split(',') : ['DOGECOIN', 'SHIBA', 'PEPE', 'FLOKI'];
      
      if (!alibabaAIService.isReady()) {
        return res.status(503).json({ 
          error: "AI service initializing",
          message: "Alibaba Cloud AI service is starting up. Please try again in a moment."
        });
      }
      
      const recommendations = await alibabaAIService.getAIRecommendations(symbolList);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI recommendations" });
    }
  });

  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { symbol, price, volume, marketCap, sentiment, socialMentions, influencerCount } = req.body;
      
      if (!alibabaAIService.isReady()) {
        return res.status(503).json({ 
          error: "AI service not ready",
          message: "Alibaba Cloud AI service is initializing"
        });
      }
      
      const marketData = {
        symbol,
        price: parseFloat(price),
        volume: parseInt(volume),
        marketCap: parseInt(marketCap),
        sentiment: parseFloat(sentiment),
        socialMentions: parseInt(socialMentions),
        influencerCount: parseInt(influencerCount)
      };
      
      const analysis = await alibabaAIService.analyzeMarketData(marketData);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze market data" });
    }
  });

  // AI service status endpoint
  app.get("/api/ai/status", async (req, res) => {
    res.json({
      ready: alibabaAIService.isReady(),
      service: "Alibaba Cloud Model Studio",
      capabilities: [
        "Multi-agent market analysis",
        "Social sentiment processing",
        "Risk assessment",
        "Trading signal generation"
      ]
    });
  });

  return httpServer;
}
