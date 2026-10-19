(() => {
  'use strict';

  function ocultarOcorrencias() {
    document.querySelectorAll('#managementView .mgmt-card').forEach(card => {
      const titulo = card.querySelector('h3');
      if (titulo && titulo.textContent.trim() === 'Registrar ocorrência') {
        // Mantém os elementos internos no DOM porque o painel de gestão
        // ainda os referencia durante as atualizações automáticas.
        // Remover o nó causava erros de JavaScript e interrompia o painel.
        card.hidden = true;
        card.style.display = 'none';
        card.setAttribute('aria-hidden', 'true');
      }
    });

    const hint = document.querySelector('#managementView .panelhead .hint');
    if (hint) hint.textContent = 'Operação diária, calendário, capacidade, histórico e alertas';
  }

  ocultarOcorrencias();
  document.addEventListener('DOMContentLoaded', ocultarOcorrencias, { once: true });
  window.addEventListener('agendamento-records', ocultarOcorrencias);
})();