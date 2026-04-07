import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Dialog({ 
  open, 
  setOpen, 
  children, 
  content, 
  title, 
  description,
  className 
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Trigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogPrimitive.Trigger>
      
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/20 data-[state=open]:animate-none data-[state=closed]:animate-none" 
          onClick={() => setOpen(false)}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-8 shadow-none duration-0 sm:rounded-none",
            className
          )}
        >
          <div className="flex flex-col space-y-1">
            {title && (
              <DialogPrimitive.Title className="text-xl font-bold leading-tight text-slate-900">
                {title}
              </DialogPrimitive.Title>
            )}
            {description && (
              <DialogPrimitive.Description className="text-sm text-slate-500">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          
          <div className="mt-4">
            {content}
          </div>

          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 opacity-50 hover:opacity-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
