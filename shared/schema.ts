import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with simple username/password auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tradingPositions = pgTable("trading_positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  side: text("side").notNull(), // 'buy' or 'sell'
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  pnl: decimal("pnl", { precision: 18, scale: 8 }).default("0"),
  pnlPercent: decimal("pnl_percent", { precision: 10, scale: 4 }).default("0"),
  status: text("status").notNull().default("open"), // 'open', 'closed', 'pending'
  stopLoss: decimal("stop_loss", { precision: 18, scale: 8 }),
  takeProfit: decimal("take_profit", { precision: 18, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const tradeHistory = pgTable("trade_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  positionId: integer("position_id"),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  type: text("type").notNull(), // 'buy', 'sell'
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 18, scale: 8 }),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  pnl: decimal("pnl", { precision: 18, scale: 8 }).default("0"),
  trigger: text("trigger"), // 'social', 'stop_loss', 'take_profit', 'manual'
  metadata: jsonb("metadata"),
  executedAt: timestamp("executed_at").defaultNow(),
});

export const socialSentiment = pgTable("social_sentiment", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 4 }).notNull(),
  mentions: integer("mentions").default(0),
  influencerCount: integer("influencer_count").default(0),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }),
  volumeChange: decimal("volume_change", { precision: 10, scale: 4 }),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const tradingSettings = pgTable("trading_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  maxPositionSize: decimal("max_position_size", { precision: 18, scale: 2 }).default("100"),
  maxPositions: integer("max_positions").default(5),
  dailyLossLimit: decimal("daily_loss_limit", { precision: 18, scale: 2 }).default("200"),
  stopLossPercent: decimal("stop_loss_percent", { precision: 5, scale: 2 }).default("15"),
  takeProfitPercent: decimal("take_profit_percent", { precision: 5, scale: 2 }).default("30"),
  autoTradingEnabled: boolean("auto_trading_enabled").default(true),
  sentimentThreshold: decimal("sentiment_threshold", { precision: 5, scale: 4 }).default("0.8"),
  influencerThreshold: integer("influencer_threshold").default(5),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'trade', 'alert', 'risk', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'critical'
  read: boolean("read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for authentication system
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTradingPositionSchema = createInsertSchema(tradingPositions).omit({
  id: true,
  createdAt: true,
  closedAt: true,
});

export const insertTradeHistorySchema = createInsertSchema(tradeHistory).omit({
  id: true,
  executedAt: true,
});

export const insertSocialSentimentSchema = createInsertSchema(socialSentiment).omit({
  id: true,
  timestamp: true,
});

export const insertTradingSettingsSchema = createInsertSchema(tradingSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type TradingPosition = typeof tradingPositions.$inferSelect;
export type InsertTradingPosition = z.infer<typeof insertTradingPositionSchema>;

export type TradeHistory = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = z.infer<typeof insertTradeHistorySchema>;

export type SocialSentiment = typeof socialSentiment.$inferSelect;
export type InsertSocialSentiment = z.infer<typeof insertSocialSentimentSchema>;

export type TradingSettings = typeof tradingSettings.$inferSelect;
export type InsertTradingSettings = z.infer<typeof insertTradingSettingsSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
