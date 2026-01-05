import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Upload, X, Repeat, GripHorizontal, Wind } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { toast } from 'sonner';
import { useDraggable } from '@/hooks/useDraggable';

interface Track {
  id: string;
  name: string;
  url: string;
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

    if (activeChannel === 1) {
      setChannel1(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
    } else {
      setChannel2(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
    }
    toast.success('Audio añadido');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    if (track?.url) {
      URL.revokeObjectURL(track.url);
    }
    
    if (channelNum === 1) {
      setChannel1(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));
    } else {
      setChannel2(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));
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
            step={5}
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
                <Button
                  onClick={() => removeTrack(track.id, channelNum)}
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

              {/* Upload button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="w-full mb-4 gap-2"
              >
                <Upload className="w-4 h-4" />
                Añadir a {activeChannel === 1 ? 'Música' : 'Ambiente'}
              </Button>

              {/* Active channel controls */}
              {activeChannel === 1 ? renderChannelControls(1) : renderChannelControls(2)}
            </div>
          </div>
        )}
      </div>
    </>
  );
};