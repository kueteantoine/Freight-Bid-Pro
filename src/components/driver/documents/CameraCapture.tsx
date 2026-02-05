"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X } from "lucide-react";
import Image from "next/image";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    label?: string;
}

export function CameraCapture({ onCapture, label = "Take Photo" }: CameraCaptureProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreview(url);
        }
    };

    const handleConfirm = () => {
        if (file) {
            onCapture(file);
            // Reset for next caputer if needed, or caller handles it
        }
    };

    const handleClear = () => {
        setPreview(null);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={inputRef}
                onChange={handleFileChange}
            />

            {!preview ? (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-32 border-2 border-dashed flex flex-col gap-2 rounded-xl"
                    onClick={() => inputRef.current?.click()}
                >
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <span>{label}</span>
                </Button>
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-contain"
                        />
                        <button
                            onClick={handleClear}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => inputRef.current?.click()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retake
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 gap-2"
                            onClick={handleConfirm}
                        >
                            <Check className="h-4 w-4" />
                            Save Photo
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
