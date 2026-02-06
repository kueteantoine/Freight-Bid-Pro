import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Truck, Package, MapPin, DollarSign, TrendingUp, Tag, Receipt } from 'lucide-react';

export default function SettingsOverviewPage() {
    const settingsCategories = [
        {
            title: 'Vehicle Types',
            description: 'Manage available vehicle types and capacity ranges',
            icon: Truck,
            href: '/admin/settings/vehicle-types',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Freight Categories',
            description: 'Configure freight classifications and special requirements',
            icon: Package,
            href: '/admin/settings/freight-categories',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Service Regions',
            description: 'Define geographic coverage and service areas',
            icon: MapPin,
            href: '/admin/settings/service-regions',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Commission Tiers',
            description: 'Set up tiered commission structure based on volume',
            icon: DollarSign,
            href: '/admin/settings/commission-tiers',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Surge Pricing',
            description: 'Configure dynamic pricing rules and multipliers',
            icon: TrendingUp,
            href: '/admin/settings/surge-pricing',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Promotional Codes',
            description: 'Create and manage discount codes and promotions',
            icon: Tag,
            href: '/admin/settings/promotional-codes',
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
        },
        {
            title: 'Tax Rates',
            description: 'Configure regional tax rates and calculation methods',
            icon: Receipt,
            href: '/admin/settings/tax-rates',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-600 mt-2">
                    Configure platform-wide settings and manage system configuration
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <a key={category.title} href={category.href}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}>
                                        <Icon className={`w-6 h-6 ${category.color}`} />
                                    </div>
                                    <CardTitle>{category.title}</CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
