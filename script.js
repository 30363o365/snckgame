const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;

// 確保畫布尺寸是格子大小的整數倍
function adjustCanvasSizeToGrid() {
    canvas.width = Math.floor(window.innerWidth * 0.8 / gridSize) * gridSize;
    canvas.height = Math.floor(window.innerHeight * 0.8 / gridSize) * gridSize;
}

adjustCanvasSizeToGrid();

window.addEventListener('resize', () => {
    adjustCanvasSizeToGrid();
    generateNewFood();
    generateWalls(); // 重新生成障碍墙
});

// 確保位置是格子大小的整數倍
function alignToGrid(position) {
    return Math.floor(position / gridSize) * gridSize;
}

// 蛇的初始位置對齊格子
let snake = [{ x: alignToGrid(200), y: alignToGrid(200) }];
let food = { x: alignToGrid(100), y: alignToGrid(100) };
let direction = { x: 0, y: -gridSize };
let nextDirection = direction;
let gameOver = false;
let autoPathActive = false; // 自动寻路状态
let path = []; // 存储计算出的路径
let walls = []; // 储存障碍墙

// 生成新食物，確保位置對齊格子
function generateNewFood() {
    const maxX = Math.floor(canvas.width / gridSize) - 1;
    const maxY = Math.floor(canvas.height / gridSize) - 1;

    food = {
        x: Math.floor(Math.random() * maxX + 1) * gridSize,
        y: Math.floor(Math.random() * maxY + 1) * gridSize
    };

    // 確保食物不會生成在蛇身上或障碍墙上
    while (
        snake.some(segment => segment.x === food.x && segment.y === food.y) ||
        walls.some(wall => wall.x === food.x && wall.y === food.y)
    ) {
        food = {
            x: Math.floor(Math.random() * maxX + 1) * gridSize,
            y: Math.floor(Math.random() * maxY + 1) * gridSize
        };
    }
}

// 生成随机障碍墙
function generateWalls() {
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    walls = [];
    
    // 障碍墙数量 - 根据地图大小调整
    const wallCount = Math.floor((cols * rows) * 0.05); // 约占地图5%的面积
    
    for (let i = 0; i < wallCount; i++) {
        const wall = {
            x: Math.floor(Math.random() * cols) * gridSize,
            y: Math.floor(Math.random() * rows) * gridSize
        };
        
        // 确保墙不会生成在蛇或食物的位置
        const isOnSnake = snake.some(segment => segment.x === wall.x && segment.y === wall.y);
        const isOnFood = wall.x === food.x && wall.y === food.y;
        
        if (!isOnSnake && !isOnFood && !walls.some(w => w.x === wall.x && w.y === wall.y)) {
            walls.push(wall);
        } else {
            // 如果位置冲突，重试一次
            i--;
        }
    }
}

// 初始生成墙
generateWalls();

const restartButton = document.getElementById('restartButton');
const autoPathButton = document.getElementById('autoPathButton');

restartButton.addEventListener('click', () => {
    snake = [{ x: alignToGrid(200), y: alignToGrid(200) }];
    generateNewFood();
    direction = { x: 0, y: -gridSize };
    nextDirection = direction;
    gameOver = false;
    autoPathActive = false;
    path = [];
    generateWalls(); // 重新生成墙
    restartButton.style.display = 'none';
    autoPathButton.textContent = '自動尋路';
    gameLoop();
});

// 自动寻路按钮点击事件
autoPathButton.addEventListener('click', () => {
    autoPathActive = !autoPathActive;
    autoPathButton.textContent = autoPathActive ? '停止自動尋路' : '自動尋路';
    if (autoPathActive) {
        findPath();
    } else {
        path = [];
    }
});

// 触摸事件处理
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

// 绘制格子背景
function drawGrid() {
    ctx.strokeStyle = '#ddd';
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// A*寻路算法
function findPath() {
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);

    const grid = new Array(cols).fill().map(() => new Array(rows).fill().map(() => ({
        f: 0, g: 0, h: 0,
        visited: false,
        closed: false,
        parent: null,
        x: 0, y: 0
    })));

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            grid[x][y].x = x;
            grid[x][y].y = y;
        }
    }

    snake.forEach(segment => {
        const x = Math.floor(segment.x / gridSize);
        const y = Math.floor(segment.y / gridSize);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y].closed = true;
        }
    });
    
    // 将障碍墙标记为关闭状态
    walls.forEach(wall => {
        const x = Math.floor(wall.x / gridSize);
        const y = Math.floor(wall.y / gridSize);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y].closed = true;
        }
    });

    const startX = Math.floor(snake[0].x / gridSize);
    const startY = Math.floor(snake[0].y / gridSize);
    const endX = Math.floor(food.x / gridSize);
    const endY = Math.floor(food.y / gridSize);

    const openList = [];
    openList.push(grid[startX][startY]);

    while (openList.length > 0) {
        let currentIndex = 0;
        for (let i = 0; i < openList.length; i++) {
            if (openList[i].f < openList[currentIndex].f) {
                currentIndex = i;
            }
        }

        const current = openList[currentIndex];

        if (current.x === endX && current.y === endY) {
            let curr = current;
            const tempPath = [];
            while (curr.parent) {
                tempPath.push({ x: curr.x * gridSize, y: curr.y * gridSize });
                curr = curr.parent;
            }
            path = tempPath.reverse();
            return;
        }

        openList.splice(currentIndex, 1);
        current.closed = true;

        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        for (const dir of directions) {
            let nx = current.x + dir.dx;
            let ny = current.y + dir.dy;

            if (nx < 0) nx = cols - 1;
            else if (nx >= cols) nx = 0;
            if (ny < 0) ny = rows - 1;
            else if (ny >= rows) ny = 0;

            const neighbor = grid[nx][ny];

            if (neighbor.closed) continue;

            neighbors.push(neighbor);
        }

        for (const neighbor of neighbors) {
            if (neighbor.closed) continue;

            const gScore = current.g + 1;
            let gScoreIsBest = false;

            if (!neighbor.visited) {
                gScoreIsBest = true;
                neighbor.h = Math.abs(neighbor.x - endX) + Math.abs(neighbor.y - endY);
                neighbor.visited = true;
                openList.push(neighbor);
            } else if (gScore < neighbor.g) {
                gScoreIsBest = true;
            }

            if (gScoreIsBest) {
                neighbor.parent = current;
                neighbor.g = gScore;
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
    }

    path = [];
    return;
}

// 游戏主循环
function gameLoop() {
    if (gameOver) {
        restartButton.style.display = 'block';
        return;
    }

    if (autoPathActive) {
        if (path.length === 0 || (Math.abs(snake[0].x - food.x) < gridSize && Math.abs(snake[0].y - food.y) < gridSize)) {
            findPath();
        }

        if (path.length > 0) {
            const nextPoint = path.shift();
            const dx = nextPoint.x - snake[0].x;
            const dy = nextPoint.y - snake[0].y;

            if (Math.abs(dx) > gridSize) {
                nextDirection = { x: dx > 0 ? -gridSize : gridSize, y: 0 };
            } else if (Math.abs(dy) > gridSize) {
                nextDirection = { x: 0, y: dy > 0 ? -gridSize : gridSize };
            } else {
                nextDirection = { x: dx, y: dy };
            }
        }
    }

    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0) head.x = canvas.width - gridSize;
    else if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - gridSize;
    else if (head.y >= canvas.height) head.y = 0;

    // 碰到自己或障碍墙时游戏结束
    if (
        snake.some(segment => segment.x === head.x && segment.y === head.y) ||
        walls.some(wall => wall.x === head.x && wall.y === head.y)
    ) {
        gameOver = true;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        generateNewFood();

        if (autoPathActive) {
            findPath();
        }
    } else {
        snake.pop();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (autoPathActive && path.length > 0) {
        ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
        path.forEach(point => {
            ctx.fillRect(point.x, point.y, gridSize, gridSize);
        });
    }

    // 绘制障碍墙
    ctx.fillStyle = '#333';
    walls.forEach(wall => ctx.fillRect(wall.x, wall.y, gridSize, gridSize));

    ctx.fillStyle = 'green';
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, gridSize, gridSize));

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, gridSize, gridSize);

    setTimeout(gameLoop, 100);
}

gameLoop();

