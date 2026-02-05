"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClear?: () => void;
    placeholder?: string;
}

export function SignaturePad({ onSave, onClear, placeholder = "Please sign here" }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set line style
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // Handle window resize
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = 200; // Fixed height
            }
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        setIsEmpty(false);
        const { x, y } = getCoordinates(e.nativeEvent);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e.nativeEvent);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
            onClear?.();
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (canvas && !isEmpty) {
            const dataUrl = canvas.toDataURL("image/png");
            onSave(dataUrl);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl bg-white overflow-hidden touch-none h-[200px]">
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-muted-foreground/50 text-sm font-medium">{placeholder}</span>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="w-full h-full cursor-crosshair"
                />
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={clear}
                >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                </Button>
                <Button
                    type="button"
                    className="flex-1 gap-2"
                    onClick={save}
                    disabled={isEmpty}
                >
                    <Check className="h-4 w-4" />
                    Confirm Signature
                </Button>
            </div>
        </div>
    );
}
