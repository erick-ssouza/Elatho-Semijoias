import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, GripVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface MultiImageUploadProps {
  mainImage: string;
  additionalImages: string[];
  onMainImageChange: (url: string) => void;
  onAdditionalImagesChange: (urls: string[]) => void;
  bucket?: string;
}

export default function MultiImageUpload({
  mainImage,
  additionalImages,
  onMainImageChange,
  onAdditionalImagesChange,
  bucket = "produtos",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Combine all images for display
  const allImages = [mainImage, ...additionalImages].filter(Boolean);
  const canAddMore = allImages.length < MAX_IMAGES;

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use JPG, PNG ou WebP",
        variant: "destructive",
      });
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "Máximo 5MB por imagem",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast({
        title: "Erro no upload",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - allImages.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast({
        title: "Limite de imagens",
        description: `Você pode adicionar apenas mais ${remainingSlots} imagem(ns)`,
        variant: "destructive",
      });
    }

    const validFiles = filesToUpload.filter(validateFile);
    if (validFiles.length === 0) return;

    setUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of validFiles) {
      const url = await uploadFile(file);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      if (!mainImage && uploadedUrls.length > 0) {
        // First image becomes main
        onMainImageChange(uploadedUrls[0]);
        if (uploadedUrls.length > 1) {
          onAdditionalImagesChange([...additionalImages, ...uploadedUrls.slice(1)]);
        }
      } else {
        onAdditionalImagesChange([...additionalImages, ...uploadedUrls]);
      }
      toast({ title: `${uploadedUrls.length} imagem(ns) adicionada(s)` });
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = allImages[index];
    
    // Extract filename from URL to delete from storage
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      
      await supabase.storage.from(bucket).remove([fileName]);
    } catch (e) {
      // Continue even if storage delete fails
      console.log("Could not delete from storage:", e);
    }

    if (index === 0) {
      // Removing main image
      if (additionalImages.length > 0) {
        // Promote first additional to main
        onMainImageChange(additionalImages[0]);
        onAdditionalImagesChange(additionalImages.slice(1));
      } else {
        onMainImageChange("");
      }
    } else {
      // Removing additional image
      const newAdditional = [...additionalImages];
      newAdditional.splice(index - 1, 1);
      onAdditionalImagesChange(newAdditional);
    }

    toast({ title: "Imagem removida" });
  };

  const setAsMain = (index: number) => {
    if (index === 0) return; // Already main
    
    const newMainUrl = additionalImages[index - 1];
    const newAdditional = [...additionalImages];
    newAdditional.splice(index - 1, 1);
    
    // Move current main to additional (at the beginning)
    if (mainImage) {
      newAdditional.unshift(mainImage);
    }
    
    // Update both in sequence - the parent should use functional updates
    // to ensure both changes are applied correctly
    onMainImageChange(newMainUrl);
    onAdditionalImagesChange(newAdditional);
    toast({ title: "Imagem principal atualizada" });
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder images
    const newAllImages = [...allImages];
    const [draggedImage] = newAllImages.splice(draggedIndex, 1);
    newAllImages.splice(dropIndex, 0, draggedImage);

    // Update main and additional
    onMainImageChange(newAllImages[0] || "");
    onAdditionalImagesChange(newAllImages.slice(1));

    setDraggedIndex(null);
    setDragOverIndex(null);
    toast({ title: "Ordem atualizada" });
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {allImages.map((img, index) => (
            <div
              key={img}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative aspect-square border-2 rounded-lg overflow-hidden group cursor-move transition-all ${
                dragOverIndex === index
                  ? "border-primary scale-105"
                  : index === 0
                  ? "border-primary"
                  : "border-border"
              } ${draggedIndex === index ? "opacity-50" : ""}`}
            >
              <img
                src={img}
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Main badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Principal
                </div>
              )}
              
              {/* Drag handle */}
              <div className="absolute top-1 right-1 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsMain(index)}
                    className="p-2 bg-background rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Definir como principal"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-background rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Clique ou arraste para adicionar
              </p>
              <p className="text-xs text-muted-foreground">
                {allImages.length}/{MAX_IMAGES} imagens · JPG, PNG ou WebP · Máx 5MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        Arraste para reordenar. A primeira imagem será a principal.
      </p>
    </div>
  );
}
