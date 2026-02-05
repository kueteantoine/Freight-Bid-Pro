"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, PenTool } from "lucide-react";
import { getDigitalBOL, signDigitalBOL } from "@/app/actions/driver-docs-actions";
import { SignaturePad } from "./SignaturePad";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";

interface BOLViewProps {
    shipmentId: string;
    onClose?: () => void;
}

export function BOLView({ shipmentId, onClose }: BOLViewProps) {
    const [bol, setBol] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showSignPad, setShowSignPad] = useState(false);
    const [signingRole, setSigningRole] = useState<'shipper' | 'carrier' | null>(null);

    const loadBOL = async () => {
        setLoading(true);
        const result = await getDigitalBOL(shipmentId);
        if (result.bol) {
            setBol(result.bol);
        } else {
            toast.error(result.error || "Failed to load BOL");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadBOL();
    }, [shipmentId]);

    const handleSign = async (signature: string) => {
        if (!signingRole) return;

        try {
            const result = await signDigitalBOL(shipmentId, signingRole, signature);
            if (result.success) {
                toast.success(`Signed as ${signingRole}`);
                setShowSignPad(false);
                setSigningRole(null);
                loadBOL();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred during signing");
        }
    };

    if (loading) return <div>Loading BOL...</div>;
    if (!bol) return <div>BOL not found</div>;

    return (
        <Card className="max-w-2xl mx-auto border-none shadow-none bg-background">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b pb-4">
                <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-xl">{bol.bol_number}</CardTitle>
                        <p className="text-xs text-muted-foreground">Generated {format(new Date(bol.created_at), "MMM d, yyyy HH:mm")}</p>
                    </div>
                </div>
                <Badge variant={bol.status === 'fully_signed' ? 'default' : 'secondary'}>
                    {bol.status.replace(/_/g, ' ')}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
                {/* BOL Content (Summary) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Shipment Summary</h3>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="font-semibold text-primary mb-1">Items Summary</p>
                            <ul className="list-disc list-inside space-y-1">
                                {bol.items_json?.map((item: any, i: number) => (
                                    <li key={i}>{item.quantity}x {item.description || "Freight Item"} ({item.weight}kg)</li>
                                )) || <li>General Cargo</li>}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Shipper Section */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase text-muted-foreground">Shipper Signature</p>
                        {bol.shipper_signature_url ? (
                            <div className="h-24 bg-muted/20 border rounded-lg flex items-center justify-center overflow-hidden">
                                {/* Note: Actual URL would need handling for storage path */}
                                <div className="text-[10px] text-muted-foreground italic">Signature Captured</div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full h-24 border-dashed gap-2 flex-col"
                                onClick={() => { setSigningRole('shipper'); setShowSignPad(true); }}
                            >
                                <PenTool className="h-4 w-4" />
                                Add Shipper sign
                            </Button>
                        )}
                    </div>

                    {/* Carrier Section */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase text-muted-foreground">Carrier/Driver Signature</p>
                        {bol.carrier_signature_url ? (
                            <div className="h-24 bg-muted/20 border rounded-lg flex items-center justify-center overflow-hidden">
                                <div className="text-[10px] text-muted-foreground italic">Signature Captured</div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full h-24 border-dashed gap-2 flex-col"
                                onClick={() => { setSigningRole('carrier'); setShowSignPad(true); }}
                            >
                                <PenTool className="h-4 w-4" />
                                Add Carrier sign
                            </Button>
                        )}
                    </div>
                </div>

                {/* Terms Placeholder */}
                <div className="text-[10px] text-muted-foreground mt-8 leading-relaxed">
                    <p>Received the above described property in good order, except as noted. Contents and condition of packages unknown. Subject to terms and conditions of Freight Bid Pro service agreement.</p>
                </div>
            </CardContent>

            {/* Signature Modal Overlay */}
            {showSignPad && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-lg">Sign as {signingRole}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setShowSignPad(false); setSigningRole(null); }}>
                                <PenTool className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <SignaturePad onSave={handleSign} placeholder={`Signature for ${signingRole}`} />
                        </CardContent>
                    </Card>
                </div>
            )}
        </Card>
    );
}
