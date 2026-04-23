import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut } from "lucide-react";

export const SiteHeader = () => {
  const { user, signOut, isManager, isOrganizer } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow transition-smooth group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Festera</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/events" className={({ isActive }) =>
            `px-3 py-2 text-sm font-medium rounded-md transition-smooth ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
          }>Browse Events</NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) =>
              `px-3 py-2 text-sm font-medium rounded-md transition-smooth ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
            }>Dashboard</NavLink>
          )}
          {isOrganizer && (
            <NavLink to="/dashboard/events/new" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Create</NavLink>
          )}
          {isManager && (
            <NavLink to="/dashboard/admin/users" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Admin</NavLink>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button size="sm" className="bg-gradient-primary shadow-elegant" onClick={() => navigate("/auth?mode=signup")}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
