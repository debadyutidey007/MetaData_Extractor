
"use client";

import * as React from "react";
import { UploadCloud, FileUp, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadFormProps {
  onFilesAdded: (files: FileList) => void;
}

export function FileUploadForm({ onFilesAdded }: FileUploadFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dirInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
      // Reset the input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline tracking-tight">Upload Files</CardTitle>
        <CardDescription>Select or drop files and folders to analyze</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors group",
            isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadCloud className="w-12 h-12 text-muted-foreground transition-transform group-hover:scale-110 group-hover:text-primary" />
          <p className="mt-4 text-center text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">Files and folders are supported</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => fileInputRef.current?.click()} className="flex-1">
                <FileUp />
                <span>Select Files</span>
            </Button>
            <Button onClick={() => dirInputRef.current?.click()} variant="secondary" className="flex-1">
                <FolderUp />
                <span>Select Folder</span>
            </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="*"
        />
        <input
          type="file"
          ref={dirInputRef}
          onChange={handleFileChange}
          className="hidden"
          webkitdirectory="true"
          mozdirectory="true"
          directory=""
        />
      </CardContent>
    </Card>
  );
}