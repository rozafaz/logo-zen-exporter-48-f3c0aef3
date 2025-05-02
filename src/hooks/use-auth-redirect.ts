
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export function useAuthRedirect(redirectPath: string = '/auth') {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only redirect if:
    // 1. We're definitely not loading
    // 2. There's no user
    // 3. We're not already on the redirectPath (to prevent redirect loops)
    // 4. We're not on the landing page (/) - allow unauthenticated access there
    if (!isLoading && !user && !location.pathname.includes(redirectPath) && location.pathname !== '/') {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      });
      navigate(redirectPath, { replace: true }); // Using replace to avoid history buildup
    }
  }, [user, isLoading, navigate, redirectPath, location.pathname, toast]);
  
  return { isAuthenticated: !!user, isLoading };
}
