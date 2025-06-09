import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { z } from "zod";
import { insertTradingPositionSchema, insertTradingSettingsSchema } from "@shared/schema";

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

  // Portfolio endpoints
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const positions = await storage.getActivePositions(userId);
      const settings = await storage.getTradingSettings(userId);
      const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.size || "0"), 0);
      const totalPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.pnl || "0"), 0);

      res.json({
        totalValue: totalValue.toFixed(2),
        dailyPnL: totalPnL.toFixed(2),
        activePositions: positions.length,
        maxPositions: settings?.maxPositions || 5,
        availableFunds: (parseFloat(settings?.maxPositionSize || "100") * (settings?.maxPositions || 5) - totalValue).toFixed(2),
        positions
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Trading positions endpoints
  app.get("/api/positions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const positions = await storage.getActivePositions(userId);
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
      const trades = await storage.getTradeHistory(userId, limit);
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
      const sentiment = await storage.getSocialSentiment(symbolList);
      res.json(sentiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sentiment data" });
    }
  });

  // Trading settings endpoints
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getTradingSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading settings" });
    }
  });

  app.patch("/api/settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      const settings = await storage.updateTradingSettings(userId, updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trading settings" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotifications(userId);
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
      
      // Disable auto trading
      await storage.updateTradingSettings(userId, { autoTradingEnabled: false });
      
      // Close all positions (in a real implementation, this would trigger the trading engine)
      const positions = await storage.getActivePositions(userId);
      for (const position of positions) {
        await storage.closePosition(position.id);
      }
      
      // Emit emergency stop notification
      io.to(`user-${userId}`).emit('emergency-stop');
      
      res.json({ success: true, message: "Emergency stop executed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute emergency stop" });
    }
  });

  return httpServer;
}
