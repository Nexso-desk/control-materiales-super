(() => {
  const config = window.configBaseRetiros;
  const valido = /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(config.url)
    && /^sb_publishable_[A-Za-z0-9_-]+$/.test(config.clavePublicable);
  const base = config.url.replace(/\/$/, '');
  let token;
  async function solicitar(ruta, opciones = {}, usarSesion = true) {
    if (!valido) throw new Error('La base compartida todavía no está configurada.');
    let respuesta;
    try {
      respuesta = await fetch(base + ruta, {
        ...opciones,
        signal: AbortSignal.timeout(15000),
        headers: {
          apikey: config.clavePublicable,
          'Content-Type':'application/json',
          ...(usarSesion && token ? {Authorization:'Bearer '+token} : {}),
          ...opciones.headers,
        },
      });
    } catch {
      throw new Error('No hubo respuesta de la base. Revisá la conexión e intentá nuevamente.');
    }
    if (!respuesta.ok) {
      if (usarSesion && respuesta.status === 401) token = undefined;
      throw new Error(usarSesion && respuesta.status === 401 ? 'Iniciá sesión nuevamente.' : 'La base rechazó la operación. Consultá con un administrador.');
    }
    return respuesta.json();
  }
  window.baseRetiros = {
    async ingresar(email,password) {
      token = undefined;
      const sesion = await solicitar('/auth/v1/token?grant_type=password', {method:'POST',body:JSON.stringify({email,password})});
      token = sesion.access_token;
      try {
        const [acceso] = await solicitar('/rest/v1/accesos_retiros?select=administrador');
        if (!acceso) throw new Error('Tu cuenta todavía no está habilitada para Control de Materiales.');
        return acceso.administrador;
      } catch (error) {
        token = undefined;
        throw error;
      }
    },
    salir() { token = undefined; },
    async guardar(retiro) {
      const folio = await solicitar('/rest/v1/rpc/recibir_retiro_materiales',
        {method:'POST',body:JSON.stringify({p_retiro:retiro})}, false);
      if (folio !== retiro.folio) throw new Error('No se pudo verificar que el retiro quedó guardado.');
    },
    async consultar() {
      if (!token) throw new Error('Ingresá con tu cuenta para consultar los retiros.');
      const registros = [];
      const limite = 100;
      let corte;
      for (let offset = 0; ; offset += limite) {
        const filtros = new URLSearchParams({select:'retiro,recibido',order:'recibido.desc,folio.asc,autor.asc',limit:String(limite),offset:String(offset)});
        if (corte) filtros.set('recibido','lte.'+corte);
        const pagina = await solicitar('/rest/v1/retiros_materiales?'+filtros);
        corte ??= pagina[0]?.recibido;
        registros.push(...pagina.map(fila=>fila.retiro));
        if (pagina.length < limite) return registros;
      }
    },
  };
})();
