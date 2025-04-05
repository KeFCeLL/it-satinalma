'use client';

import { Dialog, DialogContent, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { TalepDetay } from '@/components/talep-detay';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TalepDetayDialogProps {
  talepId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TalepDetayDialog({ talepId, open, onOpenChange }: TalepDetayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-2xl font-semibold">
              Talep Detayı
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {open && <TalepDetay talepId={talepId} isInModal={true} />}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
} 