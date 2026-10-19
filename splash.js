(() => {
  'use strict';
  const screen = document.getElementById('splashScreen');
  if (!screen) return;
  const enter = () => {
    if (screen.classList.contains('splash-leaving')) return;
    screen.classList.add('splash-leaving');
    window.setTimeout(() => {
      screen.remove();
      document.getElementById('supplierSearch')?.focus({preventScroll:true});
    }, 460);
  };
  screen.addEventListener('click', enter);
  screen.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      enter();
    }
  });
})();