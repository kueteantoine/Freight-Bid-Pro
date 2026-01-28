"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Loader2, 
  Clock, 
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface PendingVerification {
  id: string;
  user_id: string;
  role_type: string;
  verification_status: string;
  verification_documents: any;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVer, setSelectedVer] = useState<PendingVerification | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_type,
          verification_status,
          verification_documents,
          created_at,
          profiles:user_id(first_name, last_name)
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVerifications(data as any);
    } catch (err: any) {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleProcess = async (status: 'verified' | 'rejected') => {
    if (!selectedVer) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          verification_status: status,
          activated_at: status === 'verified' ? new Date().toISOString() : null,
          role_specific_profile: { 
            review_note: reviewNote, 
            reviewed_at: new Date().toISOString() 
          }
        })
        .eq('id', selectedVer.id);

      if (error) throw error;

      toast.success(`Verification ${status} successfully`);
      setSelectedVer(null);
      setReviewNote("");
      fetchVerifications();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">Document Review Center</h1>
        <p className="text-muted-foreground">Process pending identity verifications from users across all roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-red-50 border-red-200 shadow-sm">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-black text-red-700">{verifications.length}</div>
          </CardContent>
        </Card>
        {/* Placeholder cards */}
      </div>

      <Card className="shadow-xl border-border">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle>Awaiting Review</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <p className="text-sm text-muted-foreground">Fetching pending documents...</p>
            </div>
          ) : verifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="p-4 rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold">All caught up!</h3>
                <p className="text-muted-foreground">No pending verifications to review right now.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((ver) => (
                  <TableRow key={ver.id} className="group transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {ver.profiles?.first_name} {ver.profiles?.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{ver.id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize font-semibold px-2.5">
                        {ver.role_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ver.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {Object.keys(ver.verification_documents || {}).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setSelectedVer(ver)}
                        className="rounded-full hover:bg-red-50 hover:text-red-700"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedVer} onOpenChange={(open) => !open && setSelectedVer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Review {selectedVer?.role_type} Verification
            </DialogTitle>
            <DialogDescription>
              Verification for {selectedVer?.profiles?.first_name} {selectedVer?.profiles?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(selectedVer?.verification_documents || {}).map(([key, url]) => (
                <Card key={key} className="overflow-hidden border-border bg-muted/5">
                  <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-tight">{key.replace('_', ' ')}</span>
                    <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Full View
                    </a>
                  </div>
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {(url as string).endsWith('.pdf') ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <span className="text-xs">PDF Document</span>
                      </div>
                    ) : (
                      <img src={url as string} alt={key} className="object-contain w-full h-full" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Review Notes / Feedback
              </label>
              <Textarea 
                placeholder="Internal notes or rejection reason to show to the user..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="min-h-[100px] border-red-100 focus:border-red-300"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="rounded-full px-8 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={processing}
              onClick={() => handleProcess('rejected')}
            >
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button 
              className="rounded-full px-8 bg-green-600 hover:bg-green-700"
              disabled={processing}
              onClick={() => handleProcess('verified')}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Approve Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}