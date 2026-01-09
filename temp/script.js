const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const pauseBtn = document.getElementById('pauseBtn');

// UI 元素
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');

// 音效
const eatSound = new Audio('https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3');
const overSound = new Audio('https://s3.amazonaws.com/freecodecamp/drums/Heater-6.mp3');

// 游戏配置
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 7;

// 游戏状态
let score = 0;
let velocityX = 0;
let velocityY = 0;
let snake = [];
let food = { x: 5, y: 5 };
let isGameRunning = false;
let isPaused = false;
let canChangeDirection = true; // 方向锁

// --- 新增：粒子数组 ---
let particles = [];

// 最高分初始化
let highScore = 0;
try {
    highScore = localStorage.getItem('snakeHighScore') || 0;
} catch (e) {}
if (highScoreElement) highScoreElement.innerText = highScore;

function initSnake() {
    snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    velocityX = 0;
    velocityY = -1;
    canChangeDirection = true;
    particles = []; // 重置粒子
}

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    score = 0;
    speed = 7;
    scoreElement.innerText = score;
    isPaused = false;
    if (pauseBtn) pauseBtn.innerText = "PAUSE";
    initSnake();
    placeFood();
    isGameRunning = true;
    gameLoop();
}

function gameLoop() {
    if (!isGameRunning) return;

    if (!isPaused) {
        update();
    }

    draw();

    if (isPaused) {
        // 暂停遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }

    setTimeout(gameLoop, 1000 / speed);
}

function togglePause() {
    if (!isGameRunning) return;
    isPaused = !isPaused;
    if (pauseBtn) pauseBtn.innerText = isPaused ? "RESUME" : "PAUSE";
}

// --- 新增：粒子类与相关函数 ---
class Particle {
    constructor(x, y, color) {
        this.x = x * gridSize + gridSize / 2; // 像素坐标中心
        this.y = y * gridSize + gridSize / 2;
        // 随机爆炸速度
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0; // 透明度/生命值 (1.0 -> 0)
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03; // 每次变淡一点
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life); // 设置透明度
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 6, 6); // 绘制小碎片
        ctx.globalAlpha = 1.0; // 恢复画笔透明度
    }
}

function createExplosion(x, y, color) {
    // 每次产生 15 个粒子
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function update() {
    // 1. 更新蛇
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(part => part.x === head.x && part.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        eatSound.currentTime = 0;
        eatSound.play();
        score += 10;
        scoreElement.innerText = score;

        // --- 特效：触发粒子爆炸 ---
        createExplosion(food.x, food.y, '#ff00de');

        if (score > highScore) {
            highScore = score;
            if (highScoreElement) highScoreElement.innerText = highScore;
            try { localStorage.setItem('snakeHighScore', highScore); } catch (e) {}
        }
        if (score % 50 === 0) speed += 0.5;
        placeFood();
    } else {
        snake.pop();
    }

    // 2. 更新粒子状态
    particles.forEach((p, index) => {
        p.update();
        if (p.life <= 0) particles.splice(index, 1); // 粒子消失后移除
    });

    canChangeDirection = true;
}

// --- 新增：画网格背景 ---
function drawGrid() {
    ctx.strokeStyle = '#222'; // 很暗的灰色线条
    ctx.lineWidth = 1;

    // 画竖线
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    // 画横线
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    // 清空背景
    ctx.fillStyle = '#0d0d0d'; // 使用深黑偏灰背景，更有质感
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 画网格
    drawGrid();

    // 2. 画粒子
    particles.forEach(p => p.draw(ctx));

    // 3. 画蛇 (带渐变色)
    for (let i = 0; i < snake.length; i++) {
        let part = snake[i];

        // 头部
        if (i === 0) {
            ctx.fillStyle = '#00ffcc';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffcc';
        } else {
            // 身体：根据位置计算渐变色 (HSL 颜色模式)
            // 颜色会随着身体长度从青色渐渐变成蓝色/紫色
            let hue = 160 + (i * 2);
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 0;
        }

        // 稍微画小一点点，留出缝隙，看起来更精致
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    // 重置发光，防止影响其他元素
    ctx.shadowBlur = 0;

    // 4. 画食物 (带呼吸灯效果)
    // 利用当前时间戳产生一个闪烁的 alpha 值
    let glow = Math.abs(Math.sin(Date.now() / 200));
    ctx.fillStyle = '#ff00de';
    ctx.shadowBlur = 15 + glow * 10; // 光圈大小随时间呼吸
    ctx.shadowColor = '#ff00de';
    ctx.fillRect(food.x * gridSize + 1, food.y * gridSize + 1, gridSize - 2, gridSize - 2);

    ctx.shadowBlur = 0;
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        valid = true;
        for (let part of snake) {
            if (part.x === food.x && part.y === food.y) { valid = false; break; }
        }
    }
}

function gameOver() {
    overSound.play();
    isGameRunning = false;
    finalScoreElement.innerText = score;
    gameOverScreen.style.display = 'flex';
}

document.addEventListener('keydown', e => {
    if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
    if (e.keyCode === 32) togglePause();
    if (isPaused) return;
    if (!canChangeDirection) return;

    if ((e.keyCode === 37 || e.keyCode === 65) && velocityX !== 1) {
        velocityX = -1;
        velocityY = 0;
        canChangeDirection = false;
    } else if ((e.keyCode === 38 || e.keyCode === 87) && velocityY !== 1) {
        velocityX = 0;
        velocityY = -1;
        canChangeDirection = false;
    } else if ((e.keyCode === 39 || e.keyCode === 68) && velocityX !== -1) {
        velocityX = 1;
        velocityY = 0;
        canChangeDirection = false;
    } else if ((e.keyCode === 40 || e.keyCode === 83) && velocityY !== -1) {
        velocityX = 0;
        velocityY = 1;
        canChangeDirection = false;
    }
});

function addTouch(id, fn) {
    const btn = document.getElementById(id);
    if (btn) {
        const h = (e) => {
            e.preventDefault();
            if (!isPaused && isGameRunning && canChangeDirection) {
                fn();
                canChangeDirection = false;
            }
        };
        btn.addEventListener('touchstart', h);
        btn.addEventListener('click', h);
    }
}
addTouch('btnUp', () => { if (velocityY !== 1) { velocityX = 0;
        velocityY = -1; } });
addTouch('btnDown', () => { if (velocityY !== -1) { velocityX = 0;
        velocityY = 1; } });
addTouch('btnLeft', () => { if (velocityX !== 1) { velocityX = -1;
        velocityY = 0; } });
addTouch('btnRight', () => { if (velocityX !== -1) { velocityX = 1;
        velocityY = 0; } });

// 初始静态绘制
ctx.fillStyle = '#0d0d0d';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawGrid();