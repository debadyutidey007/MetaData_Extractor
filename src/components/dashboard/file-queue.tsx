"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProcessedFile } from "@/lib/types";
import { FileQueueItem } from "./file-queue-item";
import { Inbox, Trash2, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FileQueueProps {
  files: ProcessedFile[];
  selectedFile: ProcessedFile | null;
  onFileSelect: (file: ProcessedFile) => void;
  onClearQueue: () => void;
  onClearCompleted: () => void;
}
 
export function FileQueue({ files, selectedFile, onFileSelect, onClearQueue, onClearCompleted }: FileQueueProps) {
  const hasCompleted = files.some(f => f.status === 'done' || f.status === 'error');

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline tracking-tight">Processing Queue</CardTitle>
        <CardDescription>Files pending metadata extraction and redaction.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-80">
          {files.length > 0 ? (
            <div className="space-y-1 p-2">
              {files.map((file) => (
                <FileQueueItem
                  key={file.id}
                  file={file}
                  isSelected={selectedFile?.id === file.id}
                  onSelect={() => onFileSelect(file)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <Inbox className="w-14 h-14 mb-4 text-primary/50" />
              <p className="font-semibold text-lg">Queue is empty</p>
              <p className="text-sm">Upload files to begin processing.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {files.length > 0 && (
        <>
          <Separator />
          <CardFooter className="flex flex-col sm:flex-row gap-2 p-4">
            {/* Clear All button remains */}
            <Button variant="outline" onClick={onClearQueue} className="w-full sm:w-auto">
              <Trash2 /> Clear All
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
