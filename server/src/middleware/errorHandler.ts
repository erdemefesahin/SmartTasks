import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

export function errorHandler(err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(err.status ?? 500).json({
    error: err.message ?? 'Internal server error',
  });
}
