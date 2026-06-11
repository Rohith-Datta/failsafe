import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, PlusCircle, Upload, LogOut, BarChart3, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/failsafe-logo.png";

export function AppHeader() {
    const navigate = useNavigate();
    const [name, setName] = useState<string>("Professor");
    const [role, setRole] = useState<"professor" | "hod">("professor");

    useEffect(() => {
        const userStr = localStorage.getItem("failsafe_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.full_name) setName(user.full_name);
                if (user.role) setRole(user.role);
            } catch (e) {
                console.error("Error parsing user data");
            }
        }
    }, []);

    const signOut = async () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("failsafe_user");
        navigate({ to: "/auth", replace: true });
    };

    const linkCls =
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";

    return (
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <img src={logoSrc} alt="FAILSAFE" className="h-10 w-10 rounded-xl object-contain" width={40} height={40} />
                    <div className="leading-tight">
                        <div className="font-display text-lg font-bold tracking-tight">FAILSAFE</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Early Intervention System</div>
                    </div>
                </Link>

                <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
                    <Link to="/dashboard" className={linkCls} activeProps={{ className: linkCls + " !text-foreground !bg-accent" }}>
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link to="/assess" className={linkCls} activeProps={{ className: linkCls + " !text-foreground !bg-accent" }}>
                        <PlusCircle className="h-4 w-4" /> New Assessment
                    </Link>
                    <Link to="/bulk" className={linkCls} activeProps={{ className: linkCls + " !text-foreground !bg-accent" }}>
                        <Upload className="h-4 w-4" /> Bulk Upload
                    </Link>
                    <Link to="/analytics" className={linkCls} activeProps={{ className: linkCls + " !text-foreground !bg-accent" }}>
                        <BarChart3 className="h-4 w-4" /> My Analytics
                    </Link>
                    {role === "hod" && (
                        <Link to="/dept" className={linkCls} activeProps={{ className: linkCls + " !text-foreground !bg-accent" }}>
                            <Building2 className="h-4 w-4" /> Dept Overview
                        </Link>
                    )}
                </nav>

                <div className="flex items-center gap-3">
                    <div className="hidden text-right text-sm sm:block">
                        <div className="text-muted-foreground">Welcome,</div>
                        <div className="font-semibold">{name}{role === "hod" && <span className="ml-1 text-[10px] uppercase tracking-wider text-primary">HOD</span>}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
}