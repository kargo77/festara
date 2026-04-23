import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Row { id: string; events: { id: string; title: string; starts_at: string; location: string | null } | null; }

const MyRegistrations = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("registrations")
        .select("id, events(id,title,starts_at,location)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold">My registrations</h1>
      {rows.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">You haven't registered for any events yet.</p>
          <Button asChild className="mt-4"><Link to="/events">Browse events</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => r.events && (
            <Card key={r.id} className="p-5 border-border/60 shadow-card flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.events.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(r.events.starts_at), "PP · p")}</span>
                  {r.events.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.events.location}</span>}
                </p>
              </div>
              <Button asChild variant="outline" size="sm"><Link to={`/events/${r.events.id}`}>View</Link></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
