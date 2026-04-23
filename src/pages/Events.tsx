import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Search } from "lucide-react";
import { format } from "date-fns";

interface Ev { id: string; title: string; description: string | null; location: string | null; starts_at: string; cover_url: string | null; }

const Events = () => {
  const [events, setEvents] = useState<Ev[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,description,location,starts_at,cover_url")
        .eq("published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      setEvents((data ?? []) as Ev[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("events-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, async () => {
        const { data } = await supabase
          .from("events")
          .select("id,title,description,location,starts_at,cover_url")
          .eq("published", true)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });
        setEvents((data ?? []) as Ev[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(q.toLowerCase()) ||
    (e.location ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container py-12">
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold">Discover events</h1>
          <p className="mt-3 text-muted-foreground text-lg">Browse upcoming experiences from organizers around the world.</p>
        </header>
        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or city" className="pl-9" />
        </div>

        {loading ? (
          <p className="mt-12 text-muted-foreground">Loading events…</p>
        ) : filtered.length === 0 ? (
          <Card className="mt-12 p-12 text-center border-dashed">
            <p className="text-muted-foreground">No events yet. Check back soon.</p>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="group">
                <Card className="overflow-hidden h-full border-border/60 shadow-card hover:shadow-elegant transition-smooth">
                  <div className="aspect-[16/10] bg-gradient-hero relative overflow-hidden">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt={e.title} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-primary-foreground/80">
                        <Calendar className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <Badge variant="secondary" className="bg-accent-soft text-accent border-0">{format(new Date(e.starts_at), "PP")}</Badge>
                    <h3 className="mt-3 font-semibold text-lg group-hover:text-primary transition-smooth">{e.title}</h3>
                    {e.location && (
                      <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
