document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const skipBtn = document.getElementById('skip-preloader');

    // Initial state: body should not scroll
    document.body.classList.add('preloader-active');

    // Flag to ensure preloader is faded out only once
    let isPreloaderFaded = false;

    function fadeOutPreloader() {
        if (isPreloaderFaded) return;
        isPreloaderFaded = true;

        if (preloader) {
            preloader.classList.add('fade-out');
            document.body.classList.remove('preloader-active');
        }
        
        // Trigger hero entry animations after preloader fades
        setTimeout(() => {
            document.querySelector('.hero')?.classList.add('hero-loaded');
        }, 400);
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', fadeOutPreloader);
    }

    // Auto dismiss after logo animation completes (3.5 seconds)
    setTimeout(fadeOutPreloader, 3500);

    const washForm = document.getElementById('washForm');
    const sections = document.querySelectorAll('section, header');
    const animatedItems = document.querySelectorAll('.animate');
    const navLinks = document.querySelectorAll('.nav-links a');
    const navbar = document.getElementById('navbar');

    // Mobile Nav Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinksContainer = document.querySelector('.nav-links');

    if (navToggle && navLinksContainer) {
        navToggle.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Toggle hamburger icon to X
            const icon = navToggle.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('active');
                navToggle.classList.remove('active');
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // Smooth Scroll Offset for Sticky Header
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            const targetPosition = targetElement.offsetTop;
            window.scrollTo({
                top: targetPosition - 80,
                behavior: 'smooth'
            });
        });
    });

    // Intersection Observer for Animations
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    const animateElements = entry.target.querySelectorAll('.animate');
                    animateElements.forEach((el, index) => {
                        setTimeout(() => {
                            el.classList.add('is-visible');
                        }, index * 100);
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    } else {
        animatedItems.forEach(el => el.classList.add('is-visible'));
    }

    // ========================================
    // BEFORE / AFTER SLIDER
    // ========================================
    const slider     = document.getElementById('baSlider');
    const beforeEl   = document.getElementById('baBefore');
    const handle     = document.getElementById('baHandle');

    if (slider && beforeEl && handle) {
        let isDragging = false;
        const tagBefore = slider.querySelector('.ba-tag-before');
        const tagAfter  = slider.querySelector('.ba-tag-after');

        function getPosition(e) {
            const rect = slider.getBoundingClientRect();
            let x;
            if (e.touches && e.touches.length > 0) {
                x = e.touches[0].clientX - rect.left;
            } else {
                x = e.clientX - rect.left;
            }
            // Clamp between 0 and width
            x = Math.max(0, Math.min(x, rect.width));
            return x / rect.width;   // 0‥1
        }

        function updateSlider(ratio) {
            const percent = ratio * 100;
            // clip-path: inset(top right bottom left)
            // We want the BEFORE image visible on the LEFT side
            beforeEl.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
            handle.style.left = percent + '%';
            handle.setAttribute('aria-valuenow', Math.round(percent));

            // Dynamic visibility of before/after tags
            if (tagBefore && tagAfter) {
                if (ratio < 0.5) {
                    tagBefore.style.opacity = '0';
                    tagBefore.style.visibility = 'hidden';
                    tagAfter.style.opacity = '1';
                    tagAfter.style.visibility = 'visible';
                } else if (ratio > 0.5) {
                    tagBefore.style.opacity = '1';
                    tagBefore.style.visibility = 'visible';
                    tagAfter.style.opacity = '0';
                    tagAfter.style.visibility = 'hidden';
                } else {
                    tagBefore.style.opacity = '1';
                    tagBefore.style.visibility = 'visible';
                    tagAfter.style.opacity = '1';
                    tagAfter.style.visibility = 'visible';
                }
            }
        }

        // Initialise at 50 %
        updateSlider(0.5);

        // Pointer down
        slider.addEventListener('mousedown',  startDrag);
        slider.addEventListener('touchstart', startDrag, { passive: false });

        function startDrag(e) {
            e.preventDefault();
            isDragging = true;
            slider.classList.add('active');
            updateSlider(getPosition(e));
            // Hide hint after first interaction
            const hint = document.querySelector('.slider-hint');
            if (hint) hint.style.opacity = '0';
        }

        // Pointer move (on window so drag continues outside slider)
        window.addEventListener('mousemove',  onMove);
        window.addEventListener('touchmove',  onMove, { passive: false });

        function onMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            updateSlider(getPosition(e));
        }

        // Pointer up
        window.addEventListener('mouseup',  stopDrag);
        window.addEventListener('touchend', stopDrag);

        function stopDrag() {
            isDragging = false;
            slider.classList.remove('active');
        }

        // Keyboard accessibility (left / right arrow)
        handle.addEventListener('keydown', (e) => {
            const current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
            let next = current;
            if (e.key === 'ArrowLeft')  next = Math.max(0, current - 2);
            if (e.key === 'ArrowRight') next = Math.min(100, current + 2);
            if (next !== current) {
                e.preventDefault();
                updateSlider(next / 100);
            }
        });
    }

    // ========================================
    // FORM SUBMISSION → WHATSAPP
    // ========================================
    if (washForm) {
        washForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name         = document.getElementById('custName').value;
            const packageName  = document.getElementById('package').value;
            const washLocation = document.getElementById('washLocation').value;
            const washDate     = document.getElementById('date').value;
            const address      = document.getElementById('address').value;

            // Route all bookings to the primary WhatsApp number
            const whatsappNumber = "918848700790";
            
            const message = `*ShineXpress Booking* 🚗✨\n\n` +
                          `*Package:* ${packageName}\n` +
                          `*Location:* ${washLocation}\n` +
                          `*Customer:* ${name}\n` +
                          `*Date:* ${washDate}\n` +
                          `*Address:* ${address}\n\n` +
                          `_Sent via ShineXpress Website_`;

            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            washForm.reset();
        });
    }

    const careerForm = document.getElementById('careerForm');
    if (careerForm) {
        careerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name       = document.getElementById('careerName').value;
            const phone      = document.getElementById('careerPhone').value;
            const position   = document.getElementById('careerPosition').value;
            const experience = document.getElementById('careerExperience').value;
            const location   = document.getElementById('careerLocation').value;
            const details    = document.getElementById('careerDetails').value;

            // Route all applications to the primary WhatsApp number
            const whatsappNumber = "918848700790";
            
            const message = `*ShineXpress Career Application* 💼✨\n\n` +
                          `*Name:* ${name}\n` +
                          `*Phone:* ${phone}\n` +
                          `*Position:* ${position}\n` +
                          `*Experience:* ${experience}\n` +
                          `*Preferred Location:* ${location}\n` +
                          `*Skills & Details:* ${details}\n\n` +
                          `_Sent via ShineXpress Careers Site_`;

            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            careerForm.reset();
        });
    }

    // ========================================
    // WHATSAPP CONTACT SELECTION MODAL
    // ========================================
    const whatsappModal = document.getElementById('whatsappModal');
    const closeWaModal = document.getElementById('closeWaModal');
    const waTriggers = document.querySelectorAll('.trigger-whatsapp-modal');

    if (whatsappModal && closeWaModal) {
        waTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                whatsappModal.classList.add('active');
            });
        });

        closeWaModal.addEventListener('click', () => {
            whatsappModal.classList.remove('active');
        });

        // Close when clicking outside content box
        whatsappModal.addEventListener('click', (e) => {
            if (e.target === whatsappModal) {
                whatsappModal.classList.remove('active');
            }
        });
    }

    // ========================================
    // SCROLL HEADER STYLING
    // ========================================
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ========================================
    // SCROLL-REVEAL FOR SECTIONS
    // ========================================
    const revealElements = document.querySelectorAll(
        '.service-card, .addon-card, .feature-card, .testimonial-card, .reel-container, .booking-info, .booking-form, .careers-info'
    );

    if ('IntersectionObserver' in window && revealElements.length) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.transitionDelay = (i * 0.06) + 's';
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => {
            el.classList.add('animate');
            revealObserver.observe(el);
        });
    }

    // ========================================
    // NUMBER COUNT-UP ANIMATION
    // ========================================
    const countElements = document.querySelectorAll('.count-up');
    
    if ('IntersectionObserver' in window && countElements.length) {
        const countObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target'), 10);
                    const duration = 2000; // 2 seconds
                    const frameRate = 1000 / 60;
                    const totalFrames = Math.round(duration / frameRate);
                    let frame = 0;
                    
                    const counter = setInterval(() => {
                        frame++;
                        const progress = frame / totalFrames;
                        // Ease-out cubic
                        const easeProgress = 1 - Math.pow(1 - progress, 3);
                        const currentCount = Math.round(target * easeProgress);
                        
                        el.innerText = currentCount;
                        
                        if (frame >= totalFrames) {
                            clearInterval(counter);
                            el.innerText = target;
                        }
                    }, frameRate);
                    
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        
        countElements.forEach(el => {
            countObserver.observe(el);
        });
    } else {
        countElements.forEach(el => {
            el.innerText = el.getAttribute('data-target');
        });
    }

    // ========================================
    // HERO PARTICLES CANVAS (MIST & DROPLETS)
    // ========================================
    const canvas = document.getElementById('hero-particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        // Resize handler
        window.addEventListener('resize', () => {
            if (canvas.offsetWidth && canvas.offsetHeight) {
                width = canvas.width = canvas.offsetWidth;
                height = canvas.height = canvas.offsetHeight;
            }
        });

        const particles = [];
        const maxParticles = 60; // Optimal performance

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                // Determine if it is a droplet or mist
                this.type = Math.random() > 0.55 ? 'droplet' : 'mist';
                
                this.x = Math.random() * width;
                
                if (this.type === 'droplet') {
                    // Droplets start from the top
                    this.y = Math.random() * -50;
                    this.vx = (Math.random() - 0.5) * 0.4; // slight horizontal drift
                    this.vy = Math.random() * 2.5 + 2.0;   // falling speed
                    this.radius = Math.random() * 1.5 + 0.8; // small droplets
                    this.alpha = Math.random() * 0.35 + 0.15;
                    this.length = Math.random() * 12 + 6;  // falling trail length
                } else {
                    // Mist starts from the bottom or random height initially
                    this.y = height + Math.random() * 100;
                    this.vx = (Math.random() - 0.5) * 0.4; // slow drift
                    this.vy = -(Math.random() * 0.5 + 0.2); // floating slow up
                    this.radius = Math.random() * 60 + 30; // large cloud
                    this.alpha = Math.random() * 0.05 + 0.015; // extremely subtle
                }
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Recycle conditions
                if (this.type === 'droplet') {
                    if (this.y > height || this.x < 0 || this.x > width) {
                        this.reset();
                    }
                } else {
                    if (this.y < -this.radius || this.x < -this.radius || this.x > width + this.radius) {
                        this.reset();
                    }
                }
            }

            draw() {
                ctx.save();
                if (this.type === 'droplet') {
                    // Draw a falling droplet line (glowing cyan/white)
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 242, 255, ${this.alpha})`;
                    ctx.lineWidth = this.radius;
                    ctx.lineCap = 'round';
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + this.vx * 2, this.y + this.length);
                    ctx.stroke();
                } else {
                    // Draw a soft mist cloud
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, this.radius
                    );
                    gradient.addColorStop(0, `rgba(100, 255, 218, ${this.alpha})`);
                    gradient.addColorStop(0.5, `rgba(0, 242, 255, ${this.alpha * 0.45})`);
                    gradient.addColorStop(1, 'rgba(2, 12, 27, 0)');

                    ctx.beginPath();
                    ctx.fillStyle = gradient;
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        // Initialize particles
        for (let i = 0; i < maxParticles; i++) {
            const p = new Particle();
            // Stagger initial Y coordinates to fill the screen on load
            p.y = Math.random() * height;
            particles.push(p);
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            
            requestAnimationFrame(animate);
        }

        animate();
    }
});
