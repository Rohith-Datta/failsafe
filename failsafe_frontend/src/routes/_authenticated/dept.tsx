import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listDeptProfessors, getProfessorAnalytics, getProfile } from "@/lib/assessments.functions";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Building2, Users, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dept")({ component: DeptOverview });

const RISK_COLORS = { low: "#10B981", medium: "#F59E0B", high: "#EF4444" } as const;

function DeptOverview() {
    const navigate = useNavigate();
    const prof = useServerFn(getProfile);
    const listFn = useServerFn(listDeptProfessors);
    const analyticsFn = useServerFn(getProfessorAnalytics);

    const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => prof() });
    useEffect(() => {
        if (profileQ.data && (profileQ.data as any).role !== "hod") {
            navigate({ to: "/dashboard", replace: true });
        }
    }, [profileQ.data, navigate]);

    const listQ = useQuery({
        queryKey: ["dept-professors"],
        queryFn: () => listFn(),
        enabled: (profileQ.data as any)?.role === "hod",
    });
    const profs = (listQ.data ?? []) as any[];
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        if (!selected && profs.length > 0) setSelected(profs[0].id);
    }, [profs, selected]);

    const analyticsQ = useQuery({
        queryKey: ["prof-analytics", selected],
        queryFn: () => analyticsFn({ data: { professor_id: selected! } }),
        enabled: !!selected,
    });
    const stats = analyticsQ.data;

    const pieData = stats ? [
        { name: "Low", value: stats.low, key: "low" },
        { name: "Medium", value: stats.medium, key: "medium" },
        { name: "High", value: stats.high, key: "high" },
    ].filter((d) => d.value > 0) : [];

    const completionPct = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const selectedProf = profs.find((p) => p.id === selected);

    return (
        <div className="space-y-8">
            <header className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Department Overview</h1>
                    <p className="mt-1 text-muted-foreground">
                        {(profileQ.data as any)?.department ?? "Your"} department • {profs.length} member{profs.length === 1 ? "" : "s"}
                    </p>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Left: professor list */}
                <aside className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
                    <div className="border-b p-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Active Professors</h3>
                    </div>
                    <div className="max-h-[560px] overflow-y-auto divide-y">
                        {listQ.isLoading && <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>}
                        {!listQ.isLoading && profs.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No professors found.</div>}
                        {profs.map((p) => {
                            const active = p.id === selected;
                            return (
                                <button key={p.id} onClick={() => setSelected(p.id)}
                                    className={["w-full text-left p-4 transition", active ? "bg-accent" : "hover:bg-accent/50"].join(" ")}>
                                    <div className="flex items-center gap-3">
                                        <div className={["flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold", active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"].join(" ")}>
                                            {p.full_name?.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase() || "P"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold">{p.full_name}</div>
                                            <div className="truncate text-[11px] text-muted-foreground">{p.email}</div>
                                        </div>
                                        {p.role === "hod" && <span className="text-[9px] font-bold uppercase tracking-wider text-primary">HOD</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Right: analytics */}
                <section className="space-y-6">
                    <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Student Risk Ratio</h3>
                                <p className="mt-1 text-sm font-semibold">{selectedProf?.full_name ?? "—"}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Students Assessed</div>
                            </div>
                        </div>
                        {analyticsQ.isLoading ? (
                            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
                        ) : pieData.length === 0 ? (
                            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No assessments yet for this professor.</div>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3}>
                                            {pieData.map((d) => (
                                                <Cell key={d.key} fill={RISK_COLORS[d.key as keyof typeof RISK_COLORS]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                        <div className="mb-4 flex items-center gap-2.5">
                            <ClipboardCheck className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Action Progress</h3>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <div className="text-3xl font-extrabold tracking-tight">
                                    {stats?.completed ?? 0}<span className="text-muted-foreground">/{stats?.total ?? 0}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Interventions completed</div>
                            </div>
                            <div className="text-xl font-bold text-primary">{completionPct}%</div>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
