import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, Users, BarChart3, Bell, ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" aria-hidden />
        <img
          src={heroImg}
          alt="Concert stage with deep blue and emerald lighting"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-50"
        />
        <div className="container relative py-24 md:py-36">
          <div className="max-w-3xl text-primary-foreground animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              The all-in-one event platform
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              Run unforgettable events.
              <span className="block bg-gradient-to-r from-accent to-primary-foreground bg-clip-text text-transparent">From idea to encore.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              Festera gives organizers, managers and attendees a single, beautiful space to create, discover and experience events.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow">
                <Link to="/auth?mode=signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/events">Browse events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">Built for every role</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Tailored dashboards for managers, organizers and visitors — all in one platform.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: BarChart3, title: "Manager", desc: "Oversee every event, manage users and roles, dive into platform analytics.", color: "from-primary to-primary-glow" },
            { icon: Calendar, title: "Organizer", desc: "Create events, edit details, manage attendees and ping them with updates.", color: "from-accent to-primary-glow" },
            { icon: Users, title: "Visitor", desc: "Discover and register for events, keep your tickets in one tidy place.", color: "from-primary-glow to-accent" },
          ].map((f) => (
            <Card key={f.title} className="p-8 shadow-card hover:shadow-elegant transition-smooth border-border/60">
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.color} shadow-glow`}>
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Real-time band */}
      <section className="bg-secondary/40 border-y border-border/60">
        <div className="container py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft text-accent px-3 py-1 text-xs font-semibold">
              <Bell className="h-3 w-3" /> Real-time
            </div>
            <h2 className="mt-4 text-4xl font-bold">Live updates the moment they happen.</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              When an organizer publishes a new event or an attendee registers, every dashboard updates instantly — no refresh needed.
            </p>
            <Button asChild className="mt-8 bg-gradient-primary shadow-elegant" size="lg">
              <Link to="/auth?mode=signup">Create your account</Link>
            </Button>
          </div>
          <Card className="p-8 shadow-elegant border-border/60">
            <div className="space-y-4">
              {[
                { who: "Aurora Festival", what: "just published a new event", when: "now" },
                { who: "Maya R.", what: "registered for Tech Summit '26", when: "2s ago" },
                { who: "Manager", what: "promoted Alex to Organizer", when: "1m ago" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/60">
                  <div className="h-2 w-2 mt-2 rounded-full bg-accent animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-semibold">{n.who}</span> {n.what}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.when}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <footer className="container py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Festera. Built for unforgettable events.
      </footer>
    </div>
  );
};

export default Index;
