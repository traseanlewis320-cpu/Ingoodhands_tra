/* --- LUMINA: ADMIN SCRIPT --- */
document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let galleryStore = JSON.parse(localStorage.getItem('lumina-gallery')) || [];
    let blockedStore = JSON.parse(localStorage.getItem('lumina-blocked')) || { dates: [], times: {} };
    let themeStore = localStorage.getItem('lumina-theme') || 'obsidian';
    let logoStore = localStorage.getItem('lumina-logo') || '';
    
    // --- UI Elements ---
    const adminLogoPrev = document.getElementById('admin-logo-preview');
    const adminTitleInp = document.getElementById('admin-title-input');
    const adminTaglineInp = document.getElementById('admin-tagline-input');
    const themeOpts = document.querySelectorAll('.theme-opt');
    const modalCrop = document.getElementById('crop-modal');
    const cropImgEl = document.getElementById('crop-image-el');
    let cropperInstance = null;
    let pendingFiles = [];

    // --- Init Controls ---
    adminLogoPrev.src = logoStore || 'https://via.placeholder.com/100?text=Logo';
    adminTitleInp.value = localStorage.getItem('lumina-title') || 'Lumina Studio';
    adminTaglineInp.value = localStorage.getItem('lumina-tagline') || 'The next level of wellness and arts.';

    themeOpts.forEach(opt => {
        if (opt.dataset.theme === themeStore) opt.classList.add('active');
        opt.onclick = () => {
            themeOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            themeStore = opt.dataset.theme;
            document.body.setAttribute('data-theme', themeStore);
        };
    });

    // --- Logo Upload ---
    document.getElementById('logo-file').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            logoStore = f.target.result;
            adminLogoPrev.src = logoStore;
        };
        reader.readAsDataURL(file);
    };

    // --- Bulk Gallery Upload with Cropping ---
    document.getElementById('bulk-file').onchange = (e) => {
        pendingFiles = Array.from(e.target.files);
        processNextFile();
    };

    function processNextFile() {
        if (pendingFiles.length === 0) {
            renderAdminGallery();
            return;
        }
        const file = pendingFiles.shift();
        const reader = new FileReader();
        reader.onload = (f) => {
            cropImgEl.src = f.target.result;
            modalCrop.classList.add('open');
            if (cropperInstance) cropperInstance.destroy();
            cropperInstance = new Cropper(cropImgEl, {
                aspectRatio: 220 / 280, // Match gallery height/width ratio
                viewMode: 1,
                dragMode: 'move',
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        };
        reader.readAsDataURL(file);
    }

    window.finishCrop = () => {
        const croppedData = cropperInstance.getCroppedCanvas({
            width: 440, // 2x for high resolution
            height: 560
        }).toDataURL('image/jpeg', 0.85);

        galleryStore.push(croppedData);
        modalCrop.classList.remove('open');
        processNextFile();
    }

    window.cancelCrop = () => {
        modalCrop.classList.remove('open');
        processNextFile();
    }

    function renderAdminGallery() {
        const list = document.getElementById('admin-gallery-list');
        list.innerHTML = '';
        galleryStore.forEach((src, idx) => {
            const div = document.createElement('div');
            div.classList.add('gallery-card');
            div.style.width = '100px';
            div.style.height = '120px';
            div.innerHTML = `<img src="${src}"><button style="position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.7); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">&times;</button>`;
            div.querySelector('button').onclick = () => {
                galleryStore.splice(idx, 1);
                renderAdminGallery();
            };
            list.appendChild(div);
        });
    }
    renderAdminGallery();

    // --- Admin Schedule Management ---
    let admCalDate = new Date();
    let admSelDate = new Date();

    function renderAdminCal() {
        const container = document.getElementById('admin-cal-container');
        container.innerHTML = '<h3>Blocked Dates</h3>';
        
        const grid = document.createElement('div');
        grid.classList.add('cal-days-grid');
        grid.style.marginTop = '20px';
        
        const monthLabel = document.createElement('h4');
        monthLabel.innerText = admCalDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthLabel.style.marginBottom = '15px';
        container.appendChild(monthLabel);
        container.appendChild(grid);

        const firstDay = new Date(admCalDate.getFullYear(), admCalDate.getMonth(), 1).getDay();
        let startGap = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < startGap; i++) grid.appendChild(document.createElement('div'));

        for (let i = 1; i <= new Date(admCalDate.getFullYear(), admCalDate.getMonth() + 1, 0).getDate(); i++) {
            const d = new Date(admCalDate.getFullYear(), admCalDate.getMonth(), i);
            const dateKey = d.toISOString().split('T')[0];
            const cell = document.createElement('div');
            cell.classList.add('cal-day-cell');
            cell.innerText = i;
            if (blockedStore.dates.includes(dateKey)) cell.style.background = 'rgba(255,0,0,0.2)';
            if (admSelDate && d.toDateString() === admSelDate.toDateString()) cell.classList.add('selected');

            cell.onclick = () => {
                admSelDate = d;
                renderAdminCal();
                renderAdminTimeBlocker();
            };

            // Double click to toggle full day block
            cell.ondblclick = () => {
                if (blockedStore.dates.includes(dateKey)) {
                    blockedStore.dates = blockedStore.dates.filter(dk => dk !== dateKey);
                } else {
                    blockedStore.dates.push(dateKey);
                }
                renderAdminCal();
            };
            grid.appendChild(cell);
        }
    }
    renderAdminCal();

    function renderAdminTimeBlocker() {
        const blocker = document.getElementById('admin-time-blocker');
        blocker.innerHTML = `<h4 style="grid-column: span 3; margin-bottom: 20px;">Block Times: ${admSelDate.toDateString()}</h4>`;
        if (!admSelDate) return;

        const dateKey = admSelDate.toISOString().split('T')[0];
        if (!blockedStore.times[dateKey]) blockedStore.times[dateKey] = [];

        for (let h = 8; h <= 20; h++) {
            for (let m of [0, 30]) {
                if (h === 20 && m === 30) continue;
                const hh = h > 12 ? h - 12 : h;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const mm = m === 0 ? '00' : '30';
                const timeStr = `${hh}:${mm} ${ampm}`;

                const btn = document.createElement('div');
                btn.classList.add('time-btn');
                if (blockedStore.times[dateKey].includes(timeStr)) btn.classList.add('blocked');
                btn.innerText = timeStr;

                btn.onclick = () => {
                    if (blockedStore.times[dateKey].includes(timeStr)) {
                        blockedStore.times[dateKey] = blockedStore.times[dateKey].filter(t => t !== timeStr);
                    } else {
                        blockedStore.times[dateKey].push(timeStr);
                    }
                    renderAdminTimeBlocker();
                };
                blocker.appendChild(btn);
            }
        }
    }
    renderAdminTimeBlocker();

    // --- Save Logic ---
    window.saveAdminChanges = () => {
        localStorage.setItem('lumina-gallery', JSON.stringify(galleryStore));
        localStorage.setItem('lumina-blocked', JSON.stringify(blockedStore));
        localStorage.setItem('lumina-theme', themeStore);
        localStorage.setItem('lumina-logo', logoStore);
        localStorage.setItem('lumina-title', adminTitleInp.value);
        localStorage.setItem('lumina-tagline', adminTaglineInp.value);
        
        alert('All changes saved to system storage.');
        window.location.reload();
    };
});
