import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Ev { id: string; title: string; description: string | null; location: string | null; starts_at: string; ends_at: string | null; capacity: number | null; cover_url: string | null; organizer_id: string; }

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Ev | null>(null);
  const [registered, setRegistered] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!id) return;
    const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    setEvent(data as Ev | null);
    const { count: c } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", id);
    setCount(c ?? 0);
    if (user) {
      const { data: r } = await supabase.from("registrations").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle();
      setRegistered(!!r);
    } else setRegistered(false);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations", filter: `event_id=eq.${id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [id]);

  const onRegister = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!event) return;
    setBusy(true);
    if (registered) {
      const { error } = await supabase.from("registrations").delete().eq("event_id", event.id).eq("user_id", user.id);
      if (error) toast.error(error.message); else toast.success("Registration cancelled");
    } else {
      const { error } = await supabase.from("registrations").insert({ event_id: event.id, user_id: user.id });
      if (error) toast.error(error.message); else toast.success("You're registered! 🎉");
    }
    setBusy(false);
    refresh();
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!event) return <div className="min-h-screen"><SiteHeader /><div className="container py-20 text-center"><p>Event not found.</p><Button asChild className="mt-4"><Link to="/events">Back</Link></Button></div></div>;

  const full = event.capacity != null && count >= event.capacity;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6"><Link to="/events"><ArrowLeft className="h-4 w-4 mr-2" />All events</Link></Button>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-hero shadow-elegant relative">
              {event.cover_url ? <img src={event.cover_url} alt={event.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary-foreground"><Calendar className="h-16 w-16" /></div>}
            </div>
            <div>
              <Badge className="bg-accent-soft text-accent border-0">{format(new Date(event.starts_at), "PPPP")}</Badge>
              <h1 className="mt-4 font-display text-4xl font-bold">{event.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(event.starts_at), "p")}{event.ends_at && ` – ${format(new Date(event.ends_at), "p")}`}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{count}{event.capacity ? ` / ${event.capacity}` : ""} registered</span>
              </div>
              {event.description && <p className="mt-6 text-foreground/90 leading-relaxed whitespace-pre-wrap">{event.description}</p>}
            </div>
          </div>
          <Card className="p-6 h-fit lg:sticky lg:top-24 border-border/60 shadow-elegant">
            <p className="text-sm text-muted-foreground">Reserve your spot</p>
            <p className="font-display text-2xl font-bold mt-1">Free entry</p>
            <Button className="mt-4 w-full bg-gradient-primary shadow-elegant" size="lg" onClick={onRegister}
              disabled={busy || (full && !registered)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : registered ? "Cancel registration" : full ? "Sold out" : "Register"}
            </Button>
            {!user && <p className="mt-3 text-xs text-muted-foreground text-center">You'll need an account to register.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
