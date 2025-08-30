import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error logging middleware
export const errorLogger = (error: AppError, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.error(`[${timestamp}] ERROR: ${error.message}`);
  console.error(`Request: ${method} ${url}`);
  console.error(`User-Agent: ${userAgent}`);
  console.error(`IP: ${ip}`);
  
  if (error.stack && process.env.NODE_ENV === 'development') {
    console.error(`Stack: ${error.stack}`);
  }
  
  next(error);
};

// Development error handler (with stack traces)
const handleDevelopmentError = (error: AppError, req: Request, res: Response) => {
  const statusCode = error.statusCode || 500;
  
  res.status(statusCode).json({
    status: error.status || 'error',
    message: error.message,
    stack: error.stack,
    error: error,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Production error handler (no sensitive info)
const handleProductionError = (error: AppError, req: Request, res: Response) => {
  const statusCode = error.statusCode || 500;
  
  // Only send error details for operational errors
  if (error.isOperational) {
    res.status(statusCode).json({
      status: error.status || 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming errors - don't leak details
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  }
};

// Handle specific error types
const handleCastError = (error: any): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsError = (error: any): AppError => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = (error: any): AppError => {
  const errors = Object.values(error.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again!', 401);
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired! Please log in again.', 401);
};

// Main error handling middleware
export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    handleDevelopmentError(error, req, res);
  } else {
    let err = { ...error };
    err.message = error.message;

    if (error.name === 'CastError') err = handleCastError(err);
    if (error.code === 11000) err = handleDuplicateFieldsError(err);
    if (error.name === 'ValidationError') err = handleValidationError(err);
    if (error.name === 'JsonWebTokenError') err = handleJWTError();
    if (error.name === 'TokenExpiredError') err = handleJWTExpiredError();

    handleProductionError(err, req, res);
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};