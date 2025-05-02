
import { User, Session } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

export interface UserProfile extends Tables<'profiles'> {}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}
