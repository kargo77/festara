import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  password: z.string().min(8, "Min 8 characters").max(72),
  role: z.enum(["organizer", "visitor"]),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(200),
  password: z.string().min(1, "Password required").max(72),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);

  const [signinForm, setSigninForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ fullName: "", email: "", password: "", role: "visitor" as "visitor" | "organizer" });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(signinForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signupForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName, role: parsed.data.role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! You're in.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-hero p-12 text-primary-foreground flex-col justify-between overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-foreground/15 backdrop-blur">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <span className="font-display text-xl font-bold">Festera</span>
        </Link>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold leading-tight max-w-md">
            Where great events are born, run and remembered.
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Join thousands of organizers, managers and attendees building the future of events.
          </p>
        </div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md p-8 shadow-elegant border-border/60">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Festera</span>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <h1 className="font-display text-2xl font-bold">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your Festera account.</p>
              <form onSubmit={onSignIn} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" autoComplete="email" required value={signinForm.email}
                    onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pw">Password</Label>
                  <Input id="si-pw" type="password" autoComplete="current-password" required value={signinForm.password}
                    onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <h1 className="font-display text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick a role — Manager access is granted by an admin.</p>
              <form onSubmit={onSignUp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" autoComplete="email" required value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pw">Password</Label>
                  <Input id="su-pw" type="password" autoComplete="new-password" required value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>I am a…</Label>
                  <RadioGroup value={signupForm.role} onValueChange={(v) => setSignupForm({ ...signupForm, role: v as "visitor" | "organizer" })}
                    className="grid grid-cols-2 gap-3">
                    <Label htmlFor="r-vis" className={`flex flex-col gap-1 p-4 rounded-lg border cursor-pointer transition-smooth ${signupForm.role === "visitor" ? "border-primary bg-accent-soft/40" : "border-border"}`}>
                      <RadioGroupItem id="r-vis" value="visitor" className="sr-only" />
                      <span className="font-semibold">Visitor</span>
                      <span className="text-xs text-muted-foreground">Discover & attend events</span>
                    </Label>
                    <Label htmlFor="r-org" className={`flex flex-col gap-1 p-4 rounded-lg border cursor-pointer transition-smooth ${signupForm.role === "organizer" ? "border-primary bg-accent-soft/40" : "border-border"}`}>
                      <RadioGroupItem id="r-org" value="organizer" className="sr-only" />
                      <span className="font-semibold">Organizer</span>
                      <span className="text-xs text-muted-foreground">Create & run events</span>
                    </Label>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
