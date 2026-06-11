import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, ClipboardList, Info, GraduationCap, Puzzle, BookOpen, Users, Wine,
    Wifi, Heart, Loader2, Brain, ShieldCheck, Clock, Activity, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PhaseStepper } from "@/components/PhaseStepper";
import { createAssessment } from "@/lib/assessments.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assess")({ component: AssessPage });

const STUDY_LABELS = ["< 2 hrs", "2-5 hrs", "5-10 hrs", "10+ hrs"];
const FIVE_LABELS = ["1: Very Low", "2: Low", "3: Med", "4: High", "5: Very High"];

function AssessPage() {
    const navigate = useNavigate();
    const create = useServerFn(createAssessment);

    const [phase, setPhase] = useState<1 | 2>(1);
    const [studentId, setStudentId] = useState("");
    const [studentName, setStudentName] = useState("");
    const [absences, setAbsences] = useState(5);
    const [failures, setFailures] = useState(0);
    const [studyTime, setStudyTime] = useState(2);
    const [freetime, setFreetime] = useState(3);
    const [goout, setGoout] = useState(3);
    const [dalc, setDalc] = useState(1);
    const [walc, setWalc] = useState(1);
    const [health, setHealth] = useState(3);
    const [higher, setHigher] = useState(true);
    const [internet, setInternet] = useState(true);
    const [romantic, setRomantic] = useState(false);

    const mut = useMutation({
        mutationFn: () => create({
            data: {
                student_id_code: studentId.trim() || undefined,
                student_name: studentName.trim() || undefined,
                absences, failures, study_time: studyTime,
                freetime, goout, dalc, walc, health,
                higher, internet, romantic,
            },
        }),
        onSuccess: (result) => {
            const id = result?.id != null ? String(result.id) : null;
            if (!id) {
                toast.error("Assessment completed but no result ID was returned.");
                setPhase(1);
                return;
            }
            navigate({ to: "/results/$id", params: { id } });
        },
        onError: (e: Error) => { toast.error(e.message); setPhase(1); },
    });

    const submit = async () => {
        setPhase(2);
        setTimeout(() => mut.mutate(), 1400);
    };

    return (
        <div className="space-y-8">
            <PhaseStepper current={phase} />
            <AnimatePresence mode="wait">
                {phase === 1 ? (
                    <motion.div key="p1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <header>
                            <h1 className="font-display text-3xl font-bold tracking-tight">
                                Phase 1: Input <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                            </h1>
                            <p className="mt-1 text-muted-foreground">Provide accurate student information to assess risk factors.</p>
                        </header>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <Field label="Student ID (optional)">
                                <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. STU-1042" />
                            </Field>
                            <Field label="Student Name (optional)">
                                <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g., John Doe" />
                            </Field>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                            <NumberCard icon={<Calendar className="h-5 w-5" />} label="Absences" value={absences} onChange={setAbsences} max={60} help="Total Absences" />
                            <NumberCard icon={<ClipboardList className="h-5 w-5" />} label="Failures" value={failures} onChange={setFailures} max={10} help="Past Failures" />
                            <div className="flex items-start gap-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary"><Info className="h-5 w-5" /></div>
                                <p className="text-sm text-muted-foreground">Absences and failures are key academic indicators and will be used in risk assessment.</p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                                <SectionHead icon={<GraduationCap className="h-5 w-5" />} title="Academic Factors" />
                                <div className="mt-6 space-y-7">
                                    <SliderRow icon={<BookOpen className="h-5 w-5 text-muted-foreground" />} label="Study Time" value={studyTime} setValue={setStudyTime} min={1} max={4} labels={STUDY_LABELS} />
                                </div>

                                <div className="mt-8">
                                    <SectionHead icon={<Sparkles className="h-5 w-5" />} title="Social & Lifestyle Factors" />
                                    <div className="mt-6 space-y-7">
                                        <SliderRow icon={<Clock className="h-5 w-5 text-muted-foreground" />} label="Free Time (after school)" value={freetime} setValue={setFreetime} min={1} max={5} labels={FIVE_LABELS} />
                                        <SliderRow icon={<Users className="h-5 w-5 text-muted-foreground" />} label="Going Out with Friends (goout)" value={goout} setValue={setGoout} min={1} max={5} labels={FIVE_LABELS} />
                                        <SliderRow icon={<Wine className="h-5 w-5 text-muted-foreground" />} label="Daily Alcohol Consumption (Dalc)" value={dalc} setValue={setDalc} min={1} max={5} labels={FIVE_LABELS} />
                                        <SliderRow icon={<Wine className="h-5 w-5 text-muted-foreground" />} label="Weekend Alcohol Consumption (Walc)" value={walc} setValue={setWalc} min={1} max={5} labels={FIVE_LABELS} />
                                        <SliderRow icon={<Activity className="h-5 w-5 text-muted-foreground" />} label="Current Health Status" value={health} setValue={setHealth} min={1} max={5} labels={FIVE_LABELS} />
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                                <SectionHead icon={<Puzzle className="h-5 w-5" />} title="Additional Factors" />
                                <div className="mt-4 divide-y">
                                    <ToggleRow icon={<GraduationCap className="h-5 w-5 text-muted-foreground" />} title="higher_yes" sub="Desire for Higher Education" value={higher} onChange={setHigher} />
                                    <ToggleRow icon={<Wifi className="h-5 w-5 text-muted-foreground" />} title="internet_yes" sub="Internet Access at Home" value={internet} onChange={setInternet} />
                                    <ToggleRow icon={<Heart className="h-5 w-5 text-muted-foreground" />} title="romantic_yes" sub="Active Romantic Relationship" value={romantic} onChange={setRomantic} />
                                </div>
                            </section>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button size="lg" onClick={submit} disabled={mut.isPending}>
                                Run Risk Analysis →
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <header>
                            <h1 className="font-display text-3xl font-bold tracking-tight">
                                Phase 2: Analysis <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                            </h1>
                            <p className="mt-1 text-muted-foreground">Our machine learning model is analyzing the data to identify risk levels and key factors.</p>
                        </header>
                        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                            <aside className="space-y-6">
                                <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                                    <SectionHead icon={<Brain className="h-5 w-5" />} title="What is happening?" />
                                    <p className="mt-3 text-sm text-muted-foreground">Our ML model is examining multiple data points to:</p>
                                    <ul className="mt-3 space-y-2 text-sm">
                                        {["Calculate risk probability", "Identify key risk factors", "Compare with similar student patterns"].map((s) => (
                                            <li key={s} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="h-3 w-3" /></span>{s}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/50 p-3 text-xs text-muted-foreground">
                                        <Info className="h-4 w-4" /> This usually takes 10–30 seconds.
                                    </div>
                                </div>
                            </aside>
                            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border bg-card text-center shadow-[var(--shadow-card)]">
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <h3 className="mt-6 font-display text-xl font-semibold">Analyzing data…</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Please wait while our ML model processes the information.</p>
                                <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs text-primary">
                                    <ShieldCheck className="h-4 w-4" /> Your data is secure and confidential.
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}{required && " *"}</Label>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{title}</h2>
        </div>
    );
}

function NumberCard({ icon, label, value, onChange, max, help }: { icon: React.ReactNode; label: string; value: number; onChange: (n: number) => void; max: number; help: string }) {
    return (
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            </div>
            <div className="mt-4 flex items-end gap-3">
                <input
                    type="number" min={0} max={max} value={value}
                    onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
                    className="w-24 border-0 bg-transparent text-4xl font-bold tracking-tight outline-none"
                />
                <div className="pb-2 text-xs text-muted-foreground">{help}</div>
            </div>
        </div>
    );
}

function SliderRow({ icon, label, value, setValue, min, max, labels }: { icon: React.ReactNode; label: string; value: number; setValue: (n: number) => void; min: number; max: number; labels: string[] }) {
    return (
        <div>
            <div className="mb-2 font-semibold">{label}</div>
            <div className="flex items-center gap-4">
                {icon}
                <Slider value={[value]} min={min} max={max} step={1} onValueChange={([v]) => setValue(v)} className="flex-1" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background font-semibold">{value}</div>
            </div>
            <div className="mt-2 flex justify-between pl-9 text-[10px] text-muted-foreground">
                {labels.map((l) => <span key={l}>{l}</span>)}
            </div>
        </div>
    );
}

function ToggleRow({ icon, title, sub, value, onChange }: { icon: React.ReactNode; title: string; sub: string; value: boolean; onChange: (b: boolean) => void }) {
    return (
        <div className="flex items-center gap-4 py-3">
            {icon}
            <div className="flex-1">
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
            </div>
            <Switch checked={value} onCheckedChange={onChange} />
            <span className={["w-9 text-xs font-semibold", value ? "text-primary" : "text-muted-foreground"].join(" ")}>{value ? "Yes" : "No"}</span>
        </div>
    );
}
