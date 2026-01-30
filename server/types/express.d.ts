import { Session } from 'express-session';
import { Request } from 'express';

export interface UserSession {
  id: number;
  role: string;
  businessId?: number;
}

export interface CustomSession extends Session {
  user?: UserSession;
}

export interface AuthenticatedRequest extends Request {
  session: CustomSession;
}