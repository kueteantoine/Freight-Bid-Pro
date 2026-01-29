"use client";

import React, { useState, useRef, useEffect } from "react";
import { User as UserIcon, Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";

const MAX_SIZE_MB = 2;

export function AvatarUpload() {
  const [user, setUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`File size exceeds ${MAX_SIZE_MB}MB.`);
        return;
      }
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update user profile table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Update local state
      setAvatarUrl(publicUrl);

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(`Failed to upload avatar: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
      // 1. Remove URL from profile table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Clear local state
      setAvatarUrl("");
      toast.success("Avatar removed.");
    } catch (error: any) {
      toast.error(`Failed to remove avatar: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
          <AvatarImage src={avatarUrl} alt="User Avatar" />
          <AvatarFallback className="bg-primary/20 text-primary">
            <UserIcon className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn(
            "absolute bottom-0 right-0 h-8 w-8 rounded-full transition-all duration-200",
            isUploading ? "bg-primary/50" : "bg-primary hover:bg-primary/80 text-primary-foreground"
          )}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        {avatarUrl && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-0 right-0 h-6 w-6 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Max {MAX_SIZE_MB}MB. JPG/PNG only.</p>
    </div>
  );
}