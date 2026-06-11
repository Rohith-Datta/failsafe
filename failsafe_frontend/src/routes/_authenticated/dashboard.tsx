import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAssessments, deleteAssessment, toggleActionCompleted } from "@/lib/assessments.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Trash2, Search, GaugeCircle, AlertTriangle, ShieldCheck, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
    const list = useServerFn(listAssessments);
    const del = useServerFn(deleteAssessment);
    const toggle = useServerFn(toggleActionCompleted);
    const qc = useQueryClient();
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

    const query = useQuery({ queryKey: ["assessments"], queryFn: () => list() });
    const delMut = useMutation({
        mutationFn: (id: string) => del({ data: { id } }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); toast.success("Assessment deleted"); },
        onError: (e) => toast.error(e.message),
    });
    const toggleMut = useMutation({
        mutationFn: (v: { id: string; completed: boolean }) => toggle({ data: v }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
        onError: (e) => toast.error(e.message),
    });

    const rows = (query.data ?? []) as any[];
    const stats = useMemo(() => {
        const h = rows.filter((r) => r.risk_level === "high").length;
        const m = rows.filter((r) => r.risk_level === "medium").length;
        const l = rows.filter((r) => r.risk_level === "low").length;
        const done = rows.filter((r) => r.action_completed).length;
        return { total: rows.length, h, m, l, done };
    }, [rows]);

    const filtered = rows.filter((r) => {
        if (filter !== "all" && r.risk_level !== filter) return false;
        if (q) {
            const hay = `${r.student_name ?? ""} ${r.student_id_code ?? ""}`.toLowerCase();
            if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Student Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">All assessments you've processed, plus your intervention to-do list.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline"><Link to="/bulk"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Link></Button>
                    <Button asChild><Link to="/assess"><Plus className="mr-2 h-4 w-4" /> New Assessment</Link></Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<GaugeCircle className="h-5 w-5" />} label="Total Processed" value={stats.total} tone="brand" />
                <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="High Risk" value={stats.h} tone="danger" />
                <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Medium Risk" value={stats.m} tone="warning" />
                <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Actions Completed" value={`${stats.done}/${stats.total}`} tone="success" />
            </div>

            <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search student..." className="w-64 pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <div className="flex gap-1 rounded-lg bg-muted p-1">
                        {(["all", "high", "medium", "low"] as const).map((k) => (
                            <button key={k}
                                onClick={() => setFilter(k)}
                                className={[
                                    "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition",
                                    filter === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                ].join(" ")}>
                                {k}
                            </button>
                        ))}
                    </div>
                </div>

                {query.isLoading ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
                            <GaugeCircle className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-display text-lg font-semibold">No assessments yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Run your first risk assessment to get started.</p>
                        <Button asChild className="mt-4"><Link to="/assess"><Plus className="mr-2 h-4 w-4" /> New Assessment</Link></Button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filtered.map((r) => {
                            const action = Array.isArray(r.interventions) && r.interventions[0]?.title
                                ? r.interventions[0].title
                                : "Routine check-in";
                            const done = !!r.action_completed;
                            return (
                                <div key={r.id} className={["flex items-center gap-4 p-4 transition", done ? "opacity-60" : "hover:bg-accent/40"].join(" ")}>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); toggleMut.mutate({ id: r.id, completed: !done }); }}
                                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border bg-background hover:bg-accent"
                                        title={done ? "Mark not done" : "Mark complete"}
                                    >
                                        <Checkbox checked={done} onCheckedChange={(v) => toggleMut.mutate({ id: r.id, completed: !!v })} />
                                    </div>
                                    <Link to="/results/$id" params={{ id: r.id }} className="flex flex-1 items-center gap-4 min-w-0">
                                        <RiskGauge level={r.risk_level} score={Number(r.risk_score)} />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold">
                                                {r.student_name ? r.student_name : r.student_id_code ? `Student #${r.student_id_code}` : "Anonymous student"}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs">
                                                <ClipboardList className="h-3 w-3 text-primary" />
                                                <span className={["truncate", done ? "line-through text-muted-foreground" : "text-foreground/80"].join(" ")}>
                                                    {action}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                                        </div>
                                        <RiskBadge level={r.risk_level} />
                                    </Link>
                                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this assessment?")) delMut.mutate(r.id); }}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: "brand" | "danger" | "warning" | "success" }) {
    const toneCls = {
        brand: "bg-primary/10 text-primary",
        danger: "bg-destructive/10 text-destructive",
        warning: "bg-warning/15 text-warning",
        success: "bg-success/15 text-success",
    }[tone];
    return (
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className={["mb-3 flex h-10 w-10 items-center justify-center rounded-xl", toneCls].join(" ")}>{icon}</div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
    );
}

function RiskBadge({ level }: { level: string }) {
    const map = {
        high: "bg-destructive/10 text-destructive border-destructive/20",
        medium: "bg-warning/15 text-warning border-warning/30",
        low: "bg-success/15 text-success border-success/30",
    } as const;
    return <Badge variant="outline" className={[(map as any)[level] ?? "", "uppercase font-semibold text-[10px]"].join(" ")}>{level}</Badge>;
}

function RiskGauge({ level, score }: { level: string; score: number }) {
    const color = level === "high" ? "var(--color-destructive)" : level === "medium" ? "var(--color-warning)" : "var(--color-success)";
    return (
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-muted)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
                    strokeDasharray={`${(score / 100) * 94.2} 94.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-[10px] font-bold">{Math.round(score)}</span>
        </div>
    );
}
