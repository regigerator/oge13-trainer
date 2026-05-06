(() => {
  function updateBuilderPreview() {
    document.querySelectorAll('.builder').forEach((builder) => {
      const pills = Array.from(builder.querySelectorAll('.pill'));
      const hasPoint = pills[0]?.classList.contains('done');
      const hasDirection = pills[1]?.classList.contains('done');
      const hasPointType = pills[2]?.classList.contains('done');

      builder.classList.toggle('has-point', !!hasPoint);
      builder.classList.toggle('no-direction-yet', !!hasPoint && !hasDirection);
      builder.classList.toggle('no-point-type-yet', !!hasPoint && !hasPointType);
      builder.classList.toggle('only-point-selected', !!hasPoint && !hasDirection && !hasPointType);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .builder.no-direction-yet .ss,
    .builder.no-direction-yet .sf {
      opacity: 0 !important;
    }

    .builder.no-point-type-yet circle.open,
    .builder.no-point-type-yet circle.closed {
      fill: var(--gold) !important;
      stroke: #10141e !important;
      stroke-width: 3 !important;
      opacity: .95;
    }

    .builder.no-point-type-yet .read::after {
      content: ' · тип точки ещё не выбран';
      color: var(--gold);
    }

    .builder.no-direction-yet .read::after {
      content: ' · направление ещё не выбрано';
      color: var(--gold);
    }

    .builder.only-point-selected .read::after {
      content: ' · теперь выбери направление и тип точки';
      color: var(--gold);
    }
  `;
  document.head.appendChild(style);

  updateBuilderPreview();
  const main = document.getElementById('main');
  if (main) new MutationObserver(updateBuilderPreview).observe(main, { childList: true, subtree: true });
})();