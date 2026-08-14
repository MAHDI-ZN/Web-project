type Listener = (currentTime: number, duration: number) => void;

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private endedListeners = new Set<() => void>();

  private ensure(): HTMLAudioElement {
    if (typeof window === "undefined") {
      throw new Error("AudioEngine only works in browser");
    }
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "metadata";
      this.audio.addEventListener("timeupdate", () => {
        if (!this.audio) return;
        this.emit(this.audio.currentTime, this.audio.duration || 0);
      });
      this.audio.addEventListener("loadedmetadata", () => {
        if (!this.audio) return;
        this.emit(this.audio.currentTime, this.audio.duration || 0);
      });
      this.audio.addEventListener("ended", () => {
        this.endedListeners.forEach((fn) => fn());
      });
    }
    return this.audio;
  }

  private emit(currentTime: number, duration: number) {
    this.listeners.forEach((fn) => fn(currentTime, duration));
  }

  onTick(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onEnded(fn: () => void) {
    this.endedListeners.add(fn);
    return () => this.endedListeners.delete(fn);
  }

  async load(url: string) {
    const audio = this.ensure();
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }
  }

  async play() {
    const audio = this.ensure();
    await audio.play();
  }

  pause() {
    this.ensure().pause();
  }

  seek(time: number) {
    const audio = this.ensure();
    audio.currentTime = time;
  }

  setVolume(volume: number) {
    this.ensure().volume = Math.min(1, Math.max(0, volume));
  }

  getCurrentTime() {
    return this.audio?.currentTime ?? 0;
  }

  getDuration() {
    return this.audio?.duration ?? 0;
  }
}

export const audioEngine = typeof window !== "undefined" ? new AudioEngine() : (null as unknown as AudioEngine);
