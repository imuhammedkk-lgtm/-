document.addEventListener('DOMContentLoaded', () => {
    // Sound state management
    let soundEnabled = false;
    const soundToggle = document.getElementById('soundToggle');
    let audioCtx = null;

    // Toggle Sound Button handler
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                soundToggle.classList.remove('sound-off');
                soundToggle.classList.add('sound-on');
                soundToggle.querySelector('i').className = 'fas fa-volume-up';
                soundToggle.querySelector('span').textContent = 'Sound ON';
                
                // Initialize AudioContext on user interaction
                initAudioContext();
                
                // Play a brief welcome spray sound to confirm it works
                playWaterSpray(0.1, 0.3, 1200, 1500);
            } else {
                soundToggle.classList.remove('sound-on');
                soundToggle.classList.add('sound-off');
                soundToggle.querySelector('i').className = 'fas fa-volume-mute';
                soundToggle.querySelector('span').textContent = 'Muted';
            }
        });
    }

    // Initialize Web Audio Context
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Programmatically synthesize a premium "Water Spray" jet sound using Web Audio API
    // This creates a realistic "psshhh" noise by filtering white noise
    function playWaterSpray(volume = 0.08, duration = 0.5, startFreq = 1500, endFreq = 1000) {
        try {
            initAudioContext();
            if (!audioCtx || audioCtx.state === 'suspended') return;

            // 1. Create a buffer filled with white noise
            const bufferSize = audioCtx.sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            // 2. Create Audio Nodes
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;

            // Bandpass filter to model the high-pressure water nozzle frequency range
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
            // Sweep the frequency downward to simulate a spraying sweep
            filter.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
            filter.Q.setValueAtTime(3.0, audioCtx.currentTime); // High Q makes it sound hissier/cleaner

            // Gain node to control amplitude envelope (Attack, Decay, Sustain, Release style)
            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            // Quick attack
            gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05);
            // Slow decay
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            // Connect nodes
            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Play noise
            noiseSource.start();
            noiseSource.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    // AI Voice Narration using Web Speech API
    function speakService(serviceName) {
        if (!soundEnabled) return;
        try {
            // Cancel any speech currently playing
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(serviceName);
            
            // Attempt to select a premium English voice
            const voices = window.speechSynthesis.getVoices();
            // Look for Google UK English Male, Google US English, Microsoft David, etc.
            const preferredVoice = voices.find(voice => 
                (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Premium')) && voice.lang.includes('en')
            ) || voices.find(voice => voice.lang.includes('en'));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            utterance.rate = 0.95; // Slightly slower for luxury/clear feeling
            utterance.pitch = 1.0;
            utterance.volume = 0.9;
            
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Speech synthesis error:', e);
        }
    }

    // Preloader and Intro Handling
    const preloader = document.getElementById('preloader');
    
    // Page load handler
    window.addEventListener('load', () => {
        // Smoothly fade out the loader after brief delay to let images buffer
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('fade-out');
                document.body.classList.remove('preloader-active');
            }
        }, 1500);
    });

    // Mobile Navigation (if links clicked, smooth scroll to them)
    const navLinks = document.querySelectorAll('.nav-links a');
    const navbar = document.getElementById('navbar');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offsetPosition = targetElement.offsetTop - 85;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Dynamic Price Animate / Count-Up
    function animatePriceCount(element) {
        const target = parseInt(element.getAttribute('data-price-target'), 10);
        if (isNaN(target)) return;

        let start = 0;
        const duration = 1800; // Animation duration in ms
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Ease-out cubic formula
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeProgress * target);

            element.textContent = currentVal.toLocaleString('en-IN');

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = target.toLocaleString('en-IN');
            }
        }
        requestAnimationFrame(updateCount);
    }

    // Set up scroll triggers for animations and count-up values
    const animatedElements = document.querySelectorAll('.animate');
    const priceElements = document.querySelectorAll('[data-price-target]');

    // Keep track of which elements have already animated the price
    const animatedPrices = new Set();

    if ('IntersectionObserver' in window) {
        // General Observer for elements fade-in-up
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    
                    // If the card is visible, look for pricing elements inside it to trigger count-up
                    const priceTag = entry.target.querySelector('[data-price-target]');
                    if (priceTag && !animatedPrices.has(priceTag)) {
                        animatedPrices.add(priceTag);
                        // Trigger count-up animation after a short visual delay
                        setTimeout(() => animatePriceCount(priceTag), 250);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => scrollObserver.observe(el));
    } else {
        // Fallback for older browsers
        animatedElements.forEach(el => el.classList.add('is-visible'));
        priceElements.forEach(el => {
            const target = el.getAttribute('data-price-target');
            el.textContent = parseInt(target, 10).toLocaleString('en-IN');
        });
    }

    // Connect Audio Interactions to Cards
    const serviceCards = document.querySelectorAll('.service-card');
    const addonCards = document.querySelectorAll('.addon-card');

    serviceCards.forEach(card => {
        const serviceName = card.getAttribute('data-service-name') || 'Service Package';

        // Hover: Play a subtle "water jet spray" SFX
        card.addEventListener('mouseenter', () => {
            if (soundEnabled) {
                // Short, soft frequency sweep (2000Hz down to 1400Hz)
                playWaterSpray(0.04, 0.35, 2000, 1400);
            }
        });

        // Click: Play stronger spray SFX followed by the AI voice naming the service
        card.addEventListener('click', (e) => {
            // Only trigger if they did not click the Booking Button inside the card
            if (e.target.tagName !== 'A' && !e.target.classList.contains('btn')) {
                // Play a more pronounced spray SFX
                if (soundEnabled) {
                    playWaterSpray(0.12, 0.7, 1600, 800);
                    
                    // Voice speaks service name after a tiny delay
                    setTimeout(() => speakService(serviceName), 200);
                } else {
                    // Help user know sound is available by blinking the sound pill
                    if (soundToggle) {
                        soundToggle.style.transform = 'scale(1.15)';
                        soundToggle.style.borderColor = 'var(--cta-red)';
                        setTimeout(() => {
                            soundToggle.style.transform = 'scale(1)';
                            soundToggle.style.borderColor = 'var(--silver-border)';
                        }, 500);
                    }
                }
            }
        });
    });

    addonCards.forEach(card => {
        // Add-ons play a short spray SFX on hover for premium feedback
        card.addEventListener('mouseenter', () => {
            if (soundEnabled) {
                playWaterSpray(0.03, 0.25, 2200, 1600);
            }
        });
    });

    // Booking Form Submission & WhatsApp Redirect
    const washForm = document.getElementById('washForm');
    if (washForm) {
        washForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Play a satisfying spray sound to confirm submission
            if (soundEnabled) {
                playWaterSpray(0.15, 1.0, 1800, 600);
            }

            const name = document.getElementById('custName').value;
            const packageName = document.getElementById('package').value;
            const washDate = document.getElementById('date').value;
            const address = document.getElementById('address').value;
            
            // Build the Whatsapp Message format
            const whatsappNumber = "918848900790";
            const message = `*ShineXpress Booking Form* 🚗✨\n\n` +
                          `*Selected Package:* ${packageName}\n` +
                          `*Customer Name:* ${name}\n` +
                          `*Requested Date:* ${washDate}\n` +
                          `*Location / Address:* ${address}\n\n` +
                          `_Sent directly via ShineXpress Detailing Portal_`;
            
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            
            // Redirect user to WhatsApp chat
            window.open(whatsappUrl, '_blank');
            
            washForm.reset();
        });
    }

    // Scroll Navbar effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Populate default date picker value to today's date + 1 day
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
});
