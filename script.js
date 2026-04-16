// ============================================================
// API CONFIG
// ============================================================
const API_BASE = 'https://haps-backend.vercel.app/api';
 
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('haps_admin_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
}
 
// ============================================================
// PRODUCT DATA — loaded from API
// ============================================================
let products = [];
 
// ============================================================
// PRODUCT IMAGE RENDERER
// ============================================================
const typeBg = {
  ro:    "linear-gradient(145deg, #dff0fa 0%, #b8ddf5 100%)",
  uv:    "linear-gradient(145deg, #d9f5f8 0%, #a8e6ec 100%)",
  uf:    "linear-gradient(145deg, #ddeeff 0%, #aaccee 100%)",
  combo: "linear-gradient(145deg, #e4e8ff 0%, #bbc5f5 100%)"
};
const typeBorder = {
  ro: "#7ec8ed", uv: "#6dd5dd", uf: "#7ab8e8", combo: "#8c9ee8"
};
 
function getProductImage(imageUrl, type, forModal) {
  const bg     = typeBg[type]     || typeBg.ro;
  const border = typeBorder[type] || typeBorder.ro;
  const size   = forModal ? "86%" : "78%";
  const uid    = "img_" + Math.random().toString(36).slice(2, 8);
  return `
    <div style="width:100%;height:100%;background:${bg};display:flex;
                align-items:center;justify-content:center;
                position:relative;overflow:hidden;border-radius:inherit;">
      <div style="position:absolute;width:55%;height:55%;border-radius:50%;
                  background:rgba(255,255,255,0.65);border:2px solid ${border};
                  top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;"></div>
      <img id="${uid}" src="${imageUrl}" alt="Water Purifier"
        style="width:${size};height:${size};object-fit:contain;position:relative;z-index:1;
               transition:transform 0.45s ease,filter 0.45s ease;
               filter:drop-shadow(0 10px 18px rgba(0,70,140,0.20));"
        onerror="document.getElementById('${uid}').style.display='none';
                 document.getElementById('fb_${uid}').style.display='flex';" />
      <div id="fb_${uid}" style="display:none;position:absolute;inset:0;flex-direction:column;
                                  align-items:center;justify-content:center;gap:8px;">
        <i class="fas fa-tint" style="font-size:2.8rem;color:#0093d1;opacity:0.7;"></i>
        <span style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;
                     text-transform:uppercase;color:#6b9ec5;">${(type||'').toUpperCase()} Purifier</span>
      </div>
    </div>`;
}
 
// ============================================================
// RENDER PRODUCTS GRID
// ============================================================
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
 
  if (!products.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-light);">
        <i class="fas fa-tint" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:16px;"></i>
        No products found.
      </div>`;
    return;
  }
 
  products.forEach((p, i) => {
    const features  = Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');
    const tags      = Array.isArray(p.tags)     ? p.tags     : JSON.parse(p.tags     || '[]');
    const desc      = p.description || p.desc   || '';
    const typeLabel = p.type_label  || p.typeLabel || '';
 
    const card = document.createElement('div');
    card.className = 'product-card reveal';
    card.setAttribute('data-type', p.type);
    card.setAttribute('data-delay', String((i % 4) + 1));
    card.setAttribute('data-id', p.id);
    card.innerHTML = `
      <div class="product-card-img">
        ${getProductImage(p.image, p.type)}
        <span class="product-tag">${typeLabel}</span>
        <span class="product-brand-tag">${p.brand}</span>
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <p class="product-card-desc">${desc.substring(0, 100)}…</p>
        <div class="product-features-mini">
          ${tags.map(t => `<span class="feat-chip">${t}</span>`).join('')}
          <span class="feat-chip">${(p.type||'').toUpperCase()}</span>
        </div>
        <div class="product-footer">
          <div class="product-price">₹${Number(p.price).toLocaleString('en-IN')}<span>/system</span></div>
          <button class="product-view-btn" onclick="openModal(${p.id})">View Details</button>
        </div>
      </div>`;
    grid.appendChild(card);
    setTimeout(() => { card.classList.add('visible'); }, i * 80);
  });
 
  setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(observeReveal);
  }, 100);
}
 
// ============================================================
// FILTER PRODUCTS
// ============================================================
async function filterProducts(type, el) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  try {
    const query = type !== 'all' ? `?type=${type}` : '';
    const data  = await apiFetch(`/products${query}`);
    products    = data.products || [];
  } catch (err) {
    console.warn('Filter failed:', err.message);
  }
  renderProducts();
}
 
// ============================================================
// PRODUCT DETAIL MODAL
// ============================================================
let currentProduct = null;
 
function openModal(id) {
  const p = products.find(x => x.id == id);
  if (!p) return;
  currentProduct = p;
 
  const features  = Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');
  const desc      = p.description || p.desc || '';
  const typeLabel = p.type_label  || p.typeLabel || '';
  const origPrice = p.orig_price  || p.origPrice || p.price;
 
  document.getElementById('modal-title').textContent      = p.name;
  document.getElementById('modal-brand').innerHTML        =
    `<i class="fas fa-tag" style="margin-right:6px;color:var(--blue-bright);"></i>
     Brand: <strong>${p.brand}</strong> &nbsp;|&nbsp;
     <i class="fas fa-layer-group" style="color:var(--blue-bright);"></i> ${typeLabel}`;
  document.getElementById('modal-desc').textContent       = desc;
  document.getElementById('modal-price').textContent      = `₹${Number(p.price).toLocaleString('en-IN')}`;
  document.getElementById('modal-orig-price').textContent = `MRP ₹${Number(origPrice).toLocaleString('en-IN')}`;
  document.getElementById('modal-warranty').textContent   = p.warranty || '1 Year';
  document.getElementById('modal-tags').innerHTML         =
    `<span class="product-tag"       style="position:static;">${typeLabel}</span>
     <span class="product-brand-tag" style="position:static;">${p.brand}</span>`;
  document.getElementById('modal-features').innerHTML     =
    features.map(f => `<div class="modal-feat-item"><i class="fas fa-check-circle"></i> ${f}</div>`).join('');
  document.getElementById('modal-main-img').innerHTML     = getProductImage(p.image, p.type, true);
  document.getElementById('modal-thumbs').innerHTML       = [0,1,2].map((n, i) => `
    <div class="modal-thumb ${i===0?'active':''}"
         onclick="selectThumb(this,'${p.image}','${p.type}')">
      <img src="${p.image}" alt="view ${i+1}"
           style="width:75%;height:75%;object-fit:contain;"
           onerror="this.style.display='none'">
    </div>`).join('');
 
  document.getElementById('product-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
 
function selectThumb(el, imageUrl, type) {
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('modal-main-img').innerHTML = getProductImage(imageUrl, type, true);
}
 
function closeModal() {
  document.getElementById('product-modal').classList.remove('open');
  document.body.style.overflow = '';
}
 
function bookThisProduct() {
  closeModal();
  if (currentProduct) selectBookingProduct(currentProduct.id);
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}
 
function addToWhatsApp() {
  if (!currentProduct) return;
  const typeLabel = currentProduct.type_label || currentProduct.typeLabel || '';
  const msg = `Hi HAPS! I'm interested in *${currentProduct.name}* (${typeLabel}) priced at ₹${Number(currentProduct.price).toLocaleString('en-IN')}. Please share more details.`;
  window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
}
 
document.getElementById('product-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
 
// ============================================================
// BOOKING FLOW
// ============================================================
let bookingState = { step: 1, selectedProduct: null, paymentMethod: null };
const stepProgressMap = { 1:'0%', 2:'25%', 3:'50%', 4:'75%', 5:'100%' };
 
function renderBookingProducts() {
  const grid = document.getElementById('booking-products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(p => {
    const card     = document.createElement('div');
    card.className = 'booking-product-card';
    card.id        = `bpc-${p.id}`;
    card.onclick   = () => selectBookingProduct(p.id);
    card.innerHTML = `
      <div class="bpc-img">
        <img src="${p.image}" alt="${p.name}"
          style="width:72px;height:72px;object-fit:contain;
                 filter:drop-shadow(0 4px 8px rgba(0,60,130,0.18));"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
        <i class="fas fa-tint" style="display:none;font-size:2rem;color:#0093d1;"></i>
      </div>
      <div class="bpc-name">${p.name}</div>
      <div class="bpc-price">₹${Number(p.price).toLocaleString('en-IN')}</div>`;
    grid.appendChild(card);
  });
}
 
function selectBookingProduct(id) {
  bookingState.selectedProduct = products.find(p => p.id == id);
  document.querySelectorAll('.booking-product-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`bpc-${id}`);
  if (card) card.classList.add('selected');
  document.getElementById('next-btn').disabled = false;
}
 
function updateStepUI() {
  const s = bookingState.step;
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (!dot) continue;
    dot.className = 'step-dot';
    if (i < s)       dot.classList.add('done');
    else if (i === s) dot.classList.add('active');
  }
  const prog = document.getElementById('steps-progress');
  if (prog) prog.style.width = stepProgressMap[s];
 
  document.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));
  const stepEl = document.getElementById(`step-${s}`);
  if (stepEl) stepEl.classList.add('active');
 
  const backBtn = document.getElementById('back-btn');
  const nextBtn = document.getElementById('next-btn');
  if (backBtn) backBtn.style.visibility = (s > 1 && s < 5) ? 'visible' : 'hidden';
 
  if (s === 5) {
    document.getElementById('booking-nav').style.display = 'none';
  } else {
    document.getElementById('booking-nav').style.display = 'flex';
    if (nextBtn) {
      nextBtn.innerHTML = s === 4
        ? '<i class="fas fa-check"></i> Confirm Order'
        : 'Continue <i class="fas fa-arrow-right"></i>';
      nextBtn.disabled = (s === 1 && !bookingState.selectedProduct);
    }
  }
}
 
function populateStep2() {
  const p        = bookingState.selectedProduct;
  const features = Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');
  const desc     = p.description || p.desc || '';
  document.getElementById('step2-product-preview').innerHTML = `
    <div class="step2-img">
      <img src="${p.image}" alt="${p.name}"
        style="width:100%;height:100%;object-fit:contain;
               filter:drop-shadow(0 6px 14px rgba(0,60,130,0.18));"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
      <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">
        <i class="fas fa-tint" style="font-size:2.5rem;color:#0093d1;"></i>
      </div>
    </div>
    <div class="step2-info">
      <div class="step2-name">${p.name}</div>
      <p class="step2-desc">${desc}</p>
      <div class="step2-chips">
        ${features.slice(0, 4).map(f => `<span class="feat-chip">${f}</span>`).join('')}
      </div>
      <div class="step2-price">
        ₹${Number(p.price).toLocaleString('en-IN')}
        <span style="font-size:0.8rem;color:var(--text-light);font-weight:400;">incl. installation</span>
      </div>
    </div>`;
}
 
function populateStep4() {
  const p       = bookingState.selectedProduct;
  const install = 499;
  const gst     = Math.round(p.price * 0.18);
  const total   = p.price + install + gst;
  document.getElementById('order-summary-4').innerHTML = `
    <h4>Order Summary</h4>
    <div class="order-line"><span>${p.name}</span><span>₹${Number(p.price).toLocaleString('en-IN')}</span></div>
    <div class="order-line"><span>Installation Charges</span><span>₹${install}</span></div>
    <div class="order-line"><span>GST (18%)</span><span>₹${gst.toLocaleString('en-IN')}</span></div>
    <div class="order-line total"><span>Total Payable</span><span>₹${total.toLocaleString('en-IN')}</span></div>`;
}
 
async function bookingNext() {
  const s = bookingState.step;
 
  if (s === 1) {
    if (!bookingState.selectedProduct) { showToast('⚠️ Please select a product first.'); return; }
    populateStep2();
  } else if (s === 3) {
    const name  = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const addr  = document.getElementById('cust-address').value.trim();
    if (!name || !phone || !addr) { showToast('⚠️ Please fill all required fields.'); return; }
    populateStep4();
  } else if (s === 4) {
    if (!bookingState.paymentMethod) { showToast('⚠️ Please select a payment method.'); return; }
 
    const nextBtn     = document.getElementById('next-btn');
    nextBtn.disabled  = true;
    nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order…';
 
    try {
      const p       = bookingState.selectedProduct;
      const payload = {
        product_id:     p.id,
        cust_name:      document.getElementById('cust-name').value.trim(),
        cust_phone:     document.getElementById('cust-phone').value.trim(),
        cust_email:     document.getElementById('cust-email').value.trim(),
        cust_city:      document.getElementById('cust-city').value.trim(),
        cust_address:   document.getElementById('cust-address').value.trim(),
        preferred_date: document.getElementById('cust-date').value,
        time_slot:      document.getElementById('cust-time').value,
        payment_method: bookingState.paymentMethod
      };
 
      const data = await apiFetch('/bookings', {
        method: 'POST',
        body:   JSON.stringify(payload)
      });
 
      showConfirmation(data.booking.order_id, data.booking.total_amount);
      bookingState.step = 5;
      updateStepUI();
 
    } catch (err) {
      showToast('❌ ' + err.message);
      nextBtn.disabled  = false;
      nextBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Order';
    }
    return;
  }
 
  bookingState.step = Math.min(s + 1, 5);
  updateStepUI();
}
 
function showConfirmation(orderId, totalAmount) {
  const p       = bookingState.selectedProduct;
  const name    = document.getElementById('cust-name').value.trim();
  const phone   = document.getElementById('cust-phone').value.trim();
  const city    = document.getElementById('cust-city').value.trim();
  const date    = document.getElementById('cust-date').value;
  const time    = document.getElementById('cust-time').value;
  const payLabels = {
    upi:'UPI Payment', card:'Credit/Debit Card',
    netbanking:'Net Banking', cod:'Cash on Delivery'
  };
  document.getElementById('confirmation-content').innerHTML = `
    <div class="confirm-icon"><i class="fas fa-check"></i></div>
    <div class="confirm-title">Order Confirmed! 🎉</div>
    <p class="confirm-sub">Thank you ${name}! Our team will contact you within 2 hours.</p>
    <div class="confirm-order-id">Order ID: ${orderId}</div>
    <div class="confirm-details">
      <div class="confirm-detail-row"><span class="label">Product</span><span class="val">${p.name}</span></div>
      <div class="confirm-detail-row"><span class="label">Brand</span><span class="val">${p.brand}</span></div>
      <div class="confirm-detail-row"><span class="label">Customer</span><span class="val">${name}</span></div>
      <div class="confirm-detail-row"><span class="label">Phone</span><span class="val">${phone}</span></div>
      <div class="confirm-detail-row"><span class="label">City</span><span class="val">${city || '–'}</span></div>
      <div class="confirm-detail-row"><span class="label">Date</span><span class="val">${date || 'To be confirmed'}</span></div>
      <div class="confirm-detail-row"><span class="label">Time Slot</span><span class="val">${time}</span></div>
      <div class="confirm-detail-row"><span class="label">Payment</span><span class="val">${payLabels[bookingState.paymentMethod]}</span></div>
      <div class="confirm-detail-row"><span class="label">Total</span><span class="val">₹${Number(totalAmount).toLocaleString('en-IN')}</span></div>
    </div>
    <button class="btn btn-primary" onclick="resetBooking()" style="margin:0 auto;">
      <i class="fas fa-redo"></i> Book Another
    </button>`;
}
 
function bookingPrev() {
  bookingState.step = Math.max(bookingState.step - 1, 1);
  updateStepUI();
}
 
function selectPayment(el, method) {
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  bookingState.paymentMethod = method;
}
 
function resetBooking() {
  bookingState = { step: 1, selectedProduct: null, paymentMethod: null };
  ['cust-name','cust-phone','cust-email','cust-city','cust-address','cust-date']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('.booking-product-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.pay-method').forEach(c => c.classList.remove('selected'));
  document.getElementById('booking-nav').style.display = 'flex';
  updateStepUI();
}
 
// ============================================================
// SEARCH
// ============================================================
function toggleSearch() {
  const overlay = document.getElementById('search-overlay');
  overlay.classList.toggle('open');
  if (overlay.classList.contains('open')) {
    setTimeout(() => document.getElementById('search-input').focus(), 200);
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-empty').style.display = 'none';
    document.getElementById('search-input').value = '';
  }
  document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
}
 
function doSearch(val) {
  const q       = val.toLowerCase().trim();
  const results = document.getElementById('search-results');
  const empty   = document.getElementById('search-empty');
  if (!q) { results.innerHTML = ''; empty.style.display = 'none'; return; }
 
  const matches = products.filter(p => {
    const desc     = p.description || p.desc || '';
    const typeLabel = p.type_label || p.typeLabel || '';
    const tags     = Array.isArray(p.tags)     ? p.tags     : JSON.parse(p.tags     || '[]');
    const features = Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]');
    return p.name.toLowerCase().includes(q) ||
           p.brand.toLowerCase().includes(q) ||
           p.type.includes(q) ||
           typeLabel.toLowerCase().includes(q) ||
           desc.toLowerCase().includes(q) ||
           tags.some(t => t.toLowerCase().includes(q)) ||
           features.some(f => f.toLowerCase().includes(q));
  });
 
  if (!matches.length) { results.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  results.innerHTML = matches.map(p => `
    <div class="search-result-card" onclick="openFromSearch(${p.id})">
      <img src="${p.image}" alt="${p.name}"
           style="width:60px;height:60px;object-fit:contain;margin:0 auto 8px;
                  filter:drop-shadow(0 3px 6px rgba(0,60,130,0.2));"
           onerror="this.style.display='none'">
      <div class="sr-name">${p.name}</div>
      <div class="sr-brand">${p.brand} · ${p.type_label || p.typeLabel || ''}</div>
      <div style="margin-top:6px;font-size:0.82rem;color:var(--aqua);">
        ₹${Number(p.price).toLocaleString('en-IN')}
      </div>
    </div>`).join('');
}
 
function openFromSearch(id) {
  toggleSearch();
  setTimeout(() => {
    document.getElementById('systems').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => openModal(id), 500);
  }, 300);
}
 
// ============================================================
// NAVBAR
// ============================================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('back-top').classList.toggle('show', window.scrollY > 400);
});
 
function toggleMenu() {
  document.getElementById('hamburger-btn').classList.toggle('open');
  document.getElementById('mobile-menu').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('hamburger-btn').classList.remove('open');
  document.getElementById('mobile-menu').classList.remove('open');
}
 
// ============================================================
// SCROLL REVEAL
// ============================================================
function observeReveal(el) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  obs.observe(el);
}
 
// ============================================================
// BUBBLES
// ============================================================
function createBubbles() {
  const container = document.getElementById('bubbles-container');
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const b        = document.createElement('div');
    b.className    = 'bubble';
    const size     = Math.random() * 30 + 6;
    const left     = Math.random() * 100;
    const duration = Math.random() * 12 + 8;
    const delay    = Math.random() * 15;
    b.style.cssText =
      `width:${size}px;height:${size}px;left:${left}%;bottom:-${size}px;` +
      `animation-duration:${duration}s;animation-delay:-${delay}s;`;
    container.appendChild(b);
  }
}
 
// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
 
function sendContactForm() {
  showToast('✅ Message sent! We\'ll contact you soon.');
}
 
// ============================================================
// KEYBOARD
// ============================================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    const so = document.getElementById('search-overlay');
    if (so && so.classList.contains('open')) toggleSearch();
  }
});
 
// ============================================================
// INIT — runs when page loads
// ============================================================
async function initPage() {
  // 1. Load products from API
  try {
    const data = await apiFetch('/products');
    products   = data.products || [];
  } catch (err) {
    console.warn('Could not load products from API:', err.message);
    products = [];
  }
 
  // 2. Render everything
  renderProducts();
  renderBookingProducts();
  updateStepUI();
  createBubbles();
 
  // 3. Set min date
  const dateInput = document.getElementById('cust-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
 
  // 4. Scroll reveal for all sections
  setTimeout(() => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
            .forEach(observeReveal);
  }, 200);
}
 
// START
initPage();