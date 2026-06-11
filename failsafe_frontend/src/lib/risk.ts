// Mock ML risk scoring — swap out for real ML API later.
// Placeholder weighted formula, but the shape mirrors a real model output.

export interface RiskInput {
    absences: number;
    failures: number;
    study_time: number; // 1-4
    freetime: number; // 1-5
    goout: number; // 1-5
    dalc: number; // 1-5 daily alcohol
    walc: number; // 1-5 weekend alcohol
    health: number; // 1-5
    higher: boolean;
    internet: boolean;
    romantic: boolean;
}

export interface RiskFactor {
    label: string;
    level: "HIGH RISK" | "MEDIUM RISK" | "LOW RISK";
    delta: number;
    description: string;
}

export interface RiskResult {
    score: number;
    level: "high" | "medium" | "low";
    factors: RiskFactor[];
    interventions: { title: string; description: string }[];
}

const lvl5 = (n: number, hi = 4, mid = 3): RiskFactor["level"] =>
    n >= hi ? "HIGH RISK" : n >= mid ? "MEDIUM RISK" : "LOW RISK";

export function calculateRisk(input: RiskInput): RiskResult {
    let score = 20;
    const factors: RiskFactor[] = [];

    const absDelta = Math.min(input.absences * 2.5, 35);
    score += absDelta;
    factors.push({
        label: "Absences",
        description: `${input.absences} total absences`,
        delta: +absDelta.toFixed(1),
        level: input.absences >= 8 ? "HIGH RISK" : input.absences >= 4 ? "MEDIUM RISK" : "LOW RISK",
    });

    const failDelta = input.failures * 18;
    score += failDelta;
    factors.push({
        label: "Past Failures",
        description: `${input.failures} past failure${input.failures === 1 ? "" : "s"}`,
        delta: +failDelta.toFixed(1),
        level: input.failures >= 2 ? "HIGH RISK" : input.failures === 1 ? "MEDIUM RISK" : "LOW RISK",
    });

    const studyDelta = (3 - input.study_time) * 6;
    score += studyDelta;
    factors.push({
        label: "Study Time",
        description: ["< 2 hrs", "2-5 hrs", "5-10 hrs", "10+ hrs"][input.study_time - 1] ?? "—",
        delta: +studyDelta.toFixed(1),
        level: input.study_time <= 1 ? "HIGH RISK" : input.study_time <= 2 ? "MEDIUM RISK" : "LOW RISK",
    });

    const dalcDelta = (input.dalc - 1) * 4;
    score += dalcDelta;
    factors.push({
        label: "Daily Alcohol (Dalc)",
        description: `Level ${input.dalc} of 5`,
        delta: +dalcDelta.toFixed(1),
        level: lvl5(input.dalc),
    });

    const walcDelta = (input.walc - 1) * 3;
    score += walcDelta;
    factors.push({
        label: "Weekend Alcohol (Walc)",
        description: `Level ${input.walc} of 5`,
        delta: +walcDelta.toFixed(1),
        level: lvl5(input.walc),
    });

    const gooutDelta = (input.goout - 3) * 2;
    score += gooutDelta;
    factors.push({
        label: "Going Out",
        description: `Level ${input.goout} of 5`,
        delta: +gooutDelta.toFixed(1),
        level: input.goout >= 4 ? "MEDIUM RISK" : "LOW RISK",
    });

    const freeDelta = (input.freetime - 3) * 1.5;
    score += freeDelta;
    factors.push({
        label: "Free Time",
        description: `Level ${input.freetime} of 5`,
        delta: +freeDelta.toFixed(1),
        level: input.freetime >= 4 ? "MEDIUM RISK" : "LOW RISK",
    });

    const healthDelta = (3 - input.health) * 3;
    score += healthDelta;
    factors.push({
        label: "Health",
        description: `Level ${input.health} of 5`,
        delta: +healthDelta.toFixed(1),
        level: input.health <= 2 ? "MEDIUM RISK" : "LOW RISK",
    });

    if (!input.higher) {
        score += 10;
        factors.push({ label: "Higher Education", description: "No desire for higher education", delta: 10, level: "MEDIUM RISK" });
    }
    if (!input.internet) {
        score += 5;
        factors.push({ label: "Internet Access", description: "No internet at home", delta: 5, level: "MEDIUM RISK" });
    }
    if (input.romantic) {
        score += 4;
        factors.push({ label: "Romantic Relationship", description: "Active relationship", delta: 4, level: "LOW RISK" });
    }

    score = Math.max(0, Math.min(100, score));
    const level: RiskResult["level"] = score >= 65 ? "high" : score >= 40 ? "medium" : "low";

    const interventions: RiskResult["interventions"] = [];
    if (input.absences >= 4) interventions.push({ title: "Schedule attendance counseling", description: "Address frequent absences and establish a plan to improve attendance." });
    if (input.failures >= 1) interventions.push({ title: "Assign academic tutoring", description: "Provide personalized tutoring for conceptual gaps." });
    if (input.study_time <= 2) interventions.push({ title: "Study skills workshop", description: "Build consistent study habits." });
    if (input.dalc >= 3 || input.walc >= 4) interventions.push({ title: "Wellness & lifestyle counseling", description: "Refer to wellness services to address alcohol-related risk." });
    if (input.health <= 2) interventions.push({ title: "Health check-in", description: "Coordinate with school health services for support." });
    if (!input.higher) interventions.push({ title: "Career & motivation mentoring", description: "Pair with a mentor to explore post-secondary pathways." });
    if (interventions.length === 0) interventions.push({ title: "Routine check-in", description: "Continue monthly check-ins to maintain academic momentum." });

    factors.sort((a, b) => b.delta - a.delta);
    return { score: +score.toFixed(1), level, factors, interventions };
}
