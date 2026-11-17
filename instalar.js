(() => {
  const boton = document.getElementById('instalarApp');
  const ayuda = document.getElementById('ayudaInstalacion');
  const pasos = document.getElementById('pasosInstalacion');
  let solicitud;

  function mostrarAyuda(texto) {
    pasos.textContent = texto;
    ayuda.hidden = false;
    boton.setAttribute('aria-expanded','true');
    ayuda.scrollIntoView({block:'nearest'});
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    solicitud = event;
  });
  window.addEventListener('appinstalled', () => {
    solicitud = undefined;
    mostrarAyuda('La app ya está instalada. Podés abrirla desde su ícono.');
  });

  boton.onclick = async () => {
    if (navigator.standalone || matchMedia('(display-mode: standalone)').matches) {
      mostrarAyuda('Ya estás usando Control de Materiales como app.');
      return;
    }
    if (solicitud) {
      const pendiente = solicitud;
      solicitud = undefined;
      try {
        const eleccion = await pendiente.prompt();
        if (eleccion.outcome === 'accepted') return;
      } catch {}
    }
    if (location.protocol === 'file:' || !window.isSecureContext) {
      mostrarAyuda('Abrí la dirección HTTPS publicada para instalar la app. Este archivo abierto directamente sirve para probar el formulario.');
      return;
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      mostrarAyuda('En Safari, tocá Compartir, elegí Agregar a pantalla de inicio y confirmá.');
      return;
    }
    mostrarAyuda('En Chrome o Edge, buscá Instalar app en la barra de direcciones o en el menú del navegador. En Android, también puede aparecer como Agregar a pantalla principal.');
  };
  document.getElementById('cerrarInstalacion').onclick = () => {
    ayuda.hidden = true;
    boton.setAttribute('aria-expanded','false');
    boton.focus();
  };

  if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('No se pudo registrar el acceso sin conexión.',error);
    });
  }
})();
