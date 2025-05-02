
import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
    }
    
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className={cn(
      'w-full py-6 px-8 flex items-center justify-between',
      'animate-fade-in border-b border-gray-100',
      className
    )}>
      <div className="flex items-center">
        <div className="relative mr-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg animate-float">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 text-white"
            >
              <path d="M2 8V4a2 2 0 0 1 2-2h4" />
              <path d="M22 8V4a2 2 0 0 0-2-2h-4" />
              <path d="M8 22h8" />
              <path d="M12 17v5" />
              <path d="M5 17H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6" />
            </svg>
          </div>
        </div>
        <div>
          <Link to="/">
            <h1 className="text-xl font-medium tracking-tight">AI Logo Exporter</h1>
            <p className="text-sm text-muted-foreground">Export your logo in multiple formats</p>
          </Link>
        </div>
      </div>
      <nav className="hidden md:flex gap-6">
        <Link to="/" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Features</Link>
        <Link to="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Documentation</Link>
        <Link to="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Help</Link>
      </nav>
      
      <div className="flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="secondary" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button onClick={() => navigate('/auth?tab=signUp')}>Register</Button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
