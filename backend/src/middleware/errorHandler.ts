import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal error occurred.';

  res.status(statusCode).json({
    error: message,
    disclaimer: 'MediGuide AI provides educational information only. Always seek direct medical attention for acute health questions.',
  });
}
