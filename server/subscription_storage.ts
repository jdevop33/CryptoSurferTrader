import { type User } from "@shared/schema";

// Simple subscription-focused storage for freemium model
export interface ISubscriptionStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  createUser(userData: Partial<User>): Promise<User>;
}

export class SimpleSubscriptionStorage implements ISubscriptionStorage {
  private users: Map<string, User> = new Map();

  constructor() {
    // Initialize with a demo user
    this.users.set("demo-user", {
      id: "demo-user",
      email: "demo@trader.com",
      firstName: "Demo",
      lastName: "Trader",
      profileImageUrl: null,
      subscriptionStatus: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const id = userData.id || `user-${Date.now()}`;
    const user: User = {
      id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      subscriptionStatus: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(id, user);
    return user;
  }
}

export const subscriptionStorage = new SimpleSubscriptionStorage();