import { getDriverJobs, respondToAssignment } from "@/app/actions/driver-jobs";
import { JobDetailView } from "@/components/driver/jobs/JobDetailView";
import { AcceptanceFooter } from "@/components/driver/jobs/AcceptanceFooter";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function JobDetailsPage({ params }: PageProps) {
    const { id } = await params;

    // In a real app we'd have a specific getJobById action, but here we can filter from specific lists or fetch all
    // Ideally we assume getDriverJobs can filter by ID or we just fetch the single record
    // For demo purposes, I'll fetch 'pending' and 'active' and find it. 
    // Optimization: Create getJobById action. I'll rely on getDriverJobs logic for now but checking all statuses is inefficient.
    // Let's assume we can fetch it directly or just filter.

    // Hack: Fetching all relevant lists to find it.
    const { jobs: pending } = await getDriverJobs("pending");
    const { jobs: active } = await getDriverJobs("active");
    const { jobs: history } = await getDriverJobs("history");

    const job = [...(pending || []), ...(active || []), ...(history || [])].find(j => j.id === id);

    if (!job) {
        notFound();
    }

    async function handleAccept() {
        "use server";
        await respondToAssignment(id, "accept");
    }

    async function handleReject(reason: string) {
        "use server";
        await respondToAssignment(id, "reject", reason);
        redirect("/driver/jobs");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4">
                    <Link href="/driver/jobs">
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <h1 className="ml-2 text-base font-semibold">Job Details</h1>
                </div>
            </header>

            <div className="flex-1 p-4 pb-24 md:p-6 max-w-2xl mx-auto w-full">
                <JobDetailView job={job} />
            </div>

            {job.status === 'pending' && (
                <AcceptanceFooter
                    onAccept={handleAccept}
                    onReject={handleReject}
                    expiresAt={job.response_deadline}
                />
            )}
        </div>
    );
}
