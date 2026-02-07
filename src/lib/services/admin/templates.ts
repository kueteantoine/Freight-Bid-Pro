'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// TYPES
// =====================================================

export type TemplateType = 'email' | 'sms';

export interface EmailTemplate {
    id: string;
    template_key: string;
    template_name: string;
    description?: string;
    subject_template: string;
    body_template: string;
    variables_schema: string[];
    conditional_rules: any[];
    language: string;
    category?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SmsTemplate {
    id: string;
    template_key: string;
    template_name: string;
    description?: string;
    message_template: string;
    variables_schema: string[];
    conditional_rules: any[];
    language: string;
    category?: string;
    character_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateEmailTemplateInput {
    template_key: string;
    template_name: string;
    description?: string;
    subject_template: string;
    body_template: string;
    variables_schema?: string[];
    conditional_rules?: any[];
    language?: string;
    category?: string;
}

export interface CreateSmsTemplateInput {
    template_key: string;
    template_name: string;
    description?: string;
    message_template: string;
    variables_schema?: string[];
    conditional_rules?: any[];
    language?: string;
    category?: string;
}

// =====================================================
// GET TEMPLATES
// =====================================================

export async function getEmailTemplates(language?: string) {
    const supabase = await createClient();

    try {
        let query = supabase.from('email_templates').select('*').eq('is_active', true);

        if (language) {
            query = query.eq('language', language);
        }

        const { data, error } = await query.order('template_name');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching email templates:', error);
        return { success: false, error: error.message };
    }
}

export async function getSmsTemplates(language?: string) {
    const supabase = await createClient();

    try {
        let query = supabase.from('sms_templates').select('*').eq('is_active', true);

        if (language) {
            query = query.eq('language', language);
        }

        const { data, error } = await query.order('template_name');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching SMS templates:', error);
        return { success: false, error: error.message };
    }
}

export async function getTemplateById(templateId: string, templateType: TemplateType) {
    const supabase = await createClient();

    try {
        const tableName = templateType === 'email' ? 'email_templates' : 'sms_templates';
        const { data, error } = await supabase.from(tableName).select('*').eq('id', templateId).single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching template:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// CREATE/UPDATE TEMPLATES
// =====================================================

export async function createEmailTemplate(input: CreateEmailTemplateInput) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('email_templates')
            .insert({
                template_key: input.template_key,
                template_name: input.template_name,
                description: input.description,
                subject_template: input.subject_template,
                body_template: input.body_template,
                variables_schema: input.variables_schema || [],
                conditional_rules: input.conditional_rules || [],
                language: input.language || 'en',
                category: input.category,
                created_by_admin_id: user.id,
                updated_by_admin_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/templates');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating email template:', error);
        return { success: false, error: error.message };
    }
}

export async function createSmsTemplate(input: CreateSmsTemplateInput) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('sms_templates')
            .insert({
                template_key: input.template_key,
                template_name: input.template_name,
                description: input.description,
                message_template: input.message_template,
                variables_schema: input.variables_schema || [],
                conditional_rules: input.conditional_rules || [],
                language: input.language || 'en',
                category: input.category,
                created_by_admin_id: user.id,
                updated_by_admin_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/templates');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating SMS template:', error);
        return { success: false, error: error.message };
    }
}

export async function updateEmailTemplate(
    templateId: string,
    input: Partial<CreateEmailTemplateInput>
) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('email_templates')
            .update({
                ...input,
                updated_by_admin_id: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', templateId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/templates');
        revalidatePath(`/admin/templates/email/${templateId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating email template:', error);
        return { success: false, error: error.message };
    }
}

export async function updateSmsTemplate(
    templateId: string,
    input: Partial<CreateSmsTemplateInput>
) {
    const supabase = await createClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('sms_templates')
            .update({
                ...input,
                updated_by_admin_id: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', templateId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/templates');
        revalidatePath(`/admin/templates/sms/${templateId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating SMS template:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteTemplate(templateId: string, templateType: TemplateType) {
    const supabase = await createClient();

    try {
        const tableName = templateType === 'email' ? 'email_templates' : 'sms_templates';
        const { error } = await supabase.from(tableName).delete().eq('id', templateId);

        if (error) throw error;

        revalidatePath('/admin/templates');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting template:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// TEMPLATE RENDERING
// =====================================================

export async function renderEmailTemplate(
    templateKey: string,
    variables: Record<string, any>,
    userRole?: string,
    language: string = 'en'
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('render_email_template', {
            template_key_param: templateKey,
            variables_param: variables,
            user_role_param: userRole || null,
            language_param: language,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error rendering email template:', error);
        return { success: false, error: error.message };
    }
}

export async function renderSmsTemplate(
    templateKey: string,
    variables: Record<string, any>,
    userRole?: string,
    language: string = 'en'
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('render_sms_template', {
            template_key_param: templateKey,
            variables_param: variables,
            user_role_param: userRole || null,
            language_param: language,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error rendering SMS template:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// TEMPLATE PREVIEW
// =====================================================

export async function previewTemplate(
    templateId: string,
    templateType: TemplateType,
    sampleData: {
        variables: Record<string, any>;
        user_role?: string;
    }
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_template_preview', {
            template_id_param: templateId,
            template_type_param: templateType,
            sample_data_param: sampleData,
        });

        if (error) throw error;

        if (!data.success) {
            return { success: false, error: data.error };
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error('Error previewing template:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// TEMPLATE VALIDATION
// =====================================================

export async function validateTemplateSyntax(templateBody: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('validate_template_syntax', {
            template_body_param: templateBody,
        });

        if (error) throw error;

        return data;
    } catch (error: any) {
        console.error('Error validating template syntax:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// TEMPLATE VARIABLES
// =====================================================

export async function getTemplateVariables() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('template_variables')
            .select('*')
            .order('category', { ascending: true })
            .order('variable_name', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching template variables:', error);
        return { success: false, error: error.message };
    }
}

export async function getTemplateVariablesByCategory() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('template_variables')
            .select('*')
            .order('category', { ascending: true })
            .order('variable_name', { ascending: true });

        if (error) throw error;

        // Group by category
        const grouped = data.reduce((acc: any, variable: any) => {
            const category = variable.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(variable);
            return acc;
        }, {});

        return { success: true, data: grouped };
    } catch (error: any) {
        console.error('Error fetching template variables by category:', error);
        return { success: false, error: error.message };
    }
}
