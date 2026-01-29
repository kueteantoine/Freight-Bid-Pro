"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string[];
  maxSizeMB?: number;
  onUploadComplete: (url: string) => void;
  path: string;
}

export function FileUpload({
  label,
  description,
  accept = ["application/pdf", "image/jpeg", "image/png"],
  maxSizeMB = 5,
  onUploadComplete,
  path
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (!accept.includes(file.type)) {
      toast.error(`Invalid file type. Accepted: ${accept.join(", ")}`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      await uploadFile(selectedFile);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(10);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('verification-docs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setProgress(100);
      const { data: { publicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(filePath);

      setUploadedUrl(publicUrl);
      onUploadComplete(publicUrl);
      toast.success("Document uploaded successfully");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadedUrl(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <label className="text-sm font-semibold">{label}</label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {uploadedUrl && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center gap-2",
          uploadedUrl ? "border-green-200 bg-green-50/30" : "border-muted hover:border-primary/50 bg-muted/5",
          uploading && "opacity-70 pointer-events-none"
        )}
      >
        {!file ? (
          <>
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-1">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">PDF, JPG or PNG (max. {maxSizeMB}MB)</p>
            <input
              type="file"
              ref={fileInputRef}
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept={accept.join(",")}
            />
          </>
        ) : (
          <div className="w-full flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              {uploading ? (
                <div className="mt-2 space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              )}
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}