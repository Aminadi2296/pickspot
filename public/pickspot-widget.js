(function () {
  if (window.PickspotWidget) return;

  window.PickspotWidget = {
    init: function (config) {
      const slug = config.slug || 'bella-spa';
      const baseUrl = config.baseUrl || 'http://localhost:3001';
      const buttonText = config.buttonText || 'Reservar Cita';
      const primaryColor = config.primaryColor || '#6366f1';

      // 1. Inyectar botón flotante si está habilitado
      if (config.floatingButton !== false) {
        const btn = document.createElement('button');
        btn.id = 'pickspot-float-btn';
        btn.innerText = buttonText;
        btn.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: ${primaryColor};
          color: #ffffff;
          border: none;
          padding: 14px 24px;
          border-radius: 9999px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 8px 10px -6px rgba(99, 102, 241, 0.4);
          cursor: pointer;
          z-index: 999998;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;
        btn.onmouseenter = () => (btn.style.transform = 'translateY(-2px)');
        btn.onmouseleave = () => (btn.style.transform = 'translateY(0)');
        btn.onclick = () => window.PickspotWidget.open();
        document.body.appendChild(btn);
      }

      // 2. Crear Modal Backdrop & Iframe
      const modal = document.createElement('div');
      modal.id = 'pickspot-modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        z-index: 999999;
        align-items: center;
        justify-content: center;
        padding: 16px;
      `;

      const container = document.createElement('div');
      container.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 720px;
        height: 92vh;
        max-height: 920px;
        background: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: pickspotFadeIn 0.25s ease-out;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.setAttribute('aria-label', 'Close booking modal');
      closeBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        width: 34px;
        height: 34px;
        background: rgba(241, 245, 249, 0.92);
        color: #475569;
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 50%;
        cursor: pointer;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        transition: background 0.15s ease, transform 0.15s ease;
        z-index: 10;
      `;
      closeBtn.onmouseenter = () => {
        closeBtn.style.background = '#e2e8f0';
        closeBtn.style.transform = 'scale(1.05)';
      };
      closeBtn.onmouseleave = () => {
        closeBtn.style.background = 'rgba(241, 245, 249, 0.92)';
        closeBtn.style.transform = 'scale(1)';
      };
      closeBtn.onclick = () => window.PickspotWidget.close();

      const iframe = document.createElement('iframe');
      iframe.src = `${baseUrl}/${slug}/book`;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;

      container.appendChild(closeBtn);
      container.appendChild(iframe);
      modal.appendChild(container);

      // Cerrar al dar click afuera
      modal.onclick = (e) => {
        if (e.target === modal) window.PickspotWidget.close();
      };

      document.body.appendChild(modal);

      // Estilos de animación
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pickspotFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);

      // Escuchar cualquier botón que tenga data-pickspot-open
      document.addEventListener('click', function (e) {
        if (e.target && e.target.closest('[data-pickspot-open]')) {
          e.preventDefault();
          window.PickspotWidget.open();
        }
      });
    },

    open: function () {
      const modal = document.getElementById('pickspot-modal');
      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    },

    close: function () {
      const modal = document.getElementById('pickspot-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    },
  };
})();
