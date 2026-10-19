(() => {
  'use strict';
  function removerOcorrencias() {
    document.querySelectorAll('#managementView .mgmt-card').forEach(card => {
      const titulo = card.querySelector('h3');
      if (titulo && titulo.textContent.trim() === 'Registrar ocorrência') card.remove();
    });
  }
  removerOcorrencias();
  document.addEventListener('DOMContentLoaded', removerOcorrencias, { once: true });
})();