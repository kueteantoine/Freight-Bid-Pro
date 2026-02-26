import { BottomNav } from "@/components/driver/BottomNav";

export default function DriverDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-16 relative">
            {children}
            <BottomNav />
        </div>
    );
}
