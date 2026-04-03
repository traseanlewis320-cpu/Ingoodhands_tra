document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentStep = 1;
    let selectedService = null;
    let selectedDate = null;
    let selectedTime = null;
    let currentDate = new Date(); // For calendar navigation

    // Persistence Data
    let theme = JSON.parse(localStorage.getItem('lumina_theme')) || {
        primary: '#6366f1',
        secondary: '#ec4899',
        blurIntensity: 20
    };
    let gallery = JSON.parse(localStorage.getItem('lumina_gallery')) || [
        { id: 1, url: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800&auto=format&fit=crop' },
        { id: 2, url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop' },
        { id: 3, url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop' },
        { id: 4, url: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=800&auto=format&fit=crop' }
    ];
    let blocked = JSON.parse(localStorage.getItem('lumina_blocked')) || { dates: [], times: {} };

    // Elements
    const steps = document.querySelectorAll('.wizard-step');
    const navSteps = document.querySelectorAll('.nav-steps .step');
    const btnNext = document.getElementById('btn-next');
    const btnBack = document.getElementById('btn-back');
    const stepTitle = document.getElementById('step-title');
    const stepSubtitle = document.getElementById('step-subtitle');
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthLabel = document.getElementById('current-month');
    const timeSlotsContainer = document.getElementById('time-slots');

    const stepInfo = {
        1: { title: 'Select a Service', subtitle: 'Choose the experience that fits your needs.' },
        2: { title: 'Select Date & Time', subtitle: 'When would you like to visit us?' },
        3: { title: 'Personal Details', subtitle: 'Tell us a bit about yourself.' },
        4: { title: 'Review & Confirm', subtitle: 'Double check everything is correct.' }
    };

    // --- Dynamic Effects & Theme ---
    function applyTheme() {
        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--primary-glow', theme.primary + '80');
        document.documentElement.style.setProperty('--secondary', theme.secondary);
        document.documentElement.style.setProperty('--glass-blur', `blur(${theme.blurIntensity}px)`);
    }

    function renderFloatingGallery() {
        const galleryContainer = document.getElementById('floating-gallery');
        if (!galleryContainer) return;
        galleryContainer.innerHTML = '';

        gallery.forEach((img, index) => {
            const card = document.createElement('div');
            card.classList.add('gallery-card');
            
            // Random distribution for floating effect
            const top = 10 + (Math.random() * 60);
            const left = 5 + (Math.random() * 20);
            const delay = index * 0.5;
            const duration = 5 + Math.random() * 5;

            card.style.top = `${top}%`;
            card.style.left = `${left}%`;
            card.style.zIndex = index;
            card.style.animationDelay = `${delay}s`;
            card.style.animationDuration = `${duration}s`;
            
            card.innerHTML = `<img src="${img.url}" alt="Work instance ${index}">`;
            galleryContainer.appendChild(card);
        });

        // Parallax Mouse Effect
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.gallery-card');
            const x = (e.clientX - window.innerWidth / 2) / 100;
            const y = (e.clientY - window.innerHeight / 2) / 100;

            cards.forEach((card, idx) => {
                const speed = (idx + 1) * 2;
                card.style.transform = `translate(${x * speed}px, ${y * speed}px) rotateY(${x * 2}deg)`;
            });
        });
    }

    // --- Wizard Navigation ---
    function updateWizard() {
        // Show/Hide steps
        steps.forEach(step => step.classList.remove('active'));
        const targetStep = document.getElementById(`step-${currentStep}`);
        if(targetStep) targetStep.classList.add('active');

        // Update nav sidebar
        navSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'complete');
            if (stepNum === currentStep) step.classList.add('active');
            if (stepNum < currentStep) step.classList.add('complete');
        });

        // Update titles
        if(stepTitle) stepTitle.innerText = stepInfo[currentStep].title;
        if(stepSubtitle) stepSubtitle.innerText = stepInfo[currentStep].subtitle;

        // Button visibility/text
        if(btnBack) btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
        
        if (currentStep === 4) {
            btnNext.innerHTML = 'Confirm Booking <i data-lucide="check"></i>';
            updateSummary();
        } else {
            btnNext.innerHTML = 'Next <i data-lucide="arrow-right"></i>';
        }
        if (window.lucide) lucide.createIcons();

        // Specific step initializations
        if (currentStep === 2) {
            renderCalendar();
            renderTimeSlots();
        }
    }

    if(btnNext) btnNext.addEventListener('click', () => {
        if (!validateStep()) return;
        if (currentStep < 4) {
            currentStep++;
            updateWizard();
        } else {
            showSuccess();
        }
    });

    if(btnBack) btnBack.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizard();
        }
    });

    function validateStep() {
        if (currentStep === 1 && !selectedService) {
            alert('Please select a service before continuing.');
            return false;
        }
        if (currentStep === 2 && (!selectedDate || !selectedTime)) {
            alert('Please select both a date and a time.');
            return false;
        }
        if (currentStep === 3) {
            const form = document.getElementById('details-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return false;
            }
        }
        return true;
    }

    // --- Step 1: Service Selection ---
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedService = {
                id: card.dataset.id,
                name: card.querySelector('h3').innerText,
                price: card.querySelector('.price').innerText
            };
        });
    });

    // --- Step 2: Calendar & Time Slots ---
    function renderCalendar() {
        if (!calendarDays) return;
        calendarDays.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        if(currentMonthLabel) currentMonthLabel.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startGrid = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < startGrid; i++) calendarDays.appendChild(document.createElement('div'));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.innerText = day;

            const isBlocked = blocked.dates.includes(dateStr);

            if (dateObj < today || isBlocked) {
                dayElement.classList.add('disabled');
            } else {
                if (dateObj.getTime() === today.getTime()) dayElement.style.color = 'var(--primary)';
                if (selectedDate && dateObj.toDateString() === selectedDate.toDateString()) {
                    dayElement.classList.add('selected');
                }

                dayElement.addEventListener('click', () => {
                    selectedDate = dateObj;
                    renderCalendar();
                    renderTimeSlots();
                });
            }
            calendarDays.appendChild(dayElement);
        }
    }

    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    if(prevMonthBtn) prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    if(nextMonthBtn) nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    function renderTimeSlots() {
        if (!timeSlotsContainer || !selectedDate) return;
        timeSlotsContainer.innerHTML = '';
        
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const blockedTimes = blocked.times[dateStr] || [];

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

            if (blockedTimes.includes(timeString)) continue;

            const slot = document.createElement('div');
            slot.classList.add('time-slot');
            slot.innerText = timeString;

            if (selectedTime === timeString) slot.classList.add('selected');

            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                selectedTime = timeString;
            });
            timeSlotsContainer.appendChild(slot);
        }
    }

    // --- Step 4: Summary ---
    function updateSummary() {
        const sumService = document.getElementById('summary-service');
        const sumDate = document.getElementById('summary-date');
        const sumTime = document.getElementById('summary-time');
        const sumContact = document.getElementById('summary-contact');
        
        if(sumService) sumService.innerText = selectedService.name;
        if(sumDate) sumDate.innerText = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if(sumTime) sumTime.innerText = selectedTime;
        if(sumContact) sumContact.innerText = document.getElementById('full-name').value;
    }

    function showSuccess() {
        const modal = document.getElementById('success-modal');
        if(modal) {
            modal.classList.add('active');
            const confettiContainer = modal.querySelector('.confetti-container');
            if(confettiContainer) {
                confettiContainer.innerHTML = ''; // Clear previous
                for (let i = 0; i < 50; i++) {
                    const confetti = document.createElement('div');
                    confetti.style.cssText = `position: absolute; width: 10px; height: 10px; background-color: ${['#6366f1','#ec4899','#ffffff'][Math.floor(Math.random()*3)]}; top:-10px; left:${Math.random()*100}%; opacity:${Math.random()}; transform:rotate(${Math.random()*360}deg); transition:all ${Math.random()*3+2}s linear; pointer-events:none;`;
                    confettiContainer.appendChild(confetti);
                    setTimeout(() => {
                        confetti.style.top = '100%';
                        confetti.style.opacity = '0';
                    }, 100);
                }
            }
        }
    }

    const btnCloseModal = document.getElementById('btn-close-modal');
    if(btnCloseModal) btnCloseModal.addEventListener('click', () => {
        location.reload();
    });

    // --- Boot ---
    applyTheme();
    if(document.getElementById('floating-gallery')) renderFloatingGallery();
    updateWizard();
});
