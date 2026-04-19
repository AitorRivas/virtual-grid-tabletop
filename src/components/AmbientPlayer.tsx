import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Upload, X, Repeat, GripHorizontal, Wind, Library, Save, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import { useDraggable } from '@/hooks/useDraggable';
import { useAudioLibrary, type LibraryAudio } from '@/hooks/useAudioLibrary';

interface Track {
  id: string;
  name: string;
  url: string;
  /** If set, the source is base64 from the persistent library (do not revoke). */
  libraryId?: string;
}

interface AudioChannel {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  currentTime: number;
  duration: number;
}

const PANEL_WIDTH = 320; // w-80 = 20rem = 320px
const PANEL_HEIGHT = 450; // approximate height

export const AmbientPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Channel 1: Music
  const [channel1, setChannel1] = useState<AudioChannel>({
    tracks: [],
    currentTrack: null,
    isPlaying: false,
    volume: 50,
    isMuted: false,
    isLooping: true,
    currentTime: 0,
    duration: 0,
  });
  
  // Channel 2: Ambient sounds
  const [channel2, setChannel2] = useState<AudioChannel>({
    tracks: [],
    currentTrack: null,
    isPlaying: false,
    volume: 50,
    isMuted: false,
    isLooping: true,
    currentTime: 0,
    duration: 0,
  });
  
  const [activeChannel, setActiveChannel] = useState<1 | 2>(1);
  const [showLibrary, setShowLibrary] = useState(false);
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);

  const { items: libraryItems, addToLibrary, removeFromLibrary } = useAudioLibrary();

  const audioRef1 = useRef<HTMLAudioElement | null>(null);
  const audioRef2 = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate safe position when expanding
  const getDefaultPosition = useCallback(() => {
    const x = Math.max(16, window.innerWidth - PANEL_WIDTH - 16);
    const y = Math.max(16, window.innerHeight - PANEL_HEIGHT - 100);
    return { x, y };
  }, []);
  
  const { position, isDragging, dragRef, handleMouseDown, resetPosition } = useDraggable({
    defaultPosition: getDefaultPosition(),
  });

  // Reset to safe position when minimized
  useEffect(() => {
    if (!isExpanded) {
      resetPosition();
    }
  }, [isExpanded, resetPosition]);

  // Channel 1 audio effects
  useEffect(() => {
    if (audioRef1.current) {
      audioRef1.current.volume = channel1.isMuted ? 0 : channel1.volume / 100;
    }
  }, [channel1.volume, channel1.isMuted]);

  useEffect(() => {
    if (audioRef1.current) {
      audioRef1.current.loop = channel1.isLooping;
    }
  }, [channel1.isLooping]);

  // Channel 2 audio effects
  useEffect(() => {
    if (audioRef2.current) {
      audioRef2.current.volume = channel2.isMuted ? 0 : channel2.volume / 100;
    }
  }, [channel2.volume, channel2.isMuted]);

  useEffect(() => {
    if (audioRef2.current) {
      audioRef2.current.loop = channel2.isLooping;
    }
  }, [channel2.isLooping]);

  // Listen for scene audio events
  useEffect(() => {
    const handleSceneAudio = (e: Event) => {
      const { channel, name, data } = (e as CustomEvent).detail as { channel: 1 | 2; name: string; data: string };
      const audioRef = channel === 1 ? audioRef1 : audioRef2;
      const setChannel = channel === 1 ? setChannel1 : setChannel2;

      const newTrack: Track = { id: `scene-${Date.now()}`, name: name || 'Escena', url: data };
      
      // Add track and play it
      setChannel(prev => {
        const filtered = prev.tracks.filter(t => t.name !== name);
        return { ...prev, tracks: [...filtered, newTrack], currentTrack: newTrack, isPlaying: true };
      });

      if (audioRef.current) {
        audioRef.current.src = data;
        audioRef.current.play();
      }
    };

    window.addEventListener('scene-play-audio', handleSceneAudio);
    return () => window.removeEventListener('scene-play-audio', handleSceneAudio);
  }, []);

  // Update current time for channel 1
  useEffect(() => {
    const audio = audioRef1.current;
    if (!audio) return;

    const handleTimeUpdate = () => setChannel1(prev => ({ ...prev, currentTime: audio.currentTime }));
    const handleDurationChange = () => setChannel1(prev => ({ ...prev, duration: audio.duration || 0 }));
    const handleLoadedMetadata = () => setChannel1(prev => ({ ...prev, duration: audio.duration || 0 }));

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Update current time for channel 2
  useEffect(() => {
    const audio = audioRef2.current;
    if (!audio) return;

    const handleTimeUpdate = () => setChannel2(prev => ({ ...prev, currentTime: audio.currentTime }));
    const handleDurationChange = () => setChannel2(prev => ({ ...prev, duration: audio.duration || 0 }));
    const handleLoadedMetadata = () => setChannel2(prev => ({ ...prev, duration: audio.duration || 0 }));

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
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const newTracks: Track[] = [];
    let invalid = 0;
    for (const file of files) {
      if (!file.type.startsWith('audio/')) {
        invalid += 1;
        continue;
      }
      const url = URL.createObjectURL(file);
      newTracks.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
      });
    }

    if (newTracks.length > 0) {
      if (activeChannel === 1) {
        setChannel1(prev => ({ ...prev, tracks: [...prev.tracks, ...newTracks] }));
      } else {
        setChannel2(prev => ({ ...prev, tracks: [...prev.tracks, ...newTracks] }));
      }
      toast.success(`${newTracks.length} pista${newTracks.length === 1 ? '' : 's'} añadida${newTracks.length === 1 ? '' : 's'}`);
    }
    if (invalid > 0) {
      toast.error(`${invalid} archivo${invalid === 1 ? '' : 's'} ignorado${invalid === 1 ? '' : 's'} (no es audio)`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const playTrack = (track: Track, channelNum: 1 | 2) => {
    const audioRef = channelNum === 1 ? audioRef1 : audioRef2;
    const channel = channelNum === 1 ? channel1 : channel2;
    const setChannel = channelNum === 1 ? setChannel1 : setChannel2;

    if (channel.currentTrack?.id === track.id && channel.isPlaying) {
      audioRef.current?.pause();
      setChannel(prev => ({ ...prev, isPlaying: false }));
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play();
      }
      setChannel(prev => ({ ...prev, currentTrack: track, isPlaying: true }));
    }
  };

  const togglePlayPause = (channelNum: 1 | 2) => {
    const audioRef = channelNum === 1 ? audioRef1 : audioRef2;
    const channel = channelNum === 1 ? channel1 : channel2;
    const setChannel = channelNum === 1 ? setChannel1 : setChannel2;

    if (!channel.currentTrack) return;
    
    if (channel.isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setChannel(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const stopPlayback = (channelNum: 1 | 2) => {
    const audioRef = channelNum === 1 ? audioRef1 : audioRef2;
    const setChannel = channelNum === 1 ? setChannel1 : setChannel2;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setChannel(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTrack: null, 
      currentTime: 0, 
      duration: 0 
    }));
  };

  const handleSeek = (value: number[], channelNum: 1 | 2) => {
    const audioRef = channelNum === 1 ? audioRef1 : audioRef2;
    const channel = channelNum === 1 ? channel1 : channel2;
    const setChannel = channelNum === 1 ? setChannel1 : setChannel2;

    if (audioRef.current && channel.duration > 0) {
      audioRef.current.currentTime = value[0];
      setChannel(prev => ({ ...prev, currentTime: value[0] }));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeTrack = (trackId: string, channelNum: 1 | 2) => {
    const channel = channelNum === 1 ? channel1 : channel2;

    if (channel.currentTrack?.id === trackId) {
      stopPlayback(channelNum);
    }
    const track = channel.tracks.find(t => t.id === trackId);
    // Only revoke blob URLs (library tracks use base64 data URIs).
    if (track?.url && !track.libraryId && track.url.startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }

    if (channelNum === 1) {
      setChannel1(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));
    } else {
      setChannel2(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));
    }
  };

  // Convert blob URL to base64 and persist to library.
  const saveTrackToLibrary = async (track: Track, channelNum: 1 | 2) => {
    if (track.libraryId) {
      toast.info('Esta pista ya está en la biblioteca');
      return;
    }
    setSavingTrackId(track.id);
    try {
      const res = await fetch(track.url);
      const blob = await res.blob();
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const channelKey: 'music' | 'ambient' = channelNum === 1 ? 'music' : 'ambient';
      const saved = await addToLibrary(track.name, channelKey, base64);
      if (saved) {
        toast.success('Guardado en biblioteca');
        // Tag the in-session track with libraryId so we don't allow double-save.
        const updater = (prev: AudioChannel) => ({
          ...prev,
          tracks: prev.tracks.map(t => (t.id === track.id ? { ...t, libraryId: saved.id } : t)),
        });
        if (channelNum === 1) setChannel1(updater);
        else setChannel2(updater);
      }
    } catch (err) {
      toast.error('Error al guardar pista');
    } finally {
      setSavingTrackId(null);
    }
  };

  // Load a single library item into the active channel and start playing.
  const loadFromLibrary = (item: LibraryAudio) => {
    const channelNum: 1 | 2 = item.channel === 'ambient' ? 2 : 1;
    setActiveChannel(channelNum);
    const setChannel = channelNum === 1 ? setChannel1 : setChannel2;
    const audioRef = channelNum === 1 ? audioRef1 : audioRef2;

    const newTrack: Track = {
      id: `lib-${item.id}`,
      name: item.name,
      url: item.audio_data,
      libraryId: item.id,
    };

    setChannel(prev => {
      const exists = prev.tracks.find(t => t.libraryId === item.id);
      const tracks = exists ? prev.tracks : [...prev.tracks, newTrack];
      return { ...prev, tracks, currentTrack: newTrack, isPlaying: true };
    });
    if (audioRef.current) {
      audioRef.current.src = item.audio_data;
      audioRef.current.play().catch(() => {});
    }
  };

  const renderChannelControls = (channelNum: 1 | 2) => {
    const channel = channelNum === 1 ? channel1 : channel2;
    const setChannel = channelNum === 1 ? setChannel1 : setChannel2;

    return (
      <div className="space-y-3">
        {/* Current track info */}
        {channel.currentTrack && (
          <div className="p-2 bg-secondary/50 rounded-lg">
            <p className="text-sm text-foreground truncate mb-2">{channel.currentTrack.name}</p>
            
            {/* Progress bar */}
            <div className="mb-2">
              <Slider
                value={[channel.currentTime]}
                onValueChange={(v) => handleSeek(v, channelNum)}
                max={channel.duration || 100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(channel.currentTime)}</span>
                <span>{formatTime(channel.duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => togglePlayPause(channelNum)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                {channel.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => stopPlayback(channelNum)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setChannel(prev => ({ ...prev, isLooping: !prev.isLooping }))}
                variant={channel.isLooping ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setChannel(prev => ({ ...prev, isMuted: !prev.isMuted }))}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            {channel.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[channel.volume]}
            onValueChange={(v) => setChannel(prev => ({ ...prev, volume: v[0] }))}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{channel.volume}%</span>
        </div>

        {/* Track list */}
        {channel.tracks.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {channel.tracks.map((track) => (
              <div
                key={track.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  channel.currentTrack?.id === track.id 
                    ? 'bg-primary/20 border border-primary/50' 
                    : 'bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <Button
                  onClick={() => playTrack(track, channelNum)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  {channel.currentTrack?.id === track.id && channel.isPlaying 
                    ? <Pause className="w-3 h-3" /> 
                    : <Play className="w-3 h-3" />
                  }
                </Button>
                <span className="flex-1 text-sm truncate">{track.name}</span>
                {!track.libraryId && (
                  <Button
                    onClick={() => saveTrackToLibrary(track, channelNum)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-primary"
                    title="Guardar en biblioteca"
                    disabled={savingTrackId === track.id}
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  onClick={() => removeTrack(track.id, channelNum)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-destructive"
                  title="Quitar de la sesión"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {channel.tracks.length === 0 && !channel.currentTrack && (
          <p className="text-center text-xs text-muted-foreground py-2">
            Sin pistas
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <audio 
        ref={audioRef1} 
        onEnded={() => !channel1.isLooping && setChannel1(prev => ({ ...prev, isPlaying: false }))}
        onError={() => toast.error('Error al reproducir el audio')}
      />
      <audio 
        ref={audioRef2} 
        onEnded={() => !channel2.isLooping && setChannel2(prev => ({ ...prev, isPlaying: false }))}
        onError={() => toast.error('Error al reproducir el audio')}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
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
            className={`w-12 h-12 rounded-full shadow-lg ${(channel1.isPlaying || channel2.isPlaying) ? 'animate-pulse bg-primary' : ''}`}
          >
            <Music className="w-5 h-5" />
          </Button>
        )}

        {/* Expanded player */}
        {isExpanded && (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl w-80">
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
              {/* Channel tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => setActiveChannel(1)}
                  variant={activeChannel === 1 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Music className="w-4 h-4" />
                  Música
                  {channel1.isPlaying && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                </Button>
                <Button
                  onClick={() => setActiveChannel(2)}
                  variant={activeChannel === 2 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Wind className="w-4 h-4" />
                  Ambiente
                  {channel2.isPlaying && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                </Button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  title="Puedes seleccionar varios archivos a la vez"
                >
                  <Upload className="w-4 h-4" />
                  Añadir
                </Button>
                <Button
                  onClick={() => setShowLibrary(s => !s)}
                  variant={showLibrary ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Library className="w-4 h-4" />
                  Biblioteca
                </Button>
              </div>

              {showLibrary ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {libraryItems.length === 0
                      ? 'Tu biblioteca está vacía. Sube una pista y guárdala con el icono 💾.'
                      : `${libraryItems.length} pista${libraryItems.length === 1 ? '' : 's'} guardada${libraryItems.length === 1 ? '' : 's'}`}
                  </p>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {libraryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded bg-secondary/30 hover:bg-secondary/50"
                      >
                        {item.channel === 'ambient' ? (
                          <Wind className="w-3 h-3 text-muted-foreground shrink-0" />
                        ) : (
                          <Music className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="flex-1 text-sm truncate" title={item.name}>
                          {item.name}
                        </span>
                        <Button
                          onClick={() => loadFromLibrary(item)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-primary"
                          title="Cargar y reproducir"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => removeFromLibrary(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-destructive"
                          title="Eliminar de la biblioteca"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Active channel controls */
                activeChannel === 1 ? renderChannelControls(1) : renderChannelControls(2)
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};