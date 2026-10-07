/**
 * MediGuide AI - Enhanced Main JavaScript (main.js)
 * ---------------------------------------------------
 * - Navbar scroll effect
 * - Scroll-reveal animations (IntersectionObserver)
 * - Animated counter numbers (stats strip)
 * - Dynamic hero particles
 * - Auto-scroll chat to bottom
 * - Chatbot typing indicator
 * - Form focus/validation enhancements
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ------------------------------------------------------------------ */
    /*  1. NAVBAR SCROLL EFFECT                                            */
    /* ------------------------------------------------------------------ */
    const navbar = document.querySelector('.navbar-custom');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        }, { passive: true });
    }

    /* ------------------------------------------------------------------ */
    /*  2. SCROLL REVEAL (IntersectionObserver)                            */
    /* ------------------------------------------------------------------ */
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => io.observe(el));
    }

    /* ------------------------------------------------------------------ */
    /*  3. ANIMATED COUNTER (stats strip)                                  */
    /* ------------------------------------------------------------------ */
    function animateCount(el, target, suffix = '') {
        const duration = 1600;
        const step = 16;
        const increment = target / (duration / step);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            el.textContent = Math.floor(current).toLocaleString() + suffix;
            if (current >= target) clearInterval(timer);
        }, step);
    }

    const counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
        const counterIO = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const el     = e.target;
                    const target = parseInt(el.dataset.count, 10);
                    const suffix = el.dataset.suffix || '';
                    animateCount(el, target, suffix);
                    counterIO.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(el => counterIO.observe(el));
    }

    /* ------------------------------------------------------------------ */
    /*  4. HERO PARTICLES                                                   */
    /* ------------------------------------------------------------------ */
    const particleContainer = document.querySelector('.hero-particles');
    if (particleContainer) {
        const count = 18;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.cssText = `
                left: ${Math.random() * 100}%;
                width: ${3 + Math.random() * 5}px;
                height: ${3 + Math.random() * 5}px;
                animation-duration: ${6 + Math.random() * 10}s;
                animation-delay: ${Math.random() * 8}s;
                opacity: ${0.1 + Math.random() * 0.2};
            `;
            particleContainer.appendChild(p);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  5. CHAT – AUTO SCROLL TO BOTTOM                                    */
    /* ------------------------------------------------------------------ */
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /* ------------------------------------------------------------------ */
    /*  6. CHAT – TYPING INDICATOR                                         */
    /* ------------------------------------------------------------------ */
    const chatForm = document.getElementById('chatForm');
    const typingIndicator = document.getElementById('typingIndicator');
    if (chatForm && typingIndicator) {
        chatForm.addEventListener('submit', () => {
            typingIndicator.style.display = 'flex';
            if (chatMessages) {
                setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  7. LEGACY SYMPTOM CHECKER BUTTON (backward-compat)                 */
    /* ------------------------------------------------------------------ */
    const analyzeBtn = document.getElementById('analyzeBtn');
    const symptomInput = document.getElementById('symptomInput');
    if (analyzeBtn && symptomInput) {
        analyzeBtn.addEventListener('click', () => {
            const query = symptomInput.value.trim();
            if (!query) {
                symptomInput.classList.add('is-invalid');
                symptomInput.focus();
                return;
            }
            symptomInput.classList.remove('is-invalid');
        });
        symptomInput.addEventListener('input', () => symptomInput.classList.remove('is-invalid'));
    }

    /* ------------------------------------------------------------------ */
    /*  8. FORM INPUTS – add styled class automatically                    */
    /* ------------------------------------------------------------------ */
    document.querySelectorAll('.auto-style-input').forEach(el => {
        el.classList.add('form-control-styled');
    });

    /* ------------------------------------------------------------------ */
    /*  9. FLASH MESSAGE AUTO-DISMISS                                      */
    /* ------------------------------------------------------------------ */
    const flashAlerts = document.querySelectorAll('.alert.alert-dismissible');
    flashAlerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            if (bsAlert) bsAlert.close();
        }, 5000);
    });

    /* ------------------------------------------------------------------ */
    /*  10. HOVER CARD TILT (light 3D tilt on feature cards)               */
    /* ------------------------------------------------------------------ */
    document.querySelectorAll('.feature-card, .module-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
            const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 12;
            card.style.transform = `translateY(-10px) rotateX(${-y}deg) rotateY(${x}deg)`;
            card.style.transition = 'transform 0.1s ease';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        });
    });

});
