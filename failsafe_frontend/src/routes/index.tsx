import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight, BarChart3, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "FAILSAFE — Early Intervention System for Educators" },
            { name: "description", content: "Identify at-risk students early. Run ML-powered risk assessments, track every student, and download intervention plans." },
            { property: "og:title", content: "FAILSAFE — Early Intervention System" },
            { property: "og:description", content: "Identify at-risk students early with ML-powered risk assessments and intervention plans." },
        ],
    }),
    component: Landing,
});

function Landing() {
    return (
        <div className="min-h-screen bg-background">
            <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <div className="font-display text-lg font-bold">FAILSAFE</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Early Intervention System</div>
                    </div>
                </div>
                <Button asChild><Link to="/auth">Sign in <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </header>

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10"
                    style={{ background: "radial-gradient(60% 50% at 50% 0%, oklch(0.92 0.06 258 / 0.6), transparent 70%)" }} />
                <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-success" /> Powered by ML risk modeling
                    </div>
                    <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                        Catch struggling students <span style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>before they fall behind.</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        FAILSAFE turns attendance, grades, and life factors into a clear risk score — with intervention plans you can act on today.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button size="lg" asChild><Link to="/auth">Get started free <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                        <Button size="lg" variant="outline" asChild><Link to="/auth">Sign in</Link></Button>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
                {[
                    { icon: <Brain className="h-5 w-5" />, t: "ML risk scoring", d: "Multi-factor model weighs absences, grades, and social context to produce a 0–100 risk score." },
                    { icon: <BarChart3 className="h-5 w-5" />, t: "Class-wide dashboard", d: "Every student you've assessed in one searchable view, filterable by risk level." },
                    { icon: <FileText className="h-5 w-5" />, t: "Printable intervention plans", d: "Download a counselor-ready PDF report for each student with suggested actions." },
                ].map((f) => (
                    <div key={f.t} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{f.icon}</div>
                        <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                    </div>
                ))}
            </section>

            <footer className="border-t py-8 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} FAILSAFE • Built for educators
            </footer>
        </div>
    );
}
