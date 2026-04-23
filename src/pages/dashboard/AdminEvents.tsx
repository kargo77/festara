import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Ev { id: string; title: string; starts_at: string; published: boolean; organizer_id: string; }

const AdminEvents = () => {
  const [events, setEvents] = useState<Ev[]>([]);
  const refresh = async () => {
    const { data } = await supabase.from("events").select("id,title,starts_at,published,organizer_id").order("starts_at", { ascending: false });
    setEvents((data ?? []) as Ev[]);
  };
  useEffect(() => { refresh(); }, []);

  const togglePublish = async (e: Ev) => {
    const { error } = await supabase.from("events").update({ published: !e.published }).eq("id", e.id);
    if (error) toast.error(error.message); else { toast.success("Updated"); refresh(); }
  };
  const remove = async (e: Ev) => {
    if (!confirm(`Delete "${e.title}"?`)) return;
    const { error } = await supabase.from("events").delete().eq("id", e.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold">All events</h1>
      <Card className="border-border/60 shadow-card">
        <div className="divide-y divide-border">
          {events.length === 0 && <p className="p-6 text-sm text-muted-foreground">No events yet.</p>}
          {events.map((e) => (
            <div key={e.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/events/${e.id}`} className="font-semibold hover:underline">{e.title}</Link>
                  {e.published ? <Badge className="bg-success text-success-foreground">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(e.starts_at), "PP · p")}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => togglePublish(e)}>{e.published ? "Unpublish" : "Publish"}</Button>
                <Button size="sm" variant="outline" asChild><Link to={`/dashboard/events/${e.id}/edit`}>Edit</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(e)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminEvents;
