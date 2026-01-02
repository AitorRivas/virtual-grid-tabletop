import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SharedImage {
  id: string;
  name: string;
  category: string;
  image_data: string;
  created_at: string;
}

export const useSharedImages = () => {
  const [images, setImages] = useState<SharedImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shared_images')
      .select('*')
      .order('name', { ascending: true });
    
    setImages((data as SharedImage[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const getImagesByCategory = (category: 'hero' | 'monster' | 'item') => {
    return images.filter(img => img.category === category);
  };

  return {
    images,
    loading,
    getImagesByCategory,
    refreshImages: fetchImages
  };
};
