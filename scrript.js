// Web Audio API Sound Synthesizer
class SoundFX {
    constructor() {
        this.ctx = null;
        this.volume = 0.7;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    playPunch(isHeavy = false) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = isHeavy ? 'square' : 'triangle';
            osc.frequency.setValueAtTime(isHeavy ? 140 : 100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.18);

            gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        } catch(e) {}
    }

    playStar() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5

            gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch(e) {}
    }

    playBell() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(920, this.ctx.currentTime);

            gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 1.8);
        } catch(e) {}
    }
}

const soundFX = new SoundFX();

// Game Configuration & State
const fightersData = [
    { name: "MAC", color: "#3b82f6", glove: "#2563eb", hp: 100, speed: 6, power: 12 },
    { name: "HIPPO KING", color: "#ef4444", glove: "#dc2626", hp: 140, speed: 4, power: 18 },
    { name: "MYSTIC TIGER", color: "#10b981", glove: "#059669", hp: 85, speed: 8, power: 10 },
    { name: "IRON BRAWN", color: "#a855f7", glove: "#9333ea", hp: 120, speed: 5, power: 15 }
];

let gameState = {
    mode: 'single', // 'single' or 'pvp'
    selectedFighterIndex: 0,
    aiFighterIndex: 1,
    scanlinesEnabled: true,
    shakeEnabled: true,
    lameMode: false,
    theme: 'arcade',
    round: 1,
    timer: 99,
    matchActive: false,
    highScore: localStorage.getItem('punch_highscore') || 10500
};

document.getElementById('menu-highscore').innerText = gameState.highScore;

// Input Management
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    soundFX.init();

    // Handle knockdown recovery mashing
    if (knockdownActive) {
        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
            recoveryMashCount++;
        }
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// UI Navigation Functions
function showModeSelect() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('mode-screen').classList.remove('hidden');
}

function showFighterSelect() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('fighter-screen').classList.remove('hidden');
}

function showSettings() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.remove('hidden');
}

function returnToMenu() {
    document.getElementById('mode-screen').classList.add('hidden');
    document.getElementById('fighter-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    gameState.matchActive = false;
}

function selectMode(mode) {
    gameState.mode = mode;
    if (mode === 'single') {
        document.getElementById('p2-controls-label').innerText = "CPU Opponent (AI Career Ladder)";
    } else {
        document.getElementById('p2-controls-label').innerText = "P2: ARROWS (Move/Block) | N (Jab) 7 (Hook) M (Body) , (Star)";
    }
    startMatch();
}

function setFighter(index) {
    gameState.selectedFighterIndex = index;
    document.querySelectorAll('.fighter-card').forEach((card, i) => {
        if (i === index) {
            card.classList.remove('border-slate-700');
            card.classList.add('border-amber-400');
        } else {
            card.classList.remove('border-amber-400');
            card.classList.add('border-slate-700');
        }
    });
}

function updateVolume(val) {
    soundFX.volume = parseFloat(val);
}

function toggleScanlines() {
    gameState.scanlinesEnabled = !gameState.scanlinesEnabled;
    const btn = document.getElementById('btn-scanlines');
    const overlay = document.getElementById('crt-overlay');
    if (gameState.scanlinesEnabled) {
        btn.innerText = "ENABLED";
        btn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white arcade-font text-xs rounded-lg";
        overlay.style.opacity = "1";
    } else {
        btn.innerText = "DISABLED";
        btn.className = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white arcade-font text-xs rounded-lg";
        overlay.style.opacity = "0";
    }
}

function toggleShake() {
    gameState.shakeEnabled = !gameState.shakeEnabled;
    const btn = document.getElementById('btn-shake');
    if (gameState.shakeEnabled) {
        btn.innerText = "ENABLED";
        btn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white arcade-font text-xs rounded-lg";
    } else {
        btn.innerText = "DISABLED";
        btn.className = "px-4 py-2 bg-slate-700 hover:bg-slate-700 text-white arcade-font text-xs rounded-lg";
    }
}

function toggleLameMode() {
    gameState.lameMode = !gameState.lameMode;
    const btn = document.getElementById('btn-lamemode');
    if (gameState.lameMode) {
        btn.innerText = "ACTIVE";
        btn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white arcade-font text-xs rounded-lg";
    } else {
        btn.innerText = "OFF";
        btn.className = "px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white arcade-font text-xs rounded-lg";
    }
}

function changeTheme(theme) {
    gameState.theme = theme;
    const container = document.getElementById('game-container');
    if (theme === 'neon') {
        container.style.borderColor = '#06b6d4';
    } else if (theme === 'nes') {
        container.style.borderColor = '#eab308';
    } else {
        container.style.borderColor = '#f59e0b';
    }
}

function leaveGame() {
    window.close();
    alert("Thanks for playing P.U.N.C.H! You can now close this tab.");
}

class Boxer {
    constructor(x, y, isPlayer1, fighterConfig) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.isPlayer1 = isPlayer1;
        this.config = fighterConfig;
        this.maxHp = fighterConfig.hp;
        this.hp = fighterConfig.hp;
        this.stamina = 100;
        this.stars = 0;
        this.width = 75;
        this.height = 150;

        // Combat States
        this.state = 'idle'; // 'idle', 'walk', 'punch', 'block_high', 'block_low', 'dodge_left', 'dodge_right', 'hit', 'stunned'
        this.punchType = null; // 'jab', 'hook', 'body', 'star'
        this.actionTimer = 0;
        this.facingRight = isPlayer1;
        this.vx = 0;
        this.telegraphTimer = 0;
        this.animTick = 0;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.hp = this.maxHp;
        this.stamina = 100;
        this.stars = 0;
        this.state = 'idle';
        this.actionTimer = 0;
    }

    update(opponent) {
        if (this.state === 'knockdown') return;

        // Recover stamina over time
        if (this.stamina < 100 && Math.random() < 0.1) {
            this.stamina += 1;
        }

        // Handle Action Timer
        if (this.actionTimer > 0) {
            this.actionTimer--;
            if (this.actionTimer === 0 && this.state !== 'knockdown') {
                this.state = 'idle';
                this.punchType = null;
            }
        }

        // Input & Movement Processing
        if (['idle', 'walk'].includes(this.state)) {
            this.vx = 0;

            if (this.isPlayer1) {
                // P1 Controls (WASD + J/U/H/Space)
                if (keys['KeyA']) { this.vx = -this.config.speed; this.state = 'walk'; }
                if (keys['KeyD']) { this.vx = this.config.speed; this.state = 'walk'; }

                // Dodges
                if (keys['KeyS'] && keys['KeyA']) { this.triggerDodge('left'); return; }
                if (keys['KeyS'] && keys['KeyD']) { this.triggerDodge('right'); return; }

                // Blocks
                if (keys['KeyK']) { this.state = 'block_high'; }
                else if (keys['KeyS']) { this.state = 'block_low'; }
                else {
                    // Punches
                    if (this.actionTimer === 0 && this.stamina >= 10) {
                        if (keys['KeyJ']) this.startPunch('jab');
                        else if (keys['KeyU']) this.startPunch('hook');
                        else if (keys['KeyH']) this.startPunch('body');
                        else if (keys['Space'] && this.stars > 0) this.startPunch('star');
                    }
                }
            } else {
                // P2 or AI Controls
                if (gameState.mode === 'pvp') {
                    if (keys['ArrowLeft']) { this.vx = -this.config.speed; this.state = 'walk'; }
                    if (keys['ArrowRight']) { this.vx = this.config.speed; this.state = 'walk'; }

                    if (keys['ArrowDown'] && keys['ArrowLeft']) { this.triggerDodge('left'); return; }
                    if (keys['ArrowDown'] && keys['ArrowRight']) { this.triggerDodge('right'); return; }

                    if (keys['KeyM']) { this.state = 'block_high'; }
                    else if (keys['ArrowDown']) { this.state = 'block_low'; }
                    else {
                        if (this.actionTimer === 0 && this.stamina >= 10) {
                            if (keys['KeyN']) this.startPunch('jab');
                            else if (keys['Digit7'] || keys['KeyU']) this.startPunch('hook');
                            else if (keys['Comma'] && this.stars > 0) this.startPunch('star');
                        }
                    }
                } else {
                    // AI Opponent Logic
                    this.updateAI(opponent);
                }
            }
        }

        // Boundary bounds
        this.x += this.vx;
        if (this.x < 40) this.x = 40;
        if (this.x > canvas.width - 110) this.x = canvas.width - 110;

        this.facingRight = this.x < opponent.x;
    }

    triggerDodge(dir) {
        this.state = dir === 'left' ? 'dodge_left' : 'dodge_right';
        this.actionTimer = 22; // Invincibility frames window
        soundFX.playPunch();
    }

    startPunch(type) {
        this.state = 'punch';
        this.punchType = type;
        this.actionTimer = type === 'jab' ? 14 : (type === 'hook' ? 22 : (type === 'body' ? 18 : 25));
        this.stamina -= type === 'star' ? 0 : 12;
        if (this.stamina < 0) this.stamina = 0;

        if (type === 'star') {
            this.stars--;
            soundFX.playStar();
        } else {
            soundFX.playPunch(type === 'hook' || type === 'star');
        }

        // Check hit collision
        setTimeout(() => {
            if (this.state === 'punch') {
                checkHit(this, this.isPlayer1 ? opponentInstance : playerInstance);
            }
        }, type === 'jab' ? 90 : 160);
    }

    updateAI(opponent) {
        const dist = Math.abs(this.x - opponent.x);
        if (dist > 130) {
            this.vx = (this.x < opponent.x) ? this.config.speed * 0.75 : -this.config.speed * 0.75;
            this.state = 'walk';
        } else {
            if (Math.random() < 0.04 && this.actionTimer === 0) {
                const roll = Math.random();
                if (roll < 0.4) this.startPunch('jab');
                else if (roll < 0.75) this.startPunch('hook');
                else if (this.stars > 0 && roll < 0.9) this.startPunch('star');
                else this.startPunch('body');
            } else if (Math.random() < 0.03) {
                this.state = Math.random() < 0.5 ? 'block_high' : 'block_low';
                setTimeout(() => { if (this.state.includes('block')) this.state = 'idle'; }, 500);
            }
        }
    }

    takeDamage(amount, type) {
        // Check if opponent is dodging (Invincibility frames)
        if (this.state.includes('dodge')) return;

        // Check if blocked correctly
        if ((type === 'jab' || type === 'hook' || type === 'star') && this.state === 'block_high') {
            amount = Math.floor(amount * 0.25);
            soundFX.playPunch();
            return;
        }
        if (type === 'body' && this.state === 'block_low') {
            amount = Math.floor(amount * 0.25);
            soundFX.playPunch();
            return;
        }

        // If attacker landed while defender was punching or exposed -> Counter Star opportunity!
        if (this.state === 'punch') {
            const attacker = this.isPlayer1 ? opponentInstance : playerInstance;
            attacker.stars++;
            if (attacker.stars > 3) attacker.stars = 3;
            soundFX.playStar();
        }

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        this.state = 'hit';
        this.actionTimer = 18;

        if (gameState.shakeEnabled) {
            document.getElementById('game-container').classList.add('shake-screen');
            setTimeout(() => {
                document.getElementById('game-container').classList.remove('shake-screen');
            }, 300);
        }

        if (this.hp === 0) {
            triggerKnockdown(this);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Offset position if dodging
        if (this.state === 'dodge_left') ctx.translate(-30, 0);
        if (this.state === 'dodge_right') ctx.translate(30, 0);

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(this.width / 2, this.height + 5, this.width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lame Mode Teddy Bear vs Standard Boxer
        if (gameState.lameMode && this.isPlayer1) {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(10, 45, this.width - 20, this.height - 55);
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(this.width / 2, 30, 24, 0, Math.PI * 2);
            ctx.fill();
            // Pink teddy gloves
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(this.facingRight ? this.width + 12 : -12, 75, 18, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Torso
            ctx.fillStyle = this.config.color;
            ctx.fillRect(10, 45, this.width - 20, this.height - 65);

            // Head
            ctx.fillStyle = '#fbcfe8';
            ctx.beginPath();
            ctx.arc(this.width / 2, 28, 20, 0, Math.PI * 2);
            ctx.fill();

            // Headband / Cap
            ctx.fillStyle = this.config.glove;
            ctx.fillRect(this.width / 2 - 20, 18, 40, 8);

            // Gloves
            ctx.fillStyle = this.config.glove;
            let gloveX = this.facingRight ? this.width + 5 : -25;
            let gloveY = this.state === 'block_high' ? 35 : (this.state === 'block_low' ? 90 : 70);
            if (this.state === 'punch') gloveX += this.facingRight ? 35 : -35;

            ctx.beginPath();
            ctx.arc(gloveX, gloveY, 16, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Canvas Setup & Match Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let playerInstance = null;
let opponentInstance = null;
let matchInterval = null;
let knockdownActive = false;
let knockdownTimer = null;
let recoveryMashCount = 0;
let knockedDownBoxer = null;

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resizeCanvas);

function startMatch() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('mode-screen').classList.add('hidden');
    document.getElementById('fighter-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('knockdown-overlay').classList.add('hidden');

    resizeCanvas();

    const p1Config = fightersData[gameState.selectedFighterIndex];
    const p2Config = gameState.mode === 'single' ? fightersData[1] : fightersData[2];

    playerInstance = new Boxer(canvas.width * 0.3, canvas.height - 230, true, p1Config);
    opponentInstance = new Boxer(canvas.width * 0.65, canvas.height - 230, false, p2Config);

    document.getElementById('p1-name').innerText = `P1 (${p1Config.name})`;
    document.getElementById('p2-name').innerText = gameState.mode === 'single' ? `CPU (${p2Config.name})` : `P2 (${p2Config.name})`;

    gameState.timer = 99;
    gameState.matchActive = true;
    knockdownActive = false;

    soundFX.playBell();
    showAnnouncer("FIGHT!");

    if (matchInterval) clearInterval(matchInterval);
    matchInterval = setInterval(() => {
        if (!gameState.matchActive || knockdownActive) return;
        gameState.timer--;
        document.getElementById('match-timer').innerText = gameState.timer;
        if (gameState.timer <= 0) {
            gameState.matchActive = false;
            triggerGameOver(playerInstance.hp > opponentInstance.hp ? "PLAYER 1 WINS ON POINTS!" : "OPPONENT WINS ON POINTS!");
        }
    }, 1000);

    requestAnimationFrame(gameLoop);
}

function checkHit(attacker, defender) {
    const dist = Math.abs(attacker.x - defender.x);
    if (dist < 95) {
        let damage = attacker.config.power;
        if (attacker.punchType === 'hook') damage *= 1.4;
        if (attacker.punchType === 'star') damage *= 2.2;
        if (attacker.punchType === 'body') damage *= 1.1;

        defender.takeDamage(damage, attacker.punchType);
        updateHUD();
    }
}

function triggerKnockdown(boxer) {
    knockdownActive = true;
    knockedDownBoxer = boxer;
    boxer.state = 'knockdown';
    recoveryMashCount = 0;

    const overlay = document.getElementById('knockdown-overlay');
    const countNum = document.getElementById('count-number');
    overlay.classList.remove('hidden');

    let count = 10;
    countNum.innerText = count;

    if (knockdownTimer) clearInterval(knockdownTimer);
    knockdownTimer = setInterval(() => {
        count--;
        countNum.innerText = count;

        // Check if player mashed enough to get up
        if (recoveryMashCount >= 12 || count <= 0) {
            clearInterval(knockdownTimer);
            overlay.classList.add('hidden');
            knockdownActive = false;

            if (count <= 0 && boxer === playerInstance) {
                triggerGameOver("PLAYER 2 / AI WINS BY KNOCKOUT!");
            } else if (count <= 0) {
                triggerGameOver("PLAYER 1 WINS BY KNOCKOUT!");
            } else {
                boxer.hp = Math.floor(boxer.maxHp * 0.35); // Revive with 35% HP
                boxer.state = 'idle';
                showAnnouncer("GET UP!");
            }
        }
    }, 900);
}

function updateHUD() {
    if (!playerInstance || !opponentInstance) return;

    const p1Hp = (playerInstance.hp / playerInstance.maxHp) * 100;
    const p2Hp = (opponentInstance.hp / opponentInstance.maxHp) * 100;

    document.getElementById('p1-hp-bar').style.width = `${p1Hp}%`;
    document.getElementById('p1-hp-text').innerText = `${playerInstance.hp}/${playerInstance.maxHp}`;
    document.getElementById('p1-stamina-bar').style.width = `${playerInstance.stamina}%`;
    document.getElementById('p1-stars').innerText = '⭐'.repeat(playerInstance.stars) || 'None';

    document.getElementById('p2-hp-bar').style.width = `${p2Hp}%`;
    document.getElementById('p2-hp-text').innerText = `${opponentInstance.hp}/${opponentInstance.maxHp}`;
    document.getElementById('p2-stamina-bar').style.width = `${opponentInstance.stamina}%`;
    document.getElementById('p2-stars').innerText = '⭐'.repeat(opponentInstance.stars) || 'None';
}

function showAnnouncer(text) {
    const banner = document.getElementById('announcer-banner');
    const txt = document.getElementById('announcer-text');
    txt.innerText = text;
    banner.style.opacity = '1';
    txt.style.transform = 'scale(1)';
    setTimeout(() => {
        banner.style.opacity = '0';
        txt.style.transform = 'scale(0.75)';
    }, 1400);
}

function triggerGameOver(msg) {
    gameState.matchActive = false;
    clearInterval(matchInterval);
    if (knockdownTimer) clearInterval(knockdownTimer);
    document.getElementById('knockdown-overlay').classList.add('hidden');

    document.getElementById('gameover-title').innerText = msg.includes("PLAYER 1") ? "VICTORY!" : "DEFEAT";
    document.getElementById('gameover-desc').innerText = msg;
    document.getElementById('gameover-modal').classList.remove('hidden');

    if (msg.includes("PLAYER 1")) {
        let newScore = parseInt(gameState.highScore) + 1250;
        gameState.highScore = newScore;
        localStorage.setItem('punch_highscore', newScore);
        document.getElementById('menu-highscore').innerText = newScore;
    }
}

function restartMatch() {
    document.getElementById('gameover-modal').classList.add('hidden');
    startMatch();
}

function gameLoop() {
    if (!gameState.matchActive) return;

    if (!knockdownActive) {
        playerInstance.update(opponentInstance);
        opponentInstance.update(playerInstance);
    }

    updateHUD();

    // Render Canvas Arena
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ring Canvas Floor
    ctx.fillStyle = gameState.theme === 'neon' ? '#0f172a' : (gameState.theme === 'nes' ? '#1e293b' : '#1e293b');
    ctx.fillRect(0, canvas.height - 110, canvas.width, 110);

    // Ropes and canvas posts
    ctx.strokeStyle = gameState.theme === 'neon' ? '#06b6d4' : '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 110);
    ctx.lineTo(canvas.width, canvas.height - 110);
    ctx.stroke();

    // Draw Fighters
    playerInstance.draw(ctx);
    opponentInstance.draw(ctx);

    // Rainbow particle effects if Lame Mode is active
    if (gameState.lameMode) {
        ctx.fillStyle = `hsl(${Date.now() % 360}, 100%, 75%)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 10, 10);
    }

    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    resizeCanvas();
};
