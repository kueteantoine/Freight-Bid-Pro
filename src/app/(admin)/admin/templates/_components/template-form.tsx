'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import {
    createEmailTemplate,
    createSmsTemplate,
    updateEmailTemplate,
    updateSmsTemplate,
    getTemplateVariablesByCategory,
} from '@/lib/services/admin/templates';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

const formSchema = z.object({
    template_name: z.string().min(2, 'Name must be at least 2 characters'),
    template_key: z.string().min(2, 'Key must be at least 2 characters').regex(/^[a-z0-9_]+$/, 'Key must be lowercase, numbers, or underscores'),
    description: z.string().optional(),
    category: z.string().optional(),
    language: z.string().default('en'),
    is_active: z.boolean().default(true),
    // Email specific
    subject_template: z.string().optional(),
    body_template: z.string().optional(),
    // SMS specific
    message_template: z.string().optional(),
    variables_schema: z.array(z.string()).default([]),
});

interface TemplateFormProps {
    initialData?: any;
    type?: 'email' | 'sms';
    isEditing?: boolean;
}

export function TemplateForm({ initialData, type: initialType, isEditing }: TemplateFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [templateType, setTemplateType] = useState<'email' | 'sms'>(initialType || 'email');
    const [availableVariables, setAvailableVariables] = useState<Record<string, any>>({});
    const [newVariable, setNewVariable] = useState('');

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            variables_schema: initialData.variables_schema || [],
        } : {
            template_name: '',
            template_key: '',
            description: '',
            category: 'general',
            language: 'en',
            is_active: true,
            subject_template: '',
            body_template: '',
            message_template: '',
            variables_schema: [],
        },
    });

    useEffect(() => {
        async function fetchVariables() {
            const result = await getTemplateVariablesByCategory();
            if (result.success) {
                setAvailableVariables(result.data);
            }
        }
        fetchVariables();
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            let result;
            if (isEditing) {
                if (templateType === 'email') {
                    result = await updateEmailTemplate(initialData.id, values);
                } else {
                    result = await updateSmsTemplate(initialData.id, values);
                }
            } else {
                if (templateType === 'email') {
                    result = await createEmailTemplate({
                        ...values,
                        subject_template: values.subject_template || '',
                        body_template: values.body_template || '',
                    } as any);
                } else {
                    result = await createSmsTemplate({
                        ...values,
                        message_template: values.message_template || '',
                    } as any);
                }
            }

            if (result.success) {
                toast.success(`Template ${isEditing ? 'updated' : 'created'} successfully`);
                router.push('/admin/templates');
                router.refresh();
            } else {
                toast.error(result.error || 'Something went wrong');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    const addVariable = (variable: string) => {
        const current = form.getValues('variables_schema');
        if (!current.includes(variable)) {
            form.setValue('variables_schema', [...current, variable]);
        }
    };

    const removeVariable = (variable: string) => {
        const current = form.getValues('variables_schema');
        form.setValue('variables_schema', current.filter((v: string) => v !== variable));
    };

    const handleCustomVariable = () => {
        if (newVariable && !form.getValues('variables_schema').includes(newVariable)) {
            addVariable(newVariable);
            setNewVariable('');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Template Details</CardTitle>
                                <CardDescription>Basic information about the template</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!isEditing && (
                                    <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border mb-4">
                                        <Button
                                            type="button"
                                            variant={templateType === 'email' ? 'default' : 'outline'}
                                            onClick={() => setTemplateType('email')}
                                            className="flex-1"
                                        >
                                            Email Template
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={templateType === 'sms' ? 'default' : 'outline'}
                                            onClick={() => setTemplateType('sms')}
                                            className="flex-1"
                                        >
                                            SMS Template
                                        </Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="template_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Welcome Email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="template_key"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Key</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="welcome_email"
                                                        {...field}
                                                        disabled={isEditing}
                                                    />
                                                </FormControl>
                                                <FormDescription>Unique identifier for development</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="auth">Authentication</SelectItem>
                                                        <SelectItem value="bidding">Bidding</SelectItem>
                                                        <SelectItem value="payments">Payments</SelectItem>
                                                        <SelectItem value="general">General</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="language"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Language</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select language" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="en">English (EN)</SelectItem>
                                                        <SelectItem value="fr">French (FR)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Sent to new users after registration" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Active Status</FormLabel>
                                                <FormDescription>Whether this template can be used</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Content</CardTitle>
                                <CardDescription>
                                    Compose your {templateType} template using variables
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {templateType === 'email' ? (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="subject_template"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subject</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Welcome, {{user_name}}!" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="body_template"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Body</FormLabel>
                                                    <FormControl>
                                                        <RichTextEditor
                                                            content={field.value || ''}
                                                            onChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="message_template"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Message</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Your bid for {{load_id}} has been accepted."
                                                        className="min-h-[150px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Variables</CardTitle>
                                <CardDescription>Available substitution tokens</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <FormLabel>Required Variables</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {form.watch('variables_schema').map((variable: string) => (
                                            <Badge key={variable} variant="secondary" className="pl-2">
                                                {variable}
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariable(variable)}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {form.watch('variables_schema').length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No variables added</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Input
                                            placeholder="Custom variable"
                                            value={newVariable}
                                            onChange={(e) => setNewVariable(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomVariable())}
                                        />
                                        <Button type="button" size="icon" onClick={handleCustomVariable}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    {Object.entries(availableVariables).map(([category, vars]: [string, any]) => (
                                        <div key={category} className="space-y-2">
                                            <h4 className="text-xs font-semibold uppercase text-muted-foreground">{category}</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {vars.map((v: any) => (
                                                    <Button
                                                        key={v.variable_name}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-[10px] h-7 px-2"
                                                        onClick={() => addVariable(v.variable_name)}
                                                    >
                                                        {v.variable_name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Create Template'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}
