import { BottomNav } from "@/components/driver/BottomNav"

interface DriverLayoutProps {
    children: React.ReactNode
}

export function DriverLayout({ children }: DriverLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background pb-16">
            <main className="flex-1 overflow-y-auto pb-safe-area-bottom">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
