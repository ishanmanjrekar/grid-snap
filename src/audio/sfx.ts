export type SfxKey =
  | 'drag_tick'
  | 'shift_commit'
  | 'frame_snap'
  | 'hint_activate'
  | 'extra_time'
  | 'button_tap'
  | 'error_buzz'
  | 'timer_warn'
  | 'level_win'
  | 'level_timeout'
  | 'store_buy';

/**
 * Synthesizes 16-bit handheld chiptune SFX using WebAudio oscillators/gains.
 * Matches all 11 acoustic profiles specified in `docs/art-direction.md` §7.1.
 */
export function playSynthesizedSfx(
  ctx: AudioContext,
  destination: AudioNode,
  key: SfxKey
): void {
  const now = ctx.currentTime;

  const scheduleTone = (
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    startTime: number,
    duration: number,
    peakGain = 0.18
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freqEnd),
        startTime + duration
      );
    }

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.008, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  };

  switch (key) {
    case 'drag_tick':
      // Short 18ms crisp square-wave mechanical click (880Hz -> 1100Hz)
      scheduleTone('square', 880, 1100, now, 0.018, 0.12);
      break;

    case 'shift_commit':
      // Punchy 45ms low-mid tactile thock (320Hz -> 180Hz triangle wave)
      scheduleTone('triangle', 320, 180, now, 0.045, 0.24);
      break;

    case 'frame_snap':
      // Bright 2-note ascending chiptune chime (C6 -> G6, 90ms square wave)
      scheduleTone('square', 1046.5, 1046.5, now, 0.045, 0.16);
      scheduleTone('square', 1567.98, 1567.98, now + 0.045, 0.055, 0.18);
      break;

    case 'hint_activate':
      // Mystical 3-note arpeggio ping (E5 -> B5 -> E6, 140ms)
      scheduleTone('square', 659.25, 659.25, now, 0.045, 0.16);
      scheduleTone('square', 987.77, 987.77, now + 0.045, 0.045, 0.16);
      scheduleTone('square', 1318.51, 1318.51, now + 0.09, 0.065, 0.18);
      break;

    case 'extra_time':
      // Rising power-up sweep (440Hz -> 1320Hz over 180ms)
      scheduleTone('square', 440, 1320, now, 0.18, 0.18);
      break;

    case 'button_tap':
      // Snappy 25ms microswitch blip (660Hz)
      scheduleTone('square', 660, 880, now, 0.025, 0.14);
      break;

    case 'error_buzz':
      // Double low-frequency square buzz (150Hz -> 110Hz, 120ms)
      scheduleTone('sawtooth', 150, 110, now, 0.055, 0.2);
      scheduleTone('sawtooth', 140, 100, now + 0.065, 0.065, 0.2);
      break;

    case 'timer_warn':
      // Urgent high-pitched clock beep (1480Hz, 35ms)
      scheduleTone('square', 1480, 1480, now, 0.035, 0.15);
      break;

    case 'level_win': {
      // Upbeat 6-note 16-bit victory fanfare (~650ms)
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      const durs = [0.08, 0.08, 0.08, 0.12, 0.08, 0.22];
      let offset = 0;
      notes.forEach((freq, i) => {
        scheduleTone('square', freq, freq, now + offset, durs[i], 0.18);
        offset += durs[i] + 0.01;
      });
      break;
    }

    case 'level_timeout': {
      // Descending 4-note arcade fail trombone/synth (A4 -> G#4 -> G4 -> F#4, 450ms)
      const notes = [440, 415.3, 392.0, 369.99];
      notes.forEach((freq, i) => {
        scheduleTone(
          'sawtooth',
          freq,
          i === 3 ? freq * 0.92 : freq,
          now + i * 0.1,
          i === 3 ? 0.18 : 0.09,
          0.18
        );
      });
      break;
    }

    case 'store_buy':
      // Classic dual-tone coin register ding (B5 -> E6, 160ms)
      scheduleTone('square', 987.77, 987.77, now, 0.055, 0.18);
      scheduleTone('square', 1318.51, 1318.51, now + 0.055, 0.12, 0.2);
      break;
  }
}

