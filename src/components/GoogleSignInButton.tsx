
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';

const GoogleSignInButton: React.FC = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Sign out</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={signInWithGoogle}
      className="text-muted-foreground hover:text-foreground border border-border/50 hover:border-border"
    >
      <LogIn className="w-4 h-4" />
      <span className="ml-2">Sign in with Google</span>
    </Button>
  );
};

export default GoogleSignInButton;
