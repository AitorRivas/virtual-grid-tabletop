import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Check, X, Upload, Trash2, ArrowLeft, Shield, Users, Image } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  approved: boolean;
  created_at: string;
}

interface SharedImage {
  id: string;
  name: string;
  category: string;
  image_data: string;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<Profile[]>([]);
  const [sharedImages, setSharedImages] = useState<SharedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageName, setImageName] = useState('');
  const [imageCategory, setImageCategory] = useState<string>('hero');
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pending users
    const { data: pending } = await supabase
      .from('profiles')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });
    
    setPendingUsers((pending as Profile[]) || []);

    // Fetch approved users
    const { data: approved } = await supabase
      .from('profiles')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    setApprovedUsers((approved as Profile[]) || []);

    // Fetch shared images
    const { data: images } = await supabase
      .from('shared_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    setSharedImages((images as SharedImage[]) || []);
    
    setLoading(false);
  };

  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('user_id', userId);
    
    if (error) {
      toast.error('Error al aprobar usuario');
    } else {
      toast.success('Usuario aprobado');
      fetchData();
    }
  };

  const handleReject = async (userId: string) => {
    // Delete the user completely
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      // If admin delete fails, just remove from profiles
      await supabase.from('profiles').delete().eq('user_id', userId);
    }
    
    toast.success('Usuario rechazado');
    fetchData();
  };

  const handleRevokeApproval = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: false })
      .eq('user_id', userId);
    
    if (error) {
      toast.error('Error al revocar aprobación');
    } else {
      toast.success('Aprobación revocada');
      fetchData();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!imageName || !imageData || !imageCategory) {
      toast.error('Completa todos los campos');
      return;
    }

    setUploading(true);
    const { error } = await supabase.from('shared_images').insert({
      name: imageName,
      category: imageCategory,
      image_data: imageData
    });
    setUploading(false);

    if (error) {
      toast.error('Error al subir imagen');
    } else {
      toast.success('Imagen subida correctamente');
      setImageName('');
      setImageData(null);
      setImageCategory('hero');
      fetchData();
    }
  };

  const handleDeleteImage = async (id: string) => {
    const { error } = await supabase.from('shared_images').delete().eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar imagen');
    } else {
      toast.success('Imagen eliminada');
      fetchData();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-board-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-board-bg p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al mapa
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Panel de Administración
          </h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Biblioteca de Imágenes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Pending Users */}
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Pendientes ({pendingUsers.length})</CardTitle>
                <CardDescription>Usuarios esperando aprobación</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay usuarios pendientes</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Fecha de registro</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username || 'Sin nombre'}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" onClick={() => handleApprove(user.user_id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(user.user_id)}>
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Approved Users */}
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Aprobados ({approvedUsers.length})</CardTitle>
                <CardDescription>Usuarios con acceso a la aplicación</CardDescription>
              </CardHeader>
              <CardContent>
                {approvedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay usuarios aprobados</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Fecha de registro</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username || 'Sin nombre'}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => handleRevokeApproval(user.user_id)}>
                              Revocar acceso
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            {/* Upload new image */}
            <Card>
              <CardHeader>
                <CardTitle>Subir Nueva Imagen</CardTitle>
                <CardDescription>Las imágenes estarán disponibles para todos los usuarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={imageName}
                      onChange={(e) => setImageName(e.target.value)}
                      placeholder="Nombre de la imagen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={imageCategory} onValueChange={setImageCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Héroes</SelectItem>
                        <SelectItem value="monster">Monstruos</SelectItem>
                        <SelectItem value="item">Items/Objetos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Imagen</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
                
                {imageData && (
                  <div className="flex items-center gap-4">
                    <img src={imageData} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    <Button onClick={handleUploadImage} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Subir imagen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image categories */}
            {['hero', 'monster', 'item'].map((category) => {
              const categoryImages = sharedImages.filter(img => img.category === category);
              const categoryName = category === 'hero' ? 'Héroes' : category === 'monster' ? 'Monstruos' : 'Items/Objetos';
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{categoryName} ({categoryImages.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryImages.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No hay imágenes en esta categoría</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categoryImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.image_data}
                              alt={image.name}
                              className="w-full aspect-square object-cover rounded border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-center mt-1 truncate">{image.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
