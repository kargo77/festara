import { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Calendar, Users, BarChart3, Ticket, PlusCircle, Shield, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item { to: string; label: string; icon: any; }

export const DashboardLayout = ({ children }: { children?: ReactNode }) => {
  const { isManager, isOrganizer, isVisitor } = useAuth();

  const items: Item[] = [{ to: "/dashboard", label: "Overview", icon: BarChart3 }];
  if (isVisitor) items.push({ to: "/dashboard/my-registrations", label: "My Registrations", icon: Ticket });
  if (isOrganizer) {
    items.push({ to: "/dashboard/my-events", label: "My Events", icon: Calendar });
    items.push({ to: "/dashboard/events/new", label: "Create Event", icon: PlusCircle });
  }
  if (isManager) {
    items.push({ to: "/dashboard/admin/events", label: "All Events", icon: ListChecks });
    items.push({ to: "/dashboard/admin/users", label: "Users & Roles", icon: Users });
    items.push({ to: "/dashboard/admin/analytics", label: "Analytics", icon: Shield });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <div className="container flex-1 grid md:grid-cols-[240px_1fr] gap-8 py-8">
        <aside className="md:sticky md:top-24 md:self-start">
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.to === "/dashboard"}
                className={({ isActive }) =>
                  cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth",
                    isActive ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }>
                <it.icon className="h-4 w-4" />
                {it.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
};
