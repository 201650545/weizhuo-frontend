// Private 19-track local playlist with phase-based rotation. Audio files remain external to the single HTML bundle.
(() => {
  'use strict';
  const audio = document.getElementById('background-music');
  const tracks = [...document.querySelectorAll('[data-music-source]')];
  if (!tracks.length) { const button=document.getElementById('music-toggle'); if(button){button.disabled=true;button.title='公开样板未包含音乐';button.setAttribute('aria-label','公开样板未包含音乐');} return; }
  let enabled = true, level = .12, selected = 0, ducked = false, pending = false, busy = false, generation = 0;
  try {
    enabled = localStorage.getItem('host-mock:bgm-enabled') !== '0';
    const n = Number(localStorage.getItem('host-mock:bgm-level'));
    if (localStorage.getItem('host-mock:bgm-level') !== null && Number.isFinite(n)) level = Math.max(0, Math.min(.35, n));
    const choice = Number(localStorage.getItem('host-mock:bgm-track'));
    if (Number.isInteger(choice) && tracks[choice]) selected = choice;
  } catch {}

  audio.loop = false;
  audio.preload = 'none';
  // ── 阶段曲库：按情感/节奏分组，见 音乐策划_20261116/音乐分类与场景映射.md ──
  const PHASE_BUCKETS = {
    lobby:   ['O Come O Come Emmanuel', 'the grotto', 'old doll', 'hi'],
    read:    ['死寂', 'salvatore', 'Are you lost', '沼に沈む', '沙子 a long story'],
    speak:   ['死寂', 'Are you lost'],
    discuss: ['pendulum', 'shiver', 'holyghost'],
    clue:    ['the grotto', 'holyghost'],
    vote:    ['shiver', 'pendulum', '鬼新娘'],
    reveal:  ['鬼新娘', '扭曲的梦境'],
    ending:  ['少女のうた', 'Fallen Down', 'time machine', 'NOP']
  };
  const PHASE_LABEL = { lobby: '等候与选角', read: '私人阅读', speak: '逐人陈述', discuss: '讨论', clue: '线索公开', vote: '投票', reveal: '揭晓', ending: '个人结尾' };
  let phase = 'lobby', autoMode = true, lastByPhase = {}, fadeTimer = null;
  const cleanTitle = v => String(v || '').replace(/^\s*\d+\s*[·.]\s*/u, '').trim();
  function byTitle(t) { return tracks.findIndex(x => cleanTitle(x.dataset.title) === t); }
  function bucketFor(p) { return (PHASE_BUCKETS[p] || PHASE_BUCKETS.read).map(byTitle).filter(i => i >= 0); }
  function nextInPhase(p) {
    const list = bucketFor(p);
    if (!list.length) return 0;
    const prev = lastByPhase[p];
    const at = prev === undefined ? -1 : list.indexOf(prev);
    const pick = list[(at + 1) % list.length];
    lastByPhase[p] = pick;
    return pick;
  }
  function fadeTo(target, ms) {
    if (fadeTimer) clearInterval(fadeTimer);
    const from = audio.volume, steps = Math.max(1, Math.round(ms / 60)); let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; }
    }, 60);
  }
  window.mockMusicSetPhase = function (next) {
    if (!PHASE_BUCKETS[next] || next === phase) { phase = PHASE_BUCKETS[next] ? next : phase; return state(); }
    phase = next;
    if (!autoMode) return state();
    fadeTo(0, 900);
    setTimeout(() => {
      choose(nextInPhase(phase), true);
      fadeTo(enabled ? level : 0, 1400);
    }, 950);
    return state();
  };
  const PHASE_HINTS = [[/揭晓|复盘|宣布/, 'reveal'], [/投票|指认|锁票/, 'vote'], [/线索|公开/, 'clue'], [/讨论|自由/, 'discuss'], [/陈述|发言/, 'speak'], [/阅读/, 'read'], [/结尾|结束|尾声/, 'ending']];
  function detectPhase() {
    const el = document.querySelector('.page-label, #phase-control, .phase-title');
    const text = (el && el.textContent) || '';
    for (const [re, name] of PHASE_HINTS) if (re.test(text)) return name;
    return null;
  }
  setInterval(() => { const next = detectPhase(); if (next && next !== phase) window.mockMusicSetPhase(next); }, 2500);

  audio.addEventListener('loadedmetadata', () => { audio.loop = false; ui(); });
  function save() {
    try {
      localStorage.setItem('host-mock:bgm-enabled', enabled ? '1' : '0');
      localStorage.setItem('host-mock:bgm-level', String(level));
      localStorage.setItem('host-mock:bgm-track', String(selected));
    } catch {}
  }
  function volume() {
    const target = enabled ? level * (ducked ? .22 : 1) : 0;
    audio.volume = target;
  }
  function state() {
    return {
      enabled, level, selected, paused: audio.paused, currentTime: audio.currentTime,
      readyState: audio.readyState, pending, ducked, loop: audio.loop,
      duration: Number.isFinite(audio.duration) ? audio.duration : null,
      title: tracks[selected]?.dataset.title || null,
      count: tracks.length, phase, phaseLabel: PHASE_LABEL[phase] || phase, autoMode
    };
  }
  function ui() {
    const select = document.getElementById('bgm-track');
    if (select && select.options.length !== tracks.length) {
      select.innerHTML = tracks.map((track, i) => `<option value="${i}">${track.dataset.title} · ${track.dataset.genre || '音乐'}</option>`).join('');
    }
    const b = document.getElementById('music-toggle');
    if (b) { const playing = enabled && !audio.paused; const label = playing ? '背景音乐播放中，点击关闭' : pending ? '音乐播放失败，点击重试' : '背景音乐已关闭，点击播放'; if (!b.querySelector('svg')) b.textContent = playing ? '音乐开' : '音乐关'; b.setAttribute('aria-pressed', String(playing)); b.setAttribute('aria-label', label); b.title = label; }
    const start = document.getElementById('music-start');
    if (start) { start.textContent = audio.paused ? '播放' : '暂停'; start.setAttribute('aria-pressed', String(!audio.paused)); }
    const status = document.getElementById('music-status');
    if (status) {
      const title = tracks[selected]?.dataset.title || '未选择曲目';
      status.textContent = !enabled ? '背景音乐已关闭' : pending
        ? '播放未成功；点音乐按钮重试，不影响游戏'
        : audio.paused ? `已选：${title} · 点击音乐按钮播放` : `正在播放：${title} · ${PHASE_LABEL[phase] || phase}${autoMode ? ' · 自动轮换' : ' · 手选'}`;
    }
    const toggle = document.getElementById('bgm-enabled'); if (toggle) toggle.checked = enabled;
    if (select) select.value = String(selected);
    const slider = document.getElementById('bgm-volume'); if (slider) slider.value = String(Math.round(level * 100));
  }
  async function play(fromGesture = false) {
    if (!enabled || busy) { ui(); return; }
    const id = generation; busy = true;
    try {
      const nextSrc = tracks[selected].getAttribute('src');
      if (audio.getAttribute('src') !== nextSrc) { audio.src = nextSrc; audio.load(); }
      volume();
      await audio.play();
      if (id !== generation || !enabled) { audio.pause(); return; }
      pending = false;
    } catch { pending = true; }
    finally { busy = false; ui(); }
  }
  function toggle() {
    if (enabled && audio.paused) { pending = false; play(true); ui(); return; }
    enabled = !enabled; generation++;
    save();
    if (enabled) play(true);
    else { audio.pause(); pending = false; volume(); }
    ui();
  }
  function togglePlayback() {
    if (audio.paused) {
      enabled = true; pending = false; generation++; save(); play(true);
    } else {
      generation++; audio.pause();
    }
    ui();
  }
  function choose(i, autoSwitch) {
    if (!Number.isInteger(i) || !tracks[i]) return;
    if (!busy && autoMode && !autoSwitch && i !== selected) autoMode = false;
    generation++; audio.pause(); selected = i; pending = false; audio.loop = false; save();
    audio.src = tracks[selected].getAttribute('src'); audio.load();
    try { audio.currentTime = 0; } catch {}
    if (enabled) play(true);
    ui();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (b?.id === 'music-toggle') toggle(); else if (b?.id === 'music-start') togglePlayback();
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'bgm-enabled') { if (e.target.checked !== enabled) toggle(); }
    else if (e.target.id === 'bgm-track') choose(Number(e.target.value));
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'bgm-volume') { level = Math.max(0, Math.min(.35, Number(e.target.value) / 100)); save(); volume(); }
  });
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('#music-toggle,#music-start,#bgm-enabled,#bgm-track')) return;
    if (enabled && !audio.ended && (audio.paused || pending)) play(true);
  }, { passive: true });
  // Switching apps/tabs never pauses or mutes an already-playing track.
  document.addEventListener('visibilitychange', volume);
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => { enabled=true; save(); play(); });
    navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); ui(); });
    navigator.mediaSession.setActionHandler('previoustrack', () => choose((selected+tracks.length-1)%tracks.length));
    navigator.mediaSession.setActionHandler('nexttrack', () => choose((selected+1)%tracks.length));
  }
  audio.addEventListener('ended', () => { if (!autoMode) return; choose(nextInPhase(phase), true); });
  audio.addEventListener('error', () => { pending = true; ui(); });
  audio.addEventListener('playing', () => { pending = false; ui(); });
  document.addEventListener('play', e => {
    if (!(e.target instanceof HTMLAudioElement)) return;
    document.querySelectorAll('audio').forEach(other => { if (other !== e.target) other.pause(); });
  }, true);
  audio.addEventListener('pause', ui);
  const observer = new MutationObserver(ui);
  observer.observe(document.getElementById('sheet-body'), { childList: true });
  window.mockMusic = { state, play, choose, toggle, togglePlayback, setPhase: window.mockMusicSetPhase, resumeAuto() { autoMode = true; return window.mockMusicSetPhase(phase); }, duck(value) { ducked = !!value; volume(); }, updateUI: ui };
  ui();
})();
