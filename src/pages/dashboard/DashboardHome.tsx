import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Ticket, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface EventRow { id: string; title: string; starts_at: string; location: string | null; published: boolean; }

const DashboardHome = () => {
  const { user, isManager, isOrganizer, isVisitor, roles } = useAuth();
  const [stats, setStats] = useState({ events: 0, registrations: 0, upcoming: 0 });
  const [recent, setRecent] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Upcoming published events (visible to everyone)
      const { data: pub } = await supabase
        .from("events")
        .select("id,title,starts_at,location,published")
        .eq("published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5);
      setRecent((pub ?? []) as EventRow[]);

      let eventsCount = 0;
      let regsCount = 0;

      if (isManager) {
        const { count: ec } = await supabase.from("events").select("id", { count: "exact", head: true });
        const { count: rc } = await supabase.from("registrations").select("id", { count: "exact", head: true });
        eventsCount = ec ?? 0;
        regsCount = rc ?? 0;
      } else if (isOrganizer) {
        const { count: ec } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("organizer_id", user.id);
        eventsCount = ec ?? 0;
        const { data: myEv } = await supabase.from("events").select("id").eq("organizer_id", user.id);
        const ids = (myEv ?? []).map((e) => e.id);
        if (ids.length) {
          const { count: rc } = await supabase.from("registrations").select("id", { count: "exact", head: true }).in("event_id", ids);
          regsCount = rc ?? 0;
        }
      } else {
        const { count: rc } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("user_id", user.id);
        regsCount = rc ?? 0;
      }

      setStats({ events: eventsCount, registrations: regsCount, upcoming: pub?.length ?? 0 });
    })();
  }, [user, isManager, isOrganizer]);

  const greeting =
    isManager ? "Manager" : isOrganizer ? "Organizer" : isVisitor ? "Visitor" : "Member";

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge variant="secondary" className="bg-accent-soft text-accent border-0">{greeting} dashboard</Badge>
        <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold">Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] ?? "there"}.</h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening across Festera right now.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label={isManager ? "Total events" : isOrganizer ? "My events" : "Upcoming events"} value={isVisitor && !isOrganizer && !isManager ? stats.upcoming : stats.events} />
        <StatCard icon={Ticket} label={isVisitor && !isOrganizer && !isManager ? "My registrations" : "Total registrations"} value={stats.registrations} />
        <StatCard icon={BarChart3} label="Roles" value={roles.length} hint={roles.join(", ") || "—"} />
      </div>

      <Card className="p-6 border-border/60 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Upcoming events</h2>
          <Link to="/events" className="text-sm text-primary hover:underline">Browse all</Link>
        </div>
        <div className="mt-4 divide-y divide-border">
          {recent.length === 0 && <p className="py-6 text-sm text-muted-foreground">No upcoming events yet.</p>}
          {recent.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-smooth">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(e.starts_at), "PP · p")} {e.location && `· ${e.location}`}</p>
              </div>
              <Badge variant="outline">Open</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint?: string }) => (
  <Card className="p-6 border-border/60 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft">
        <Icon className="h-4 w-4 text-accent" />
      </div>
    </div>
    <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1 capitalize">{hint}</p>}
  </Card>
);

export default DashboardHome;
