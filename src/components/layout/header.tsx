import { Logo } from "@/components/icons/logo";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex flex-1 items-center gap-2">
        <Logo className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tighter text-foreground font-headline">
          DataSnatcher
        </h1>
      </div>
      <div className="flex items-center gap-2">
         <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/firebase/studio-examples/tree/main/data-snatcher" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
                <Github className="h-5 w-5" />
            </a>
         </Button>
      </div>
    </header>
  );
}
