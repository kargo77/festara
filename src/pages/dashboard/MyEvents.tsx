import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Users } from "lucide-react";
import { format } from "date-fns";

interface Ev { id: string; title: string; starts_at: string; published: boolean; }

const MyEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,starts_at,published")
        .eq("organizer_id", user.id)
        .order("starts_at", { ascending: true });
      setEvents((data ?? []) as Ev[]);
    })();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">My events</h1>
        <Button asChild className="bg-gradient-primary shadow-elegant"><Link to="/dashboard/events/new">+ New event</Link></Button>
      </div>
      {events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">No events yet. Create your first one!</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {events.map((e) => (
            <Card key={e.id} className="p-5 border-border/60 shadow-card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{e.title}</p>
                  {e.published ? <Badge className="bg-success text-success-foreground">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{format(new Date(e.starts_at), "PP · p")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to={`/dashboard/events/${e.id}/attendees`}><Users className="h-3 w-3 mr-1" />Attendees</Link></Button>
                <Button asChild size="sm"><Link to={`/dashboard/events/${e.id}/edit`}><Edit className="h-3 w-3 mr-1" />Edit</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
