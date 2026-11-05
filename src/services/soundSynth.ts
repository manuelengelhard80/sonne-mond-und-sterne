// Web Audio API Ambient Sound Synthesizer
import { SoundMode } from '../types';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private currentMode: SoundMode = 'off';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.3;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playSound(mode: SoundMode) {
    this.stopCurrent();
    this.currentMode = mode;
    if (mode === 'off') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (mode === 'sun') {
      this.startSunDrone();
    } else if (mode === 'moon') {
      this.startMoonWaves();
    } else if (mode === 'stars') {
      this.startStarChimes();
    } else if (mode === 'rain') {
      this.startGentleRain();
    } else if (mode === 'lake') {
      this.startLakeNight();
    }
  }

  public stopCurrent() {
    // Clear scheduled intervals
    this.activeNodes.forEach(node => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // Ignore audio node disconnect errors
        }
      }
    });
    this.activeNodes = [];
    this.currentMode = 'off';
  }

  public getCurrentMode(): SoundMode {
    return this.currentMode;
  }

  // 🌅 Sun Drone: Warm harmonic chords in C Major (C4, G4, E5) with slow LFO pulse
  private startSunDrone() {
    if (!this.ctx || !this.masterGain) return;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
    
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + idx * 50, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.activeNodes.push(osc);
    });
  }

  // 🌙 Moon Waves: Deep gentle ocean wave noise with lowpass sweep
  private startMoonWaves() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // LFO for wave pulsation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();

    this.activeNodes.push(whiteNoise, lfo);
  }

  // ✨ Star Chimes: Periodic soft pentatonic bell chimes
  private startStarChimes() {
    if (!this.ctx || !this.masterGain) return;

    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66]; // C5 pentatonic
    const playChime = () => {
      if (!this.ctx || !this.masterGain || this.currentMode !== 'stars') return;
      
      const pitch = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.2);
    };

    playChime();
    const interval = window.setInterval(playChime, 2500);
    this.activeNodes.push(interval);
  }

  // 🌧️ Gentle Rain: Pink noise approximation
  private startGentleRain() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.03;
      b6 = white * 0.115926;
    }

    const rainNoise = this.ctx.createBufferSource();
    rainNoise.buffer = noiseBuffer;
    rainNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    rainNoise.connect(filter);
    filter.connect(this.masterGain);

    rainNoise.start();
    this.activeNodes.push(rainNoise);
  }

  // 🌊 Sommernacht am See: Gentle water laps, warm night breeze, and subtle distant crickets
  private startLakeNight() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Water gentle lapping noise
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const waterNoise = this.ctx.createBufferSource();
    waterNoise.buffer = noiseBuffer;
    waterNoise.loop = true;

    const waterFilter = this.ctx.createBiquadFilter();
    waterFilter.type = 'lowpass';
    waterFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    const waterGain = this.ctx.createGain();
    waterGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    // LFO for slow water lapping cycle (about 6 seconds per wave)
    const lapLfo = this.ctx.createOscillator();
    lapLfo.frequency.setValueAtTime(0.16, this.ctx.currentTime);
    const lapGain = this.ctx.createGain();
    lapGain.gain.setValueAtTime(140, this.ctx.currentTime);

    lapLfo.connect(lapGain);
    lapGain.connect(waterFilter.frequency);

    waterNoise.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(this.masterGain);

    waterNoise.start();
    lapLfo.start();
    this.activeNodes.push(waterNoise, lapLfo);

    // 2. Warm harmonic lake pad (D minor / F Major warm evening chords)
    const lakePitches = [146.83, 220.00, 261.63, 349.23]; // D3, A3, C4, F4
    lakePitches.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      padGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(padGain);
      padGain.connect(this.masterGain);

      osc.start();
      this.activeNodes.push(osc);
    });

    // 3. Delicate, occasional summer night cricket chirps
    const cricketInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.currentMode !== 'lake') return;
      const now = this.ctx.currentTime;
      const cricketOsc = this.ctx.createOscillator();
      const cricketGain = this.ctx.createGain();

      cricketOsc.type = 'sine';
      cricketOsc.frequency.setValueAtTime(4600 + Math.random() * 400, now);

      cricketGain.gain.setValueAtTime(0.0001, now);
      cricketGain.gain.linearRampToValueAtTime(0.008, now + 0.04);
      cricketGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      cricketOsc.connect(cricketGain);
      cricketGain.connect(this.masterGain);

      cricketOsc.start(now);
      cricketOsc.stop(now + 0.2);
    }, 1800);

    this.activeNodes.push(cricketInterval);
  }

  // Soft pebble or water droplet ripple sound
  public playWaterDrop() {
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const now = this.ctx.currentTime;
    osc.type = 'sine';
    // Frequency sweeps up then down like a droplet hitting calm water
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  // Play a soft bell tone when breathing cycle transitions or star is placed
  public playSoftBell() {
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, this.ctx.currentTime); // 528Hz love/solfeggio frequency

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.6);
  }

  // 🌠 Magical shooting star flight sound (celestial swoosh & crystal chime)
  public playShootingStar() {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Luminous celestial swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.65);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.65);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);

    // 2. Chime spark when landing
    const chimePitches = [1046.5, 1318.5, 1567.98]; // C6, E6, G6
    chimePitches.forEach((pitch, i) => {
      if (!this.ctx) return;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      const chimeStart = now + 0.5 + i * 0.05;

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(pitch, chimeStart);

      chimeGain.gain.setValueAtTime(0.0001, chimeStart);
      chimeGain.gain.exponentialRampToValueAtTime(0.045, chimeStart + 0.03);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeStart + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);

      chimeOsc.start(chimeStart);
      chimeOsc.stop(chimeStart + 1.3);
    });
  }
}

export const soundSynth = new SoundSynthesizer();
