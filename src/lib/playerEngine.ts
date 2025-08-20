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
  private preGain?: GainNode;
  private bassShelf?: BiquadFilterNode;
  private eqFilters?: BiquadFilterNode[];
  private eqEnabled: boolean = false;
  private eqBandGainsDb: number[] = [];
  private bassGainDb: number = 0;

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
      this.rebuildAudioGraph();
    } else {
      // ensure fft size stays in sync
      this.analyser.fftSize = fftSize;
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

  private rebuildAudioGraph(): void {
    if (!this.audioContext || !this.mediaSource || !this.analyser) return;
    try {
      // Disconnect everything first
      try { this.mediaSource.disconnect(); } catch {}
      if (this.preGain) { try { this.preGain.disconnect(); } catch {} }
      if (this.bassShelf) { try { this.bassShelf.disconnect(); } catch {} }
      if (this.eqFilters && this.eqFilters.length) {
        for (const f of this.eqFilters) { try { f.disconnect(); } catch {} }
      }
      try { this.analyser.disconnect(); } catch {}

      // Build nodes
      if (!this.preGain) this.preGain = this.audioContext.createGain();
      if (!this.bassShelf) {
        this.bassShelf = this.audioContext.createBiquadFilter();
        this.bassShelf.type = "lowshelf";
        this.bassShelf.frequency.value = 80; // 80Hz
      }
      if (!this.eqFilters || this.eqFilters.length === 0) {
        const freqs = [170, 350, 1000, 3500, 10000];
        this.eqFilters = freqs.map((f) => {
          const biq = this.audioContext!.createBiquadFilter();
          biq.type = "peaking";
          biq.frequency.value = f;
          biq.Q.value = 1.0;
          return biq;
        });
      }

      // Apply current gains
      this.bassShelf.gain.value = this.bassGainDb || 0;
      const gains = this.eqBandGainsDb;
      if (this.eqFilters) {
        for (let i = 0; i < this.eqFilters.length; i++) {
          this.eqFilters[i].gain.value = gains?.[i] ?? 0;
        }
      }

      // Connect graph depending on EQ enabled
      if (this.eqEnabled) {
        // media -> pre -> bass -> eq filters... -> analyser -> destination
        this.mediaSource.connect(this.preGain);
        this.preGain.connect(this.bassShelf);
        let last: AudioNode = this.bassShelf;
        for (const f of this.eqFilters!) {
          last.connect(f);
          last = f;
        }
        last.connect(this.analyser);
      } else {
        // bypass eq: media -> analyser
        this.mediaSource.connect(this.analyser);
      }
      this.analyser.connect(this.audioContext.destination);
    } catch {
      // noop
    }
  }

  public configureEqualizer(params: { enabled?: boolean; bandGainsDb?: number[]; bassGainDb?: number }): void {
    if (!this.audioContext) {
      // Lazy init audio context graph
      try { this.getOrCreateAnalyser(); } catch {}
    }
    if (typeof params.enabled === "boolean") this.eqEnabled = params.enabled;
    if (Array.isArray(params.bandGainsDb)) this.eqBandGainsDb = params.bandGainsDb.slice();
    if (typeof params.bassGainDb === "number") this.bassGainDb = params.bassGainDb;
    this.rebuildAudioGraph();
  }
}


