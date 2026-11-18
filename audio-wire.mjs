// Thin bridge between the poster UI and the procedural audio module.
// Nothing starts until the player presses the audio button.
import { startAudio, stopAudio, setMuted, audioState, playWhistle } from './procedural-audio.mjs';

window.deskAudio = {
  state: audioState,
  toggle() {
    if (audioState().started) stopAudio();
    else startAudio();
    return audioState();
  },
  mute(next) { return setMuted(next); },
  whistle() { return playWhistle(); }
};
