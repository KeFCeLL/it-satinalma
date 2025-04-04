'use client';

import { Dialog, DialogContent, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { TalepDetay } from '@/components/talep-detay';

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
          <DialogTitle className="text-2xl font-semibold mb-6">
            Talep Detayı
          </DialogTitle>
          <TalepDetay talepId={talepId} isInModal={true} />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
} 