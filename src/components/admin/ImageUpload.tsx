import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const ImageUpload = ({ value, onChange, bucket = "produtos" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Formato inválido. Use JPG, PNG ou WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande. Máximo 2MB.";
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      setProgress(30);

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      setProgress(70);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      setProgress(100);
      onChange(urlData.publicUrl);
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar a imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = async () => {
    if (value) {
      try {
        // Extract filename from URL
        const url = new URL(value);
        const pathParts = url.pathname.split("/");
        const fileName = pathParts[pathParts.length - 1];

        await supabase.storage.from(bucket).remove([fileName]);
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    onChange("");
  };

  if (value) {
    return (
      <div className="relative">
        <div className="relative rounded-lg overflow-hidden border-2 border-[#D4AF37]/30 bg-[#FAF7F2]">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Clique no X para remover e enviar outra imagem
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${dragOver 
            ? "border-[#D4AF37] bg-[#D4AF37]/10" 
            : "border-[#D4AF37]/50 hover:border-[#D4AF37] bg-[#FAF7F2]"
          }
          ${uploading ? "pointer-events-none opacity-70" : "cursor-pointer"}
        `}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mb-3" />
              <p className="text-sm font-medium text-foreground">Enviando imagem...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Arraste uma imagem ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WebP • Máximo 2MB
              </p>
            </>
          )}
        </div>
      </div>

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{progress}%</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          className="w-full border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".jpg,.jpeg,.png,.webp";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) uploadFile(file);
            };
            input.click();
          }}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Selecionar arquivo
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;
