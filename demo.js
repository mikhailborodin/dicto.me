const examples = {
  dictation: {
    duration: 2, file: 'assets/dictation.m4a',
    words: [[0.15, 'Пришлю'], [0.65, ' макет'], [1.05, ' в'], [1.25, ' пятницу.']]
  },
  meeting: {
    duration: 3.76, file: 'assets/meeting.m4a',
    words: [[0.12, '— Когда'], [0.43, ' пришлёшь'], [0.97, ' макет?'],
      [1.98, '\n— В'], [2.18, ' пятницу,'], [2.85, ' до'], [3.1, ' обеда.']]
  }
};

const playButton = document.querySelector('#play');
const transcript = document.querySelector('#words');
const statusText = document.querySelector('#announcement');
const dialog = document.querySelector('dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let mode = 'dictation';
let playback;

function bars(target, count, startX, baseline, spacing, width, color) {
  return Array.from({ length: count }, (_, index) => {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', startX + index * spacing);
    bar.setAttribute('width', width);
    bar.setAttribute('rx', width / 2);
    bar.setAttribute('fill', color);
    target.append(bar);
    return { bar, index, baseline };
  });
}

const panelBars = bars(document.querySelector('#wave'), 43, 1, 18, 5.7, 3, '#b5b0a6');
const displayBars = bars(document.querySelector('#signal'), 24, 286, 498, 25, 10, '#ffe6bb');

function drawWave(seconds = 0) {
  for (const group of [panelBars, displayBars]) {
    const size = group === panelBars ? 30 : 129;
    for (const { bar, index, baseline } of group) {
      const envelope = Math.sin(Math.PI * index / (group.length - 1));
      const amplitude = Math.abs(Math.sin(index * .47 + seconds * 8) * Math.cos(index * .87 - seconds * 4));
      const height = size * (.09 + envelope * amplitude);
      bar.setAttribute('y', baseline - height / 2);
      bar.setAttribute('height', height);
    }
  }
}

function fullText() {
  return examples[mode].words.map(([, word]) => word).join('');
}

function setState(state) {
  document.body.dataset.state = state;
  const playing = state === 'playing';
  const label = playing ? 'Остановить демо' : state === 'done' ? 'Повторить демо' : 'Посмотреть демо';
  document.querySelector('#play-label').textContent = label;
  document.querySelector('#play-icon').textContent = playing ? '■' : '▶';
  playButton.setAttribute('aria-label', playing ? label : label + ' со звуком');
}

function stop(state = 'idle') {
  if (playback) {
    cancelAnimationFrame(playback.frame);
    playback.audio.pause();
    playback = null;
  }
  transcript.textContent = fullText();
  setState(state);
  drawWave();
}

function start() {
  stop();
  const example = examples[mode];
  const run = { audio: new Audio(example.file), frame: 0, silentStart: null };
  playback = run;
  transcript.textContent = '';
  statusText.textContent = 'Дикто слушает пример.';
  setState('playing');

  // Keep the visual demo usable if the browser cannot play the local clip.
  const silentFallback = () => {
    if (playback === run && run.silentStart === null) {
      run.silentStart = performance.now() - run.audio.currentTime * 1000;
    }
  };
  run.audio.addEventListener('error', silentFallback, { once: true });
  run.audio.play().catch(silentFallback);

  function render(now) {
    if (playback !== run) return;
    const seconds = run.silentStart === null ? run.audio.currentTime : (now - run.silentStart) / 1000;
    const text = example.words.filter(([at]) => at <= seconds).map(([, word]) => word).join('');
    if (transcript.textContent !== text) transcript.textContent = text;
    if (!reducedMotion.matches) drawWave(seconds);
    if (run.audio.ended || seconds >= example.duration + .1) {
      stop('done');
      statusText.textContent = fullText();
    } else {
      run.frame = requestAnimationFrame(render);
    }
  }
  run.frame = requestAnimationFrame(render);
}

playButton.addEventListener('click', () => {
  if (playback) {
    stop();
    statusText.textContent = 'Демо остановлено.';
  } else start();
});

const modes = document.querySelectorAll('[data-mode]');
for (const button of modes) {
  button.addEventListener('click', () => {
    if (button.dataset.mode === mode) return;
    mode = button.dataset.mode;
    stop();
    for (const option of modes) option.setAttribute('aria-pressed', String(option === button));
    statusText.textContent = fullText();
  });
}

for (const button of document.querySelectorAll('[data-install]')) {
  button.addEventListener('click', () => { stop(); dialog.showModal(); });
}
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
window.addEventListener('pagehide', () => stop());
drawWave();
