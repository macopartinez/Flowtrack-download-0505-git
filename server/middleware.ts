import type { Request, Response, NextFunction } from "express";
import { getCurrentUser, getUserById } from "./auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getCurrentUser(req);
  
  if (!userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  next();
}

export function requireVerified(req: Request, res: Response, next: NextFunction) {
  const userId = getCurrentUser(req);
  
  if (!userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  getUserById(userId).then(user => {
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Compte non vérifié",
        requiresVerification: true 
      });
    }
    
    next();
  }).catch(err => {
    return res.status(500).json({ message: "Erreur serveur" });
  });
}

export function requireOwnership(paramName: string = "userId") {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getCurrentUser(req);
    const requestedId = Number(req.params[paramName]);
    
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    if (userId !== requestedId) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    
    next();
  };
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 5, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    
    const record = rateLimitStore.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        message: "Trop de tentatives. Réessayez dans quelques minutes." 
      });
    }
    
    record.count++;
    next();
  };
}
