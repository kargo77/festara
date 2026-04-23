import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Reg { id: string; user_id: string; created_at: string; profile: { full_name: string | null; email: string | null } | null; }
interface Ev { id: string; title: string; }

const Attendees = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Ev | null>(null);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const refresh = async () => {
    if (!id) return;
    const { data: ev } = await supabase.from("events").select("id,title").eq("id", id).maybeSingle();
    setEvent(ev as Ev | null);
    const { data } = await supabase.from("registrations").select("id,user_id,created_at").eq("event_id", id).order("created_at");
    const userIds = (data ?? []).map((r) => r.user_id);
    let profiles: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", userIds);
      (profs ?? []).forEach((p: any) => { profiles[p.id] = { full_name: p.full_name, email: p.email }; });
    }
    setRegs((data ?? []).map((r) => ({ ...r, profile: profiles[r.user_id] ?? null })));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

  const sendNotification = async () => {
    if (!event || !title.trim()) return;
    setSending(true);
    const rows = regs.map((r) => ({ user_id: r.user_id, event_id: event.id, title, body }));
    if (rows.length === 0) { toast.info("No attendees to notify"); setSending(false); return; }
    const { error } = await supabase.from("notifications").insert(rows);
    setSending(false);
    if (error) toast.error(error.message);
    else { toast.success(`Sent to ${rows.length} attendees`); setTitle(""); setBody(""); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild><Link to="/dashboard/my-events"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
      <h1 className="font-display text-3xl font-bold">{event?.title ?? "Event"} — Attendees</h1>

      <Card className="p-6 border-border/60 shadow-card">
        <h2 className="font-semibold">Send notification ({regs.length} attendees)</h2>
        <div className="mt-4 space-y-3">
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Important update" /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <Button onClick={sendNotification} disabled={sending || !title.trim()} className="bg-gradient-primary shadow-elegant">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Send</>}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border/60 shadow-card">
        <h2 className="font-semibold mb-4">Registered ({regs.length})</h2>
        {regs.length === 0 ? <p className="text-sm text-muted-foreground">No registrations yet.</p> : (
          <div className="divide-y divide-border">
            {regs.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.profile?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.profile?.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Attendees;
