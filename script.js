const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
//
const gridSize = 20; // 網格大小設定，決定蛇和食物的基本單位

// 確保畫布尺寸是格子大小的整數倍
function adjustCanvasSizeToGrid() {
    canvas.width = Math.floor(window.innerWidth * 0.8 / gridSize) * gridSize;
    canvas.height = Math.floor(window.innerHeight * 0.8 / gridSize) * gridSize;
}

// 初始化畫布大小
adjustCanvasSizeToGrid();

// 當視窗大小改變時，重新調整畫布尺寸並重新生成食物和障礙牆
window.addEventListener('resize', () => {
    adjustCanvasSizeToGrid();
    generateNewFood();
    generateWalls(); // 重新生成障礙牆
});

// 確保位置是格子大小的整數倍，避免出現非對齊情況
function alignToGrid(position) {
    return Math.floor(position / gridSize) * gridSize;
}

// 蛇的初始位置對齊格子
let snake = [{ x: alignToGrid(200), y: alignToGrid(200) }]; // 蛇身陣列，第一個元素是蛇頭
let food = { x: alignToGrid(100), y: alignToGrid(100) }; // 食物位置
let direction = { x: 0, y: -gridSize }; // 初始方向：向上移動
let nextDirection = direction; // 下一步方向，用於避免快速按鍵導致的反向移動
let gameOver = false; // 遊戲結束標記
let autoPathActive = false; // 自動尋路狀態標記
let path = []; // 存儲計算出的路徑座標點
let walls = []; // 儲存障礙牆位置

// 生成新食物，確保位置對齊格子且不與蛇身和牆壁重疊
function generateNewFood() {
    // 計算畫布中可放置食物的最大座標值
    const maxX = Math.floor(canvas.width / gridSize) - 1;
    const maxY = Math.floor(canvas.height / gridSize) - 1;

    // 隨機生成食物位置
    food = {
        x: Math.floor(Math.random() * maxX + 1) * gridSize,
        y: Math.floor(Math.random() * maxY + 1) * gridSize
    };

    // 確保食物不會生成在蛇身上或障礙牆上，如果重疊則重新生成
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

// 生成隨機障礙牆，增加遊戲難度
function generateWalls() {
    const cols = Math.floor(canvas.width / gridSize); // 畫布網格列數
    const rows = Math.floor(canvas.height / gridSize); // 畫布網格行數
    walls = []; // 清空現有障礙牆
    
    // 障礙牆數量 - 根據地圖大小調整，約佔地圖5%的面積
    const wallCount = Math.floor((cols * rows) * 0.05);
    
    // 隨機生成指定數量的牆
    for (let i = 0; i < wallCount; i++) {
        const wall = {
            x: Math.floor(Math.random() * cols) * gridSize,
            y: Math.floor(Math.random() * rows) * gridSize
        };
        
        // 確保牆不會生成在蛇或食物的位置，避免遊戲一開始就結束
        const isOnSnake = snake.some(segment => segment.x === wall.x && segment.y === wall.y);
        const isOnFood = wall.x === food.x && wall.y === food.y;
        const isOnExistingWall = walls.some(w => w.x === wall.x && w.y === wall.y);
        
        // 如果位置合適，則添加這個牆；否則重試
        if (!isOnSnake && !isOnFood && !isOnExistingWall) {
            walls.push(wall);
        } else {
            // 如果位置衝突，重試一次
            i--;
        }
    }
}

// 遊戲初始時生成障礙牆
generateWalls();

// 獲取控制按鈕元素
const restartButton = document.getElementById('restartButton');
const autoPathButton = document.getElementById('autoPathButton');

// 設置重新開始按鈕的點擊事件
restartButton.addEventListener('click', () => {
    // 重置遊戲狀態
    snake = [{ x: alignToGrid(200), y: alignToGrid(200) }]; // 重置蛇的位置
    generateNewFood(); // 重新生成食物
    direction = { x: 0, y: -gridSize }; // 重置移動方向為向上
    nextDirection = direction;
    gameOver = false; // 清除遊戲結束標記
    autoPathActive = false; // 停止自動尋路
    path = []; // 清空路徑
    generateWalls(); // 重新生成障礙牆
    restartButton.style.display = 'none'; // 隱藏重新開始按鈕
    autoPathButton.textContent = '自動尋路'; // 重設按鈕文字
    gameLoop(); // 重啟遊戲循環
});

// 自動尋路按鈕點擊事件處理
autoPathButton.addEventListener('click', () => {
    autoPathActive = !autoPathActive; // 切換自動尋路狀態
    autoPathButton.textContent = autoPathActive ? '停止自動尋路' : '自動尋路'; // 更改按鈕文字
    if (autoPathActive) {
        findPath(); // 如果開啟自動尋路，立即計算路徑
    } else {
        path = []; // 若停止自動尋路，清空路徑
    }
});

// 添加键盘事件监听，支持WASD和方向键控制
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': // 上箭頭
        case 'w':      // W键：向上
        case 'W':
            if (direction.y === 0) nextDirection = { x: 0, y: -gridSize };
            break;
        case 'ArrowRight': // 右箭頭 
        case 'd':         // D键：向右
        case 'D':
            if (direction.x === 0) nextDirection = { x: gridSize, y: 0 };
            break;
        case 'ArrowDown': // 下箭頭
        case 's':        // S键：向下
        case 'S':
            if (direction.y === 0) nextDirection = { x: 0, y: gridSize };
            break;
        case 'ArrowLeft': // 左箭頭
        case 'a':        // A键：向左
        case 'A':
            if (direction.x === 0) nextDirection = { x: -gridSize, y: 0 };
            break;
    }
});

// 觸控事件處理，支援行動裝置操作
let touchStartX = 0; // 觸控起始X座標
let touchStartY = 0; // 觸控起始Y座標

// 記錄觸控開始位置
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

// 根據觸控移動方向改變蛇的前進方向
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 防止頁面滾動
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX; // X方向移動距離
    const deltaY = touch.clientY - touchStartY; // Y方向移動距離

    // 根據滑動方向設置蛇的移動方向，避免直接反向移動
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑動超過垂直滑動
        if (deltaX > 0 && direction.x === 0) nextDirection = { x: gridSize, y: 0 }; // 向右移動
        else if (deltaX < 0 && direction.x === 0) nextDirection = { x: -gridSize, y: 0 }; // 向左移動
    } else {
        // 垂直滑動超過水平滑動
        if (deltaY > 0 && direction.y === 0) nextDirection = { x: 0, y: gridSize }; // 向下移動
        else if (deltaY < 0 && direction.y === 0) nextDirection = { x: 0, y: -gridSize }; // 向上移動
    }
});

// 繪製網格背景，使遊戲界面更清晰
function drawGrid() {
    ctx.strokeStyle = '#ddd'; // 網格線顏色
    // 繪製垂直網格線
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    // 繪製水平網格線
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// A*尋路演算法，計算從蛇頭到食物的最佳路徑
function findPath() {
    // 計算畫布中的網格數量
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);

    // 初始化 A* 算法需要的網格資料結構
    const grid = new Array(cols).fill().map(() => new Array(rows).fill().map(() => ({
        f: 0, // f = g + h，總評估成本
        g: 0, // 從起點到此點的實際成本
        h: 0, // 從此點到終點的預估成本（曼哈頓距離）
        visited: false, // 是否已訪問
        closed: false, // 是否已關閉（不再考慮）
        parent: null, // 父節點，用於回溯路徑
        x: 0, y: 0, // 網格座標
        direction: null // 到達此點的方向
    })));

    // 初始化網格座標
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            grid[x][y].x = x;
            grid[x][y].y = y;
        }
    }

    // 將蛇身所在格子標記為關閉狀態（不可通行）
    snake.forEach(segment => {
        const x = Math.floor(segment.x / gridSize);
        const y = Math.floor(segment.y / gridSize);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y].closed = true;
        }
    });
    
    // 將障礙牆標記為關閉狀態（不可通行）
    walls.forEach(wall => {
        const x = Math.floor(wall.x / gridSize);
        const y = Math.floor(wall.y / gridSize);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y].closed = true;
        }
    });

    // 設定起點（蛇頭）和終點（食物）
    const startX = Math.floor(snake[0].x / gridSize);
    const startY = Math.floor(snake[0].y / gridSize);
    const endX = Math.floor(food.x / gridSize);
    const endY = Math.floor(food.y / gridSize);
    
    // 確定蛇當前的移動方向
    let currentDirection = null;
    if (direction.x > 0) currentDirection = 'right';
    else if (direction.x < 0) currentDirection = 'left';
    else if (direction.y > 0) currentDirection = 'down';
    else if (direction.y < 0) currentDirection = 'up';
    
    // 將蛇頭的當前方向設定為初始方向
    grid[startX][startY].direction = currentDirection;

    // 開始 A* 算法搜索過程
    const openList = [];
    openList.push(grid[startX][startY]);

    // 當開放列表不為空時繼續搜索
    while (openList.length > 0) {
        // 找出 f 值最低的節點（最有希望的路徑）
        let currentIndex = 0;
        for (let i = 0; i < openList.length; i++) {
            if (openList[i].f < openList[currentIndex].f) {
                currentIndex = i;
            }
        }

        const current = openList[currentIndex];

        // 如果到達終點，回溯構建路徑
        if (current.x === endX && current.y === endY) {
            let curr = current;
            const tempPath = [];
            while (curr.parent) {
                tempPath.push({ x: curr.x * gridSize, y: curr.y * gridSize });
                curr = curr.parent;
            }
            path = tempPath.reverse(); // 反轉路徑使其從起點到終點
            return;
        }

        // 從開放列表移除當前節點，標記為已處理
        openList.splice(currentIndex, 1);
        current.closed = true;

        // 檢查相鄰的四個方向
        const directions = [
            { dx: 0, dy: -1, name: 'up' },    // 上
            { dx: 1, dy: 0, name: 'right' },  // 右
            { dx: 0, dy: 1, name: 'down' },   // 下
            { dx: -1, dy: 0, name: 'left' }   // 左
        ];

        // 計算各個方向的相鄰格子
        for (const dir of directions) {
            let nx = current.x + dir.dx;
            let ny = current.y + dir.dy;

            // 處理邊界情況，允許穿牆（地圖環繞）
            if (nx < 0) nx = cols - 1;
            else if (nx >= cols) nx = 0;
            if (ny < 0) ny = rows - 1;
            else if (ny >= rows) ny = 0;

            const neighbor = grid[nx][ny];

            // 跳過已關閉的格子
            if (neighbor.closed) continue;

            // 基本移動成本
            let gScore = current.g + 1;
            
            // 計算是否需要轉彎
            if (current.direction && current.direction !== dir.name) {
                // 對轉彎增加懲罰值，降低其優先級，鼓勵直線路徑
                gScore += 2;
            }
            
            let gScoreIsBest = false;

            // 如果是首次訪問該格子或找到更好的路徑
            if (!neighbor.visited) {
                gScoreIsBest = true;
                // 使用曼哈頓距離作為啟發值，但優先考慮沿x軸或y軸直線移動
                neighbor.h = Math.abs(neighbor.x - endX) + Math.abs(neighbor.y - endY);
                neighbor.visited = true;
                openList.push(neighbor);
            } else if (gScore < neighbor.g) {
                gScoreIsBest = true;
            }

            // 如果找到更好的路徑，更新節點信息
            if (gScoreIsBest) {
                neighbor.parent = current;
                neighbor.g = gScore;
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.direction = dir.name; // 記錄到達該點的方向
            }
        }
    }

    // 如果找不到路徑，清空路徑陣列
    path = [];
    return;
}

// 遊戲主循環，控制遊戲流程和畫面更新
function gameLoop() {
    if (gameOver) {
        restartButton.style.display = 'block'; // 遊戲結束時顯示重新開始按鈕
        return;
    }

    // 自動尋路邏輯
    if (autoPathActive) {
        // 當路徑用完或蛇頭接近食物時，重新計算路徑
        if (path.length === 0 || (Math.abs(snake[0].x - food.x) < gridSize && Math.abs(snake[0].y - food.y) < gridSize)) {
            findPath();
        }

        // 如果有可用路徑，根據路徑設定下一步方向
        if (path.length > 0) {
            const nextPoint = path.shift();
            const dx = nextPoint.x - snake[0].x;
            const dy = nextPoint.y - snake[0].y;

            // 處理環繞地圖的情況（穿過邊界）
            if (Math.abs(dx) > gridSize) {
                nextDirection = { x: dx > 0 ? -gridSize : gridSize, y: 0 };
            } else if (Math.abs(dy) > gridSize) {
                nextDirection = { x: 0, y: dy > 0 ? -gridSize : gridSize };
            } else {
                nextDirection = { x: dx, y: dy };
            }
        }
    }

    direction = nextDirection; // 更新移動方向
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y }; // 計算新的蛇頭位置

    // 處理穿牆邏輯（地圖環繞）
    if (head.x < 0) head.x = canvas.width - gridSize;
    else if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - gridSize;
    else if (head.y >= canvas.height) head.y = 0;

    // 檢測碰撞：撞到自己或障礙牆時遊戲結束
    if (
        snake.some(segment => segment.x === head.x && segment.y === head.y) ||
        walls.some(wall => wall.x === head.x && wall.y === head.y)
    ) {
        gameOver = true;
    }

    snake.unshift(head); // 在蛇頭前新增一個新的頭部

    // 吃到食物：不移除尾部（蛇身增長），生成新食物
    if (head.x === food.x && head.y === food.y) {
        generateNewFood();

        // 如果自動尋路開啟，計算新的路徑
        if (autoPathActive) {
            findPath();
        }
    } else {
        snake.pop(); // 未吃到食物：移除尾部（保持蛇身長度不變）
    }

    // 繪製遊戲畫面
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布
    drawGrid(); // 繪製網格背景

    // 如果自動尋路開啟，繪製路徑提示
    if (autoPathActive && path.length > 0) {
        ctx.fillStyle = 'rgba(0, 100, 255, 0.3)'; // 半透明藍色
        path.forEach(point => {
            ctx.fillRect(point.x, point.y, gridSize, gridSize);
        });
    }

    // 繪製障礙牆
    ctx.fillStyle = '#333'; // 深灰色
    walls.forEach(wall => ctx.fillRect(wall.x, wall.y, gridSize, gridSize));

    // 繪製蛇身
    ctx.fillStyle = 'green';
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, gridSize, gridSize));

    // 繪製食物
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, gridSize, gridSize);

    // 設定下一幀更新時間（控制遊戲速度）
    setTimeout(gameLoop, 100);
}

// 開始遊戲
gameLoop();
