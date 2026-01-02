import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSharedImages, SharedImage } from '@/hooks/useSharedImages';
import { Image, Loader2 } from 'lucide-react';

interface SharedImagePickerProps {
  category: 'hero' | 'monster' | 'item';
  onSelect: (imageData: string) => void;
  selectedImage?: string;
}

export const SharedImagePicker = ({ category, onSelect, selectedImage }: SharedImagePickerProps) => {
  const { getImagesByCategory, loading } = useSharedImages();
  const [open, setOpen] = useState(false);
  
  const images = getImagesByCategory(category);
  const categoryLabel = category === 'hero' ? 'Héroes' : category === 'monster' ? 'Monstruos' : 'Items';

  const handleSelect = (image: SharedImage) => {
    onSelect(image.image_data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Image className="w-4 h-4" />
          Elegir de biblioteca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Biblioteca de {categoryLabel}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay imágenes en esta categoría. El administrador puede añadir imágenes desde el panel de administración.
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-4 gap-2 p-2">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleSelect(image)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
                    selectedImage === image.image_data ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                  }`}
                >
                  <img
                    src={image.image_data}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                    <p className="text-xs text-white truncate">{image.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
