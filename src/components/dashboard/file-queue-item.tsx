import { cn } from "@/lib/utils";
import type { ProcessedFile } from "@/lib/types";
import { FileImage, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FileQueueItemProps {
  file: ProcessedFile;
  isSelected: boolean;
  onSelect: () => void;
}

const getStatusInfo = (status: ProcessedFile['status']) => {
  switch (status) {
    case 'queued':
      return { icon: <AlertCircle className="text-accent-foreground" />, label: 'Queued', badgeVariant: 'secondary' as const, progressColor: '' };
    case 'processing':
      return { icon: <Loader2 className="animate-spin text-primary" />, label: 'Processing', badgeVariant: 'default' as const, progressColor: 'bg-primary' };
    case 'done':
      return { icon: <CheckCircle className="text-green-400" />, label: 'Done', badgeVariant: 'outline' as const, progressColor: 'bg-green-400' };
    case 'error':
      return { icon: <XCircle className="text-red-400" />, label: 'Error', badgeVariant: 'destructive' as const, progressColor: 'bg-red-400' };
  }
};

export function FileQueueItem({ file, isSelected, onSelect }: FileQueueItemProps) {
  const { icon, label, badgeVariant, progressColor } = getStatusInfo(file.status);
  const isClickable = file.status === 'done' || file.status === 'error';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={isClickable ? onSelect : undefined}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg border transition-all",
              isSelected ? "border-primary bg-primary/10 shadow-md" : "border-transparent hover:bg-muted/50",
              isClickable && "cursor-pointer"
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-muted">
              {file.file.type.startsWith('image/') ? <FileImage className="text-muted-foreground" /> : <FileText className="text-muted-foreground" />}
            </div>
            <div className="flex-grow min-w-0">
              <p className="truncate text-sm font-medium">{file.file.name}</p>
              {file.status === 'processing' ? 
                <Progress value={file.progress} className={cn("h-1 mt-1", progressColor)} />
                : <p className="text-xs text-muted-foreground capitalize">{label}</p>
            }
            </div>
            <div className="flex-shrink-0 w-8 flex items-center justify-end">
                <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
            </div>
          </div>
        </TooltipTrigger>
        {file.status === 'error' && file.error && (
            <TooltipContent className="max-w-xs break-words" side="top" align="end">
                <p>{file.error}</p>
            </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
