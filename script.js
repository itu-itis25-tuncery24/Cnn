/* ============================================
   Canan'ın Evreni — Interactive Script
   Parallax Engine, Particle System, Scroll Observers
   ============================================ */

(function () {
    'use strict';

    // ── DOM References ──
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    const progressBar = document.getElementById('progress-bar');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const realms = document.querySelectorAll('.realm');
    const parallaxLayers = document.querySelectorAll('.realm__layer');
    const reveals = document.querySelectorAll('.reveal');

    // Check saved state or play automatically
    let bgMusicPlaying = false;

    // Welcome Screen Logic
    const welcomeScreen = document.getElementById('welcome-screen');
    const welcomeForm = document.getElementById('welcome-form');
    const welcomeInput = document.getElementById('welcome-name');

    if (welcomeScreen && welcomeForm) {
        document.body.classList.add('locked');
        window.scrollTo(0,0);
        
        welcomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = welcomeInput.value.trim();
            if (name.length > 0) {
                welcomeScreen.classList.remove('active');
                setTimeout(() => {
                    document.body.classList.remove('locked');
                }, 1000);
            }
        });
    }

    // ── State ──
    let scrollY = 0;
    let ticking = false;
    let currentRealm = 'stars';
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // ============================================
    // Canvas Setup
    // ============================================
    function resizeCanvas() {
        canvas.width = window.innerWidth * DPR;
        canvas.height = window.innerHeight * DPR;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(DPR, DPR);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ============================================
    // Particle System
    // ============================================
    class Particle {
        constructor(type) {
            this.type = type;
            this.reset();
        }

        reset() {
            const W = window.innerWidth;
            const H = window.innerHeight;

            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.fadeDir = Math.random() > 0.5 ? 1 : -1;
            this.fadeSpeed = Math.random() * 0.008 + 0.002;

            switch (this.type) {
                case 'stars':
                    this.size = Math.random() * 2 + 0.5;
                    this.speedX = (Math.random() - 0.5) * 0.08;
                    this.speedY = (Math.random() - 0.5) * 0.05;
                    this.color = Math.random() > 0.7
                        ? `rgba(240,200,255,${this.opacity})`
                        : `rgba(255,255,255,${this.opacity})`;
                    break;

                case 'dust':
                    this.size = Math.random() * 1.5 + 0.5;
                    this.speedX = Math.random() * 0.3 + 0.1;
                    this.speedY = (Math.random() - 0.5) * 0.15;
                    this.color = `rgba(255,220,200,${this.opacity * 0.5})`;
                    break;

                case 'sparkles':
                    this.size = Math.random() * 2.5 + 0.5;
                    this.speedX = (Math.random() - 0.5) * 0.2;
                    this.speedY = Math.random() * -0.2 - 0.05;
                    this.color = Math.random() > 0.5
                        ? `rgba(255,220,240,${this.opacity * 0.6})`
                        : `rgba(220,200,255,${this.opacity * 0.5})`;
                    break;

                case 'petals':
                    this.size = Math.random() * 3 + 1.5;
                    this.speedX = Math.random() * 0.4 + 0.1;
                    this.speedY = Math.random() * 0.5 + 0.2;
                    this.rotation = Math.random() * 360;
                    this.rotSpeed = (Math.random() - 0.5) * 2;
                    this.color = Math.random() > 0.5
                        ? `rgba(240,170,200,${this.opacity * 0.5})`
                        : `rgba(220,160,230,${this.opacity * 0.4})`;
                    this.y = -10;
                    break;

                case 'reflections':
                    this.size = Math.random() * 1.5 + 0.5;
                    this.speedX = (Math.random() - 0.5) * 0.1;
                    this.speedY = (Math.random() - 0.5) * 0.05;
                    this.y = Math.random() * H * 0.5 + H * 0.4;
                    this.color = `rgba(180,200,230,${this.opacity * 0.4})`;
                    break;

                case 'fireflies':
                    this.size = Math.random() * 2.5 + 1;
                    this.speedX = (Math.random() - 0.5) * 0.3;
                    this.speedY = (Math.random() - 0.5) * 0.3;
                    this.glowPhase = Math.random() * Math.PI * 2;
                    this.glowSpeed = Math.random() * 0.03 + 0.01;
                    this.color = `rgba(255,220,130,${this.opacity})`;
                    break;

                case 'hearts':
                    this.size = Math.random() * 4 + 2;
                    this.speedX = (Math.random() - 0.5) * 0.2;
                    this.speedY = Math.random() * -0.3 - 0.1;
                    this.opacity = Math.random() * 0.4 + 0.1;
                    this.color = Math.random() > 0.5
                        ? `rgba(240,140,170,${this.opacity})`
                        : `rgba(255,200,180,${this.opacity})`;
                    this.y = H + 10;
                    break;
            }
        }

        update() {
            const W = window.innerWidth;
            const H = window.innerHeight;

            this.x += this.speedX;
            this.y += this.speedY;

            // Fade in/out
            this.opacity += this.fadeDir * this.fadeSpeed;
            if (this.opacity >= 0.8) this.fadeDir = -1;
            if (this.opacity <= 0.1) this.fadeDir = 1;

            // Firefly glow
            if (this.type === 'fireflies') {
                this.glowPhase += this.glowSpeed;
                this.opacity = (Math.sin(this.glowPhase) + 1) * 0.35 + 0.1;
            }

            // Petal rotation
            if (this.type === 'petals') {
                this.rotation += this.rotSpeed;
            }

            // Wrap / reset
            if (this.x < -20) this.x = W + 20;
            if (this.x > W + 20) this.x = -20;
            if (this.y < -20 && this.type !== 'hearts') this.y = H + 20;
            if (this.y > H + 20) {
                if (this.type === 'petals') {
                    this.y = -10;
                    this.x = Math.random() * W;
                } else if (this.type !== 'hearts') {
                    this.y = -20;
                }
            }
            if (this.type === 'hearts' && this.y < -20) {
                this.y = H + 10;
                this.x = Math.random() * W;
            }
        }

        draw(ctx) {
            ctx.save();

            switch (this.type) {
                case 'stars':
                case 'dust':
                case 'sparkles':
                case 'reflections':
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color.replace(/[\d.]+\)$/, this.opacity + ')');
                    ctx.fill();
                    // Glow
                    if (this.type === 'stars' && this.size > 1.5) {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, this.opacity * 0.15 + ')');
                        ctx.fill();
                    }
                    break;

                case 'petals':
                    ctx.translate(this.x, this.y);
                    ctx.rotate((this.rotation * Math.PI) / 180);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
                    ctx.fillStyle = this.color.replace(/[\d.]+\)$/, this.opacity * 0.4 + ')');
                    ctx.fill();
                    break;

                case 'fireflies':
                    // Glow
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, this.size * 4
                    );
                    gradient.addColorStop(0, `rgba(255,220,130,${this.opacity * 0.6})`);
                    gradient.addColorStop(0.5, `rgba(255,200,100,${this.opacity * 0.15})`);
                    gradient.addColorStop(1, 'rgba(255,200,100,0)');
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    // Core
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,240,180,${this.opacity})`;
                    ctx.fill();
                    break;

                case 'hearts':
                    ctx.translate(this.x, this.y);
                    ctx.scale(this.size / 10, this.size / 10);
                    ctx.beginPath();
                    ctx.moveTo(0, -3);
                    ctx.bezierCurveTo(-5, -10, -12, -5, 0, 5);
                    ctx.moveTo(0, -3);
                    ctx.bezierCurveTo(5, -10, 12, -5, 0, 5);
                    ctx.fillStyle = this.color.replace(/[\d.]+\)$/, this.opacity + ')');
                    ctx.fill();
                    break;
            }

            ctx.restore();
        }
    }

    function createParticles(type, count) {
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(type));
        }
    }

    function getParticleCount(type) {
        const isMobile = window.innerWidth < 768;
        const counts = {
            stars: isMobile ? 30 : 60,
            dust: isMobile ? 15 : 30,
            sparkles: isMobile ? 20 : 40,
            petals: isMobile ? 12 : 25,
            reflections: isMobile ? 15 : 30,
            fireflies: isMobile ? 12 : 25,
            hearts: isMobile ? 10 : 20,
        };
        return counts[type] || 30;
    }

    // Initialize with stars
    createParticles('stars', getParticleCount('stars'));

    // ============================================
    // Animation Loop
    // ============================================
    function animate() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(ctx);
        }

        requestAnimationFrame(animate);
    }
    animate();

    // ============================================
    // Parallax Engine
    // ============================================
    function updateParallax() {
        const viewportCenter = scrollY + window.innerHeight / 2;

        parallaxLayers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            const parent = layer.closest('.realm');
            if (!parent) return;

            const rect = parent.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const offset = sectionCenter * depth;

            layer.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
    }

    // ============================================
    // Scroll Handler
    // ============================================
    function onScroll() {
        scrollY = window.scrollY;

        if (!ticking) {
            requestAnimationFrame(() => {
                updateParallax();
                updateProgress();
                updateScrollIndicator();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ============================================
    // Progress Bar
    // ============================================
    function updateProgress() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollY / docHeight) * 100;
        progressBar.style.width = Math.min(progress, 100) + '%';
    }

    // ============================================
    // Scroll Indicator
    // ============================================
    function updateScrollIndicator() {
        if (scrollY > 100) {
            scrollIndicator.classList.add('hidden');
        } else {
            scrollIndicator.classList.remove('hidden');
        }
    }

    // ============================================
    // Intersection Observer: Reveal Animations
    // ============================================
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay) || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px',
        }
    );

    reveals.forEach(el => revealObserver.observe(el));

    // ============================================
    // Intersection Observer: Realm Particles
    // ============================================
    const realmObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const newType = entry.target.dataset.particles;
                    if (newType && newType !== currentRealm) {
                        currentRealm = newType;
                        createParticles(newType, getParticleCount(newType));
                    }
                }
            });
        },
        {
            threshold: 0.4,
        }
    );

    realms.forEach(r => realmObserver.observe(r));

    // ============================================
    // Mouse tracking (subtle interaction)
    // ============================================
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // ============================================
    // Initial setup
    // ============================================
    updateParallax();
    updateProgress();

    // Show scroll indicator after a moment
    setTimeout(() => {
        scrollIndicator.style.opacity = '1';
    }, 1500);

    // Trigger first realm reveals immediately
    setTimeout(() => {
        const firstReveals = document.querySelectorAll('#realm-1 .reveal');
        firstReveals.forEach((el, i) => {
            const delay = parseInt(el.dataset.delay) || 0;
            setTimeout(() => {
                el.classList.add('visible');
            }, 600 + delay);
        });
    }, 300);

})();

/* ============================================
   MINI GAMES
   ============================================ */
let activeGame = null;
let gameAnimFrame = null;

function openGame(gameId) {
    const overlay = document.getElementById('game-overlay');
    const titleEl = document.getElementById('game-overlay-title');
    const scoreEl = document.getElementById('game-score');
    const gameCanvas = document.getElementById('game-canvas');
    const memoryBoard = document.getElementById('memory-board');
    const pianoContainer = document.getElementById('piano-container');
    const wishContainer = document.getElementById('wish-container');
    const drawContainer = document.getElementById('draw-container');
    const slideContainer = document.getElementById('slide-container');
    const scratchContainer = document.getElementById('scratch-container');
    const fireworksContainer = document.getElementById('fireworks-container');

    // Reset all
    gameCanvas.style.display = 'none';
    memoryBoard.classList.remove('active');
    memoryBoard.innerHTML = '';
    pianoContainer.classList.remove('active');
    pianoContainer.querySelector('#piano-keys').innerHTML = '';
    wishContainer.classList.remove('active');
    drawContainer.classList.remove('active');
    slideContainer.classList.remove('active');
    scratchContainer.classList.remove('active');
    fireworksContainer.classList.remove('active');
    scoreEl.textContent = '0';

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));

    activeGame = gameId;

    switch (gameId) {
        case 'star-catch':
            titleEl.textContent = '⭐ Yıldız Yakala';
            scoreEl.textContent = '0';
            gameCanvas.style.display = 'block';
            startStarCatch(gameCanvas, scoreEl);
            break;
        case 'memory':
            titleEl.textContent = '🃏 Hafıza Kartları';
            scoreEl.textContent = '0 hamle';
            memoryBoard.classList.add('active');
            startMemory(memoryBoard, scoreEl);
            break;
        case 'bubble':
            titleEl.textContent = '🫧 Balon Patlatma';
            scoreEl.textContent = '0';
            gameCanvas.style.display = 'block';
            startBubblePop(gameCanvas, scoreEl);
            break;
        case 'melody':
            titleEl.textContent = '🎹 Melodi Kutusu';
            scoreEl.textContent = '♪';
            pianoContainer.classList.add('active');
            startMelody();
            break;
        case 'wish':
            titleEl.textContent = '🌠 Dilek Feneri';
            scoreEl.textContent = '';
            wishContainer.classList.add('active');
            startWishLantern();
            break;
        case 'draw':
            titleEl.textContent = '✏️ Birlikte Çiz';
            scoreEl.textContent = '';
            drawContainer.classList.add('active');
            startDrawing();
            break;
        case 'slide':
            titleEl.textContent = '☄️ Yıldız Kayması';
            scoreEl.textContent = '0 m';
            slideContainer.classList.add('active');
            startSlide(scoreEl);
            break;
        case 'scratch':
            titleEl.textContent = '💌 Gizli Mesaj';
            scoreEl.textContent = '';
            scratchContainer.classList.add('active');
            startScratch();
            break;
        case 'fireworks':
            titleEl.textContent = '🎆 Havai Fişek';
            scoreEl.textContent = '';
            fireworksContainer.classList.add('active');
            startFireworks();
            break;
    }
}

function closeGame() {
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        // Cleanup containers
        document.getElementById('piano-container').classList.remove('active');
        document.getElementById('wish-container').classList.remove('active');
        document.getElementById('draw-container').classList.remove('active');
        document.getElementById('slide-container').classList.remove('active');
        document.getElementById('scratch-container').classList.remove('active');
        document.getElementById('fireworks-container').classList.remove('active');
    }, 400);
    if (gameAnimFrame) {
        cancelAnimationFrame(gameAnimFrame);
        gameAnimFrame = null;
    }
    // Stop audio context if exists
    if (window._melodyAudioCtx) {
        try { window._melodyAudioCtx.close(); } catch (e) { }
        window._melodyAudioCtx = null;
    }
    if (window._wishAnimFrame) {
        cancelAnimationFrame(window._wishAnimFrame);
        window._wishAnimFrame = null;
    }
    if (window._slideAnimFrame) {
        cancelAnimationFrame(window._slideAnimFrame);
        window._slideAnimFrame = null;
    }
    if (window._scratchAnimFrame) {
        cancelAnimationFrame(window._scratchAnimFrame);
        window._scratchAnimFrame = null;
    }
    if (window._fireworksAnimFrame) {
        cancelAnimationFrame(window._fireworksAnimFrame);
        window._fireworksAnimFrame = null;
    }
    activeGame = null;
}

/* ──────────────────────────────
   Game 1: Yıldız Yakala
   ────────────────────────────── */
function startStarCatch(canvas, scoreEl) {
    const ctx = canvas.getContext('2d');
    const W = Math.min(400, window.innerWidth * 0.9);
    const H = Math.min(550, window.innerHeight * 0.65);
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    let score = 0;
    let stars = [];
    let sparkles = [];
    let missed = 0;
    const maxMiss = 5;
    let gameOver = false;

    class Star {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * (W - 30) + 15;
            this.y = -20;
            this.size = Math.random() * 10 + 12;
            this.speed = Math.random() * 1.5 + 0.8;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 3;
            this.opacity = 0.7 + Math.random() * 0.3;
            const hues = [45, 35, 55, 340, 280];
            this.hue = hues[Math.floor(Math.random() * hues.length)];
        }
        update() {
            this.y += this.speed;
            this.rotation += this.rotSpeed;
            if (this.y > H + 20) {
                missed++;
                this.reset();
            }
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.globalAlpha = this.opacity;
            // Glow
            ctx.shadowColor = `hsla(${this.hue}, 80%, 70%, 0.4)`;
            ctx.shadowBlur = 12;
            // Star shape
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 72 - 90) * Math.PI / 180;
                const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
                ctx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
                ctx.lineTo(Math.cos(innerAngle) * this.size * 0.4, Math.sin(innerAngle) * this.size * 0.4);
            }
            ctx.closePath();
            ctx.fillStyle = `hsla(${this.hue}, 80%, 75%, 0.85)`;
            ctx.fill();
            ctx.restore();
        }
        contains(px, py) {
            return Math.hypot(px - this.x, py - this.y) < this.size + 8;
        }
    }

    // Create initial stars
    for (let i = 0; i < 4; i++) {
        const s = new Star();
        s.y = Math.random() * H * 0.5;
        stars.push(s);
    }

    // Click/tap handler
    function handleClick(e) {
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        for (let i = stars.length - 1; i >= 0; i--) {
            if (stars[i].contains(px, py)) {
                // Sparkle effect
                for (let j = 0; j < 6; j++) {
                    sparkles.push({
                        x: stars[i].x, y: stars[i].y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        size: Math.random() * 3 + 1,
                        life: 1,
                        hue: stars[i].hue,
                    });
                }
                score++;
                scoreEl.textContent = score;
                stars[i].reset();
                // Speed up slightly
                if (score % 5 === 0 && stars.length < 10) {
                    stars.push(new Star());
                }
                break;
            }
        }
    }
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleClick(e); }, { passive: false });

    function gameLoop() {
        ctx.clearRect(0, 0, W, H);

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0e0a28');
        grad.addColorStop(1, '#1a1040');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // BG stars
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(
                (i * 73 + 10) % W,
                (i * 47 + 20) % H,
                0.8, 0, Math.PI * 2
            );
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (!gameOver) {
            // Update & draw stars
            for (const s of stars) {
                s.update();
                s.draw(ctx);
            }

            // Update & draw sparkles
            for (let i = sparkles.length - 1; i >= 0; i--) {
                const sp = sparkles[i];
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.life -= 0.03;
                if (sp.life <= 0) { sparkles.splice(i, 1); continue; }
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${sp.hue}, 80%, 75%, ${sp.life * 0.8})`;
                ctx.fill();
            }

            // Miss indicator
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '12px Outfit';
            ctx.textAlign = 'left';
            const hearts = '♡'.repeat(maxMiss - missed) + '♥'.repeat(missed);
            ctx.fillText(hearts, 10, 22);

            if (missed >= maxMiss) {
                gameOver = true;
            }
        } else {
            // Game over screen
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(240,170,200,0.9)';
            ctx.font = '600 24px Outfit';
            ctx.fillText('✨ ' + score + ' yıldız!', W / 2, H / 2 - 10);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '300 13px Outfit';
            ctx.fillText('tekrar oynamak için dokun', W / 2, H / 2 + 20);

            canvas.onclick = (e) => {
                score = 0; missed = 0; gameOver = false;
                stars = [];
                sparkles = [];
                for (let i = 0; i < 4; i++) stars.push(new Star());
                scoreEl.textContent = '0';
                canvas.onclick = null;
                canvas.addEventListener('click', handleClick);
            };
        }

        if (activeGame === 'star-catch') {
            gameAnimFrame = requestAnimationFrame(gameLoop);
        }
    }
    gameLoop();
}

/* ──────────────────────────────
   Game 2: Hafıza Kartları
   ────────────────────────────── */
function startMemory(board, scoreEl) {
    const emojis = ['🌸', '🌙', '⭐', '🦋', '💜', '☁️', '🌺', '✨'];
    const pairs = [...emojis, ...emojis];
    let moves = 0;
    let flippedCards = [];
    let matchedCount = 0;
    let isLocked = false;

    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    // Create cards
    pairs.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="memory-card__inner">
                <div class="memory-card__front"></div>
                <div class="memory-card__back">${emoji}</div>
            </div>
        `;
        card.addEventListener('click', () => flipCard(card));
        board.appendChild(card);
    });

    function flipCard(card) {
        if (isLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            moves++;
            scoreEl.textContent = moves + ' hamle';
            isLocked = true;

            const [a, b] = flippedCards;
            if (a.dataset.emoji === b.dataset.emoji) {
                // Match!
                setTimeout(() => {
                    a.classList.add('matched');
                    b.classList.add('matched');
                    matchedCount += 2;
                    flippedCards = [];
                    isLocked = false;

                    if (matchedCount === pairs.length) {
                        setTimeout(() => {
                            scoreEl.textContent = '🎉 ' + moves + ' hamlede tamamlandı!';
                        }, 400);
                    }
                }, 400);
            } else {
                // No match
                setTimeout(() => {
                    a.classList.remove('flipped');
                    b.classList.remove('flipped');
                    flippedCards = [];
                    isLocked = false;
                }, 800);
            }
        }
    }
}

/* ──────────────────────────────
   Game 3: Balon Patlatma
   ────────────────────────────── */
function startBubblePop(canvas, scoreEl) {
    const ctx = canvas.getContext('2d');
    const W = Math.min(400, window.innerWidth * 0.9);
    const H = Math.min(550, window.innerHeight * 0.65);
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    let score = 0;
    let bubbles = [];
    let pops = [];
    let time = 30;
    let gameOver = false;
    let lastTime = Date.now();

    const colors = [
        { h: 340, s: 70, l: 75 }, // pink
        { h: 270, s: 60, l: 72 }, // purple
        { h: 200, s: 60, l: 75 }, // blue
        { h: 45, s: 70, l: 75 },  // golden
        { h: 150, s: 50, l: 72 }, // mint
        { h: 310, s: 55, l: 72 }, // orchid
    ];

    class Bubble {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * (W - 40) + 20;
            this.y = H + 30;
            this.r = Math.random() * 15 + 15;
            this.speed = Math.random() * 1.2 + 0.5;
            this.wobblePhase = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.03 + 0.01;
            this.wobbleAmp = Math.random() * 1.5 + 0.5;
            const c = colors[Math.floor(Math.random() * colors.length)];
            this.h = c.h; this.s = c.s; this.l = c.l;
        }
        update() {
            this.y -= this.speed;
            this.wobblePhase += this.wobbleSpeed;
            this.x += Math.sin(this.wobblePhase) * this.wobbleAmp;
            if (this.y < -40) this.reset();
        }
        draw(ctx) {
            ctx.save();
            // Outer glow
            const grd = ctx.createRadialGradient(
                this.x - this.r * 0.2, this.y - this.r * 0.2, this.r * 0.1,
                this.x, this.y, this.r
            );
            grd.addColorStop(0, `hsla(${this.h},${this.s}%,${this.l + 15}%,0.5)`);
            grd.addColorStop(0.7, `hsla(${this.h},${this.s}%,${this.l}%,0.3)`);
            grd.addColorStop(1, `hsla(${this.h},${this.s}%,${this.l - 5}%,0.1)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
            // Border
            ctx.strokeStyle = `hsla(${this.h},${this.s}%,${this.l + 10}%,0.25)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            // Highlight
            ctx.beginPath();
            ctx.ellipse(
                this.x - this.r * 0.25,
                this.y - this.r * 0.25,
                this.r * 0.25, this.r * 0.15,
                -0.5, 0, Math.PI * 2
            );
            ctx.fillStyle = `hsla(0,0%,100%,0.2)`;
            ctx.fill();
            ctx.restore();
        }
        contains(px, py) {
            return Math.hypot(px - this.x, py - this.y) < this.r + 5;
        }
    }

    // Create initial bubbles
    for (let i = 0; i < 8; i++) {
        const b = new Bubble();
        b.y = Math.random() * H;
        bubbles.push(b);
    }

    function handleClick(e) {
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        for (let i = bubbles.length - 1; i >= 0; i--) {
            if (bubbles[i].contains(px, py)) {
                // Pop effect
                for (let j = 0; j < 8; j++) {
                    const angle = (j / 8) * Math.PI * 2;
                    pops.push({
                        x: bubbles[i].x, y: bubbles[i].y,
                        vx: Math.cos(angle) * 2.5,
                        vy: Math.sin(angle) * 2.5,
                        size: Math.random() * 3 + 1.5,
                        life: 1,
                        h: bubbles[i].h, s: bubbles[i].s, l: bubbles[i].l,
                    });
                }
                score++;
                scoreEl.textContent = score;
                bubbles[i].reset();
                // Add more bubbles as score increases
                if (score % 8 === 0 && bubbles.length < 15) {
                    bubbles.push(new Bubble());
                }
                break;
            }
        }
    }
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleClick(e); }, { passive: false });

    function gameLoop() {
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        ctx.clearRect(0, 0, W, H);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1240');
        grad.addColorStop(1, '#0e0828');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        if (!gameOver) {
            time -= dt;
            if (time <= 0) {
                time = 0;
                gameOver = true;
            }

            // Timer bar
            const timerPct = time / 30;
            ctx.fillStyle = `hsla(${timerPct * 120 + 240}, 60%, 65%, 0.4)`;
            ctx.fillRect(10, 10, (W - 20) * timerPct, 4);

            // Timer text
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '300 11px Outfit';
            ctx.textAlign = 'right';
            ctx.fillText(Math.ceil(time) + 's', W - 10, 28);

            for (const b of bubbles) {
                b.update();
                b.draw(ctx);
            }

            // Pop particles
            for (let i = pops.length - 1; i >= 0; i--) {
                const p = pops[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.04;
                if (p.life <= 0) { pops.splice(i, 1); continue; }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.h},${p.s}%,${p.l}%,${p.life * 0.6})`;
                ctx.fill();
            }
        } else {
            // Game over
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(200,160,240,0.9)';
            ctx.font = '600 24px Outfit';
            ctx.fillText('🫧 ' + score + ' balon!', W / 2, H / 2 - 10);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '300 13px Outfit';
            ctx.fillText('tekrar oynamak için dokun', W / 2, H / 2 + 20);

            canvas.onclick = (e) => {
                score = 0; time = 30; gameOver = false;
                bubbles = []; pops = [];
                lastTime = Date.now();
                for (let i = 0; i < 8; i++) { const b = new Bubble(); b.y = Math.random() * H; bubbles.push(b); }
                scoreEl.textContent = '0';
                canvas.onclick = null;
                canvas.addEventListener('click', handleClick);
            };
        }

        if (activeGame === 'bubble') {
            gameAnimFrame = requestAnimationFrame(gameLoop);
        }
    }
    gameLoop();
}

/* ──────────────────────────────
   Game 4: Melodi Kutusu (Piano)
   ────────────────────────────── */
function startMelody() {
    const keysContainer = document.getElementById('piano-keys');
    const visualizerCanvas = document.getElementById('piano-visualizer');
    const vCtx = visualizerCanvas.getContext('2d');

    // Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    window._melodyAudioCtx = audioCtx;

    // Pentatonic scale notes (dreamy, can't sound bad)
    const notes = [
        { name: 'Do', freq: 261.63, hue: 340 },
        { name: 'Re', freq: 293.66, hue: 320 },
        { name: 'Mi', freq: 329.63, hue: 280 },
        { name: 'Sol', freq: 392.00, hue: 260 },
        { name: 'La', freq: 440.00, hue: 240 },
        { name: 'Do\'', freq: 523.25, hue: 200 },
        { name: 'Re\'', freq: 587.33, hue: 180 },
        { name: 'Mi\'', freq: 659.25, hue: 45 },
    ];

    // Visualizer particles
    let vizParticles = [];

    // Resize visualizer
    const vW = visualizerCanvas.parentElement.offsetWidth || 400;
    visualizerCanvas.width = vW * 2;
    visualizerCanvas.height = 80 * 2;
    visualizerCanvas.style.width = vW + 'px';
    visualizerCanvas.style.height = '80px';
    vCtx.scale(2, 2);

    // Create keys
    notes.forEach((note, i) => {
        const key = document.createElement('div');
        key.className = 'piano-key';
        key.textContent = note.name;
        key.dataset.index = i;

        function playNote() {
            if (!audioCtx || audioCtx.state === 'closed') return;
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, audioCtx.currentTime);

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.5);

            // Visual feedback
            key.classList.add('active');
            setTimeout(() => key.classList.remove('active'), 200);

            // Visualizer particles
            const kx = (i / notes.length) * vW + (vW / notes.length / 2);
            for (let j = 0; j < 5; j++) {
                vizParticles.push({
                    x: kx + (Math.random() - 0.5) * 20,
                    y: 70,
                    vy: -Math.random() * 1.5 - 0.5,
                    vx: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 3 + 1.5,
                    life: 1,
                    hue: note.hue,
                });
            }
        }

        key.addEventListener('mousedown', playNote);
        key.addEventListener('touchstart', (e) => { e.preventDefault(); playNote(); }, { passive: false });
        keysContainer.appendChild(key);
    });

    // Visualizer animation
    function animateViz() {
        vCtx.clearRect(0, 0, vW, 80);

        for (let i = vizParticles.length - 1; i >= 0; i--) {
            const p = vizParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.015;
            if (p.life <= 0) { vizParticles.splice(i, 1); continue; }

            vCtx.beginPath();
            vCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            vCtx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.life * 0.7})`;
            vCtx.fill();
        }

        if (activeGame === 'melody') {
            requestAnimationFrame(animateViz);
        }
    }
    animateViz();
}

/* ──────────────────────────────
   Game 5: Dilek Feneri (Wish Lantern)
   ────────────────────────────── */
let wishLanterns = [];
let wishStars = [];

function startWishLantern() {
    const canvas = document.getElementById('wish-canvas');
    const ctx = canvas.getContext('2d');
    const W = Math.min(400, window.innerWidth * 0.9);
    const H = 400;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    wishLanterns = [];
    wishStars = [];

    // Create background stars
    for (let i = 0; i < 40; i++) {
        wishStars.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.7,
            size: Math.random() * 1.5 + 0.5,
            twinkle: Math.random() * Math.PI * 2,
        });
    }

    document.getElementById('wish-input').value = '';
    document.getElementById('wish-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') releaseWish();
    });

    function animate() {
        ctx.clearRect(0, 0, W, H);

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0820');
        grad.addColorStop(0.7, '#1a1040');
        grad.addColorStop(1, '#0e0828');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        for (const s of wishStars) {
            s.twinkle += 0.02;
            const alpha = (Math.sin(s.twinkle) + 1) * 0.3 + 0.2;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fill();
        }

        // Lanterns
        for (let i = wishLanterns.length - 1; i >= 0; i--) {
            const l = wishLanterns[i];
            l.y -= l.speed;
            l.x += Math.sin(l.wobble) * 0.3;
            l.wobble += 0.02;
            l.life -= 0.002;

            if (l.life <= 0 || l.y < -60) {
                wishLanterns.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.min(l.life, 1);

            // Glow
            const glow = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 35);
            glow.addColorStop(0, 'rgba(255,220,150,0.3)');
            glow.addColorStop(1, 'rgba(255,180,100,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(l.x - 35, l.y - 35, 70, 70);

            // Lantern body
            ctx.beginPath();
            ctx.roundRect(l.x - 10, l.y - 14, 20, 26, 4);
            ctx.fillStyle = `rgba(255,200,130,${0.5 * l.life})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255,180,100,${0.3 * l.life})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Text on lantern
            if (l.text) {
                ctx.fillStyle = `rgba(180,120,60,${0.6 * l.life})`;
                ctx.font = '300 7px Outfit';
                ctx.textAlign = 'center';
                const words = l.text.split(' ');
                words.forEach((w, wi) => {
                    if (wi < 3) ctx.fillText(w, l.x, l.y - 6 + wi * 9);
                });
            }

            // Sparkle trail
            if (Math.random() > 0.7) {
                ctx.beginPath();
                ctx.arc(
                    l.x + (Math.random() - 0.5) * 8,
                    l.y + 16 + Math.random() * 10,
                    Math.random() * 1.5,
                    0, Math.PI * 2
                );
                ctx.fillStyle = `rgba(255,200,130,${Math.random() * 0.4})`;
                ctx.fill();
            }

            ctx.restore();
        }

        // Hint text if no lanterns
        if (wishLanterns.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '300 13px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('dileğini yaz ve feneri bırak', W / 2, H / 2);
        }

        if (activeGame === 'wish') {
            window._wishAnimFrame = requestAnimationFrame(animate);
        }
    }
    animate();
}

function releaseWish() {
    const input = document.getElementById('wish-input');
    const text = input.value.trim();
    if (!text) return;

    const canvas = document.getElementById('wish-canvas');
    const W = parseInt(canvas.style.width);
    const H = 400;

    wishLanterns.push({
        x: W / 2 + (Math.random() - 0.5) * 60,
        y: H - 40,
        speed: Math.random() * 0.5 + 0.4,
        wobble: Math.random() * Math.PI * 2,
        life: 1.5,
        text: text,
    });

    input.value = '';
    input.focus();
}

/* ──────────────────────────────
   Game 6: Birlikte Çiz (Drawing Board)
   ────────────────────────────── */
let drawColor = 'rgba(240,170,200,0.8)';
let drawSize = 3;
let drawCtx = null;

function startDrawing() {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    drawCtx = ctx;

    const W = Math.min(400, window.innerWidth * 0.88);
    const H = 400;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    // Fill with dark background
    ctx.fillStyle = 'rgba(15,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);

    // Pastel colors
    const colors = [
        'rgba(240,170,200,0.8)',
        'rgba(200,160,240,0.8)',
        'rgba(180,220,250,0.8)',
        'rgba(255,220,160,0.8)',
        'rgba(180,230,200,0.8)',
        'rgba(255,180,180,0.8)',
        'rgba(220,200,255,0.8)',
        'rgba(255,255,255,0.7)',
    ];

    // Create color buttons
    const colorsContainer = document.getElementById('draw-colors');
    colorsContainer.innerHTML = '';
    colors.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'draw-color-btn' + (i === 0 ? ' active' : '');
        btn.style.background = c;
        btn.style.color = c;
        btn.onclick = () => {
            drawColor = c;
            colorsContainer.querySelectorAll('.draw-color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        colorsContainer.appendChild(btn);
    });

    // Drawing state
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
        return [x, y];
    }

    function startDraw(e) {
        isDrawing = true;
        [lastX, lastY] = getPos(e);
    }

    function doDraw(e) {
        if (!isDrawing) return;
        const [x, y] = getPos(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = drawColor;
        ctx.shadowBlur = drawSize * 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        lastX = x;
        lastY = y;
    }

    function endDraw() {
        isDrawing = false;
    }

    // Remove old listeners (in case of re-open)
    canvas.onmousedown = startDraw;
    canvas.onmousemove = doDraw;
    canvas.onmouseup = endDraw;
    canvas.onmouseleave = endDraw;
    canvas.ontouchstart = (e) => { e.preventDefault(); startDraw(e); };
    canvas.ontouchmove = (e) => { e.preventDefault(); doDraw(e); };
    canvas.ontouchend = endDraw;
}

function setDrawSize(size, btn) {
    drawSize = size;
    document.querySelectorAll('.draw-size-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function clearDrawing() {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    const W = parseInt(canvas.style.width);
    const H = 400;
    ctx.fillStyle = 'rgba(15,10,30,0.95)';
    ctx.fillRect(0, 0, W, H);
}

/* ──────────────────────────────
   Game 7: Yıldız Kayması (Sandboarding/Alto Style - Jumper Version)
   ────────────────────────────── */
let slideController = null;

function startSlide(scoreEl) {
    if (window._slideAnimFrame) {
        cancelAnimationFrame(window._slideAnimFrame);
        window._slideAnimFrame = null;
    }
    const canvas = document.getElementById('slide-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = Math.min(450, window.innerWidth * 0.95);
    const H = 350;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    const gameoverMenu = document.getElementById('slide-gameover');
    gameoverMenu.classList.remove('active');
    if (!scoreEl) scoreEl = document.getElementById('game-score');

    let isGameOver = false;
    let score = 0;
    scoreEl.textContent = '0 ⭐';

    let cameraX = 0;
    let lastSpawnX = 0;

    const slider = {
        x: W * 0.3,
        y: 100,
        vx: 3.8, // Slower base speed
        vy: 0,
        size: 8,
        grounded: false
    };

    let particles = [];
    let trail = [];
    let entities = []; // stars and rocks

    function getTerrainY(x) {
        // Flat terrain like Dinosaur game
        return H * 0.75;
    }

    function getTerrainSlope(x) {
        return 0; // Flat
    }

    if (slideController) {
        canvas.removeEventListener('touchstart', slideController.ds);
        canvas.removeEventListener('mousedown', slideController.ms);
        document.removeEventListener('keydown', slideController.kd);
    }

    function jump(e) {
        if (e && e.type !== 'keydown') e.preventDefault();
        if (slider.grounded && !isGameOver) {
            slider.vy = -9.5; // Snappy jump
            slider.grounded = false;

            // Jump particles
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: slider.x,
                    y: slider.y + slider.size,
                    vx: -slider.vx * 0.5 + (Math.random() - 0.5) * 3,
                    vy: Math.random() * 2,
                    life: 1,
                    decay: 0.05,
                    color: 'rgba(255,255,255,0.6)'
                });
            }
        }
    }

    slideController = {
        ds: jump,
        ms: jump,
        kd: (e) => { if (e.code === 'Space') jump(e); }
    };

    canvas.addEventListener('touchstart', slideController.ds, { passive: false });
    canvas.addEventListener('mousedown', slideController.ms);
    document.addEventListener('keydown', slideController.kd);

    function spawnEntities() {
        if (cameraX - lastSpawnX > Math.random() * 250 + 300) {
            lastSpawnX = cameraX;
            let spawnWorldX = cameraX + W + 100;

            if (Math.random() < 0.4) {
                // Spawn a rock obstacle
                entities.push({
                    type: 'rock',
                    x: spawnWorldX,
                    active: true,
                    width: 16,
                    height: 22 // slightly taller to require careful jump
                });
            } else {
                // Spawn a star to collect
                entities.push({
                    type: 'star',
                    x: spawnWorldX,
                    // Float somewhere above the terrain
                    yOffset: -Math.random() * 50 - 30,
                    active: true,
                    size: 7,
                    rot: Math.random() * Math.PI
                });
            }
        }
    }

    function gameOver() {
        if (isGameOver) return;
        isGameOver = true;

        for (let i = 0; i < 30; i++) {
            particles.push({
                x: slider.x,
                y: slider.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                decay: 0.02,
                color: 'rgba(255,100,100,0.9)'
            });
        }

        document.getElementById('slide-final-score').textContent = score + " ⭐";
        setTimeout(() => gameoverMenu.classList.add('active'), 800);
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);

        if (!isGameOver) {
            spawnEntities();

            // Increase speed very slowly over time
            slider.vx += 0.0005;
            if (slider.vx > 7) slider.vx = 7;

            let worldX = cameraX + slider.x;
            slider.vy += 0.5; // Higher gravity for snappier dino-style fall

            if (slider.vy > 14) slider.vy = 14;

            worldX += slider.vx;
            slider.y += slider.vy;
            cameraX += slider.vx;

            let terrainY = getTerrainY(worldX);

            // Collision with ground
            if (slider.y >= terrainY - slider.size) {
                slider.y = terrainY - slider.size;
                slider.grounded = true;

                // vy matches slope so we visually stick to ground without jumping logic running
                let slope = getTerrainSlope(worldX);
                slider.vy = slope * slider.vx;

                if (slider.vx > 5 && Math.random() < 0.2) {
                    particles.push({
                        x: slider.x,
                        y: slider.y + slider.size,
                        vx: -slider.vx * 0.3 + (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 2,
                        life: 1,
                        decay: 0.05,
                        color: 'rgba(255,255,255,0.4)'
                    });
                }
            } else {
                slider.grounded = false;
            }

            // Entity updating and Collision
            for (let i = entities.length - 1; i >= 0; i--) {
                let e = entities[i];
                if (!e.active) continue;

                let eScreenX = e.x - cameraX;
                let eWorldY = (e.type === 'rock') ? getTerrainY(e.x) : (getTerrainY(e.x) + e.yOffset);
                let eScreenY = eWorldY;

                // If passed screen, remove softly by marking inactive
                if (eScreenX < -50) {
                    e.active = false;
                    continue;
                }

                // Check collision based on type
                if (e.type === 'rock') {
                    // distance from center of rock
                    let dx = slider.x - eScreenX;
                    let dy = slider.y - (eScreenY - e.height / 2);
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    // Supremely forgiving hitbox! 
                    if (dist < slider.size + 2) {
                        gameOver();
                    }
                } else if (e.type === 'star') {
                    let dx = slider.x - eScreenX;
                    let dy = slider.y - eScreenY;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    // Easy to collect stars
                    if (dist < slider.size + e.size + 15) {
                        // Collect star
                        e.active = false;
                        score++;
                        scoreEl.textContent = score + " ⭐";

                        // Sparkle
                        for (let p = 0; p < 10; p++) {
                            particles.push({
                                x: eScreenX,
                                y: eScreenY,
                                vx: (Math.random() - 0.5) * 5,
                                vy: (Math.random() - 0.5) * 5,
                                life: 1,
                                decay: 0.03,
                                color: 'rgba(255, 230, 150, 0.9)'
                            });
                        }
                    }
                }
            }

            // cleanup inactive entities occasionally to save memory
            if (entities.length > 20) {
                entities = entities.filter(e => e.active);
            }

            if (slider.y > H + 100) gameOver();
        }

        // DRAWING
        // Parallax Mountains
        ctx.fillStyle = 'rgba(60, 40, 80, 0.4)';
        ctx.beginPath();
        for (let px = 0; px <= W; px += 20) {
            let py = (H * 0.4) + Math.sin((px + cameraX * 0.2) * 0.005) * 40 + Math.sin((px + cameraX * 0.2) * 0.01) * 20;
            if (px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.fill();

        // Terrain
        ctx.fillStyle = 'rgba(20, 15, 40, 0.95)';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(200, 160, 230, 0.8)';
        ctx.beginPath();
        for (let sx = 0; sx <= W + 20; sx += 10) {
            let wx = cameraX + sx;
            let sy = getTerrainY(wx);
            if (sx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.lineTo(W + 20, H);
        ctx.lineTo(0, H);
        ctx.fill();
        ctx.stroke();

        // Entities
        for (let e of entities) {
            if (!e.active) continue;
            let eScreenX = e.x - cameraX;
            let eWorldY = (e.type === 'rock') ? getTerrainY(e.x) : (getTerrainY(e.x) + e.yOffset);

            if (e.type === 'rock') {
                ctx.save();
                ctx.translate(eScreenX, eWorldY);
                // Draw crystal/rock shape sprouting from ground
                ctx.fillStyle = 'rgba(100, 70, 140, 0.9)';
                ctx.beginPath();
                ctx.moveTo(-e.width / 2, 5);
                ctx.lineTo(-e.width / 4, -e.height);
                ctx.lineTo(e.width / 4, -e.height + 4);
                ctx.lineTo(e.width / 2, 5);
                ctx.closePath();
                ctx.fill();

                // Highlight
                ctx.strokeStyle = 'rgba(200, 150, 255, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-e.width / 4, -e.height);
                ctx.lineTo(0, 5);
                ctx.stroke();
                ctx.restore();
            } else if (e.type === 'star') {
                ctx.save();
                ctx.translate(eScreenX, eWorldY);
                e.rot += 0.02;
                ctx.rotate(e.rot);
                ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(255, 230, 150, 0.6)';
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * e.size,
                        -Math.sin((18 + i * 72) / 180 * Math.PI) * e.size);
                    ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (e.size / 2.5),
                        -Math.sin((54 + i * 72) / 180 * Math.PI) * (e.size / 2.5));
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        // Trail
        if (!isGameOver) {
            trail.push({ x: slider.x, y: slider.y });
            if (trail.length > 25) trail.shift();
        }

        if (trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) {
                // trail moves left relative to camera speed
                trail[i].x -= (!isGameOver ? slider.vx : 0);
                ctx.lineTo(trail[i].x, trail[i].y);
            }
            ctx.strokeStyle = 'rgba(240, 170, 200, 0.6)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            trail = trail.filter(t => t.x > -50);
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx - (!isGameOver ? slider.vx : 0);
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, 3 * p.life), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Slider
        if (!isGameOver) {
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(240, 170, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(slider.x, slider.y, slider.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        if (activeGame === 'slide') {
            window._slideAnimFrame = requestAnimationFrame(animate);
        }
    }

    animate();
}

/* ──────────────────────────────
   Game 8: Gizli Mesaj (Scratch Card)
   ────────────────────────────── */
let scratchMessages = [
    "Seni dünyalar kadar çok seviyorum 💜",
    "Gülüşün gökyüzüm gibi ☁️",
    "İyiki varsın ✨",
    "Seninle her an çok özel 🌸",
    "Kalbimin en güzel yerisin 💌"
];
let currentScratchMsgIdx = 0;

function startScratch() {
    setupScratchCard();
}

function nextScratchCard() {
    currentScratchMsgIdx = (currentScratchMsgIdx + 1) % scratchMessages.length;
    setupScratchCard();
}

function setupScratchCard() {
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    const W = 300;
    const H = 200;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    // Initial Cover
    ctx.fillStyle = '#C8A0E6'; // Purple cover
    ctx.fillRect(0, 0, W, H);

    // Pattern
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '300 20px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ kazı kazan ⭐', W / 2, H / 2 + 7);

    // Setup global composite operation for scratching
    ctx.globalCompositeOperation = 'destination-out';

    let isScratching = false;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
        return [x, y];
    }

    function scratch(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    function doAction(e) {
        if (!isScratching) return;
        const [x, y] = getPos(e);
        scratch(x, y);
        checkReveal();
    }

    canvas.onmousedown = (e) => { isScratching = true; doAction(e); };
    canvas.onmousemove = doAction;
    canvas.onmouseup = () => isScratching = false;
    canvas.onmouseleave = () => isScratching = false;
    canvas.ontouchstart = (e) => { e.preventDefault(); isScratching = true; doAction(e); };
    canvas.ontouchmove = (e) => { e.preventDefault(); doAction(e); };
    canvas.ontouchend = () => isScratching = false;

    // Draw the actual message BEHIND the canvas via CSS or handle it on a separate canvas
    // We will use a visual trick: render text on canvas below, then overlay with the scratch canvas.
    // Instead of DOM nodes, let's just make the canvas background the message via CSS.
    canvas.style.background = '#2A1840';

    // Create a temporary canvas to generate the background image
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = W * DPR;
    bgCanvas.height = H * DPR;
    const bCtx = bgCanvas.getContext('2d');
    bCtx.scale(DPR, DPR);

    bCtx.fillStyle = '#2A1840'; // Deep dark purple
    bCtx.fillRect(0, 0, W, H);

    bCtx.fillStyle = '#F0AACE'; // Pastel pink text
    bCtx.font = '300 18px Outfit';
    bCtx.textAlign = 'center';

    let text = scratchMessages[currentScratchMsgIdx];
    let words = text.split(' ');
    let line = '';
    let startY = H / 2 - 10;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = bCtx.measureText(testLine);
        if (metrics.width > W - 40 && n > 0) {
            bCtx.fillText(line, W / 2, startY);
            line = words[n] + ' ';
            startY += 25;
        } else {
            line = testLine;
        }
    }
    bCtx.fillText(line, W / 2, startY);

    canvas.style.backgroundImage = `url(${bgCanvas.toDataURL()})`;
    canvas.style.backgroundSize = '100% 100%';

    let revealed = false;
    function checkReveal() {
        if (revealed) return;

        // Simple heuristic: check some random points
        const imgData = ctx.getImageData(0, 0, W * DPR, H * DPR).data;
        let clearCount = 0;
        let totalChecks = 100;

        for (let i = 0; i < totalChecks; i++) {
            let px = Math.floor(Math.random() * (W * DPR));
            let py = Math.floor(Math.random() * (H * DPR));
            let alpha = imgData[(py * W * DPR + px) * 4 + 3];
            if (alpha < 128) clearCount++;
        }

        if (clearCount > totalChecks * 0.4) {
            revealed = true;
            // Clear entire canvas
            let fade = setInterval(() => {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(0, 0, W, H);
            }, 30);
            setTimeout(() => clearInterval(fade), 1000);
        }
    }
}

/* ──────────────────────────────
   Game 9: Havai Fişek (Fireworks)
   ────────────────────────────── */
function startFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    const W = Math.min(400, window.innerWidth * 0.9);
    const H = Math.min(550, window.innerHeight * 0.65);
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);

    let rockets = [];
    let explosions = [];

    const colors = [
        '#F0AACE', // pink
        '#C8A0E6', // purple
        '#B4DCF0', // blue
        '#FFDC96', // yellow
        '#A0E6B4'  // mint
    ];

    function spawnRocket(x, y) {
        let rocket = {
            x: x,
            y: H,
            targetY: y,
            speed: Math.random() * 3 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            trail: []
        };
        rockets.push(rocket);
    }

    function createExplosion(x, y, color) {
        const numParticles = Math.floor(Math.random() * 30 + 40);
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            explosions.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.015 + 0.015,
                color: color,
                size: Math.random() * 2 + 1
            });
        }
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        spawnRocket(px, py);
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX - rect.left;
        const py = e.touches[0].clientY - rect.top;
        spawnRocket(px, py);
    }, { passive: false });

    // Auto spawn occasionally
    let lastAutoSpawn = Date.now();

    function animate() {
        // Fade background slowly to create trails
        ctx.fillStyle = 'rgba(15, 10, 30, 0.2)';
        ctx.fillRect(0, 0, W, H);

        if (Date.now() - lastAutoSpawn > 2000 && Math.random() < 0.02) {
            spawnRocket(Math.random() * W, Math.random() * (H / 2) + H / 4);
            lastAutoSpawn = Date.now();
        }

        // Rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
            let r = rockets[i];

            r.trail.push({ x: r.x, y: r.y, life: 1 });
            if (r.trail.length > 10) r.trail.shift();

            for (let t of r.trail) {
                t.life -= 0.1;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 2 * Math.max(t.life, 0), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${t.life * 0.5})`;
                ctx.fill();
            }

            r.y -= r.speed;

            ctx.beginPath();
            ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = r.color;
            ctx.fill();

            if (r.y <= r.targetY) {
                createExplosion(r.x, r.y, r.color);
                rockets.splice(i, 1);
            }
        }

        // Explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            let e = explosions[i];
            e.x += e.vx;
            e.y += e.vy;
            e.vy += 0.05; // gravity
            e.life -= e.decay;

            if (e.life <= 0) {
                explosions.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size * e.life, 0, Math.PI * 2);
            ctx.fillStyle = e.color;
            ctx.globalAlpha = e.life;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Initial hint text if empty landscape
        if (rockets.length === 0 && explosions.length === 0) {
            // We keep the background dark, handled by the fade fillRect
        }

        if (activeGame === 'fireworks') {
            window._fireworksAnimFrame = requestAnimationFrame(animate);
        }
    }

    animate();
}
