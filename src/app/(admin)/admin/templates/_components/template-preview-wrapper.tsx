'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { previewTemplate } from '@/lib/services/admin/templates';
import { toast } from 'sonner';
import { Loader2, Play } from 'lucide-react';

interface TemplatePreviewWrapperProps {
    template: any;
    type: 'email' | 'sms';
}

export function TemplatePreviewWrapper({ template, type }: TemplatePreviewWrapperProps) {
    const [loading, setLoading] = useState(false);
    const [variables, setVariables] = useState<Record<string, any>>({});
    const [previewContent, setPreviewContent] = useState<any>(null);

    const handleVariableChange = (key: string, value: string) => {
        setVariables(prev => ({ ...prev, [key]: value }));
    };

    const handlePreview = async () => {
        setLoading(true);
        try {
            const result = await previewTemplate(template.id, type, {
                variables,
                user_role: 'admin' // Default for preview
            });

            if (result.success) {
                setPreviewContent(result.data);
            } else {
                toast.error(result.error || 'Failed to generate preview');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Sample Data</CardTitle>
                    <CardDescription>Enter test values for variables</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {template.variables_schema?.length > 0 ? (
                        template.variables_schema.map((v: string) => (
                            <div key={v} className="space-y-2">
                                <Label htmlFor={v}>{v}</Label>
                                <Input
                                    id={v}
                                    placeholder={`Value for ${v}`}
                                    value={variables[v] || ''}
                                    onChange={(e) => handleVariableChange(v, e.target.value)}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No variables defined for this template</p>
                    )}
                    <Button
                        onClick={handlePreview}
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        Generate Preview
                    </Button>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Preview Result</CardTitle>
                    <CardDescription>How the template will appear to recipients</CardDescription>
                </CardHeader>
                <CardContent>
                    {!previewContent ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg bg-muted/30">
                            <Play className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground">Click "Generate Preview" to see the result</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {type === 'email' && (
                                <div className="space-y-2 pb-4 border-b">
                                    <Label className="text-xs uppercase text-muted-foreground">Subject</Label>
                                    <div className="text-lg font-semibold">{previewContent.subject}</div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Body</Label>
                                {type === 'email' ? (
                                    <div
                                        className="prose prose-sm max-w-none border rounded-lg p-6 bg-white overflow-auto max-h-[600px]"
                                        dangerouslySetInnerHTML={{ __html: previewContent.body || previewContent.message }}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap border rounded-lg p-6 bg-muted/10 font-mono text-sm">
                                        {previewContent.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
