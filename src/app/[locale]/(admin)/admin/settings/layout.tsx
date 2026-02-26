import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Platform Settings | Admin',
    description: 'Manage platform-wide configuration and settings',
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-full">
            {/* Settings Navigation Sidebar */}
            <aside className="w-64 border-r border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h2>
                <nav className="space-y-1">
                    <a
                        href="/admin/settings"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Overview
                    </a>
                    <a
                        href="/admin/settings/vehicle-types"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Vehicle Types
                    </a>
                    <a
                        href="/admin/settings/freight-categories"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Freight Categories
                    </a>
                    <a
                        href="/admin/settings/service-regions"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Service Regions
                    </a>
                    <a
                        href="/admin/settings/commission-tiers"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Commission Tiers
                    </a>
                    <a
                        href="/admin/settings/surge-pricing"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Surge Pricing
                    </a>
                    <a
                        href="/admin/settings/promotional-codes"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Promotional Codes
                    </a>
                    <a
                        href="/admin/settings/tax-rates"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                    >
                        Tax Rates
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
                {children}
            </main>
        </div>
    );
}
