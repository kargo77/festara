import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3, "Title too short").max(120),
  description: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  starts_at: z.string().min(1, "Start required"),
  ends_at: z.string().optional(),
  capacity: z.coerce.number().int().min(0).max(1000000).optional(),
  cover_url: z.string().url().optional().or(z.literal("")),
  published: z.boolean(),
});

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", starts_at: "", ends_at: "", capacity: "" as string,
    cover_url: "", published: false,
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (data) {
        setForm({
          title: data.title, description: data.description ?? "", location: data.location ?? "",
          starts_at: data.starts_at?.slice(0, 16), ends_at: data.ends_at?.slice(0, 16) ?? "",
          capacity: data.capacity?.toString() ?? "", cover_url: data.cover_url ?? "", published: data.published,
        });
      }
    })();
  }, [id, isEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      ...form,
      capacity: form.capacity === "" ? undefined : form.capacity,
      cover_url: form.cover_url || undefined,
      ends_at: form.ends_at || undefined,
      description: form.description || undefined,
      location: form.location || undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const payload = {
      ...parsed.data,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
      organizer_id: user.id,
    };
    const { error } = isEdit && id
      ? await supabase.from("events").update(payload).eq("id", id)
      : await supabase.from("events").insert([payload]);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Event updated" : "Event created");
    navigate(isManager ? "/dashboard/admin/events" : "/dashboard/my-events");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="font-display text-3xl font-bold">{isEdit ? "Edit event" : "Create event"}</h1>
      <Card className="p-6 border-border/60 shadow-card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Starts at</Label><Input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div className="space-y-2"><Label>Ends at</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Cover image URL</Label><Input type="url" placeholder="https://…" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Published</p>
              <p className="text-xs text-muted-foreground">When on, the event is visible to visitors.</p>
            </div>
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
          </div>
          <Button type="submit" className="bg-gradient-primary shadow-elegant" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save changes" : "Create event"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default EventForm;
