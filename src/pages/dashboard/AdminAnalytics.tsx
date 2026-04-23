import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";

const AdminAnalytics = () => {
  const [stats, setStats] = useState({ users: 0, events: 0, registrations: 0 });
  const [chart, setChart] = useState<{ day: string; registrations: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: u }, { count: e }, { count: r }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("registrations").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u ?? 0, events: e ?? 0, registrations: r ?? 0 });

      const since = subDays(new Date(), 13).toISOString();
      const { data: regs } = await supabase.from("registrations").select("created_at").gte("created_at", since);
      const buckets: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MMM d");
        buckets[d] = 0;
      }
      (regs ?? []).forEach((r: any) => {
        const k = format(new Date(r.created_at), "MMM d");
        if (k in buckets) buckets[k]++;
      });
      setChart(Object.entries(buckets).map(([day, registrations]) => ({ day, registrations })));
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-bold">Platform analytics</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Users", value: stats.users },
          { label: "Events", value: stats.events },
          { label: "Registrations", value: stats.registrations },
        ].map((s) => (
          <Card key={s.label} className="p-6 border-border/60 shadow-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="font-display text-3xl font-bold mt-2">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6 border-border/60 shadow-card">
        <h2 className="font-semibold">Registrations · last 14 days</h2>
        <div className="mt-4 h-72">
          <ChartContainer config={{ registrations: { label: "Registrations", color: "hsl(var(--accent))" } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="registrations" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
