import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/utils";
import { uploadFile } from "@/lib/supabaseStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  onImageUpload: (url: string) => void;
  folder: string;
  currentImageUrl?: string;
  className?: string;
  shape?: "circle" | "square";
  label?: string;
}

export function ImagePicker({ 
  onImageUpload, 
  folder, 
  currentImageUrl, 
  className,
  shape = "square",
  label = "Foto"
}: ImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // 1. Comprimir
      const compressedBlob = await compressImage(file, 800, 0.7);
      
      // 2. Upload
      const fileName = `${crypto.randomUUID()}.jpg`;
      const publicUrl = await uploadFile(compressedBlob, folder, fileName);
      
      onImageUpload(publicUrl);
      toast.success("Foto carregada com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao carregar foto: " + error.message);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs font-semibold text-muted-foreground block">{label}</label>}
      
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "relative bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group",
          shape === "circle" ? "w-24 h-24 rounded-full" : "w-full aspect-video rounded-2xl max-w-[300px]"
        )}>
          {currentImageUrl ? (
            <>
              <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-[10px] text-white font-bold uppercase">Alterar</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">Sem imagem</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full max-w-[300px]">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <Camera className="h-4 w-4" /> Câmera
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/15 text-gold text-xs font-bold hover:bg-gold/25 transition-colors disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4" /> Galeria
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
