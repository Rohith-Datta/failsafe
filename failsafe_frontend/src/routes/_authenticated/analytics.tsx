import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAssessments } from "@/lib/assessments.functions";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ClipboardList, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Analytics });

function Analytics() {
    const list = useServerFn(listAssessments);
    const q = useQuery({ queryKey: ["assessments"], queryFn: () => list() });
    const rows = (q.data ?? []) as any[];

    const { total, done, topFactors } = useMemo(() => {
        const total = rows.length;
        const done = rows.filter((r) => r.action_completed).length;
        const counts = new Map<string, number>();
        rows.forEach((r) => {
            const factors = (r.top_factors as any[]) ?? [];
            factors.slice(0, 3).forEach((f) => {
                const key = String(f.label || "Other");
                counts.set(key, (counts.get(key) ?? 0) + 1);
            });
        });
        const topFactors = Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
        return { total, done, topFactors };
    }, [rows]);

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const R = 70;
    const C = 2 * Math.PI * R;
    const offset = C - (pct / 100) * C;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-display text-3xl font-bold tracking-tight">My Analytics</h1>
                <p className="mt-1 text-muted-foreground">Your intervention impact at a glance.</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                    <div className="mb-4 flex items-center gap-2.5">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Self-Evaluation</h3>
                    </div>
                    <div className="flex items-center justify-center py-4">
                        <div className="relative h-48 w-48">
                            <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
                                <circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-muted)" strokeWidth="14" />
                                <circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-primary)" strokeWidth="14"
                                    strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
                                    style={{ transition: "stroke-dashoffset 0.8s ease-out" }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-4xl font-extrabold tracking-tight">{done}<span className="text-muted-foreground">/{total}</span></div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Interventions Logged</div>
                                <div className="mt-2 text-sm font-semibold text-primary">{pct}% Complete</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                    <div className="mb-4 flex items-center gap-2.5">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Top 3 Class Risk Drivers</h3>
                    </div>
                    {topFactors.length === 0 ? (
                        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No assessments yet.</div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topFactors} layout="vertical" margin={{ left: 16, right: 24, top: 8, bottom: 8 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                                        {topFactors.map((_, i) => (
                                            <Cell key={i} fill={["#EF4444", "#F59E0B", "#3B82F6"][i % 3]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
