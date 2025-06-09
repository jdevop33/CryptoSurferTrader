import asyncio
import json
import logging
import os
from typing import Dict, Set
import redis
import websockets
from websockets.server import WebSocketServerProtocol

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.pubsub = self.redis_client.pubsub()
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.user_subscriptions: Dict[WebSocketServerProtocol, int] = {}
        
    async def register_client(self, websocket: WebSocketServerProtocol):
        """Register a new WebSocket client"""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected: {websocket.remote_address}")
        
    async def unregister_client(self, websocket: WebSocketServerProtocol):
        """Unregister a WebSocket client"""
        self.connected_clients.discard(websocket)
        if websocket in self.user_subscriptions:
            del self.user_subscriptions[websocket]
        logger.info(f"Client disconnected: {websocket.remote_address}")
        
    async def handle_client_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'subscribe':
                user_id = data.get('userId')
                if user_id:
                    self.user_subscriptions[websocket] = user_id
                    await websocket.send(json.dumps({
                        'type': 'subscription_confirmed',
                        'userId': user_id
                    }))
            
            elif message_type == 'get_portfolio':
                user_id = data.get('userId')
                if user_id:
                    portfolio_data = await self.get_portfolio_data(user_id)
                    await websocket.send(json.dumps({
                        'type': 'portfolio_update',
                        'data': portfolio_data
                    }))
            
            elif message_type == 'get_sentiment':
                sentiment_data = await self.get_sentiment_data()
                await websocket.send(json.dumps({
                    'type': 'sentiment_update',
                    'data': sentiment_data
                }))
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from {websocket.remote_address}")
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
    
    async def get_portfolio_data(self, user_id: int) -> Dict:
        """Get portfolio data from Redis cache"""
        try:
            # This would typically fetch from your storage system
            # For now, return cached data or empty structure
            cached_portfolio = self.redis_client.get(f"portfolio:{user_id}")
            if cached_portfolio:
                return json.loads(cached_portfolio)
            
            return {
                'totalValue': '0.00',
                'dailyPnL': '0.00',
                'activePositions': 0,
                'maxPositions': 5,
                'availableFunds': '500.00',
                'positions': []
            }
            
        except Exception as e:
            logger.error(f"Error fetching portfolio data: {e}")
            return {}
    
    async def get_sentiment_data(self) -> list:
        """Get sentiment data from Redis cache"""
        try:
            sentiment_keys = self.redis_client.keys('sentiment:*')
            sentiment_data = []
            
            for key in sentiment_keys:
                cached_data = self.redis_client.get(key)
                if cached_data:
                    data = json.loads(cached_data)
                    sentiment_data.append(data)
            
            return sentiment_data
            
        except Exception as e:
            logger.error(f"Error fetching sentiment data: {e}")
            return []
    
    async def broadcast_to_user(self, user_id: int, message: Dict):
        """Broadcast message to specific user's connections"""
        user_clients = [
            ws for ws, uid in self.user_subscriptions.items() 
            if uid == user_id and ws in self.connected_clients
        ]
        
        if user_clients:
            message_str = json.dumps(message)
            await asyncio.gather(
                *[client.send(message_str) for client in user_clients],
                return_exceptions=True
            )
    
    async def broadcast_to_all(self, message: Dict):
        """Broadcast message to all connected clients"""
        if self.connected_clients:
            message_str = json.dumps(message)
            await asyncio.gather(
                *[client.send(message_str) for client in self.connected_clients],
                return_exceptions=True
            )
    
    async def redis_listener(self):
        """Listen for Redis pub/sub messages and broadcast to clients"""
        try:
            # Subscribe to relevant channels
            self.pubsub.subscribe(
                'portfolio_updates',
                'position_updates', 
                'sentiment_updates',
                'trade_alerts',
                'notifications'
            )
            
            while True:
                try:
                    message = self.pubsub.get_message(timeout=1.0)
                    if message and message['type'] == 'message':
                        channel = message['channel']
                        data = json.loads(message['data'])
                        
                        if channel == 'portfolio_updates':
                            user_id = data.get('userId')
                            if user_id:
                                await self.broadcast_to_user(user_id, {
                                    'type': 'portfolio_update',
                                    'data': data
                                })
                        
                        elif channel == 'position_updates':
                            user_id = data.get('userId')
                            if user_id:
                                await self.broadcast_to_user(user_id, {
                                    'type': 'position_update',
                                    'data': data
                                })
                        
                        elif channel == 'sentiment_updates':
                            await self.broadcast_to_all({
                                'type': 'sentiment_update',
                                'data': data
                            })
                        
                        elif channel == 'trade_alerts':
                            user_id = data.get('userId')
                            if user_id:
                                await self.broadcast_to_user(user_id, {
                                    'type': 'trade_alert',
                                    'data': data
                                })
                        
                        elif channel == 'notifications':
                            user_id = data.get('userId')
                            if user_id:
                                await self.broadcast_to_user(user_id, {
                                    'type': 'notification',
                                    'data': data
                                })
                
                except Exception as e:
                    logger.error(f"Redis listener error: {e}")
                    await asyncio.sleep(1)
                    
        except Exception as e:
            logger.error(f"Redis listener failed: {e}")
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle individual client connection"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                await self.handle_client_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.error(f"Client handler error: {e}")
        finally:
            await self.unregister_client(websocket)
    
    async def start_server(self, host: str = "0.0.0.0", port: int = 8001):
        """Start the WebSocket server"""
        logger.info(f"Starting WebSocket server on {host}:{port}")
        
        # Start Redis listener
        asyncio.create_task(self.redis_listener())
        
        # Start WebSocket server
        async with websockets.serve(self.handle_client, host, port):
            logger.info("WebSocket server started successfully")
            await asyncio.Future()  # Run forever

if __name__ == "__main__":
    server = WebSocketServer()
    asyncio.run(server.start_server())
