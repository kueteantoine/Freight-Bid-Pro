'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob) => Promise<void>;
}

export function VoiceRecorder({ onSend }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [timer, setTimer] = useState(0);
    const [isSending, setIsSending] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setAudioBlob(null);
            setTimer(0);
            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error starting recording:', err);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = async () => {
        if (!audioBlob) return;
        setIsSending(true);
        try {
            await onSend(audioBlob);
            setAudioBlob(null);
        } catch (error) {
            console.error('Error sending audio:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleDiscard = () => {
        setAudioBlob(null);
        setTimer(0);
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-full border shadow-inner">
            {!isRecording && !audioBlob && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md animate-in fade-in zoom-in duration-300"
                    onClick={startRecording}
                >
                    <Mic className="h-6 w-6" />
                </Button>
            )}

            {isRecording && (
                <div className="flex items-center gap-3 w-full animate-in slide-in-from-left-2 duration-200">
                    <div className="flex items-center gap-2 flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 font-bold ml-2">
                        <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-sm font-mono">{formatTime(timer)}</span>
                    </div>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full h-12 w-12 shadow-md shrink-0"
                        onClick={stopRecording}
                    >
                        <Square className="h-5 w-5 fill-current" />
                    </Button>
                </div>
            )}

            {audioBlob && !isSending && (
                <div className="flex items-center gap-2 w-full animate-in zoom-in duration-300">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-10 w-10 text-muted-foreground"
                        onClick={handleDiscard}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 text-sm font-medium flex items-center justify-center">
                        Voice Msg ({formatTime(timer)})
                    </div>
                    <Button
                        size="icon"
                        className="rounded-full h-12 w-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white shrink-0"
                        onClick={handleSend}
                    >
                        <Send className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {isSending && (
                <div className="flex items-center justify-center w-full py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
