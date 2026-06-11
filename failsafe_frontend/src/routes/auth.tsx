import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
    ssr: false,
    beforeLoad: () => {
        const token = localStorage.getItem("access_token");
        const user = localStorage.getItem("failsafe_user");
        if (token && user) {
            throw redirect({ to: "/dashboard" });
        }
        if (token && !user) {
            localStorage.removeItem("access_token");
        }
    },
    component: AuthPage,
});

const signUpSchema = z.object({
    full_name: z.string().trim().min(2, "Name required").max(80),
    email: z.string().trim().email().max(255),
    department: z.string().trim().min(2, "Department required").max(80),
    role: z.enum(["professor", "hod"]),
    password: z.string().min(6, "Min 6 characters").max(100),
});

const signInSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
});

function AuthPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<"professor" | "hod">("professor");

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);

        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                // Save the JWT token and user data locally
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("failsafe_user", JSON.stringify(data.user));
                toast.success("Welcome back");
                navigate({ to: "/dashboard", replace: true });
            } else {
                toast.error(data.detail || "Login failed");
            }
        } catch (err) {
            setLoading(false);
            toast.error("Failed to connect to the Failsafe server.");
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const parsed = signUpSchema.safeParse({
            full_name: fd.get("full_name"),
            email: fd.get("email"),
            department: fd.get("department"),
            role,
            password: fd.get("password"),
        });
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);

        setLoading(true);
        try {
            const regResponse = await fetch("http://127.0.0.1:8000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            const regData = await regResponse.json();

            if (!regResponse.ok) {
                setLoading(false);
                return toast.error(regData.detail || "Registration failed");
            }

            const loginResponse = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
            });
            const loginData = await loginResponse.json();
            setLoading(false);

            if (loginResponse.ok) {
                localStorage.setItem("access_token", loginData.access_token);
                localStorage.setItem("failsafe_user", JSON.stringify(loginData.user));
                toast.success("Account created — you're signed in");
                navigate({ to: "/dashboard", replace: true });
            } else {
                toast.error("Account created, but auto-login failed. Please log in.");
            }
        } catch (err) {
            setLoading(false);
            toast.error("Failed to connect to the Failsafe server.");
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            <div className="absolute inset-0 -z-10 opacity-60"
                style={{ background: "radial-gradient(80% 50% at 50% 0%, oklch(0.92 0.06 258 / 0.5), transparent 60%)" }} />
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
                <Link to="/" className="mb-8 flex items-center gap-3 self-start">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <div className="font-display text-xl font-bold">FAILSAFE</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Early Intervention</div>
                    </div>
                </Link>

                <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                    <Tabs defaultValue="signin">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="signin">Sign in</TabsTrigger>
                            <TabsTrigger value="signup">Create account</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signin" className="mt-6">
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
                                <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="mt-6">
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" placeholder="Prof. Charles Xavier" required /></div>
                                <div><Label htmlFor="email_su">Email</Label><Input id="email_su" name="email" type="email" required /></div>
                                <div><Label htmlFor="department">Department</Label><Input id="department" name="department" placeholder="Mathematics" required /></div>

                                <div>
                                    <Label className="mb-2 block">Account Role</Label>
                                    <RadioGroup value={role} onValueChange={(v) => setRole(v as "professor" | "hod")} className="grid grid-cols-2 gap-2">
                                        <label htmlFor="role-prof" className={["flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition", role === "professor" ? "border-primary bg-primary/5" : "border-input hover:bg-accent/30"].join(" ")}>
                                            <RadioGroupItem id="role-prof" value="professor" />
                                            <span className="font-medium">Professor</span>
                                        </label>
                                        <label htmlFor="role-hod" className={["flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition", role === "hod" ? "border-primary bg-primary/5" : "border-input hover:bg-accent/30"].join(" ")}>
                                            <RadioGroupItem id="role-hod" value="hod" />
                                            <span className="font-medium">Head of Dept.</span>
                                        </label>
                                    </RadioGroup>
                                </div>

                                <div><Label htmlFor="password_su">Password</Label><Input id="password_su" name="password" type="password" minLength={6} required /></div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Built for educators • Confidential by design
                </p>
            </div>
        </div>
    );
}