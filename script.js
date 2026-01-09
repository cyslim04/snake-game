const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
// --- 新增：加载音效 ---



// 如果您下载了文件，请用 './eat.mp3'；如果没下载，可以用下面的网络链接测试
const eatSound = new Audio('https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3');
const overSound = new Audio('https://s3.amazonaws.com/freecodecamp/drums/Heater-6.mp3');


// 游戏配置
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let speed = 7; // 初始速度

// 游戏状态
let score = 0;
let velocityX = 0;
let velocityY = 0;
let snake = [];
let food = { x: 5, y: 5 };
let gameInterval;
let isGameRunning = false;

// 初始化蛇的位置
function initSnake() {
    snake = [
        { x: 10, y: 10 }, // 头
        { x: 10, y: 11 }, // 身体
        { x: 10, y: 12 } // 尾巴
    ];
    velocityX = 0;
    velocityY = -1; // 默认向上移动
}

function gameLoop() {
    update();
    draw();
    if (isGameRunning) {
        setTimeout(gameLoop, 1000 / speed);
    }
}

function update() {
    // 移动蛇头
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

    // 1. 撞墙检测
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // 2. 撞自己检测
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    // 将新头加入数组
    snake.unshift(head);

    // 3. 吃食物检测
    if (head.x === food.x && head.y === food.y) {

        // 播放吃食物音效
        eatSound.currentTime = 0;
        eatSound.play();

        score += 10;
        scoreElement.innerText = score;

        // 稍微加快速度增加难度
        if (score % 50 === 0) speed += 0.5;
        placeFood();
    } else {
        // 没吃到食物，移除尾巴（保持长度不变）
        snake.pop();
    }

}

function draw() {
    // 清空画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画蛇
    for (let i = 0; i < snake.length; i++) {
        let part = snake[i];

        // 头部特殊颜色
        if (i === 0) {
            ctx.fillStyle = '#00ffcc'; // 霓虹青色
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffcc';
        } else {
            ctx.fillStyle = '#00ccaa'; // 稍微暗一点的青色
            ctx.shadowBlur = 0;
        }

        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    // 画食物
    ctx.fillStyle = '#ff00de'; // 霓虹粉色
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00de';
    ctx.fillRect(food.x * gridSize + 1, food.y * gridSize + 1, gridSize - 2, gridSize - 2);

    // 重置阴影效果避免影响背景
    ctx.shadowBlur = 0;
}

function placeFood() {
    // 随机生成食物，避免生成在蛇身上
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);

        valid = true;
        for (let part of snake) {
            if (part.x === food.x && part.y === food.y) {
                valid = false;
                break;
            }
        }
    }
}

function gameOver() {

    // --- 新增：播放结束音效 ---
    overSound.play();

    isGameRunning = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '40px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

function resetGame() {
    score = 0;
    speed = 7;
    scoreElement.innerText = score;
    initSnake();
    placeFood();
    if (!isGameRunning) {
        isGameRunning = true;
        gameLoop();
    }
}

// 键盘控制
document.addEventListener('keydown', keyDownEvent);

function keyDownEvent(event) {
    // 防止按键导致页面滚动
    if ([37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }

    // 左 (37) A (65)
    if ((event.keyCode === 37 || event.keyCode === 65) && velocityX !== 1) {
        velocityX = -1;
        velocityY = 0;
    }
    // 上 (38) W (87)
    else if ((event.keyCode === 38 || event.keyCode === 87) && velocityY !== 1) {
        velocityX = 0;
        velocityY = -1;
    }
    // 右 (39) D (68)
    else if ((event.keyCode === 39 || event.keyCode === 68) && velocityX !== -1) {
        velocityX = 1;
        velocityY = 0;
    }
    // 下 (40) S (83)
    else if ((event.keyCode === 40 || event.keyCode === 83) && velocityY !== -1) {
        velocityX = 0;
        velocityY = 1;
    }
}

// 启动游戏
initSnake();
isGameRunning = true;
gameLoop();