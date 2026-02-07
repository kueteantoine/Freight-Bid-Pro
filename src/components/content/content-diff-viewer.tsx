'use client';

import { useMemo } from 'react';
import { diffWords, diffLines } from 'diff';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ContentDiffViewerProps {
    oldContent: string;
    newContent: string;
    oldVersion: string;
    newVersion: string;
    mode?: 'words' | 'lines';
}

export function ContentDiffViewer({
    oldContent,
    newContent,
    oldVersion,
    newVersion,
    mode = 'words',
}: ContentDiffViewerProps) {
    const diff = useMemo(() => {
        return mode === 'words'
            ? diffWords(oldContent, newContent)
            : diffLines(oldContent, newContent);
    }, [oldContent, newContent, mode]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Content Comparison</CardTitle>
                <CardDescription>
                    Comparing {oldVersion} → {newVersion}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Old Version */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {oldVersion}
                        </h4>
                        <div className="rounded-md border p-4 bg-muted/30 overflow-auto max-h-[600px]">
                            <pre className="text-sm whitespace-pre-wrap font-mono">
                                {diff.map((part, index) => (
                                    <span
                                        key={index}
                                        className={
                                            part.removed
                                                ? 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200'
                                                : part.added
                                                    ? ''
                                                    : ''
                                        }
                                    >
                                        {part.removed ? part.value : !part.added ? part.value : ''}
                                    </span>
                                ))}
                            </pre>
                        </div>
                    </div>

                    {/* New Version */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            {newVersion}
                        </h4>
                        <div className="rounded-md border p-4 bg-muted/30 overflow-auto max-h-[600px]">
                            <pre className="text-sm whitespace-pre-wrap font-mono">
                                {diff.map((part, index) => (
                                    <span
                                        key={index}
                                        className={
                                            part.added
                                                ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200'
                                                : part.removed
                                                    ? ''
                                                    : ''
                                        }
                                    >
                                        {part.added ? part.value : !part.removed ? part.value : ''}
                                    </span>
                                ))}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Unified Diff View */}
                <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                        Unified Diff
                    </h4>
                    <div className="rounded-md border p-4 bg-muted/30 overflow-auto max-h-[400px]">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                            {diff.map((part, index) => (
                                <span
                                    key={index}
                                    className={
                                        part.added
                                            ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200'
                                            : part.removed
                                                ? 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200'
                                                : ''
                                    }
                                >
                                    {part.value}
                                </span>
                            ))}
                        </pre>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
