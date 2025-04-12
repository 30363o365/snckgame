const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 25;
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// 初始化蛇的多个节点，而不是只有一个
let snake1 = [
    { x: 100, y: 100 },
    { x: 75, y: 100 },
    { x: 50, y: 100 }
];
let snake2 = [
    { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 100 },
    { x: GAME_WIDTH - 75, y: GAME_HEIGHT - 100 },
    { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 100 }
];
let food = { x: 0, y: 0 };
let direction1 = "R";
let direction2 = "L";
let running = true;
let running2 = true;
let score1 = 0;
let score2 = 0;
let speed = 100;

// 跟踪活跃控制器
let activeController = {
    player1: "keyboard", // keyboard, mouse, touch
    player2: "keyboard"  // keyboard, mouse, touch
};

const restartButton = document.getElementById("restartButton");
const speedSelector = document.getElementById("speedSelector");

function spawnFood() {
    food.x = Math.floor(Math.random() * (GAME_WIDTH / TILE_SIZE)) * TILE_SIZE;
    food.y = Math.floor(Math.random() * (GAME_HEIGHT / TILE_SIZE)) * TILE_SIZE;
}

function drawSnake(snake, color) {
    snake.forEach((segment, index) => {
        // 使用圆形绘制蛇身，增加视觉效果
        ctx.fillStyle = index === 0 ? color.head : color.body;
        ctx.beginPath();
        ctx.arc(segment.x + TILE_SIZE/2, segment.y + TILE_SIZE/2, TILE_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFood() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(food.x + TILE_SIZE/2, food.y + TILE_SIZE/2, TILE_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
}

function drawScores() {
    ctx.fillStyle = "white";
    ctx.font = "20px Microsoft JhengHei";
    ctx.fillText("分數: " + score1, 10, 20);
    ctx.fillStyle = "cyan";
    ctx.fillText("玩家2分數: " + score2, 10, 50);
}

// 处理鼠标移动以控制蛇的方向
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // 根据鼠标相对于蛇头的位置来决定方向
    updateDirectionFromPosition(mouseX, mouseY);
}

// 处理鼠标点击以控制蛇的方向
function handleMouseClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // 决定哪条蛇应该移动 - 选择距离点击位置最近的蛇
    const dist1 = Math.hypot(mouseX - snake1[0].x, mouseY - snake1[0].y);
    const dist2 = Math.hypot(mouseX - snake2[0].x, mouseY - snake2[0].y);
    
    if (dist1 < dist2) {
        activeController.player1 = "mouse";
        updateDirectionFromPosition(mouseX, mouseY, 1);
    } else {
        activeController.player2 = "mouse";
        updateDirectionFromPosition(mouseX, mouseY, 2);
    }
}

// 处理触摸事件以控制蛇的方向
function handleTouch(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    // 决定哪条蛇应该移动 - 选择距离触摸位置最近的蛇
    const dist1 = Math.hypot(touchX - snake1[0].x, touchY - snake1[0].y);
    const dist2 = Math.hypot(touchX - snake2[0].x, touchY - snake2[0].y);
    
    if (dist1 < dist2) {
        activeController.player1 = "touch";
        updateDirectionFromPosition(touchX, touchY, 1);
    } else {
        activeController.player2 = "touch";
        updateDirectionFromPosition(touchX, touchY, 2);
    }
}

// 根据位置更新指定玩家的蛇方向
function updateDirectionFromPosition(x, y, player = 1) {
    const snake = player === 1 ? snake1 : snake2;
    const head = snake[0];
    
    const dx = x - (head.x + TILE_SIZE/2);
    const dy = y - (head.y + TILE_SIZE/2);
    
    // 确定主要方向（水平或垂直）
    if (Math.abs(dx) > Math.abs(dy)) {
        // 水平移动
        if (dx > 0) {
            if (player === 1 && direction1 !== "L") direction1 = "R";
            if (player === 2 && direction2 !== "L") direction2 = "R";
        } else {
            if (player === 1 && direction1 !== "R") direction1 = "L";
            if (player === 2 && direction2 !== "R") direction2 = "L";
        }
    } else {
        // 垂直移动
        if (dy > 0) {
            if (player === 1 && direction1 !== "U") direction1 = "D";
            if (player === 2 && direction2 !== "U") direction2 = "D";
        } else {
            if (player === 1 && direction1 !== "D") direction1 = "U";
            if (player === 2 && direction2 !== "D") direction2 = "U";
        }
    }
}

function moveSnake(snake, direction) {
    const head = { ...snake[0] };
    switch (direction) {
        case "U": head.y -= TILE_SIZE; break;
        case "D": head.y += TILE_SIZE; break;
        case "L": head.x -= TILE_SIZE; break;
        case "R": head.x += TILE_SIZE; break;
    }
    
    // 处理穿越边界
    if (head.x < 0) head.x = GAME_WIDTH - TILE_SIZE;
    else if (head.x >= GAME_WIDTH) head.x = 0;
    if (head.y < 0) head.y = GAME_HEIGHT - TILE_SIZE;
    else if (head.y >= GAME_HEIGHT) head.y = 0;
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        spawnFood();
        return true; // 吃到食物
    } else {
        snake.pop();
        return false; // 没吃到食物
    }
}

function checkCollision(snake) {
    const head = snake[0];
    
    // 检查自身碰撞
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function gameOver() {
    running = false;
    running2 = false;
    ctx.fillStyle = "red";
    ctx.font = "40px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText("遊戲結束", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    
    ctx.fillStyle = "white";
    ctx.font = "20px Microsoft JhengHei";
    ctx.fillText("分數: " + score1, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    ctx.fillText("玩家2分數: " + score2, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    
    restartButton.style.display = "inline-block";
}

function gameLoop() {
    if (!running && !running2) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawFood();
    drawSnake(snake1, { head: "green", body: "lightgreen" });
    drawSnake(snake2, { head: "blue", body: "lightblue" });
    drawScores();

    // 在游戏循环中添加视觉指示，表明哪种控制方式正在使用
    ctx.fillStyle = "white";
    ctx.font = "16px Microsoft JhengHei";
    ctx.fillText("玩家1控制: " + activeController.player1, 10, 80);
    ctx.fillText("玩家2控制: " + activeController.player2, 10, 110);

    if (running) {
        if (moveSnake(snake1, direction1)) {
            score1++; // 吃到食物加分
        }
        if (checkCollision(snake1)) {
            running = false;
        }
    }
    
    if (running2) {
        if (moveSnake(snake2, direction2)) {
            score2++; // 吃到食物加分
        }
        if (checkCollision(snake2)) {
            running2 = false;
        }
    }

    if (!running && !running2) gameOver();
}

document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp": 
            activeController.player1 = "keyboard";
            if (direction1 !== "D") direction1 = "U"; 
            break;
        case "ArrowDown": 
            activeController.player1 = "keyboard";
            if (direction1 !== "U") direction1 = "D"; 
            break;
        case "ArrowLeft": 
            activeController.player1 = "keyboard";
            if (direction1 !== "R") direction1 = "L"; 
            break;
        case "ArrowRight": 
            activeController.player1 = "keyboard";
            if (direction1 !== "L") direction1 = "R"; 
            break;
        case "w": 
            activeController.player2 = "keyboard";
            if (direction2 !== "D") direction2 = "U"; 
            break;
        case "s": 
            activeController.player2 = "keyboard";
            if (direction2 !== "U") direction2 = "D"; 
            break;
        case "a": 
            activeController.player2 = "keyboard";
            if (direction2 !== "R") direction2 = "L"; 
            break;
        case "d": 
            activeController.player2 = "keyboard";
            if (direction2 !== "L") direction2 = "R"; 
            break;
    }
});

// 添加鼠标和触摸事件监听器
canvas.addEventListener("click", handleMouseClick);
canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });

restartButton.addEventListener("click", () => {
    snake1 = [
        { x: 100, y: 100 },
        { x: 75, y: 100 },
        { x: 50, y: 100 }
    ];
    snake2 = [
        { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 100 },
        { x: GAME_WIDTH - 75, y: GAME_HEIGHT - 100 },
        { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 100 }
    ];
    direction1 = "R";
    direction2 = "L";
    score1 = 0;
    score2 = 0;
    running = true;
    running2 = true;
    restartButton.style.display = "none";
    spawnFood();

    // 重置控制器
    activeController = {
        player1: "keyboard",
        player2: "keyboard"
    };
});

speedSelector.addEventListener("change", (e) => {
    speed = parseInt(e.target.value);
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
});

// 确保重启按钮初始隐藏
restartButton.style.display = "none";

// 确保游戏开始时生成食物
spawnFood();
let gameInterval = setInterval(gameLoop, speed);

// 添加调试信息
console.log("Game initialized. Canvas size:", GAME_WIDTH, "x", GAME_HEIGHT);

