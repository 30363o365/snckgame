const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 400;

const gridSize = 20;
let snake = [{ x: 200, y: 200 }];
let food = { x: 100, y: 100 };
let direction = { x: 0, y: -gridSize };
let nextDirection = direction;
let gameOver = false;

// 觸摸事件處理
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && direction.x === 0) nextDirection = { x: gridSize, y: 0 };
        else if (deltaX < 0 && direction.x === 0) nextDirection = { x: -gridSize, y: 0 };
    } else {
        if (deltaY > 0 && direction.y === 0) nextDirection = { x: 0, y: gridSize };
        else if (deltaY < 0 && direction.y === 0) nextDirection = { x: 0, y: -gridSize };
    }
});

// 遊戲主循環
function gameLoop() {
    if (gameOver) {
        alert('遊戲結束！');
        return;
    }

    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // 碰撞檢測
    if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        gameOver = true;
    }

    snake.unshift(head);

    // 吃到食物
    if (head.x === food.x && head.y === food.y) {
        food = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
        };
    } else {
        snake.pop();
    }

    // 繪製畫面
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, gridSize, gridSize));

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, gridSize, gridSize);

    setTimeout(gameLoop, 100);
}

gameLoop();
