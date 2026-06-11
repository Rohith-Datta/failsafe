import { Check } from "lucide-react";

const STEPS = [
    { n: 1, label: "Input", sub: "Collect Student Data" },
    { n: 2, label: "Analysis", sub: "Risk Assessment (ML Model)" },
    { n: 3, label: "Results", sub: "Intervention Plan" },
];

export function PhaseStepper({ current }: { current: 1 | 2 | 3 }) {
    return (
        <div className="flex items-center justify-center gap-2 py-2 sm:gap-6">
            {STEPS.map((s, i) => {
                const done = current > s.n;
                const active = current === s.n;
                return (
                    <div key={s.n} className="flex items-center gap-2 sm:gap-6">
                        <div className="flex flex-col items-center text-center">
                            <div
                                className={[
                                    "flex h-9 w-9 items-center justify-center rounded-full font-semibold text-sm transition",
                                    done
                                        ? "bg-primary text-primary-foreground"
                                        : active
                                            ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                                            : "bg-muted text-muted-foreground",
                                ].join(" ")}
                            >
                                {done ? <Check className="h-4 w-4" /> : s.n}
                            </div>
                            <div className={["mt-2 text-sm font-semibold", active || done ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                                {s.label}
                            </div>
                            <div className="hidden text-[11px] text-muted-foreground sm:block">{s.sub}</div>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="h-px w-10 border-t border-dashed border-border sm:w-24" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
