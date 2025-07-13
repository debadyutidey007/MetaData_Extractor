
"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ProcessedFile } from "@/lib/types";
import { Eye, ShieldCheck, Loader2, FileQuestion, Camera, File as FileIcon, MapPin, Image as ImageIcon, FileText, AlertTriangle } from "lucide-react";

interface MetadataDisplayProps {
  file: ProcessedFile | null;
}

const renderValue = (value: any): string => {
  if (value === null || value === undefined) return "N/A";
  if (value instanceof Array && value.every(v => typeof v === 'number')) {
      return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    try {
      if (Object.keys(value).length === 1 && '_name' in value) {
        return `[Object: ${value._name}]`;
      }
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return "[Circular Object]";
    }
  }
  return String(value);
};


const groupMetadata = (data: Record<string, any> = {}) => {
  const groups: Record<string, Record<string, any>> = {
    file: {},
    image: {},
    camera: {},
    gps: {},
  };

  const keywords = {
    file: ['fileName', 'fileSize', 'fileType', 'lastModified', 'MIMEType', 'MajorBrand', 'PDFFormatVersion', 'IsLinearized', 'Title', 'Subject', 'Keywords'],
    image: ['ImageWidth', 'ImageHeight', 'PixelXDimension', 'PixelYDimension', 'XResolution', 'YResolution', 'ResolutionUnit', 'Orientation', 'ColorSpace'],
    camera: ['Make', 'Model', 'Software', 'ExposureTime', 'FNumber', 'ISOSpeedRatings', 'ExposureBiasValue', 'FocalLength', 'Flash', 'MeteringMode', 'WhiteBalance', 'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'Author', 'Creator', 'Producer'],
    gps: ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSTimeStamp', 'GPSDateStamp', 'GPSLatitudeRef', 'GPSLongitudeRef', 'GPSAltitudeRef'],
  };

  const otherData: Record<string, any> = {};

  for (const key in data) {
    if (key === 'info' || data[key] === null || data[key] === undefined) continue;

    let assigned = false;
    for (const [groupName, groupKeywords] of Object.entries(keywords)) {
        if (groupKeywords.some(k => key.toLowerCase() === k.toLowerCase())) {
            groups[groupName][key] = data[key];
            assigned = true;
            break;
        }
    }
    if (!assigned) {
        otherData[key] = data[key];
    }
  }

  if (data.info && typeof data.info === 'string') {
    otherData['Info'] = data.info;
  }
  
  if (Object.keys(otherData).length > 0) {
      groups.other = otherData;
  }
  
  for (const groupName in groups) {
    if (Object.keys(groups[groupName]).length === 0) {
      delete groups[groupName];
    }
  }

  return groups;
}

const getGpsCoords = (gpsData: Record<string, any>): { lat: number, lon: number } | null => {
    const { GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef } = gpsData;
    if (!GPSLatitude || !GPSLongitude) return null;

    let lat = Array.isArray(GPSLatitude) ? GPSLatitude[0] + GPSLatitude[1] / 60 + GPSLatitude[2] / 3600 : parseFloat(GPSLatitude);
    let lon = Array.isArray(GPSLongitude) ? GPSLongitude[0] + GPSLongitude[1] / 60 + GPSLongitude[2] / 3600 : parseFloat(GPSLongitude);
    
    if (isNaN(lat) || isNaN(lon)) return null;

    if (GPSLatitudeRef === 'S') lat = -lat;
    if (GPSLongitudeRef === 'W') lon = -lon;
    
    return { lat, lon };
}


const GpsMap = ({ coords }: { coords: { lat: number, lon: number } }) => {
    const { lat, lon } = coords;
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
    
    return (
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapUrl}
                title="GPS Location Map"
                aria-label="GPS Location Map"
                style={{filter: 'invert(90%) hue-rotate(180deg)'}}
            ></iframe>
        </div>
    );
};

const MetadataAccordion = ({ data }: { data: Record<string, any> | undefined }) => {
  if (!data || Object.keys(data).length === 0) {
      return <p className="text-muted-foreground text-center py-8">No metadata available.</p>;
  }

  const groupedData = groupMetadata(data);
  const gpsData = groupedData.gps || {};
  const gpsCoords = getGpsCoords(gpsData);
  const hasGpsData = Object.keys(gpsData).length > 0;
  
  const groupIcons: Record<string, React.ReactNode> = {
      file: <FileIcon className="mr-3 h-5 w-5 text-primary" />,
      image: <ImageIcon className="mr-3 h-5 w-5 text-primary" />,
      camera: <Camera className="mr-3 h-5 w-5 text-primary" />,
      gps: <MapPin className="mr-3 h-5 w-5 text-primary" />,
      other: <FileText className="mr-3 h-5 w-5 text-primary" />
  }
  
  const defaultOpen = Object.keys(groupedData).filter(g => g !== 'other');
  if (hasGpsData) defaultOpen.push('gps');

  return (
    <>
      <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
        {Object.entries(groupedData).map(([groupName, groupData]) => (
          <AccordionItem value={groupName} key={groupName}>
            <AccordionTrigger className="text-lg font-headline capitalize hover:no-underline">
              <div className="flex items-center">
                  {groupIcons[groupName] || <FileText className="mr-3 h-5 w-5 text-primary"/>} {groupName}
              </div>
            </AccordionTrigger>
            <AccordionContent>
                {groupName === 'gps' && gpsCoords && (
                    <div className="mb-4">
                        <GpsMap coords={gpsCoords} />
                    </div>
                )}
                {Object.keys(groupData).length > 0 ? (
                    <div className="relative overflow-hidden rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[35%] font-headline">Key</TableHead>
                            <TableHead className="font-headline">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(groupData).map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell className="font-mono text-xs font-medium text-muted-foreground break-words">{key}</TableCell>
                                <TableCell className="font-mono text-xs whitespace-pre-wrap break-all">{renderValue(value)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                ) : (
                    groupName === 'gps' && <p className="text-sm text-muted-foreground text-center py-4">No GPS data found in this file.</p>
                )}
            </AccordionContent>
          </AccordionItem>
        ))}
         { !groupedData.gps && (
            <AccordionItem value="gps">
                <AccordionTrigger className="text-lg font-headline capitalize hover:no-underline">
                    <div className="flex items-center">
                        <MapPin className="mr-3 h-5 w-5 text-primary" /> GPS
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <p className="text-sm text-muted-foreground text-center py-4">No GPS data found in this file.</p>
                </AccordionContent>
            </AccordionItem>
         )}
      </Accordion>
    </>
  );
};


export function MetadataDisplay({ file }: MetadataDisplayProps) {
  return (
    <Card className="h-full flex flex-col min-h-[500px] bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline tracking-tight">Metadata Viewer</CardTitle>
        <CardDescription className="truncate h-5">
          {file ? `Showing metadata for: ${file.file.name}` : "Select a processed file to view its metadata."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {file ? (
          <>
            {file.status === 'done' && (
              <Tabs defaultValue="redacted" className="w-full animate-fade-in-up">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="redacted"><ShieldCheck className="mr-2 h-4 w-4"/>Redacted</TabsTrigger>
                  <TabsTrigger value="original"><Eye className="mr-2 h-4 w-4"/>Original</TabsTrigger>
                </TabsList>
                <TabsContent value="redacted" className="mt-4">
                  <MetadataAccordion data={file.redactedMetadata} />
                </TabsContent>
                <TabsContent value="original" className="mt-4">
                  <MetadataAccordion data={file.metadata} />
                </TabsContent>
              </Tabs>
            )}
             {file.status === 'error' && (
                <div className="flex flex-col items-center justify-center h-full text-center text-destructive-foreground bg-destructive/20 border border-destructive rounded-lg p-4 animate-fade-in-up">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold">Processing Failed</h3>
                    <p className="text-sm max-w-md break-words">{file.error}</p>
                </div>
            )}
            {(file.status === 'processing' || file.status === 'queued') && (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
                <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                <p className="font-semibold text-lg">{file.status === 'processing' ? 'Analyzing file...' : 'Queued for processing'}</p>
                <p className="text-sm text-muted-foreground">Please wait a moment.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg border-muted-foreground/30">
            <FileQuestion className="w-16 h-16 mb-4 text-primary/50" />
            <p className="font-semibold text-lg">No file selected</p>
            <p className="text-sm text-muted-foreground">Select a file from the queue to see its metadata.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
