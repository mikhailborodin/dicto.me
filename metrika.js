const dictoCounterId = Number(document.currentScript.dataset.counterId);

if (location.hostname === 'dicto.me' && Number.isSafeInteger(dictoCounterId) && dictoCounterId > 0) {
  window.ym = window.ym || function () {
    (window.ym.a ||= []).push(arguments);
  };
  window.ym.l = Date.now();

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(tag);

  window.ym(dictoCounterId, 'init', { webvisor: false, clickmap: false, trackLinks: false });
}

function trackDictoGoal(goal, params) {
  if (dictoCounterId > 0 && location.hostname === 'dicto.me') {
    window.ym?.(dictoCounterId, 'reachGoal', goal, params);
  }
}
