import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PremiumPaywall } from "./PremiumPaywall";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function PremiumModal({ isOpen, onClose, title, description, icon }: PremiumModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none overflow-hidden [&>button]:hidden">
        <div className="bg-background rounded-3xl relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <PremiumPaywall 
            title={title}
            description={description}
            icon={icon}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
