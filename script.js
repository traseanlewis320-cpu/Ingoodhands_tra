document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentStep = 1;
    let selectedService = null;
    let selectedDate = null;
    let selectedTime = null;
    let currentDate = new Date(); // For calendar navigation

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

    // --- Wizard Navigation ---

    function updateWizard() {
        // Show/Hide steps
        steps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${currentStep}`).classList.add('active');

        // Update nav sidebar
        navSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'complete');
            if (stepNum === currentStep) step.classList.add('active');
            if (stepNum < currentStep) step.classList.add('complete');
        });

        // Update titles
        stepTitle.innerText = stepInfo[currentStep].title;
        stepSubtitle.innerText = stepInfo[currentStep].subtitle;

        // Button visibility/text
        btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
        
        if (currentStep === 4) {
            btnNext.innerHTML = 'Confirm Booking <i data-lucide="check"></i>';
            updateSummary();
        } else {
            btnNext.innerHTML = 'Next <i data-lucide="arrow-right"></i>';
        }
        lucide.createIcons();

        // Specific step initializations
        if (currentStep === 2) {
            renderCalendar();
            renderTimeSlots();
        }
    }

    btnNext.addEventListener('click', () => {
        if (!validateStep()) return;

        if (currentStep < 4) {
            currentStep++;
            updateWizard();
        } else {
            showSuccess();
        }
    });

    btnBack.addEventListener('click', () => {
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
            if (!form.checkValidity()) {
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
        calendarDays.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        currentMonthLabel.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start (Lucide/UI uses Mo-Su)
        // 0=Su, 1=Mo, 2=Tu... so shift everything
        let startGrid = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        // Add empty cells for previous month padding
        for (let i = 0; i < startGrid; i++) {
            const emptyDiv = document.createElement('div');
            calendarDays.appendChild(emptyDiv);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.innerText = day;

            if (dateObj < today) {
                dayElement.classList.add('disabled');
            } else {
                if (dateObj.getTime() === today.getTime()) dayElement.classList.add('today');
                
                if (selectedDate && dateObj.toDateString() === selectedDate.toDateString()) {
                    dayElement.classList.add('selected');
                }

                dayElement.addEventListener('click', () => {
                    selectedDate = dateObj;
                    renderCalendar();
                });
            }

            calendarDays.appendChild(dayElement);
        }
    }

    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    function renderTimeSlots() {
        timeSlotsContainer.innerHTML = '';
        
        // 8:00 AM to 8:00 PM (20:00) with 30 min intervals
        const start = 8 * 60; // 8:00 in minutes
        const end = 20 * 60;  // 20:00 in minutes
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

            if (selectedTime === timeString) slot.classList.add('selected');

            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                selectedTime = timeString;
            });

            timeSlotsContainer.appendChild(slot);
        }
    }

    // --- Step 4: Summary & Finalization ---

    function updateSummary() {
        document.getElementById('summary-service').innerText = selectedService.name;
        document.getElementById('summary-date').innerText = selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('summary-time').innerText = selectedTime;
        document.getElementById('summary-contact').innerText = document.getElementById('full-name').value;
    }

    function showSuccess() {
        const modal = document.getElementById('success-modal');
        modal.classList.add('active');
        
        // Simple confetti effect
        const confettiContainer = modal.querySelector('.confetti-container');
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = ['#6366f1', '#818cf8', '#f8fafc', '#7ac142'][Math.floor(Math.random() * 4)];
            confetti.style.top = '-10px';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.opacity = Math.random();
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.transition = `all ${Math.random() * 3 + 2}s linear`;
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.top = '100%';
                confetti.style.left = (parseFloat(confetti.style.left) + (Math.random() * 20 - 10)) + '%';
                confetti.style.opacity = '0';
            }, 100);
        }
    }

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        location.reload(); // Restart the booking experience
    });
});
