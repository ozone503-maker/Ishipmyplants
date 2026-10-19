(function () {
  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + n.toLocaleString('en-US');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Cart (saved in this browser) ----------
  const CART_KEY = 'ishipmyplants-cart';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); } catch (e) { cart = {}; }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} };
  const plantById = (id) => plants.find((p) => p.id === id);

  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }

  function renderCart() {
    $('cartCount').textContent = cartCount();
    const rows = Object.entries(cart).map(([id, qty]) => ({ p: plantById(id), qty })).filter((r) => r.p);
    if (!rows.length) {
      $('cartItems').innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      $('cartTotal').textContent = '$0';
      $('checkoutBtn').disabled = true;
      return;
    }
    $('cartItems').innerHTML = rows.map(({ p, qty }) => `
      <div class="cart-row">
        ${p.image ? `<img src="${p.image}" alt="">` : '<div class="ph"></div>'}
        <div>
          <div>${esc(p.name)}</div>
          <div class="muted" style="font-size:.85rem">${money(p.price)}</div>
          <div class="qty">
            <button data-act="dec" data-id="${p.id}" aria-label="Decrease">−</button>
            <span>${qty}</span>
            <button data-act="inc" data-id="${p.id}" aria-label="Increase">+</button>
          </div>
          <button class="remove" data-act="rm" data-id="${p.id}">Remove</button>
        </div>
        <div><strong>${money(p.price * qty)}</strong></div>
      </div>`).join('');
    const total = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
    $('cartTotal').textContent = money(total);
    $('checkoutBtn').disabled = false;
  }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart(); renderCart();
    toast(`Added ${plantById(id).name}`);
  }

  $('cartItems').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'inc') cart[id] = (cart[id] || 0) + 1;
    if (b.dataset.act === 'dec') cart[id] = Math.max(1, (cart[id] || 1) - 1);
    if (b.dataset.act === 'rm') delete cart[id];
    saveCart(); renderCart();
  });

  $('cartBtn').addEventListener('click', () => { $('cartDrawer').hidden = false; renderCart(); });
  $('cartClose').addEventListener('click', () => { $('cartDrawer').hidden = true; });
  $('checkoutBtn').addEventListener('click', () => toast('Checkout is not connected yet.'));

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2000);
  }

  // ---------- Catalog ----------
  let activeCat = 'all';

  function imageOrPlaceholder(p, cls) {
    return p.image
      ? `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy">`
      : `<span class="placeholder" aria-hidden="true">🌿</span>`;
  }

  function renderFilters() {
    const cats = [{ value: 'all', label: 'All plants' }, ...categories.filter((c) => c.value !== 'all')];
    $('filters').innerHTML = cats.map((c) =>
      `<button class="chip ${c.value === activeCat ? 'active' : ''}" data-cat="${c.value}">${c.label}</button>`
    ).join('');
  }

  function renderProducts() {
    const list = activeCat === 'all' ? plants : plants.filter((p) => p.category === activeCat);
    $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'plant' : 'plants'}`;
    $('productGrid').innerHTML = list.map((p) => `
      <article class="card">
        <button class="card-open" data-open="${p.id}" aria-label="View ${esc(p.name)}">
          <div class="card-img">${imageOrPlaceholder(p)}</div>
        </button>
        <div class="card-body">
          <div class="card-name">${esc(p.name)}</div>
          <div class="card-sci">${esc(p.scientific)}</div>
          <p class="card-desc">${esc(p.description)}</p>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            <button class="add-btn" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`).join('');
  }

  $('filters').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    activeCat = b.dataset.cat;
    renderFilters(); renderProducts();
  });

  $('productGrid').addEventListener('click', (e) => {
    const add = e.target.closest('button[data-add]');
    if (add) return addToCart(add.dataset.add);
    const open = e.target.closest('button[data-open]');
    if (open) showProduct(open.dataset.open);
  });

  function showProduct(id) {
    const p = plantById(id);
    if (!p) return;
    $('productCard').innerHTML = `
      <div class="card-img" style="aspect-ratio:auto">${imageOrPlaceholder(p)}</div>
      <div class="modal-body">
        <button class="icon-btn modal-close" id="modalClose" aria-label="Close">×</button>
        <h3>${esc(p.name)}</h3>
        <div class="card-sci">${esc(p.scientific)}</div>
        <p>${esc(p.description)}</p>
        <dl>
          <dt>Care</dt><dd>${esc(p.careLevel)}</dd>
          <dt>Water</dt><dd>${esc(p.water)}</dd>
          <dt>Light</dt><dd>${esc(p.sun)}</dd>
          <dt>Height</dt><dd>${esc(p.height)}</dd>
        </dl>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" id="modalAdd">Add to cart</button>
        </div>
      </div>`;
    $('productModal').hidden = false;
    $('modalClose').onclick = closeModal;
    $('modalAdd').onclick = () => { addToCart(id); closeModal(); };
  }
  function closeModal() { $('productModal').hidden = true; }
  $('productModal').addEventListener('click', (e) => { if (e.target.id === 'productModal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); $('cartDrawer').hidden = true; } });

  // ---------- Plant ID ----------
  const idDrop = $('idDrop'), idInput = $('idInput');
  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  idInput.addEventListener('change', () => idInput.files[0] && identify(idInput.files[0]));

  async function identify(file) {
    const result = $('idResult');
    const dataUrl = await readAsDataURL(file);
    $('idPrompt').textContent = file.name;
    result.hidden = false;
    result.innerHTML = `<img src="${dataUrl}" alt="Your photo"><p class="note">Identifying…</p>`;
    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (res.status === 503) {
        result.innerHTML = `<img src="${dataUrl}" alt="Your photo"><p class="note">Plant ID is not connected yet. It needs a Plant.id API key on the server.</p>`;
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const s = data.suggestions[0];
      const match = plants.find((p) => s.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
      result.innerHTML = `
        <img src="${dataUrl}" alt="Your photo">
        <h3>${esc(s.name)}</h3>
        <p class="note">${Math.round(s.probability * 100)}% confidence</p>
        ${match ? `<p style="margin-top:.75rem">We carry this: <button class="btn btn-secondary" data-open="${match.id}">View ${esc(match.name)}</button></p>` : ''}`;
    } catch (err) {
      result.innerHTML = `<img src="${dataUrl}" alt="Your photo"><p class="note">Could not identify this photo. Try a closer shot of the leaf or flower.</p>`;
    }
  }
  $('identify').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-open]');
    if (b) showProduct(b.dataset.open);
  });
  idDrop.addEventListener('dragover', (e) => e.preventDefault());
  idDrop.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files[0]) identify(e.dataTransfer.files[0]); });

  // ---------- Yard Visualizer ----------
  const canvas = $('yardCanvas');
  const ctx = canvas.getContext('2d');
  let yardImg = null;            // background photo
  let placed = [];               // {plantId, x, y, size} in image-pixel space
  let selectedPlant = null;      // palette choice
  let selectedIdx = -1;          // placed item
  let dragging = null;           // {idx, dx, dy}
  const imgCache = {};

  function loadPlantImg(p) {
    const src = p.cutout || p.image;
    if (!src) return null;
    if (!imgCache[src]) {
      const i = new Image();
      i.src = src;
      imgCache[src] = i;
    }
    return imgCache[src];
  }

  function buildPalette() {
    $('palette').innerHTML = plants.map((p) => `
      <button class="swatch ${selectedPlant === p.id ? 'active' : ''}" data-pick="${p.id}" title="${esc(p.name)}">
        ${p.image ? `<img src="${p.image}" alt="">` : '<div class="ph"></div>'}
        ${esc(p.name)}
      </button>`).join('');
  }
  $('palette').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-pick]');
    if (!b) return;
    selectedPlant = b.dataset.pick;
    buildPalette();
    toast(`Click the yard to place ${plantById(selectedPlant).name}`);
  });

  $('yardInput').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = await readAsDataURL(f);
    const img = new Image();
    img.onload = () => {
      yardImg = img;
      placed = [];
      selectedIdx = -1;
      $('yardEmpty').hidden = true;
      $('yardControls').hidden = false;
      sizeCanvas();
      draw();
      buildPalette();
    };
    img.src = url;
  });

  function sizeCanvas() {
    // Keep the photo's real proportions; cap width for screens
    const maxW = Math.min(960, canvas.parentElement.clientWidth || 960);
    const scale = Math.min(1, maxW / yardImg.naturalWidth);
    canvas.width = Math.round(yardImg.naturalWidth * scale);
    canvas.height = Math.round(yardImg.naturalHeight * scale);
  }

  function draw() {
    if (!yardImg) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    placed.forEach((item, i) => {
      const p = plantById(item.plantId);
      const pimg = loadPlantImg(p);
      const s = item.size;
      if (pimg && pimg.complete && pimg.naturalWidth) {
        ctx.drawImage(pimg, item.x - s / 2, item.y - s / 2, s, s);
      } else {
        ctx.fillStyle = 'rgba(214,58,14,0.85)';
        ctx.beginPath();
        ctx.arc(item.x, item.y, s / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `600 ${Math.max(12, s / 6)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.name.split(' ')[0], item.x, item.y);
      }
      if (i === selectedIdx) {
        ctx.strokeStyle = '#ff5a1f';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(item.x - s / 2, item.y - s / 2, s, s);
        ctx.setLineDash([]);
      }
    });
  }

  // Redraw as plant photos finish loading
  Object.values(imgCache).forEach((i) => i.addEventListener('load', draw));

  function pointer(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - r.left) * (canvas.width / r.width),
      y: (src.clientY - r.top) * (canvas.height / r.height),
    };
  }

  function hitTest(pt) {
    for (let i = placed.length - 1; i >= 0; i--) {
      const it = placed[i];
      if (Math.abs(pt.x - it.x) <= it.size / 2 && Math.abs(pt.y - it.y) <= it.size / 2) return i;
    }
    return -1;
  }

  function syncSlider() {
    const it = placed[selectedIdx];
    $('sizeSlider').value = it ? it.size : 160;
    $('sizeSlider').disabled = !it;
  }

  function down(e) {
    if (!yardImg) return;
    const pt = pointer(e);
    const hit = hitTest(pt);
    if (hit >= 0) {
      selectedIdx = hit;
      dragging = { idx: hit, dx: pt.x - placed[hit].x, dy: pt.y - placed[hit].y };
    } else if (selectedPlant) {
      const size = 160;
      placed.push({ plantId: selectedPlant, x: pt.x, y: pt.y, size });
      selectedIdx = placed.length - 1;
    } else {
      selectedIdx = -1;
    }
    syncSlider(); draw();
  }
  function move(e) {
    if (!dragging) return;
    const pt = pointer(e);
    placed[dragging.idx].x = pt.x - dragging.dx;
    placed[dragging.idx].y = pt.y - dragging.dy;
    draw();
    if (e.cancelable) e.preventDefault();
  }
  function up() { dragging = null; }

  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', up);

  $('sizeSlider').addEventListener('input', (e) => {
    if (selectedIdx < 0) return;
    placed[selectedIdx].size = Number(e.target.value);
    draw();
  });
  $('deleteBtn').addEventListener('click', () => {
    if (selectedIdx < 0) return;
    placed.splice(selectedIdx, 1);
    selectedIdx = -1; syncSlider(); draw();
  });
  $('clearBtn').addEventListener('click', () => {
    placed = []; selectedIdx = -1; syncSlider(); draw();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdx >= 0 && document.activeElement === document.body) {
      placed.splice(selectedIdx, 1); selectedIdx = -1; syncSlider(); draw();
    }
  });
  window.addEventListener('resize', () => { if (yardImg) { sizeCanvas(); draw(); } });

  // ---------- Init ----------
  renderFilters();
  renderProducts();
  buildPalette();
  renderCart();
  syncSlider();
})();
