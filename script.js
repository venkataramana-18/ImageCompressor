// ════════════════════════════════════════
//  IMAGE COMPRESSOR — script.js
//  No libraries needed. Pure JavaScript.
// ════════════════════════════════════════

// ── 1. Store the files the user picks ──
let selectedFiles = [];

// ── 2. Get references to all the HTML elements we'll need ──
const dropZone      = document.getElementById('drop-zone');
const fileInput     = document.getElementById('file-input');
const settings      = document.getElementById('settings');
const qualitySlider = document.getElementById('quality');
const qualityVal    = document.getElementById('quality-val');
const formatSelect  = document.getElementById('format');
const compressBtn   = document.getElementById('compress-btn');
const resultsDiv    = document.getElementById('results');


// ════════════════════════════════════════
//  QUALITY SLIDER
//  Updates the "80%" label as user drags
// ════════════════════════════════════════
qualitySlider.addEventListener('input', () => {
  qualityVal.textContent = qualitySlider.value + '%';
});


// ════════════════════════════════════════
//  FILE SELECTION — clicking the drop zone
// ════════════════════════════════════════

// Clicking anywhere in the drop zone opens the file picker
dropZone.addEventListener('click', () => {
  fileInput.click();
});

// When user picks files via the file picker
fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});


// ════════════════════════════════════════
//  DRAG AND DROP
// ════════════════════════════════════════

// Prevent browser from opening the file when dragged
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

// Remove highlight when drag leaves
dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
});

// User drops files on the zone
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});


// ════════════════════════════════════════
//  HANDLE FILES
//  Called when files are picked or dropped
// ════════════════════════════════════════
function handleFiles(files) {
  // Only keep image files, maximum 10
  selectedFiles = Array.from(files)
    .filter(f => f.type.startsWith('image/'))
    .slice(0, 10);

  if (selectedFiles.length === 0) {
    alert('No image files found. Please select JPG, PNG, or WebP images.');
    return;
  }

  // Show the settings panel
  settings.classList.remove('hidden');

  // Clear any previous results
  resultsDiv.innerHTML = '';

  // Show a preview of selected files
  showSelectedPreview();
}


// ════════════════════════════════════════
//  SHOW SELECTED FILES PREVIEW
//  Small thumbnails before compression
// ════════════════════════════════════════
function showSelectedPreview() {
  resultsDiv.innerHTML = `<p class="results-header">
    ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} selected — 
    adjust settings and click Compress
  </p>`;
}


// ════════════════════════════════════════
//  COMPRESS BUTTON CLICKED
// ════════════════════════════════════════
compressBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) return;

  // Update button while working
  compressBtn.textContent = '⏳ Compressing...';
  compressBtn.disabled = true;

  // Clear old results
  resultsDiv.innerHTML = `<p class="results-header">Results</p>`;

  // Read settings
  const quality = parseInt(qualitySlider.value) / 100; // convert 80 → 0.80
  const format  = formatSelect.value;                   // e.g. "image/jpeg"

  // Array to store compressed blobs for "Download All"
  const compressedFiles = [];

  // Compress each file, one at a time
  for (const file of selectedFiles) {
    const result = await compressImage(file, quality, format);
    compressedFiles.push(result);
    showResult(file, result.blob, result.format);
  }

  // Show "Download All" button if more than 1 file
  if (compressedFiles.length > 1) {
    showDownloadAllButton(compressedFiles);
  }

  // Re-enable button
  compressBtn.textContent = '⚡ Compress All Images';
  compressBtn.disabled = false;
});


// ════════════════════════════════════════
//  CORE COMPRESSION FUNCTION
//  Uses the browser's Canvas API
//  No external library needed!
// ════════════════════════════════════════
function compressImage(file, quality, format) {
  return new Promise((resolve) => {

    // Step 1: Read the file as a data URL (base64 string)
    const reader = new FileReader();

    reader.onload = (e) => {

      // Step 2: Create an Image element and load the data URL into it
      const img = new Image();

      img.onload = () => {

        // Step 3: Create an invisible canvas the same size as the image
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;

        // Step 4: Draw the image onto the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Step 5: Export canvas as compressed Blob
        // The 3rd parameter (quality) only affects JPEG and WebP
        // PNG is always lossless (quality is ignored)
        canvas.toBlob((blob) => {
          resolve({ blob, format });
        }, format, quality);

      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}


// ════════════════════════════════════════
//  SHOW ONE RESULT CARD
// ════════════════════════════════════════
function showResult(originalFile, compressedBlob, format) {
  const originalSize   = originalFile.size;
  const compressedSize = compressedBlob.size;

  // Calculate how much smaller the file got
  const savingPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  const savedBytes    = originalSize - compressedSize;

  // Build the download filename
  // e.g. "photo.jpg" → "photo_compressed.jpg"
  const ext       = format.split('/')[1];               // "jpeg", "png", "webp"
  const cleanExt  = ext === 'jpeg' ? 'jpg' : ext;        // "jpeg" → "jpg"
  const baseName  = originalFile.name.replace(/\.[^.]+$/, ''); // remove old ext
  const dlName    = baseName + '_compressed.' + cleanExt;

  // Create a temporary URL for the compressed image
  const url = URL.createObjectURL(compressedBlob);

  // Determine saving label color
  const savingClass = savingPercent >= 10 ? 'good' : 'warn';
  const savingLabel = savingPercent > 0
    ? `↓ ${savingPercent}% smaller (saved ${formatBytes(savedBytes)})`
    : '⚠ File not reduced — try lower quality or a different format';

  // Build the card
  const card = document.createElement('div');
  card.className = 'result-card';

  card.innerHTML = `
    <img src="${url}" class="result-thumb" alt="Compressed preview">
    <div class="result-info">
      <div class="result-name" title="${originalFile.name}">${originalFile.name}</div>
      <div class="result-sizes">
        ${formatBytes(originalSize)} → <strong>${formatBytes(compressedSize)}</strong>
      </div>
      <div class="result-saving ${savingClass}">${savingLabel}</div>
    </div>
    <a href="${url}" download="${dlName}" class="download-btn">
      ⬇ Download
    </a>
  `;

  resultsDiv.appendChild(card);
}


// ════════════════════════════════════════
//  DOWNLOAD ALL BUTTON
//  Triggers one download at a time for
//  all compressed images
// ════════════════════════════════════════
function showDownloadAllButton(compressedFiles) {
  // Remove old button if present
  const old = document.getElementById('download-all-wrap');
  if (old) old.remove();

  const wrap = document.createElement('div');
  wrap.id = 'download-all-wrap';

  const btn = document.createElement('button');
  btn.id = 'download-all-btn';
  btn.textContent = `⬇ Download All ${compressedFiles.length} Files`;

  btn.addEventListener('click', () => {
    compressedFiles.forEach((item, i) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(item.blob);
      const ext = item.format.split('/')[1] === 'jpeg' ? 'jpg' : item.format.split('/')[1];
      link.download = `compressed_${i + 1}.${ext}`;
      link.click();
    });
  });

  wrap.appendChild(btn);
  resultsDiv.appendChild(wrap);
}


// ════════════════════════════════════════
//  HELPER: Format bytes into readable size
//  e.g. 1048576 → "1.0 MB"
// ════════════════════════════════════════
function formatBytes(bytes) {
  if (bytes < 1024)     return bytes + ' B';
  if (bytes < 1048576)  return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}