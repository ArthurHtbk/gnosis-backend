import type { User } from '@supabase/supabase-js';

declare module 'express-serve-static-core' {
  // eslint-disable-next-line no-unused-vars
  interface Request {
    user?: User;
  }
}
