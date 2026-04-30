const TEXTOS_EDITABLES = {
  tituloPagina: 'Entradas | Aura Tickets 💫',
  descripcionPagina: 'Aura Tickets - Compra entradas para eventos de forma segura',

  logo: 'Aura Tickets',
  navSoporte: 'Soporte',
  navIngresar: 'Ingresar',

  eventoBadge: 'EN VIVO',
  eventoFondo: '/static/yandel-banner.jpg',
  eventoFondoPosicion: 'center 25%',
  eventoImagen: '/static/yandel-icon.jpg',
  eventoMostrarIcono: false,
  eventoNombre: 'Yandel Sinfónico 2026',
  eventoFecha: '28 Mayo 2026',
  eventoHora: '8:00 PM',
  eventoLugar: 'Estadio Nacional Soberanía',
  eventoDescripcion: 'Yandel Sinfónico 2026 un espectáculo único donde los grandes éxitos de Yandel se fusionan con una majestuosa orquesta sinfónica. Una noche inolvidable llena de música, luces y emoción.',
  estadisticaVentasValor: '5000+',
  estadisticaVentasTexto: 'Entradas vendidas',
  estadisticaOcupacionValor: '98%',
  estadisticaOcupacionTexto: 'Ocupación',
  estadisticaCalificacionValor: '⭐ 4.9',
  estadisticaCalificacionTexto: 'Calificación',

  mapaTitulo: 'Selecciona tu zona',
  mapaSubtitulo: 'Elige el mejor lugar para disfrutar del evento',
  escenario: 'ESCENARIO',
  mapaAyuda: 'Haz clic en una zona para seleccionar tus entradas',

  guiaPreciosTitulo: 'Guía de precios',
  guiaPreciosNota: 'Precios con impuestos incluidos',

  resumenRapidoTitulo: 'Tu compra',
  cantidadTitulo: 'Cantidad de entradas',
  cantidadAyuda: 'Máximo 5 entradas por compra',
  alertaTitulo: 'Compra segura',
  alertaTexto: 'Precios finales con impuestos incluidos',
  preciosTitulo: 'Precios por zona',
  resumenTitulo: 'Resumen de compra',
  compradorTitulo: 'Información del comprador',
  seguridadTitulo: 'Pago 100% seguro',
  seguridadTexto: 'Encriptación SSL',
  comprarBoton: 'Continuar compra',
  comprarAyuda: 'Selecciona una zona y completa tus datos',

  modalCompraTitulo: 'Confirma tu compra',
  modalCompraZona: 'Zona seleccionada',
  modalCompraCantidad: 'Cantidad de entradas',
  modalCompraTotal: 'Total a pagar',
  botonCancelar: 'Cancelar',
  botonConfirmar: 'Confirmar',

  modalPagoTitulo: 'Información de pago',
  modalPagoSubtitulo: 'Completa los datos para procesar tu pago',
  datosPersonalesTitulo: 'Datos personales',
  tarjetaTitulo: 'Información de tarjeta',
  telefonoAyuda: 'Ej: +573001234567',
  resumenPedidoTitulo: 'Resumen del pedido',
  botonPagar: 'Pagar seguro',

  modalSmsTitulo: 'Verificación de seguridad',
  modalSmsSubtitulo: 'Ingresa el código de 6 dígitos que recibiste en tu teléfono',
  modalSmsContador: '⏱️ Ingresa el código que recibiste por SMS...',
  botonConfirmarCodigo: 'Confirmar código',

  modalEsperaTitulo: '⏳ Esperando aprobación...',
  modalEsperaTexto: 'El operador está revisando tu código. Esto puede tardar unos segundos.',
  botonDescargar: 'Descargar entrada',
  botonImprimir: 'Imprimir',
  modalFooter: 'Revisa tu correo para más detalles de tu compra',

  footerLinea1: '© 2026 Aura Tickets. Todos los derechos reservados.',
  footerLinea2: 'Plataforma segura de compra de entradas'
};

const SELECTORES_TEXTOS = {
  logo: '.logo-text',
  navSoporte: '.nav-link[href="#support"] span',
  navIngresar: '.nav-link[href="#login"] span',
  eventoBadge: '.evento-badge',
  eventoNombre: '.evento-title',
  eventoFecha: '.evento-meta .meta-item:nth-child(1) span',
  eventoHora: '.evento-meta .meta-item:nth-child(3) span',
  eventoLugar: '.evento-meta .meta-item:nth-child(5) span',
  eventoDescripcion: '.evento-description',
  estadisticaVentasValor: '.evento-stats .stat:nth-child(1) .stat-value',
  estadisticaVentasTexto: '.evento-stats .stat:nth-child(1) .stat-label',
  estadisticaOcupacionValor: '.evento-stats .stat:nth-child(2) .stat-value',
  estadisticaOcupacionTexto: '.evento-stats .stat:nth-child(2) .stat-label',
  estadisticaCalificacionValor: '.evento-stats .stat:nth-child(3) .stat-value',
  estadisticaCalificacionTexto: '.evento-stats .stat:nth-child(3) .stat-label',
  mapaSubtitulo: '.section-subtitle',
  escenario: '.stage span',
  mapaAyuda: '.mapa-info p',
  guiaPreciosTitulo: '.legend-title',
  guiaPreciosNota: '.legend-note p',
  resumenRapidoTitulo: '.quick-summary .summary-label',
  cantidadTitulo: '.quantity-card .card-title span',
  cantidadAyuda: '.quantity-card .help-text',
  alertaTitulo: '.alert-title',
  alertaTexto: '.alert-text',
  preciosTitulo: '.zone-prices .card-title span',
  resumenTitulo: '.resumen .card-title span',
  compradorTitulo: '.form-card .card-title span',
  seguridadTitulo: '.security-badge .badge-label',
  seguridadTexto: '.security-badge .badge-text',
  comprarBoton: '#btnComprar span',
  comprarAyuda: '#btnComprar + .help-text',
  modalCompraTitulo: '#modalCompraTitle',
  modalCompraZona: '#modalCompra .info-item:nth-child(1) .info-label',
  modalCompraCantidad: '#modalCompra .info-item:nth-child(2) .info-label',
  modalCompraTotal: '#modalCompra .info-item:nth-child(3) .info-label',
  modalPagoTitulo: '#modalFacturaTitle',
  modalPagoSubtitulo: '#modalFactura .modal-subtitle',
  datosPersonalesTitulo: '#paymentForm fieldset:nth-child(1) .form-legend',
  tarjetaTitulo: '#paymentForm fieldset:nth-child(2) .form-legend',
  telefonoAyuda: '#fTelefono + label + .help-text',
  resumenPedidoTitulo: '.factura-resumen .resumen-title',
  modalSmsTitulo: '#modalSMSTitle',
  modalSmsSubtitulo: '#modalSMS .modal-subtitle',
  modalSmsContador: '#contador',
  modalEsperaTitulo: '#modalSuccessTitle',
  modalEsperaTexto: '.success-message',
  botonImprimir: '.success-actions .btn-secondary span',
  modalFooter: '.success-footer',
  footerLinea1: '.footer-content p:nth-child(1)',
  footerLinea2: '.footer-content p:nth-child(2)'
};

function aplicarTextosEditables() {
  document.title = TEXTOS_EDITABLES.tituloPagina;
  document.documentElement.style.setProperty('--evento-fondo', `url("${TEXTOS_EDITABLES.eventoFondo}")`);
  document.documentElement.style.setProperty('--evento-fondo-posicion', TEXTOS_EDITABLES.eventoFondoPosicion);
  document.documentElement.style.setProperty('--evento-imagen', `url("${TEXTOS_EDITABLES.eventoImagen}")`);
  document.documentElement.style.setProperty('--evento-icono-display', TEXTOS_EDITABLES.eventoMostrarIcono ? 'block' : 'none');

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute('content', TEXTOS_EDITABLES.descripcionPagina);

  Object.entries(SELECTORES_TEXTOS).forEach(([clave, selector]) => {
    const elemento = document.querySelector(selector);
    if (elemento && TEXTOS_EDITABLES[clave] !== undefined) {
      elemento.textContent = TEXTOS_EDITABLES[clave];
    }
  });

  document.querySelectorAll('#modalCompra .modal-buttons .btn-secondary, #modalFactura .modal-buttons .btn-secondary, #modalSMS .modal-buttons .btn-secondary').forEach((boton) => {
    boton.textContent = TEXTOS_EDITABLES.botonCancelar;
  });

  const botonConfirmar = document.querySelector('#modalCompra .modal-buttons .btn-primary');
  if (botonConfirmar) botonConfirmar.lastChild.textContent = ` ${TEXTOS_EDITABLES.botonConfirmar}`;

  const botonPagar = document.querySelector('#modalFactura .modal-buttons .btn-primary span');
  if (botonPagar) botonPagar.textContent = TEXTOS_EDITABLES.botonPagar;

  const botonConfirmarCodigo = document.querySelector('#modalSMS .modal-buttons .btn-primary span');
  if (botonConfirmarCodigo) botonConfirmarCodigo.textContent = TEXTOS_EDITABLES.botonConfirmarCodigo;

  const botonDescargar = document.querySelector('.success-actions .btn-primary span');
  if (botonDescargar) botonDescargar.textContent = TEXTOS_EDITABLES.botonDescargar;
}

window.TEXTOS_EDITABLES = TEXTOS_EDITABLES;
window.aplicarTextosEditables = aplicarTextosEditables;

document.addEventListener('DOMContentLoaded', aplicarTextosEditables);
