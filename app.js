// State Manajemen Aplikasi
const state = {
  frameImg: null,
  photoImg: null,
  x: 540,          // Posisi X pusat foto di canvas (default center)
  y: 540,          // Posisi Y pusat foto di canvas
  scale: 1,        // Skala zoom
  rotation: 0,     // Derajat rotasi
  flipH: 1,        // 1 atau -1
  flipV: 1,        // 1 atau -1
  filter: 'none',  // Filter efek foto
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  photoStartX: 0,
  photoStartY: 0
};

// Elemen DOM
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const emptyState = document.getElementById('canvasEmptyState');
const btnDownload = document.getElementById('btnDownload');
const btnResetAll = document.getElementById('btnResetAll');
const inputFrame = document.getElementById('inputFrame');
const inputPhoto = document.getElementById('inputPhoto');
const zoomRange = document.getElementById('zoomRange');
const zoomVal = document.getElementById('zoomVal');
const rotateRange = document.getElementById('rotateRange');
const rotateVal = document.getElementById('rotateVal');
const btnFlipH = document.getElementById('btnFlipH');
const btnFlipV = document.getElementById('btnFlipV');
const btnCenterPhoto = document.getElementById('btnCenterPhoto');
const btnResetTransform = document.getElementById('btnResetTransform');
const filterChips = document.querySelectorAll('.chip');
const templateItems = document.querySelectorAll('.template-item');
const canvasContainer = document.getElementById('canvasContainer');

// Ukuran patokan resolusi canvas (1080 x 1080 HD Square)
const CANVAS_SIZE = 1080;

// Inisialisasi
window.addEventListener('DOMContentLoaded', () => {
  // Load default template awal
  loadFrameFromUrl('assets/template-1.svg');
  setupEventListeners();
});

// Render Utama Canvas
function render() {
  // Bersihkan canvas
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // 1. Gambar Layer Foto Pengguna (Di Bawah)
  if (state.photoImg) {
    emptyState.style.display = 'none';
    btnDownload.disabled = false;

    ctx.save();
    
    // Terapkan filter visual foto
    applyPhotoFilter(ctx, state.filter);

    // Transformasi: Pindahkan origin ke (x, y) foto
    ctx.translate(state.x, state.y);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.scale * state.flipH, state.scale * state.flipV);

    // Gambar foto terpusat di titik translasi
    const pw = state.photoImg.width;
    const ph = state.photoImg.height;
    ctx.drawImage(state.photoImg, -pw / 2, -ph / 2, pw, ph);

    ctx.restore();
  } else {
    emptyState.style.display = 'flex';
    btnDownload.disabled = true;
  }

  // 2. Gambar Layer Bingkai Twibbon (Di Atas)
  if (state.frameImg) {
    ctx.drawImage(state.frameImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

// Terapkan Filter pada Canvas Context
function applyPhotoFilter(context, filterName) {
  switch (filterName) {
    case 'bright':
      context.filter = 'brightness(1.15) contrast(1.05)';
      break;
    case 'contrast':
      context.filter = 'contrast(1.3) saturate(1.1)';
      break;
    case 'grayscale':
      context.filter = 'grayscale(100%)';
      break;
    case 'warm':
      context.filter = 'sepia(25%) saturate(1.2) hue-rotate(-10deg)';
      break;
    default:
      context.filter = 'none';
  }
}

// Muat Frame Twibbon dari URL / Asset
function loadFrameFromUrl(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.frameImg = img;
    render();
  };
  img.src = url;
}

// Setup Event Listeners
function setupEventListeners() {
  // 1. Template Bawaan
  templateItems.forEach(item => {
    item.addEventListener('click', () => {
      templateItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const src = item.getAttribute('data-src');
      loadFrameFromUrl(src);
    });
  });

  // 2. Input Upload Frame Kustom
  inputFrame.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.frameImg = img;
          templateItems.forEach(i => i.classList.remove('active'));
          render();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // 3. Input Upload Foto Pengguna
  inputPhoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.photoImg = img;
          // Hitung skala otomatis agar foto pas memenuhi frame
          autoFitPhoto(img);
          render();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // 4. Slider Zoom
  zoomRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    zoomVal.textContent = `${val}%`;
    if (state.photoImg) {
      // Skala relatif terhadap ukuran autofit dasar
      state.scale = (val / 100) * state.baseScale;
      render();
    }
  });

  // 5. Slider Rotasi
  rotateRange.addEventListener('input', (e) => {
    state.rotation = parseInt(e.target.value, 10);
    rotateVal.textContent = `${state.rotation}°`;
    render();
  });

  // 6. Flip Tombol
  btnFlipH.addEventListener('click', () => {
    state.flipH *= -1;
    render();
  });

  btnFlipV.addEventListener('click', () => {
    state.flipV *= -1;
    render();
  });

  // 7. Tombol Pusatkan Foto
  btnCenterPhoto.addEventListener('click', () => {
    state.x = CANVAS_SIZE / 2;
    state.y = CANVAS_SIZE / 2;
    render();
  });

  // 8. Tombol Reset Transformasi Foto
  btnResetTransform.addEventListener('click', () => {
    if (state.photoImg) {
      autoFitPhoto(state.photoImg);
      render();
    }
  });

  // 9. Tombol Reset Semua
  btnResetAll.addEventListener('click', () => {
    state.photoImg = null;
    state.x = CANVAS_SIZE / 2;
    state.y = CANVAS_SIZE / 2;
    state.rotation = 0;
    state.flipH = 1;
    state.flipV = 1;
    state.filter = 'none';
    rotateRange.value = 0;
    rotateVal.textContent = '0°';
    zoomRange.value = 100;
    zoomVal.textContent = '100%';
    filterChips.forEach(c => c.classList.remove('active'));
    document.querySelector('.chip[data-filter="none"]').classList.add('active');
    inputPhoto.value = '';
    render();
  });

  // 10. Filter Chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filter = chip.getAttribute('data-filter');
      render();
    });
  });

  // 11. Mouse & Touch Dragging pada Canvas
  setupCanvasInteractions();

  // 12. Tombol Unduh Hasil
  btnDownload.addEventListener('click', downloadResult);
}

// Menyesuaikan ukuran awal foto saat diunggah (Autofit)
function autoFitPhoto(img) {
  state.x = CANVAS_SIZE / 2;
  state.y = CANVAS_SIZE / 2;
  state.rotation = 0;
  state.flipH = 1;
  state.flipV = 1;
  rotateRange.value = 0;
  rotateVal.textContent = '0°';
  zoomRange.value = 100;
  zoomVal.textContent = '100%';

  // Skala agar minimal menutupi area 750px
  const targetDimension = 800;
  const maxSide = Math.max(img.width, img.height);
  state.baseScale = targetDimension / maxSide;
  state.scale = state.baseScale;
}

// Drag & Drop / Gesture Handling
function setupCanvasInteractions() {
  // Fungsi konversi pointer ke koordinat canvas
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function onPointerDown(e) {
    if (!state.photoImg) return;
    state.isDragging = true;
    const pos = getCanvasCoords(e);
    state.dragStartX = pos.x;
    state.dragStartY = pos.y;
    state.photoStartX = state.x;
    state.photoStartY = state.y;
  }

  function onPointerMove(e) {
    if (!state.isDragging || !state.photoImg) return;
    if (e.cancelable) e.preventDefault();
    const pos = getCanvasCoords(e);
    const dx = pos.x - state.dragStartX;
    const dy = pos.y - state.dragStartY;
    state.x = state.photoStartX + dx;
    state.y = state.photoStartY + dy;
    render();
  }

  function onPointerUp() {
    state.isDragging = false;
  }

  // Mouse events
  canvasContainer.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Touch events (Mobile friendly)
  canvasContainer.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  // Wheel Zoom (Scroll mouse)
  canvasContainer.addEventListener('wheel', (e) => {
    if (!state.photoImg) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    let newZoom = parseInt(zoomRange.value, 10) + delta;
    newZoom = Math.max(20, Math.min(300, newZoom));
    zoomRange.value = newZoom;
    zoomVal.textContent = `${newZoom}%`;
    state.scale = (newZoom / 100) * state.baseScale;
    render();
  }, { passive: false });
}

// Download Hasil Akhir
function downloadResult() {
  if (!state.photoImg) return;

  // Pastikan render dalam kondisi bersih
  render();

  // Buat link download
  const link = document.createElement('a');
  link.download = `twibbon-result-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
