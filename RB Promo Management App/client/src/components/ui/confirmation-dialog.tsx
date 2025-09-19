import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  inputLabel?: string;
  inputValue?: string;
  inputPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value?: string) => void;
  onCancel?: () => void;
  type?: "confirm" | "input" | "destructive";
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  inputLabel,
  inputValue = "",
  inputPlaceholder,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "confirm"
}: ConfirmationDialogProps) {
  const [value, setValue] = useState(inputValue);

  // Sync internal value when dialog opens or inputValue prop changes
  useEffect(() => {
    if (open && inputValue) {
      setValue(inputValue);
    }
  }, [open, inputValue]);

  const handleConfirm = () => {
    onConfirm(type === "input" ? value : undefined);
    onOpenChange(false);
    setValue("");
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
    setValue("");
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setValue("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="confirmation-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground" data-testid="dialog-title">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {message && (
            <p className="text-sm text-muted-foreground" data-testid="dialog-message">
              {message}
            </p>
          )}
          
          {type === "input" && (
            <div className="space-y-2">
              {inputLabel && (
                <Label htmlFor="dialog-input" className="text-sm font-medium">
                  {inputLabel}
                </Label>
              )}
              <Input
                id="dialog-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full"
                data-testid="dialog-input"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="dialog-cancel"
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            data-testid="dialog-confirm"
            className={`px-6 ${type === "destructive" 
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
              : "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}