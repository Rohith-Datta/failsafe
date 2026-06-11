import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";

function clearAuth() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("failsafe_user");
}

export const Route = createFileRoute("/_authenticated")({
    ssr: false,
    beforeLoad: async () => {
        const token = localStorage.getItem("access_token");
        const user = localStorage.getItem("failsafe_user");
        if (!token || !user) {
            clearAuth();
            throw redirect({ to: "/auth" });
        }
    },
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <AppHeader />
            <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}