/**
 * Seamless looping audio engine using the Web Audio API.
 *
 * `HTMLAudioElement.loop` produces an audible gap (~50-200ms) between
 * iterations because the decoder restarts. `AudioBufferSourceNode` with
 * `loop = true` is sample-accurate and gapless, which is what ambient loops
 * (rain, wind, etc.) need.
 */
export class SeamlessAudioEngine {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private currentSrc: string | null = null;

  /** Wall-clock ctx time when current source was started. */
  private startedAt = 0;
  /** Buffer offset (s) at which current source was started. */
  private startOffset = 0;
  /** Offset to use if paused (s). */
  private pausedOffset = 0;
  private playing = false;
  private looping = true;
  private volume = 0.5;
  private muted = false;

  private ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.muted ? 0 : this.volume;
      this.gain.connect(this.ctx.destination);
    }
    return this.ctx!;
  }

  async load(src: string): Promise<void> {
    if (this.currentSrc === src && this.buffer) return;
    const ctx = this.ensureCtx();
    const res = await fetch(src);
    const arr = await res.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(arr.slice(0));
    this.currentSrc = src;
    this.pausedOffset = 0;
  }

  async loadAndPlay(src: string, loop = true): Promise<void> {
    await this.load(src);
    this.looping = loop;
    this.pausedOffset = 0;
    this.startSource(0);
  }

  private startSource(offset: number) {
    if (!this.ctx || !this.gain || !this.buffer) return;
    this.stopSource();
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = this.looping;
    src.connect(this.gain);
    src.onended = () => {
      // Fires for non-looped natural end as well as manual stop.
      if (src === this.source && !this.looping) {
        this.playing = false;
        this.pausedOffset = 0;
        this.source = null;
      }
    };
    src.start(0, offset);
    this.source = src;
    this.startedAt = this.ctx.currentTime;
    this.startOffset = offset;
    this.playing = true;
  }

  private stopSource() {
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        // already stopped
      }
      try {
        this.source.disconnect();
      } catch {
        // ignore
      }
      this.source = null;
    }
  }

  pause() {
    if (!this.playing || !this.ctx) return;
    this.pausedOffset = this.getCurrentTime();
    this.stopSource();
    this.playing = false;
  }

  resume() {
    if (this.playing || !this.buffer) return;
    this.startSource(Math.min(this.pausedOffset, this.buffer.duration - 0.001));
  }

  stop() {
    this.stopSource();
    this.playing = false;
    this.pausedOffset = 0;
  }

  seek(time: number) {
    if (!this.buffer) return;
    const t = Math.max(0, Math.min(time, this.buffer.duration));
    if (this.playing) {
      this.startSource(t);
    } else {
      this.pausedOffset = t;
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.gain) this.gain.gain.value = this.muted ? 0 : this.volume;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.gain) this.gain.gain.value = this.muted ? 0 : this.volume;
  }

  setLoop(loop: boolean) {
    if (this.looping === loop) return;
    this.looping = loop;
    if (this.source) {
      // BufferSource.loop can be changed live.
      this.source.loop = loop;
    }
  }

  getCurrentTime(): number {
    if (!this.ctx || !this.buffer) return this.pausedOffset;
    if (!this.playing) return this.pausedOffset;
    const elapsed = this.ctx.currentTime - this.startedAt + this.startOffset;
    if (this.looping && this.buffer.duration > 0) {
      return elapsed % this.buffer.duration;
    }
    return Math.min(elapsed, this.buffer.duration);
  }

  getDuration(): number {
    return this.buffer?.duration ?? 0;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  dispose() {
    this.stopSource();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.buffer = null;
    this.currentSrc = null;
  }
}
