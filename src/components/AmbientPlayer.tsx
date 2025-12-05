import { useState, useRef, useEffect } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Upload, X, Repeat, GripHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import { useDraggable } from '@/hooks/useDraggable';

interface Track {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_POSITION = { x: window.innerWidth - 72, y: window.innerHeight - 136 };

export const AmbientPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { position, isDragging, dragRef, handleMouseDown, resetPosition } = useDraggable({
    defaultPosition: DEFAULT_POSITION,
  });

  // Reset position when minimized
  useEffect(() => {
    if (!isExpanded) {
      resetPosition();
    }
  }, [isExpanded, resetPosition]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, sube un archivo de audio válido');
      return;
    }

    const url = URL.createObjectURL(file);
    const newTrack: Track = {
      id: Date.now().toString(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      url,
    };

    setTracks([...tracks, newTrack]);
    toast.success('Audio añadido');
  };

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      // Pause current track
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Play new track
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play();
      }
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeTrack = (trackId: string) => {
    if (currentTrack?.id === trackId) {
      stopPlayback();
    }
    const track = tracks.find(t => t.id === trackId);
    if (track?.url) {
      URL.revokeObjectURL(track.url);
    }
    setTracks(tracks.filter(t => t.id !== trackId));
  };

  return (
    <>
      <audio 
        ref={audioRef} 
        onEnded={() => !isLooping && setIsPlaying(false)}
        onError={() => toast.error('Error al reproducir el audio')}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div 
        ref={dragRef}
        className="fixed z-50"
        style={{ 
          left: isExpanded ? position.x : 'auto',
          top: isExpanded ? position.y : 'auto',
          right: isExpanded ? 'auto' : '16px',
          bottom: isExpanded ? 'auto' : '80px',
        }}
      >
        {/* Collapsed button */}
        {!isExpanded && (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="secondary"
            size="icon"
            className={`w-12 h-12 rounded-full shadow-lg ${isPlaying ? 'animate-pulse bg-primary' : ''}`}
          >
            <Music className="w-5 h-5" />
          </Button>
        )}

        {/* Expanded player */}
        {isExpanded && (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl w-72">
            {/* Draggable header */}
            <div 
              className={`flex items-center justify-between p-3 border-b border-border select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-muted-foreground" />
                <Music className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Ambiente</h3>
              </div>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4">
              {/* Current track info */}
              {currentTrack && (
                <div className="mb-4 p-2 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-foreground truncate mb-2">{currentTrack.name}</p>
                  
                  {/* Progress bar */}
                  <div className="mb-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleSeek}
                      max={duration || 100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={togglePlayPause}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={stopPlayback}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setIsLooping(!isLooping)}
                      variant={isLooping ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Repeat className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Volume control */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={(v) => setVolume(v[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">{volume}%</span>
              </div>

              {/* Upload button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="w-full mb-4 gap-2"
              >
                <Upload className="w-4 h-4" />
                Añadir audio
              </Button>

              {/* Track list */}
              {tracks.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-2">Mis pistas:</p>
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        currentTrack?.id === track.id 
                          ? 'bg-primary/20 border border-primary/50' 
                          : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <Button
                        onClick={() => playTrack(track)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        {currentTrack?.id === track.id && isPlaying 
                          ? <Pause className="w-3 h-3" /> 
                          : <Play className="w-3 h-3" />
                        }
                      </Button>
                      <span className="flex-1 text-sm truncate">{track.name}</span>
                      <Button
                        onClick={() => removeTrack(track.id)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {tracks.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Sube archivos de audio para ambientar tus partidas
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
