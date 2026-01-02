import { useNavigate } from 'react-router-dom';
import { Upload, Grid3x3, Minus, Plus, ZoomIn, Film, Trash2, Cloud, Eraser, RotateCcw, Shield, LogOut, Key } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MapControlsProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  gridColor: string;
  onGridColorChange: (color: string) => void;
  gridLineWidth: number;
  onGridLineWidthChange: (width: number) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onUploadClick: () => void;
  hasMap: boolean;
  cinemaMode?: boolean;
  onToggleCinemaMode?: () => void;
  onClearSession?: () => void;
  // Fog of war props
  fogEnabled?: boolean;
  onToggleFog?: () => void;
  fogEditMode?: boolean;
  onToggleFogEditMode?: () => void;
  fogBrushSize?: number;
  onFogBrushSizeChange?: (size: number) => void;
  onResetFog?: () => void;
}

export const MapControls = ({
  showGrid,
  onToggleGrid,
  gridSize,
  onGridSizeChange,
  gridColor,
  onGridColorChange,
  gridLineWidth,
  onGridLineWidthChange,
  zoomLevel,
  onZoomChange,
  onUploadClick,
  hasMap,
  cinemaMode,
  onToggleCinemaMode,
  onClearSession,
  fogEnabled,
  onToggleFog,
  fogEditMode,
  onToggleFogEditMode,
  fogBrushSize,
  onFogBrushSizeChange,
  onResetFog,
}: MapControlsProps) => {
  const navigate = useNavigate();
  const { isAdmin, signOut, updatePassword, profile } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor, completa todos los campos');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Contraseña actualizada correctamente');
      setChangePasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="bg-toolbar-bg border-b border-border p-4">
      <div className="flex items-center gap-4 max-w-7xl mx-auto flex-wrap">
        {/* User info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{profile?.username}</span>
          {isAdmin && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Admin</span>}
        </div>

        {isAdmin && (
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Panel Admin
          </Button>
        )}

        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Key className="w-4 h-4" />
              Contraseña
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar contraseña</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleChangePassword} className="w-full" disabled={loading}>
                {loading ? 'Cambiando...' : 'Cambiar contraseña'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </Button>

        <div className="h-6 w-px bg-border" />
        <Button
          onClick={() => {
            console.log('Upload button clicked');
            onUploadClick();
          }}
          variant={hasMap ? "secondary" : "default"}
          size="sm"
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {hasMap ? 'Cambiar mapa' : 'Cargar mapa'}
        </Button>

        {hasMap && (
          <>
            <div className="h-6 w-px bg-border" />
            
            <Button
              onClick={onToggleGrid}
              variant={showGrid ? "default" : "secondary"}
              size="sm"
              className="gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Cuadrícula
            </Button>

            {showGrid && (
              <>
                <div className="flex items-center gap-3 ml-2">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[gridSize]}
                    onValueChange={(values) => onGridSizeChange(values[0])}
                    min={20}
                    max={400}
                    step={5}
                    className="w-32"
                  />
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground min-w-[3rem]">
                    {gridSize}px
                  </span>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <Label htmlFor="grid-color" className="text-sm text-muted-foreground">
                    Color:
                  </Label>
                  <input
                    id="grid-color"
                    type="color"
                    value={gridColor}
                    onChange={(e) => onGridColorChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <Label htmlFor="grid-width" className="text-sm text-muted-foreground">
                    Grosor:
                  </Label>
                  <Slider
                    id="grid-width"
                    value={[gridLineWidth]}
                    onValueChange={(values) => onGridLineWidthChange(values[0])}
                    min={1}
                    max={5}
                    step={0.5}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground min-w-[2rem]">
                    {gridLineWidth}px
                  </span>
                </div>
              </>
            )}

            <div className="h-6 w-px bg-border" />

            {/* Fog of War Controls */}
            {onToggleFog && (
              <Button
                onClick={onToggleFog}
                variant={fogEnabled ? "default" : "secondary"}
                size="sm"
                className="gap-2"
              >
                <Cloud className="w-4 h-4" />
                Niebla
              </Button>
            )}

            {fogEnabled && onToggleFogEditMode && (
              <>
                <Button
                  onClick={onToggleFogEditMode}
                  variant={fogEditMode ? "default" : "secondary"}
                  size="sm"
                  className="gap-2"
                >
                  <Eraser className="w-4 h-4" />
                  {fogEditMode ? 'Dejar de borrar' : 'Borrar niebla'}
                </Button>

                {fogEditMode && fogBrushSize !== undefined && onFogBrushSizeChange && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Pincel:</Label>
                    <Slider
                      value={[fogBrushSize]}
                      onValueChange={(values) => onFogBrushSizeChange(values[0])}
                      min={20}
                      max={200}
                      step={10}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground min-w-[3rem]">
                      {fogBrushSize}px
                    </span>
                  </div>
                )}

                {onResetFog && (
                  <Button
                    onClick={onResetFog}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reiniciar
                  </Button>
                )}
              </>
            )}

            {hasMap && (
              <>
                <div className="h-6 w-px bg-border" />
                
                <div className="flex items-center gap-3">
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={(values) => onZoomChange(values[0])}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3rem]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                </div>

                {onToggleCinemaMode && (
                  <>
                    <div className="h-6 w-px bg-border" />
                    
                    <Button
                      onClick={onToggleCinemaMode}
                      variant={cinemaMode ? "default" : "secondary"}
                      size="sm"
                      className="gap-2"
                    >
                      <Film className="w-4 h-4" />
                      Modo Cine
                    </Button>
                  </>
                )}
                
                {onClearSession && (
                  <>
                    <div className="h-6 w-px bg-border" />
                    
                    <Button
                      onClick={onClearSession}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Nueva sesión
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
