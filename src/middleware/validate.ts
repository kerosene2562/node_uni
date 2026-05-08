import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try{
        req.body = schema.parse(req.body);
        next();
    } catch(error) {
        next(error);
    }
  };
}