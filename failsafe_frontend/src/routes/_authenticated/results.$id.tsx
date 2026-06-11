import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAssessment, getProfile } from "@/lib/assessments.functions";
import { Button } from "@/components/ui/button";
import { PhaseStepper } from "@/components/PhaseStepper";
import {
    ArrowLeft, AlertCircle, FileDown, Lightbulb, Calendar, ClipboardList, BookOpen,
    Clock, Users, Wine, HeartPulse, Heart, Layers, GraduationCap, Wifi, Info,
    ShieldCheck, Sparkles, AlertTriangle, User, Bus, Scale, Leaf, ShieldPlus,
    Target, Laptop, HeartHandshake,
} from "lucide-react";
import { exportAssessmentPDF } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/results/$id")({ component: Results });

type Tone = "danger" | "warning" | "success";

function riskTone(text?: string | null): Tone {
    const t = (text ?? "").toUpperCase();
    if (t.includes("HIGH") || t.includes("UNSAFE") || t.includes("CRITICAL")) return "danger";
    if (t.includes("MED") || t.includes("MODERATE") || t.includes("WARN") || t.includes("CAUTION") || t.includes("ATTENTION")) return "warning";
    return "success";
}

function toneClasses(tone: Tone) {
    return {
        danger: {
            iconBg: "bg-destructive/10", iconText: "text-destructive",
            badge: "bg-destructive/10 text-destructive border-destructive/20",
            impact: "text-destructive",
        },
        warning: {
            iconBg: "bg-warning/15", iconText: "text-warning",
            badge: "bg-warning/15 text-warning border-warning/30",
            impact: "text-warning",
        },
        success: {
            iconBg: "bg-success/15", iconText: "text-success",
            badge: "bg-success/15 text-success border-success/30",
            impact: "text-success",
        },
    }[tone];
}

function getDriverIcon(name: string, cls = "h-4 w-4") {
    const n = name.toLowerCase();
    if (n.includes("absence")) return <Calendar className={cls} />;
    if (n.includes("fail")) return <ClipboardList className={cls} />;
    if (n.includes("travel")) return <Bus className={cls} />;
    if (n.includes("study")) return <BookOpen className={cls} />;
    if (n.includes("free time") || n.includes("freetime")) return <Clock className={cls} />;
    if (n.includes("going out") || n.includes("goout")) return <Users className={cls} />;
    if (n.includes("alcohol") || n.includes("dalc") || n.includes("walc")) return <Wine className={cls} />;
    if (n.includes("health")) return <HeartPulse className={cls} />;
    if (n.includes("romantic")) return <Heart className={cls} />;
    if (n.includes("activit") || n.includes("extracurricular")) return <Layers className={cls} />;
    if (n.includes("higher") || n.includes("education")) return <GraduationCap className={cls} />;
    if (n.includes("internet") || n.includes("wifi")) return <Wifi className={cls} />;
    return <Info className={cls} />;
}

function getInterventionIcon(title: string) {
    const t = title.toLowerCase();
    if (t.includes("attendance")) return <User className="h-5 w-5" />;
    if (t.includes("tutor")) return <GraduationCap className="h-5 w-5" />;
    if (t.includes("study")) return <BookOpen className="h-5 w-5" />;
    if (t.includes("commute") || t.includes("travel")) return <Bus className="h-5 w-5" />;
    if (t.includes("time management")) return <Clock className="h-5 w-5" />;
    if (t.includes("balance")) return <Scale className="h-5 w-5" />;
    if (t.includes("wellness") || t.includes("lifestyle")) return <HeartPulse className="h-5 w-5" />;
    if (t.includes("weekend")) return <Leaf className="h-5 w-5" />;
    if (t.includes("health")) return <ShieldPlus className="h-5 w-5" />;
    if (t.includes("career") || t.includes("motivation")) return <Target className="h-5 w-5" />;
    if (t.includes("tech") || t.includes("internet")) return <Laptop className="h-5 w-5" />;
    if (t.includes("counsel")) return <HeartHandshake className="h-5 w-5" />;
    return <Lightbulb className="h-5 w-5" />;
}

function GaugeChart({ score, tone }: { score: number; tone: Tone }) {
    const rotation = (Math.max(0, Math.min(100, score)) / 100) * 180;
    const needle = tone === "danger" ? "var(--color-destructive)" : tone === "warning" ? "var(--color-warning)" : "var(--color-success)";
    return (
        <div className="relative mx-auto h-32 w-full max-w-[240px]">
            <svg viewBox="0 0 200 110" className="h-full w-full">
                <defs>
                    <linearGradient id="gaugeGrad" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="var(--color-success)" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="var(--color-destructive)" />
                    </linearGradient>
                </defs>
                <path d="M 20 100 A 75 75 0 0 1 180 100" stroke="var(--color-muted)" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M 20 100 A 75 75 0 0 1 180 100" stroke="url(#gaugeGrad)" strokeWidth="14" fill="none" strokeLinecap="round" />
                <g style={{ transform: `rotate(${rotation - 90}deg)`, transformOrigin: "100px 100px", transition: "transform 1s ease-out" }}>
                    <path d="M 96 100 L 100 30 L 104 100 Z" fill={needle} />
                    <circle cx="100" cy="100" r="6" fill={needle} />
                </g>
            </svg>
        </div>
    );
}

function Results() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const get = useServerFn(getAssessment);
    const prof = useServerFn(getProfile);
    const q = useQuery({ queryKey: ["assessment", id], queryFn: () => get({ data: { id } }) });
    const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => prof() });

    if (q.isLoading) return <div className="py-20 text-center text-muted-foreground">Loading results…</div>;
    if (q.isError || !q.data) return <div className="py-20 text-center text-destructive">Failed to load assessment.</div>;

    const a = q.data;
    const score = Number(a.risk_score);
    const level = a.risk_level as "high" | "medium" | "low";
    const factors = ((a.top_factors as any[]) ?? []).slice();
    const interventions = (a.interventions as any[]) ?? [];

    const tone = riskTone(level);
    const tc = toneClasses(tone);
    const statusLabel = tone === "danger" ? "UNSAFE" : tone === "warning" ? "CAUTION" : "SAFE";
    const headline = tone === "danger" ? "HIGH RISK DETECTED" : tone === "warning" ? "MODERATE RISK" : "LOW RISK";
    const summary = tone === "danger"
        ? "Student is highly likely to fail academically."
        : tone === "warning"
            ? "Student needs monitoring and targeted intervention."
            : "Student is on track. Routine check-ins recommended.";
    const alertBadge = tone === "danger" ? "CRITICAL ALERT" : tone === "warning" ? "WATCH CLOSELY" : "ALL CLEAR";

    const download = () => exportAssessmentPDF({
        student_name: a.student_name,
        student_id_code: a.student_id_code,
        risk_score: score,
        risk_level: level,
        created_at: a.created_at,
        top_factors: factors as any,
        interventions: interventions as any,
        professor: profileQ.data ?? null,
    });

    const displayName = a.student_name || (a.student_id_code ? `Student #${a.student_id_code}` : "Anonymous Student");

    return (
        <div className="space-y-8 pb-12">
            <PhaseStepper current={3} />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
                        Phase 3: Results <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {displayName} • Assessed {new Date(a.created_at).toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={download}><FileDown className="mr-2 h-4 w-4" /> Download PDF</Button>
                    <Button onClick={() => navigate({ to: "/assess" })}><ArrowLeft className="mr-2 h-4 w-4" /> Process Another Student</Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Gauge card */}
                <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] flex flex-col">
                    <div className="mb-2 flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Overall Risk Score</h3>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center py-2">
                        <GaugeChart score={score} tone={tone} />
                        <div className="mt-3 text-center">
                            <div className="text-[42px] font-extrabold tracking-tight leading-none">{score.toFixed(1)}%</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Calculated Risk Score</div>
                        </div>
                        <div className={["mt-4 px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md border", tc.badge].join(" ")}>
                            {statusLabel}
                        </div>
                    </div>
                </div>

                {/* Summary card */}
                <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] flex flex-col">
                    <div className="mb-4 flex items-center gap-2.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">AI Analysis Summary</h3>
                    </div>
                    <div className="flex-1 rounded-xl border bg-muted/30 p-6 flex flex-col justify-center">
                        <div className={["mb-3 flex items-center gap-2", tc.iconText].join(" ")}>
                            <AlertCircle className="h-5 w-5" />
                            <h4 className="font-bold text-lg uppercase tracking-tight">{headline}</h4>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80 mb-6">{summary}</p>
                        <span className={["self-start px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded border", tc.badge].join(" ")}>
                            {alertBadge}
                        </span>
                    </div>
                </div>

                {/* Factors card */}
                <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                    <div className="mb-4 flex items-center gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Key Risk Factors</h3>
                    </div>
                    <div className="flex flex-col divide-y divide-border">
                        {factors.slice(0, 5).map((f: any, i: number) => {
                            const ft = riskTone(f.level);
                            const fc = toneClasses(ft);
                            return (
                                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={["p-2 rounded-xl", fc.iconBg, fc.iconText].join(" ")}>
                                            {getDriverIcon(f.label, "h-4 w-4")}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs truncate">{f.label}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{f.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={["px-2 py-0.5 text-[9px] font-bold uppercase rounded border", fc.badge].join(" ")}>
                                            {f.level}
                                        </span>
                                        <div className="text-right min-w-[60px]">
                                            <p className={["font-bold text-sm", fc.impact].join(" ")}>
                                                {f.delta >= 0 ? "+" : ""}{Number(f.delta).toFixed(1)}%
                                            </p>
                                            <p className="text-[9px] text-muted-foreground whitespace-nowrap">Risk Impact</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="mb-5 flex items-center gap-2.5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Suggested Interventions</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {interventions.map((iv: any, i: number) => (
                        <div key={i} className="flex gap-4 rounded-2xl border border-primary/15 bg-primary/[0.03] p-4 hover:bg-primary/[0.06] transition-colors">
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card border border-primary/20 text-primary shadow-sm">
                                {getInterventionIcon(iv.title)}
                                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-card">
                                    {i + 1}
                                </div>
                            </div>
                            <div className="pt-0.5">
                                <h4 className="font-semibold text-sm">{iv.title}</h4>
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{iv.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link></Button>
            </div>
        </div>
    );
}
