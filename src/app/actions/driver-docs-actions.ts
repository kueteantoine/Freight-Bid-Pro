"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ShipmentDocumentType = 'gate_pass' | 'pickup_cargo' | 'delivery_cargo' | 'delivery_location' | 'bol' | 'other';

/**
 * Upload a document related to a shipment (e.g., photo of cargo, gate pass)
 */
export async function uploadShipmentDocument(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const shipmentId = formData.get('shipmentId') as string;
    const documentType = formData.get('documentType') as ShipmentDocumentType;
    const notes = formData.get('notes') as string;
    const file = formData.get('file') as File;

    if (!shipmentId || !documentType || !file) {
        return { success: false, error: "Missing required fields" };
    }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${shipmentId}/${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `shipment-docs/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('shipment-docs')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: "Failed to upload file to storage" };
    }

    // 2. Save reference to Database
    const { error: dbError } = await supabase
        .from('shipment_documents')
        .insert({
            shipment_id: shipmentId,
            document_type: documentType,
            file_url: filePath,
            notes: notes || null,
            uploaded_by_user_id: user.id
        });

    if (dbError) {
        console.error("DB error:", dbError);
        return { success: false, error: "Failed to save document record" };
    }

    revalidatePath(`/driver/jobs/${shipmentId}`);
    return { success: true, filePath };
}

/**
 * Submit Proof of Delivery (POD)
 */
export async function submitProofOfDelivery(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const shipmentId = formData.get('shipmentId') as string;
    const recipientName = formData.get('recipientName') as string;
    const signatureBase64 = formData.get('signature') as string; // Data URL
    const notes = formData.get('notes') as string;
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;

    if (!shipmentId || !recipientName || !signatureBase64) {
        return { success: false, error: "Missing required fields" };
    }

    // 1. Upload signature image to Storage
    // Convert base64 to Blob
    const base64Data = signatureBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${shipmentId}/signature_${Date.now()}.png`;
    const filePath = `signatures/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, buffer, {
            contentType: 'image/png'
        });

    if (uploadError) {
        console.error("Signature upload error:", uploadError);
        return { success: false, error: "Failed to upload signature" };
    }

    // 2. Save POD to Database
    const { error: podError } = await supabase
        .from('proof_of_delivery')
        .insert({
            shipment_id: shipmentId,
            recipient_name: recipientName,
            signature_url: filePath,
            notes: notes || null,
            latitude,
            longitude,
            delivered_at: new Date().toISOString()
        });

    if (podError) {
        console.error("POD DB error:", podError);
        return { success: false, error: "Failed to save POD record" };
    }

    // 3. Update Shipment Status to 'delivered'
    const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ status: 'delivered' })
        .eq('id', shipmentId);

    if (shipmentError) {
        console.error("Shipment status update error:", shipmentError);
        // We still return true as the POD was saved
    }

    revalidatePath(`/driver/jobs/${shipmentId}`);
    revalidatePath('/driver/dashboard');
    return { success: true };
}

/**
 * Generate (or fetch) Digital BOL for a shipment
 */
export async function getDigitalBOL(shipmentId: string) {
    const supabase = await createSupabaseServerClient();

    // Check if BOL already exists
    const { data: existingBOL, error: fetchError } = await supabase
        .from('digital_bol')
        .select('*')
        .eq('shipment_id', shipmentId)
        .maybeSingle();

    if (existingBOL) return { bol: existingBOL };

    // Create new BOL if it doesn't exist
    const bolNumber = `BOL-${shipmentId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // Fetch shipment details to snapshot items
    const { data: shipment } = await supabase
        .from('shipments')
        .select('*, items:shipment_items(*)')
        .eq('id', shipmentId)
        .single();

    const { data: newBOL, error: createError } = await supabase
        .from('digital_bol')
        .insert({
            shipment_id: shipmentId,
            bol_number: bolNumber,
            items_json: shipment?.items || [],
            status: 'draft'
        })
        .select()
        .single();

    if (createError) {
        console.error("BOL creation error:", createError);
        return { error: "Failed to create digital BOL" };
    }

    return { bol: newBOL };
}

/**
 * Sign Digital BOL (Shipper or Carrier side)
 */
export async function signDigitalBOL(shipmentId: string, role: 'shipper' | 'carrier', signatureBase64: string) {
    const supabase = await createSupabaseServerClient();

    // 1. Upload signature
    const base64Data = signatureBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${shipmentId}/bol_${role}_${Date.now()}.png`;
    const filePath = `signatures/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, buffer, { contentType: 'image/png' });

    if (uploadError) return { success: false, error: "Failed to upload signature" };

    // 2. Update BOL record
    const updateData: any = {};
    if (role === 'shipper') {
        updateData.shipper_signature_url = filePath;
        updateData.status = 'signed_by_shipper';
    } else {
        updateData.carrier_signature_url = filePath;
        // If already signed by shipper, move to fully_signed
        const { data: currentBOL } = await supabase
            .from('digital_bol')
            .select('status')
            .eq('shipment_id', shipmentId)
            .single();

        if (currentBOL?.status === 'signed_by_shipper') {
            updateData.status = 'fully_signed';
        } else {
            updateData.status = 'signed_by_carrier';
        }
    }

    const { error } = await supabase
        .from('digital_bol')
        .update(updateData)
        .eq('shipment_id', shipmentId);

    if (error) return { success: false, error: "Failed to update BOL" };

    revalidatePath(`/driver/jobs/${shipmentId}`);
    return { success: true };
}
