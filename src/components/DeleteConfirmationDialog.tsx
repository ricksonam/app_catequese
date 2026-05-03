import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}


export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Tem certeza que deseja excluir?",
  description = "Esta ação não poderá ser desfeita. Todos os dados relacionados a este registro serão removidos permanentemente.",
  itemName,
  isLoading = false,
  children
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-[400px]">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 text-destructive flex items-center justify-center animate-in zoom-in-50 duration-500">
            <AlertTriangle className="h-10 w-10" />
          </div>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-foreground leading-tight">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed pt-2 text-center">
              {itemName ? (
                <>
                  Você está prestes a excluir <span className="font-bold text-foreground">"{itemName}"</span>. {description}
                </>
              ) : (
                description
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {children && (
            <div className="w-full text-left pt-2">
              {children}
            </div>
          )}

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 w-full pt-4">

            <AlertDialogCancel asChild>
              <Button variant="outline" className="h-14 rounded-2xl border-2 flex-1 font-bold text-muted-foreground hover:bg-slate-50 transition-all">
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-destructive hover:bg-red-700 text-white font-black text-lg flex-1 shadow-xl shadow-destructive/20 transition-all active:scale-95"
              >
                {isLoading ? "Excluindo..." : "Sim, Excluir"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
