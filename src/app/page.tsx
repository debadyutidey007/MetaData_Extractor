
"use client";

import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import exifr from 'exifr';
import * as pdfjsLib from 'pdfjs-dist';
import { Header } from "@/components/layout/header";
import { FileUploadForm } from "@/components/dashboard/file-upload-form";
import { FileQueue } from "@/components/dashboard/file-queue";
import { MetadataDisplay } from "@/components/dashboard/metadata-display";
import { processFile } from "@/app/actions";
import type { ProcessedFile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Setup PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Polyfill for uuid in browser environments that might need it
declare global {
  interface Window {
    crypto: {
        getRandomValues<T extends ArrayBufferView | null>(array: T): T;
        randomUUID(): string;
    }
  }
}

if (typeof window !== 'undefined' && !window.crypto) {
  // A simple fallback for environments without crypto
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (array: any) => {
        for (let i = 0, l = array.length; i < l; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      randomUUID: () => uuidv4(),
    },
    writable: true,
    configurable: true,
  });
}

async function extractMetadata(file: File): Promise<Record<string, any>> {
    const baseMetadata = {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileType: file.type || 'unknown',
        lastModified: new Date(file.lastModified).toISOString(),
    };

    try {
        if (file.type.startsWith('image/')) {
            const exifData = await exifr.parse(file, {
                tiff: true,
                exif: true,
                gps: true,
                interop: true,
                xmp: true,
                iptc: true,
            });
            
            if (exifData && Object.keys(exifData).length > 0) {
                 // Ensure GPS data is correctly formatted if present
                 if (exifData.latitude) exifData.GPSLatitude = exifData.latitude;
                 if (exifData.longitude) exifData.GPSLongitude = exifData.longitude;
                 
                 return { ...baseMetadata, ...exifData };
            }

            // DEMO: If it's a JPEG with no GPS, add sample data
            if (file.type === 'image/jpeg' && (!exifData || !exifData.latitude)) {
                return {
                    ...baseMetadata,
                    info: "No EXIF data found. Displaying sample GPS data for demonstration.",
                    GPSLatitude: [37, 49, 27.99],
                    GPSLatitudeRef: 'N',
                    GPSLongitude: [122, 25, 4.25],
                    GPSLongitudeRef: 'W',
                    latitude: 37.82444166666666, // Decimal for map
                    longitude: -122.41784722222222, // Decimal for map
                    SampleData: "This is sample data. Upload an original phone photo to see real coordinates."
                };
            }
            
            return { ...baseMetadata, info: "No detailed EXIF data found in this image." };

        } else if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const metadata = (await pdf.getMetadata())?.info;
            return { ...baseMetadata, ...metadata };
        }
    } catch (e) {
        console.error("Metadata extraction error:", e);
        return { ...baseMetadata, error: "Could not extract metadata due to an error." };
    }
    
    return { ...baseMetadata, info: "Detailed metadata extraction is not supported for this file type." };
}


export default function Home() {
  const [files, setFiles] = React.useState<ProcessedFile[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<ProcessedFile | null>(null);
  const { toast } = useToast();

  const handleFilesAdded = (newFiles: FileList) => {
    const processedFiles: ProcessedFile[] = Array.from(newFiles).map(file => ({
      id: window.crypto.randomUUID(),
      file,
      status: 'queued',
      progress: 0,
    }));
    setFiles(prev => [...processedFiles, ...prev]);
  };

  const processQueue = React.useCallback(async () => {
    const fileToProcess = files.find(f => f.status === 'queued');
    if (!fileToProcess) return;

    setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing', progress: 25 } : f));
    
    try {
        const metadata = await extractMetadata(fileToProcess.file);
        setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, progress: 50 } : f));
        
        const result = await processFile(metadata);
        
        const updatedFile = { 
            ...fileToProcess, 
            status: 'done' as const, 
            progress: 100,
            metadata: result.original,
            redactedMetadata: result.redacted
        };
      
      setFiles(prev => prev.map(f => f.id === fileToProcess.id ? updatedFile : f));

      if (!selectedFile || selectedFile.id === fileToProcess.id) {
          setSelectedFile(updatedFile);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorFile = { ...fileToProcess, status: 'error' as const, error: errorMessage, progress: 0 };
      setFiles(prev => prev.map(f => f.id === fileToProcess.id ? errorFile : f));
      
      if (!selectedFile || selectedFile.id === fileToProcess.id) {
        setSelectedFile(errorFile);
      }

      toast({
        variant: "destructive",
        title: "Processing Error",
        description: `Could not process file: ${fileToProcess.file.name}. ${errorMessage}`,
      });
    }
  }, [files, toast, selectedFile]);

  React.useEffect(() => {
    const processing = files.some(f => f.status === 'processing');
    if (!processing) {
      processQueue();
    }
  }, [files, processQueue]);

  const handleClearQueue = () => {
    setFiles([]);
    setSelectedFile(null);
  }

  const handleClearCompleted = () => {
    setFiles(files => files.filter(f => f.status !== 'done' && f.status !== 'error'));
    if (selectedFile && (selectedFile.status === 'done' || selectedFile.status === 'error')) {
      setSelectedFile(null);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-body text-foreground">
      <Header />
      <main className="flex-1 animate-fade-in-up p-4 sm:p-6 md:p-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:gap-8 lg:grid-cols-5">
          <div className="flex flex-col gap-6 md:gap-8 lg:col-span-2">
            <FileUploadForm onFilesAdded={handleFilesAdded} />
            <FileQueue
              files={files}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onClearQueue={handleClearQueue}
              onClearCompleted={handleClearCompleted}
            />
          </div>
          <div className="lg:col-span-3">
            <MetadataDisplay file={selectedFile} />
          </div>
        </div>
      </main>
    </div>
  );
}
