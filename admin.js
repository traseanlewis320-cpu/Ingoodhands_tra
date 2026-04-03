document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let theme = JSON.parse(localStorage.getItem('lumina_theme')) || {
        primary: '#6366f1',
        secondary: '#ec4899',
        blurIntensity: 20
    };
    let gallery = JSON.parse(localStorage.getItem('lumina_gallery')) || [
        { id: 1, url: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800&auto=format&fit=crop' },
        { id: 2, url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop' },
        { id: 3, url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop' }
    ];
    let blocked = JSON.parse(localStorage.getItem('lumina_blocked')) || {
        dates: [], // YYYY-MM-DD
        times: {} // { 'YYYY-MM-DD': ['08:00 AM', '10:30 AM'] }
    };

    let admCurrentDate = new Date();
    let admSelectedDate = null;

    // Elements
    const primaryInput = document.getElementById('primary-color');
    const secondaryInput = document.getElementById('secondary-color');
    const blurInput = document.getElementById('blur-intensity');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const galleryPreview = document.getElementById('gallery-preview');
    const btnSave = document.getElementById('save-all');

    // --- Theme Logic ---
    function initTheme() {
        primaryInput.value = theme.primary;
        secondaryInput.value = theme.secondary;
        blurInput.value = theme.blurIntensity;
    }

    primaryInput.addEventListener('input', (e) => theme.primary = e.target.value);
    secondaryInput.addEventListener('input', (e) => theme.secondary = e.target.value);
    blurInput.addEventListener('input', (e) => theme.blurIntensity = e.target.value);

    // --- Gallery Logic ---
    function renderGalleryPreview() {
        galleryPreview.innerHTML = '';
        gallery.forEach((img, index) => {
            const item = document.createElement('div');
            item.classList.add('gallery-item-admin');
            item.innerHTML = `
                <img src="${img.url}" alt="Gallery image">
                <button class="delete-btn" onclick="removeImage(${index})"><i data-lucide="x"></i></button>
            `;
            galleryPreview.appendChild(item);
        });
        lucide.createIcons();
    }

    window.removeImage = (index) => {
        gallery.splice(index, 1);
        renderGalleryPreview();
    };

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    gallery.push({ id: Date.now() + Math.random(), url: e.target.result });
                    renderGalleryPreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- Availability Logic ---
    function renderAdmCalendar() {
        const calContainer = document.getElementById('adm-calendar-days');
        calContainer.innerHTML = '';
        
        const month = admCurrentDate.getMonth();
        const year = admCurrentDate.getFullYear();
        document.getElementById('adm-current-month').innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(admCurrentDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startGrid = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < startGrid; i++) calContainer.appendChild(document.createElement('div'));

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.innerText = day;

            if (blocked.dates.includes(dateStr)) dayEl.classList.add('blocked');
            if (admSelectedDate === dateStr) dayEl.classList.add('selected');

            dayEl.addEventListener('click', () => {
                admSelectedDate = dateStr;
                // Optional: toggle block full day on double click or separate UI
                // For now, click selects, then we handle time slots
                renderAdmCalendar();
                renderAdmTimeSlots(dateStr);
            });

            dayEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (blocked.dates.includes(dateStr)) {
                    blocked.dates = blocked.dates.filter(d => d !== dateStr);
                } else {
                    blocked.dates.push(dateStr);
                }
                renderAdmCalendar();
            });

            calContainer.appendChild(dayEl);
        }
    }

    function renderAdmTimeSlots(dateStr) {
        const slotsContainer = document.getElementById('adm-time-slots');
        slotsContainer.innerHTML = '';
        if (!dateStr) return;

        const start = 8 * 60;
        const end = 20 * 60;
        const step = 30;

        for (let time = start; time <= end; time += step) {
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            const displayMinutes = minutes === 0 ? '00' : minutes;
            const timeString = `${displayHours}:${displayMinutes} ${period}`;

            const slot = document.createElement('div');
            slot.classList.add('time-slot');
            slot.innerText = timeString;

            const isBlocked = blocked.times[dateStr] && blocked.times[dateStr].includes(timeString);
            if (isBlocked) slot.classList.add('blocked');

            slot.addEventListener('click', () => {
                if (!blocked.times[dateStr]) blocked.times[dateStr] = [];
                if (blocked.times[dateStr].includes(timeString)) {
                    blocked.times[dateStr] = blocked.times[dateStr].filter(t => t !== timeString);
                } else {
                    blocked.times[dateStr].push(timeString);
                }
                renderAdmTimeSlots(dateStr);
            });

            slotsContainer.appendChild(slot);
        }
    }

    document.getElementById('adm-prev-month').addEventListener('click', () => {
        admCurrentDate.setMonth(admCurrentDate.getMonth() - 1);
        renderAdmCalendar();
    });
    document.getElementById('adm-next-month').addEventListener('click', () => {
        admCurrentDate.setMonth(admCurrentDate.getMonth() + 1);
        renderAdmCalendar();
    });

    // --- Save Function ---
    btnSave.addEventListener('click', () => {
        localStorage.setItem('lumina_theme', JSON.stringify(theme));
        localStorage.setItem('lumina_gallery', JSON.stringify(gallery));
        localStorage.setItem('lumina_blocked', JSON.stringify(blocked));
        
        btnSave.innerText = 'Saved! \u2713';
        btnSave.style.background = '#10b981';
        setTimeout(() => {
            btnSave.innerText = 'Save All Changes';
            btnSave.style.background = '';
        }, 2000);
    });

    // --- Init ---
    initTheme();
    renderGalleryPreview();
    renderAdmCalendar();
});
