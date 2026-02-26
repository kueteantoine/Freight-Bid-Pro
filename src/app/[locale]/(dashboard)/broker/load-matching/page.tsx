import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoadMatchingDashboard from '@/components/broker/load-matching/LoadMatchingDashboard';

export const metadata = {
    title: 'Load Matching | Freight Bid Pro',
    description: 'Intelligent load matching and optimization for brokers',
};

export default async function LoadMatchingPage() {
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify user has broker role
    const { data: brokerRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_type', 'broker')
        .eq('is_active', true)
        .single();

    if (!brokerRole) {
        redirect('/broker/dashboard');
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Load Matching & Optimization</h1>
                <p className="mt-2 text-gray-600">
                    Intelligently match available loads with carrier capacity using AI-powered suggestions
                </p>
            </div>

            <Suspense fallback={<LoadingState />}>
                <LoadMatchingDashboard brokerId={user.id} />
            </Suspense>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-32 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
