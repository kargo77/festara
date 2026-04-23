import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Role = "manager" | "organizer" | "visitor";
interface Profile { id: string; full_name: string | null; email: string | null; roles: Role[]; }

const ALL_ROLES: Role[] = ["manager", "organizer", "visitor"];

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);

  const refresh = async () => {
    const { data: profs } = await supabase.from("profiles").select("id,full_name,email").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const map = new Map<string, Role[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    setUsers((profs ?? []).map((p: any) => ({ ...p, roles: map.get(p.id) ?? [] })));
  };
  useEffect(() => { refresh(); }, []);

  const toggleRole = async (uid: string, role: Role, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Users & roles</h1>
      <Card className="border-border/60 shadow-card">
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{u.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <div className="mt-1 flex gap-1">{u.roles.map((r) => <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>)}</div>
              </div>
              <div className="flex gap-2">
                {ALL_ROLES.map((r) => {
                  const has = u.roles.includes(r);
                  return (
                    <Button key={r} size="sm" variant={has ? "default" : "outline"} onClick={() => toggleRole(u.id, r, has)} className="capitalize">
                      {has ? `– ${r}` : `+ ${r}`}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminUsers;
