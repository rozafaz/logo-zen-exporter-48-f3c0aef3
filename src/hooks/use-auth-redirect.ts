
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export function useAuthRedirect(redirectPath: string = '/auth') {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only redirect if we're definitely not loading and there's no user
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      });
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, redirectPath, toast]);
  
  return { isAuthenticated: !!user, isLoading };
}
