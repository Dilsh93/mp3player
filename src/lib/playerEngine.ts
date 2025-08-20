export type RepeatMode = "off" | "one" | "all";

export type AudioEngineEvents = {
  onTimeUpdate?: (currentTimeSec: number, durationSec: number) => void;
  onEnded?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
};

export class AudioEngine {
  private audio: HTMLAudioElement;
  private events: AudioEngineEvents;
  private audioContext?: AudioContext;
  private mediaSource?: MediaElementAudioSourceNode;
  private analyser?: AnalyserNode;

  constructor(events: AudioEngineEvents = {}) {
    this.audio = new Audio();
    this.audio.preload = "metadata";
    this.events = events;

    this.audio.addEventListener("timeupdate", () => {
      this.events.onTimeUpdate?.(this.audio.currentTime || 0, this.audio.duration || 0);
    });
    this.audio.addEventListener("ended", () => {
      this.events.onEnded?.();
    });
    this.audio.addEventListener("play", () => {
      this.events.onPlayStateChange?.(true);
    });
    this.audio.addEventListener("pause", () => {
      this.events.onPlayStateChange?.(false);
    });
  }

  public async setSource(blob: Blob): Promise<void> {
    const objectUrl = URL.createObjectURL(blob);
    this.audio.src = objectUrl;
    try {
      await this.audio.play();
      this.audio.pause();
    } catch {
      // ignore autoplay policy errors; play() will be called by user interaction
    }
  }

  public async play(): Promise<void> {
    await this.audio.play();
  }

  public pause(): void {
    this.audio.pause();
  }

  public stop(): void {
    this.audio.pause();
    try { this.audio.currentTime = 0; } catch {}
    this.audio.removeAttribute("src");
    try { this.audio.load(); } catch {}
  }

  public seek(seconds: number): void {
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds));
  }

  public setVolume(volume01: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume01));
  }

  public setPlaybackRate(rate: number): void {
    this.audio.playbackRate = Math.max(0.5, Math.min(3, rate));
  }

  public getCurrentTime(): number {
    return this.audio.currentTime || 0;
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  public getElement(): HTMLAudioElement {
    return this.audio;
  }

  public getOrCreateAnalyser(fftSize: number = 2048): AnalyserNode {
    if (!this.audioContext) {
      const w = window as Window & {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextClass = w.AudioContext ?? w.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Web Audio API is not supported in this browser");
      }
      this.audioContext = new AudioContextClass();
    }
    if (!this.mediaSource) {
      this.mediaSource = this.audioContext.createMediaElementSource(this.audio);
    }
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = 0.85;
      // Connect chain: media -> analyser -> destination
      this.mediaSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }

    // Ensure context resumes on user interaction
    const ensureResume = async () => {
      try {
        if (this.audioContext && this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }
      } catch {
        // ignore
      }
    };
    this.audio.addEventListener("play", ensureResume, { once: true });

    return this.analyser;
  }
}


