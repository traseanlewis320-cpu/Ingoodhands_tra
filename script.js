/* --- LUMINA: PUBLIC SCRIPT --- */
document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Settings from LocalStorage ---
    const theme = localStorage.getItem('lumina-theme') || 'obsidian';
    document.body.setAttribute('data-theme', theme);

    const siteLogo = localStorage.getItem('lumina-logo');
    if (siteLogo) {
        document.getElementById('site-logo').innerHTML = `<img src="${siteLogo}">`;
    }

    const siteTitle = localStorage.getItem('lumina-title') || 'Lumina Studio';
    document.getElementById('site-title-text').innerText = siteTitle;

    const siteTagline = localStorage.getItem('lumina-tagline') || 'The next level of wellness and arts.';
    document.getElementById('site-tagline').innerText = siteTagline;

    // --- State Management ---
    let selectedService = null;
    let selectedDate = new Date();
    let selectedTime = null;
    let blockedSchedule = JSON.parse(localStorage.getItem('lumina-blocked')) || { dates: [], times: {} };
    let galleryImages = JSON.parse(localStorage.getItem('lumina-gallery')) || [
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop'
    ];

    // --- Floating Gallery ---
    function renderFloatingGallery() {
        const track = document.getElementById('floating-gallery-track');
        track.innerHTML = '';
        
        // Loop gallery twice for seamless loop
        const drawGallery = () => {
            galleryImages.forEach(src => {
                const card = document.createElement('div');
                card.classList.add('gallery-card');
                card.innerHTML = `<img src="${src}" alt="Gallery item">`;
                track.appendChild(card);
            });
        };

        drawGallery();
        drawGallery(); // Repeat for seamless loop
    }
    renderFloatingGallery();

    // --- Services ---
    const services = [
        { id: 1, name: 'Premium Craft', price: 120 },
        { id: 2, name: 'Artisan Session', price: 85 },
        { id: 3, name: 'Elite Design', price: 250 },
        { id: 4, name: 'Classic Maintenance', price: 60 }
    ];

    function renderServices() {
        const serviceList = document.getElementById('service-menu-list');
        serviceList.innerHTML = '';
        services.forEach(s => {
            const el = document.createElement('div');
            el.classList.add('service-item');
            if (selectedService && selectedService.id === s.id) el.classList.add('active');
            el.innerHTML = `<h3>${s.name}</h3><span>$${s.price} / session</span>`;
            el.onclick = () => {
                selectedService = s;
                renderServices();
            };
            serviceList.appendChild(el);
        });
    }
    renderServices();

    // --- Calendar ---
    let calendarDate = new Date();
    function renderCalendar() {
        const grid = document.getElementById('calendar-days-grid');
        const monthLabel = document.getElementById('current-cal-month');
        
        // Keep headers
        const headers = Array.from(grid.querySelectorAll('.cal-day-name'));
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        monthLabel.innerText = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
        const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

        // Account for grid start (Mon=1, Sun=0, CSS grid usually 1-7)
        let startGap = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < startGap; i++) {
            grid.appendChild(document.createElement('div'));
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i);
            const cell = document.createElement('div');
            cell.classList.add('cal-day-cell');
            cell.innerText = i;
            
            const dateKey = d.toISOString().split('T')[0];
            const isBlocked = blockedSchedule.dates.includes(dateKey);

            if (d < today || isBlocked) {
                cell.classList.add('disabled');
            } else {
                if (selectedDate && d.toDateString() === selectedDate.toDateString()) {
                    cell.classList.add('selected');
                }
                cell.onclick = () => {
                    selectedDate = d;
                    renderCalendar();
                    renderTimeSlots();
                };
            }
            grid.appendChild(cell);
        }
    }

    document.getElementById('prev-btn-cal').onclick = () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    };
    document.getElementById('next-btn-cal').onclick = () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    };
    renderCalendar();

    // --- Time Slots (8am - 8pm, 30 min) ---
    function renderTimeSlots() {
        const slotsGrid = document.getElementById('booking-time-slots');
        slotsGrid.innerHTML = '';
        if (!selectedDate) return;

        const dateKey = selectedDate.toISOString().split('T')[0];
        const blockedTimes = blockedSchedule.times[dateKey] || [];

        for (let h = 8; h <= 20; h++) {
            for (let m of [0, 30]) {
                if (h === 20 && m === 30) continue; // Ends at 8pm
                
                const hh = h > 12 ? h - 12 : h;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const mm = m === 0 ? '00' : '30';
                const timeString = `${hh}:${mm} ${ampm}`;
                
                const btn = document.createElement('div');
                btn.classList.add('time-btn');
                if (blockedTimes.includes(timeString)) btn.classList.add('blocked');
                if (selectedTime === timeString) btn.classList.add('selected');
                
                btn.innerText = timeString;
                btn.onclick = () => {
                    if (blockedTimes.includes(timeString)) return;
                    selectedTime = timeString;
                    renderTimeSlots();
                    document.getElementById('booking-final-action').style.display = 'block';
                };
                slotsGrid.appendChild(btn);
            }
        }
    }
    renderTimeSlots();

    // --- Global Actions ---
    window.processBooking = () => {
        if (!selectedService || !selectedDate || !selectedTime) return alert('Select everything first!');
        alert(`Booking Confirmed!\n${selectedService.name} on ${selectedDate.toDateString()} at ${selectedTime}`);
        window.location.reload();
    };

    window.openFullGallery = () => {
        alert('Opening full gallery...');
    };

    window.showAdmin = () => {
        document.getElementById('main-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
    };

    window.hideAdmin = () => {
        document.getElementById('main-view').style.display = 'block';
        document.getElementById('admin-view').style.display = 'none';
    };
});
