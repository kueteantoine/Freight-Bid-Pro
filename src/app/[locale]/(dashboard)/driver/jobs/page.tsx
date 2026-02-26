import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDriverJobs } from "@/app/actions/driver-jobs";
import { JobCard } from "@/components/driver/jobs/JobCard";
import { JobHistoryList } from "@/components/driver/jobs/JobHistoryList";
import { NotificationSimulator } from "@/components/driver/jobs/NotificationSimulator";

export default async function DriverJobsPage() {
    const { jobs: pendingJobs } = await getDriverJobs("pending");
    const { jobs: activeJobs } = await getDriverJobs("active");
    const { jobs: historyJobs } = await getDriverJobs("history");

    return (
        <div className="h-full flex flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <h1 className="text-xl font-bold">My Jobs</h1>
            </header>

            <div className="flex-1 p-4 md:p-6 overflow-auto">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="active">Active ({activeJobs?.length || 0})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({pendingJobs?.length || 0})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-4">
                        {(!activeJobs || activeJobs.length === 0) ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p className="mb-2">No active jobs</p>
                                <p className="text-sm">When you accept a job, it will appear here.</p>
                            </div>
                        ) : (
                            activeJobs.map(job => <JobCard key={job.id} job={job} />)
                        )}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        {(!pendingJobs || pendingJobs.length === 0) ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No pending job offers</p>
                            </div>
                        ) : (
                            pendingJobs.map(job => <JobCard key={job.id} job={job} />)
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        <JobHistoryList jobs={historyJobs || []} />
                    </TabsContent>
                </Tabs>
            </div>

            <div className="fixed bottom-4 right-4 md:hidden z-50">
                <NotificationSimulator />
            </div>
        </div>
    );
}
