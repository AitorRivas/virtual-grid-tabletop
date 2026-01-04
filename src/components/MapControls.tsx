import { useNavigate } from 'react-router-dom';
import { Upload, Grid3x3, ZoomIn, Film, Trash2, Cloud, Eraser, RotateCcw, Shield, LogOut, Key, Settings, Menu, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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
    <div className="bg-toolbar-bg/95 backdrop-blur-sm border-b border-border/50 px-4 py-2.5">
      <div className="flex items-center gap-2 max-w-full mx-auto">
        {/* User Menu - Compact dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {profile?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{profile?.username}</span>
              {isAdmin && <span className="text-[10px] bg-primary/20 text-primary px-1 py-0.5 rounded hidden sm:inline">Admin</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {profile?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium">{profile?.username}</p>
                {isAdmin && <p className="text-xs text-primary">Administrador</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2">
                <Shield className="w-4 h-4" />
                Panel Admin
              </DropdownMenuItem>
            )}
            <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                  <Key className="w-4 h-4" />
                  Cambiar contraseña
                </DropdownMenuItem>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-border/50" />

        {/* Map Actions */}
        <Button
          onClick={onUploadClick}
          variant={hasMap ? "ghost" : "default"}
          size="sm"
          className="gap-2 h-8"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{hasMap ? 'Cambiar mapa' : 'Cargar mapa'}</span>
        </Button>

        {hasMap && (
          <>
            <div className="h-5 w-px bg-border/50" />
            
            {/* Grid Controls */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={showGrid ? "default" : "ghost"}
                  size="sm"
                  className="gap-2 h-8"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden md:inline">Cuadrícula</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Mostrar cuadrícula</Label>
                    <Button
                      variant={showGrid ? "default" : "secondary"}
                      size="sm"
                      onClick={onToggleGrid}
                      className="h-7 px-2"
                    >
                      {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {showGrid && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <Label>Tamaño</Label>
                          <span className="text-muted-foreground">{gridSize}px</span>
                        </div>
                        <Slider
                          value={[gridSize]}
                          onValueChange={(values) => onGridSizeChange(values[0])}
                          min={20}
                          max={400}
                          step={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <Label>Grosor</Label>
                          <span className="text-muted-foreground">{gridLineWidth}px</span>
                        </div>
                        <Slider
                          value={[gridLineWidth]}
                          onValueChange={(values) => onGridLineWidthChange(values[0])}
                          min={1}
                          max={5}
                          step={0.5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gridColor}
                            onChange={(e) => onGridColorChange(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border border-border"
                          />
                          <Input
                            value={gridColor}
                            onChange={(e) => onGridColorChange(e.target.value)}
                            className="h-8 flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Fog of War Controls */}
            {onToggleFog && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={fogEnabled ? "default" : "ghost"}
                    size="sm"
                    className="gap-2 h-8"
                  >
                    <Cloud className="w-4 h-4" />
                    <span className="hidden md:inline">Niebla</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Niebla de guerra</Label>
                      <Button
                        variant={fogEnabled ? "default" : "secondary"}
                        size="sm"
                        onClick={onToggleFog}
                        className="h-7 px-2"
                      >
                        {fogEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {fogEnabled && (
                      <>
                        <Button
                          onClick={onToggleFogEditMode}
                          variant={fogEditMode ? "default" : "secondary"}
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Eraser className="w-4 h-4" />
                          {fogEditMode ? 'Dejar de borrar' : 'Borrar niebla'}
                        </Button>

                        {fogEditMode && fogBrushSize !== undefined && onFogBrushSizeChange && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <Label>Tamaño pincel</Label>
                              <span className="text-muted-foreground">{fogBrushSize}px</span>
                            </div>
                            <Slider
                              value={[fogBrushSize]}
                              onValueChange={(values) => onFogBrushSizeChange(values[0])}
                              min={20}
                              max={200}
                              step={10}
                            />
                          </div>
                        )}

                        {onResetFog && (
                          <Button
                            onClick={onResetFog}
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reiniciar niebla
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <div className="h-5 w-px bg-border/50" />

            {/* Zoom Control - Always visible */}
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[zoomLevel]}
                onValueChange={(values) => onZoomChange(values[0])}
                min={0.1}
                max={10}
                step={0.1}
                className="w-24 sm:w-32"
              />
              <span className="text-xs text-muted-foreground w-10">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex-1" />

            {onToggleCinemaMode && (
              <Button
                onClick={onToggleCinemaMode}
                variant={cinemaMode ? "default" : "ghost"}
                size="sm"
                className="gap-2 h-8"
              >
                <Film className="w-4 h-4" />
                <span className="hidden lg:inline">Modo Cine</span>
              </Button>
            )}
            
            {onClearSession && (
              <Button
                onClick={onClearSession}
                variant="ghost"
                size="sm"
                className="gap-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden lg:inline">Nueva sesión</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
