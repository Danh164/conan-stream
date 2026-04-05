const container = document.getElementById('episodes');
const video = document.getElementById('video');
const overlay = document.getElementById('next-ep-overlay');
const countdownSpan = document.getElementById('countdown');
const cancelNextBtn = document.getElementById('cancel-next-btn');
const playNextBtn = document.getElementById('play-next-btn');
const prevBtnEl = document.getElementById('prev-btn');
const nextBtnEl = document.getElementById('next-btn');
const lightBtnEl = document.getElementById('light-btn');
const zoomBtnEl = document.getElementById('zoom-btn');

let countdownInterval = null;
let currentCountdown = 5;

let hls;
let activeBtn = null;
let currentEp = 1;

const fragment = document.createDocumentFragment();
for (let i = 1; i <= 1072; i++) {
  const btn = document.createElement('button');
  btn.innerText = 'Tập ' + i;
  btn.className = 'episode-btn';
  btn.onclick = () => {
    loadVideo(i, btn);
  };
  fragment.appendChild(btn);
  
  if (i === 1) {
    activeBtn = btn;
    btn.classList.add('active');
  }
}
container.appendChild(fragment);

async function loadVideo(ep, btn) {
  try {
    cancelNextEpisode(); // reset any ongoing countdown if user changes episode manually
    
    if (activeBtn && btn) {
      activeBtn.classList.remove('active');
    }
    if (btn) {
      btn.classList.add('active');
      activeBtn = btn;
    }
    currentEp = ep;
    updateToolbar();

    const res = await fetch(`/api/video?ep=${ep}`);
    const data = await res.json();

    if (!data.success) {
      alert("Could not load episode. Video source might not be available.");
      return;
    }

    const src = data.video;

    if (hls) {
      hls.destroy();
    }

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', function() {
        video.play();
      });
    }
  } catch (error) {
    console.error("Error loading video:", error);
    alert("Error loading video. Please check console.");
  }
}

// Load first episode initially
loadVideo(1, activeBtn);

// Auto-play next episode logic
function startNextEpisodeCountdown() {
  const nextEp = currentEp + 1;
  const nextBtn = document.querySelectorAll('.episode-btn')[nextEp - 1];
  
  if (!nextBtn) return; // No more episodes
  
  currentCountdown = 5;
  countdownSpan.innerText = currentCountdown;
  overlay.classList.remove('hidden');
  
  countdownInterval = setInterval(() => {
    currentCountdown--;
    countdownSpan.innerText = currentCountdown;
    
    if (currentCountdown <= 0) {
      playNextEpisode();
    }
  }, 1000);
}

function cancelNextEpisode() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  overlay.classList.add('hidden');
}

function playNextEpisode() {
  cancelNextEpisode();
  const nextEp = currentEp + 1;
  const nextBtn = document.querySelectorAll('.episode-btn')[nextEp - 1];
  if (nextBtn) {
    loadVideo(nextEp, nextBtn);
    // Scroll to the active button
    nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

video.addEventListener('ended', startNextEpisodeCountdown);
cancelNextBtn.addEventListener('click', cancelNextEpisode);
playNextBtn.addEventListener('click', playNextEpisode);

function updateToolbar() {
  if (prevBtnEl) prevBtnEl.disabled = currentEp <= 1;
  if (nextBtnEl) nextBtnEl.disabled = currentEp >= 1072;
}

if (prevBtnEl) {
  prevBtnEl.addEventListener('click', () => {
    if (currentEp > 1) {
      const ep = currentEp - 1;
      const btn = document.querySelectorAll('.episode-btn')[ep - 1];
      if (btn) {
        loadVideo(ep, btn);
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
}

if (nextBtnEl) {
  nextBtnEl.addEventListener('click', () => {
    playNextEpisode();
  });
}

if (lightBtnEl) {
  lightBtnEl.addEventListener('click', () => {
    document.body.classList.toggle('lights-off');
    const isOff = document.body.classList.contains('lights-off');
    lightBtnEl.innerHTML = isOff 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Bật Đèn'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Tắt Đèn';
  });
}

if (zoomBtnEl) {
  zoomBtnEl.addEventListener('click', () => {
    document.body.classList.toggle('theater-mode');
    const isTheater = document.body.classList.contains('theater-mode');
    zoomBtnEl.innerHTML = isTheater
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> Thu Nhỏ'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> Phóng To';
    
    // Dispatch resize event to ensure video layout adjusts if needed
    window.dispatchEvent(new Event('resize'));
  });
}

