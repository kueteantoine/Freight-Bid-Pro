'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { renderEmailTemplate, renderSmsTemplate } from '@/lib/services/admin/templates';
import { useToast } from '@/hooks/use-toast';
import { Send, Eye } from 'lucide-react';

interface TemplateTestingInterfaceProps {
    templateId: string;
    templateType: 'email' | 'sms';
    templateKey: string;
}

export function TemplateTestingInterface({
    templateId,
    templateType,
    templateKey,
}: TemplateTestingInterfaceProps) {
    const { toast } = useToast();
    const [testData, setTestData] = useState({
        user_name: 'John Doe',
        user_email: 'john@example.com',
        shipment_id: 'SHP-12345',
        payment_amount: '50,000 XAF',
        transaction_id: 'TXN-67890',
    });
    const [userRole, setUserRole] = useState<'shipper' | 'carrier' | 'driver' | 'broker'>('shipper');
    const [language, setLanguage] = useState<'en' | 'fr'>('en');
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);

    async function handlePreview() {
        setLoading(true);
        try {
            const result =
                templateType === 'email'
                    ? await renderEmailTemplate(templateKey, testData, userRole, language)
                    : await renderSmsTemplate(templateKey, testData, userRole, language);

            if (result.success) {
                setPreview(result.data || '');
                toast({
                    title: 'Preview Generated',
                    description: 'Template rendered successfully with test data.',
                });
            } else {
                toast({
                    title: 'Preview Failed',
                    description: result.error || 'Failed to render template',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An error occurred while rendering the template',
                variant: 'destructive',
            });
        }
        setLoading(false);
    }

    async function handleSendTest() {
        toast({
            title: 'Test Send',
            description: 'Test email/SMS functionality would be implemented here with actual email/SMS service integration.',
        });
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Test Data Input */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Data</CardTitle>
                    <CardDescription>
                        Enter sample data to test the template rendering
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>User Role</Label>
                        <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shipper">Shipper</SelectItem>
                                <SelectItem value="carrier">Carrier</SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                                <SelectItem value="broker">Broker</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user_name">User Name</Label>
                        <Input
                            id="user_name"
                            value={testData.user_name}
                            onChange={(e) => setTestData({ ...testData, user_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user_email">User Email</Label>
                        <Input
                            id="user_email"
                            type="email"
                            value={testData.user_email}
                            onChange={(e) => setTestData({ ...testData, user_email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shipment_id">Shipment ID</Label>
                        <Input
                            id="shipment_id"
                            value={testData.shipment_id}
                            onChange={(e) => setTestData({ ...testData, shipment_id: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_amount">Payment Amount</Label>
                        <Input
                            id="payment_amount"
                            value={testData.payment_amount}
                            onChange={(e) => setTestData({ ...testData, payment_amount: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transaction_id">Transaction ID</Label>
                        <Input
                            id="transaction_id"
                            value={testData.transaction_id}
                            onChange={(e) => setTestData({ ...testData, transaction_id: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handlePreview} disabled={loading} className="flex-1">
                            <Eye className="mr-2 h-4 w-4" />
                            {loading ? 'Rendering...' : 'Preview'}
                        </Button>
                        <Button onClick={handleSendTest} variant="outline" className="flex-1">
                            <Send className="mr-2 h-4 w-4" />
                            Send Test
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                        Rendered {templateType} template with test data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {preview ? (
                        <div className="rounded-md border p-4 bg-muted/30 overflow-auto max-h-[600px]">
                            {templateType === 'email' ? (
                                <div dangerouslySetInnerHTML={{ __html: preview }} />
                            ) : (
                                <pre className="text-sm whitespace-pre-wrap">{preview}</pre>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            Click "Preview" to render the template with test data
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
