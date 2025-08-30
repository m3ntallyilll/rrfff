import { Request, Response, NextFunction } from 'express';

interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
  metadata?: Record<string, any>;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory

  track(event: AnalyticsEvent) {
    this.events.push(event);
    
    // Keep only the latest events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Log important events
    if (event.event === 'battle_created' || event.event === 'payment_completed') {
      console.log(`📊 Analytics: ${event.event}`, {
        userId: event.userId,
        timestamp: event.timestamp,
        metadata: event.metadata
      });
    }
  }

  getEvents(filter?: Partial<AnalyticsEvent>): AnalyticsEvent[] {
    if (!filter) return this.events;
    
    return this.events.filter(event => {
      return Object.entries(filter).every(([key, value]) => {
        return (event as any)[key] === value;
      });
    });
  }

  getStats() {
    const totalEvents = this.events.length;
    const uniqueUsers = new Set(this.events.map(e => e.userId).filter(Boolean)).size;
    const eventTypes = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      uniqueUsers,
      eventTypes,
      lastEvent: this.events[this.events.length - 1]?.timestamp
    };
  }
}

export const analytics = new Analytics();

// Analytics tracking middleware
export const trackRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    
    // Track API requests
    if (req.path.startsWith('/api')) {
      const userId = (req as any).user?.claims?.sub;
      const sessionId = (req as any).session?.id;
      
      analytics.track({
        event: 'api_request',
        userId,
        sessionId,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        duration,
        statusCode: res.statusCode
      });
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Track specific events
export const trackEvent = (eventName: string, metadata?: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.claims?.sub;
    const sessionId = (req as any).session?.id;
    
    analytics.track({
      event: eventName,
      userId,
      sessionId,
      timestamp: new Date(),
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      metadata: {
        ...metadata,
        body: req.body,
        query: req.query
      }
    });
    
    next();
  };
};

// Battle-specific tracking
export const trackBattleCreated = trackEvent('battle_created');
export const trackBattleCompleted = trackEvent('battle_completed');
export const trackPaymentAttempt = trackEvent('payment_attempt');
export const trackPaymentCompleted = trackEvent('payment_completed');
export const trackUserSignup = trackEvent('user_signup');
export const trackUserLogin = trackEvent('user_login');

// Analytics API endpoints middleware
export const analyticsEndpoints = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/analytics/stats') {
    const stats = analytics.getStats();
    return res.json(stats);
  }
  
  if (req.path === '/api/analytics/events') {
    const { userId, event, limit = 100 } = req.query;
    const filter: Partial<AnalyticsEvent> = {};
    
    if (userId) filter.userId = userId as string;
    if (event) filter.event = event as string;
    
    const events = analytics.getEvents(filter).slice(-Number(limit));
    return res.json(events);
  }
  
  next();
};