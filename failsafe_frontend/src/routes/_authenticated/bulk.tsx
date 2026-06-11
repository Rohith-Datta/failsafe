import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import { useServerFn } from "@tanstack/react-start";
import { createAssessment } from "@/lib/assessments.functions";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bulk")({ component: BulkUpload });

interface RowResult { name: string; status: "pending" | "ok" | "error"; message?: string }

function BulkUpload() {
    const create = useServerFn(createAssessment);
    const [results, setResults] = useState<RowResult[]>([]);
    const [running, setRunning] = useState(false);

    const handleFile = async (file: File) => {
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (parsed.errors.length) return toast.error("Could not parse CSV");
        const rows = parsed.data as Record<string, string>[];
        if (rows.length === 0) return toast.error("CSV is empty");
        if (rows.length > 1000) return toast.error("Max 1000 rows per upload");

        setResults(rows.map((r, i) => ({ name: r.student_id || r.id || `Row ${i + 1}`, status: "pending" })));
        setRunning(true);

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            try {
                await create({
                    data: {
                        student_id_code: (r.student_id || r.id || "").trim() || undefined,
                        absences: int(r.absences),
                        failures: int(r.failures),
                        study_time: clamp(int(r.study_time, 2), 1, 4),
                        freetime: clamp(int(r.freetime, 3), 1, 5),
                        goout: clamp(int(r.goout, 3), 1, 5),
                        dalc: clamp(int(r.dalc, 1), 1, 5),
                        walc: clamp(int(r.walc, 1), 1, 5),
                        health: clamp(int(r.health, 3), 1, 5),
                        higher: bool(r.higher, true),
                        internet: bool(r.internet, true),
                        romantic: bool(r.romantic),
                    },
                });
                setResults((s) => s.map((x, idx) => idx === i ? { ...x, status: "ok" } : x));
            } catch (e: any) {
                setResults((s) => s.map((x, idx) => idx === i ? { ...x, status: "error", message: e.message } : x));
            }
        }
        setRunning(false);
        toast.success("Batch complete");
    };

    const sample =
        "student_id,absences,failures,study_time,freetime,goout,dalc,walc,health,higher,internet,romantic\n" +
        "STU-1001,5,0,2,3,3,1,1,4,yes,yes,no\n" +
        "STU-1002,12,2,1,4,5,3,4,2,no,yes,yes\n";
    const dlSample = () => {
        const blob = new Blob([sample], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "failsafe_template.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-display text-3xl font-bold tracking-tight">Bulk Upload</h1>
                <p className="mt-1 text-muted-foreground">Process a whole class at once. Upload a CSV with one student per row.</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-12 text-center transition hover:border-primary/50 hover:bg-accent/30">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">Drop CSV or click to choose</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Upload Kaggle Dataset format supported.</p>
                    <p className="text-xs text-muted-foreground">Up to 1000 students per batch</p>
                    <input type="file" accept=".csv" className="hidden" disabled={running}
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </label>

                <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileSpreadsheet className="h-5 w-5" /></div>
                        <h3 className="font-semibold">CSV Format</h3>
                    </div>
                    <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">{`student_id,
absences, failures,
study_time (1-4),
freetime, goout, dalc, walc, health (1-5),
higher, internet, romantic (yes/no)`}</pre>
                    <Button variant="outline" className="mt-4 w-full" onClick={dlSample}>
                        <Download className="mr-2 h-4 w-4" /> Download Template
                    </Button>
                </div>
            </div>

            {results.length > 0 && (
                <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between border-b p-4">
                        <h3 className="font-semibold">Processing {results.length} students</h3>
                        {!running && <Button variant="outline" size="sm" asChild><Link to="/dashboard">View dashboard →</Link></Button>}
                    </div>
                    <div className="max-h-96 divide-y overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 text-sm">
                                {r.status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                {r.status === "ok" && <CheckCircle2 className="h-4 w-4 text-success" />}
                                {r.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                                <span className="flex-1">{r.name}</span>
                                {r.message && <span className="text-xs text-destructive">{r.message}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function int(v: string | undefined, fallback = 0) { const n = parseInt(v ?? ""); return isFinite(n) ? n : fallback; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function bool(v: string | undefined, fallback = false) {
    if (!v) return fallback;
    const s = v.trim().toLowerCase();
    return ["yes", "y", "true", "1"].includes(s);
}
