
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthState, UserProfile } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';

// Import the SUPABASE_URL value from the client file
import { SUPABASE_URL } from '@/integrations/supabase/client';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        setState(current => ({ ...current, session, user: session?.user ?? null }));
        
        // Defer profile fetching to avoid recursion
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setState(current => ({ ...current, profile: null }));
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      setState(current => ({ ...current, session, user: session?.user ?? null, isLoading: false }));
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setState(current => ({ ...current, profile: data }));
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      
      toast({
        title: "Account created successfully",
        description: "Please check your email for verification instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast({
        title: "Signed in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      
      // First clear local state immediately - don't wait for API response
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false
      });
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase signOut error:", error);
        // Even with an error, we keep the user signed out locally
      }
      
      // Force clear any remaining storage - handle both token types
      const projectRef = SUPABASE_URL
        .replace('https://', '')
        .replace('http://', '')
        .replace(/\/$/, '')
        .split('.')[0];
      
      // Remove both auth token AND refresh token
      localStorage.removeItem(`sb-${projectRef}-auth-token`);
      localStorage.removeItem(`sb-${projectRef}-refresh-token`);
      
      console.log("Successfully signed out");
      
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      // We've already cleared the local state, so the user is effectively signed out
      
      toast({
        title: "Sign out completed locally",
        description: "You are now signed out",
      });
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!state.user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', state.user.id);

      if (error) throw error;
      
      // Refresh the profile after update
      await refreshProfile();
      
      toast({
        title: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    await fetchProfile(state.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
