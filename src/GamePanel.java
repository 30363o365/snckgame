import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.Random;
import java.awt.GradientPaint;

public class GamePanel extends JPanel implements ActionListener {
    private final int TILE_SIZE = 25;
    private final int GAME_WIDTH = 1200;
    private final int GAME_HEIGHT = 1200;
    private final int TOTAL_TILES = (GAME_WIDTH * GAME_HEIGHT) / (TILE_SIZE * TILE_SIZE);

    private final int[] x = new int[TOTAL_TILES];
    private final int[] y = new int[TOTAL_TILES];
    private final int[] x2 = new int[TOTAL_TILES]; // 第二位玩家的蛇位置
    private final int[] y2 = new int[TOTAL_TILES];
    private int snakeLength;
    private int snakeLength2;
    private int foodX, foodY;
    private char direction = 'R';
    private char direction2 = 'L'; // 第二位玩家的初始方向
    private boolean running = false;
    private boolean running2 = false; // 第二位玩家是否在遊戲中
    private Timer timer;
    private Random random;
    private int score = 0;
    private int score2 = 0; // 第二位玩家的分數

    private JButton restartButton; // 新增重新開始按鈕
    private JComboBox<String> speedSelector; // 新增速度選擇器
    private boolean speedBoost = false; // 加速狀態

    public GamePanel() {
        random = new Random();
        setPreferredSize(new Dimension(GAME_WIDTH, GAME_HEIGHT));
        setBackground(Color.BLACK);
        setFocusable(true);
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                switch (e.getKeyCode()) {
                    // 第一位玩家控制
                    case KeyEvent.VK_LEFT:
                        if (direction != 'R') direction = 'L';
                        break;
                    case KeyEvent.VK_RIGHT:
                        if (direction != 'L') direction = 'R';
                        break;
                    case KeyEvent.VK_UP:
                        if (direction != 'D') direction = 'U';
                        break;
                    case KeyEvent.VK_DOWN:
                        if (direction != 'U') direction = 'D';
                        break;
                    // 第二位玩家控制
                    case KeyEvent.VK_A:
                        if (direction2 != 'R') direction2 = 'L';
                        break;
                    case KeyEvent.VK_D:
                        if (direction2 != 'L') direction2 = 'R';
                        break;
                    case KeyEvent.VK_W:
                        if (direction2 != 'D') direction2 = 'U';
                        break;
                    case KeyEvent.VK_S:
                        if (direction2 != 'U') direction2 = 'D';
                        break;
                    case KeyEvent.VK_SPACE: // 加速鍵
                        speedBoost = true;
                        timer.setDelay(timer.getDelay() / 4); // 將速度加快一倍
                        break;
                }
            }

            @Override
            public void keyReleased(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_SPACE) { // 釋放加速鍵
                    speedBoost = false;
                    adjustSpeed(); // 恢復到選擇的速度
                }
            }
        });

        restartButton = new JButton("重新開始");
        restartButton.setFocusable(false);
        restartButton.setVisible(false);
        restartButton.addActionListener(e -> restartGame());
        add(restartButton);

        speedSelector = new JComboBox<>(new String[]{"慢", "中", "快"});
        speedSelector.setFocusable(false);
        speedSelector.setVisible(true); // 確保遊戲一開始顯示速度選項
        speedSelector.addActionListener(e -> adjustSpeed());
        add(speedSelector);

        startGame();
    }

    private void adjustSpeed() {
        String selectedSpeed = (String) speedSelector.getSelectedItem();
        if (selectedSpeed != null) {
            switch (selectedSpeed) {
                case "慢":
                    timer.setDelay(150);
                    break;
                case "中":
                    timer.setDelay(100);
                    break;
                case "快":
                    timer.setDelay(50);
                    break;
            }
        }
    }

    private void startGame() {
        snakeLength = 3;
        for (int i = 0; i < snakeLength; i++) {
            x[i] = 100 - i * TILE_SIZE;
            y[i] = 100;
        }
        snakeLength2 = 3;
        for (int i = 0; i < snakeLength2; i++) {
            x2[i] = GAME_WIDTH - 100 + i * TILE_SIZE;
            y2[i] = GAME_HEIGHT - 100;
        }
        spawnFood();
        running = true;
        running2 = true;

        // 根據速度選項設置初始速度
        String selectedSpeed = (String) speedSelector.getSelectedItem();
        int initialDelay = 100; // 預設速度為中
        if (selectedSpeed != null) {
            switch (selectedSpeed) {
                case "慢":
                    initialDelay = 150;
                    break;
                case "快":
                    initialDelay = 50;
                    break;
            }
        }
        timer = new Timer(initialDelay, this);
        timer.start();

        restartButton.setVisible(false);
        speedSelector.setVisible(true); // 確保速度選項在遊戲開始時可見
    }

    private void restartGame() {
        score = 0;
        score2 = 0;
        direction = 'R';
        direction2 = 'L';
        running = true;
        running2 = true;
        restartButton.setVisible(false);
        speedSelector.setVisible(true); // 重新開始時顯示速度選擇器
        startGame();
        repaint();
    }

    private void spawnFood() {
        foodX = random.nextInt(GAME_WIDTH / TILE_SIZE) * TILE_SIZE;
        foodY = random.nextInt(GAME_HEIGHT / TILE_SIZE) * TILE_SIZE;
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g; // 使用 Graphics2D 以支持漸變效果
        if (running || running2) {
            // Draw food with 3D effect
            GradientPaint foodGradient = new GradientPaint(
                foodX, foodY, new Color(255, 100, 100), 
                foodX + TILE_SIZE, foodY + TILE_SIZE, new Color(200, 0, 0)
            );
            g2d.setPaint(foodGradient);
            g2d.fillOval(foodX, foodY, TILE_SIZE, TILE_SIZE);

            // 添加食物的陰影
            g2d.setColor(new Color(0, 0, 0, 50));
            g2d.fillOval(foodX + 3, foodY + 3, TILE_SIZE, TILE_SIZE);

            // Draw snake with realistic circular nodes
            for (int i = 0; i < snakeLength; i++) {
                if (i == 0) {
                    // 頭部使用漸變色和光澤效果
                    GradientPaint headGradient = new GradientPaint(
                        x[i], y[i], new Color(0, 255, 0), 
                        x[i] + TILE_SIZE, y[i] + TILE_SIZE, new Color(0, 200, 0)
                    );
                    g2d.setPaint(headGradient);
                    g2d.fillOval(x[i], y[i], TILE_SIZE, TILE_SIZE);

                    // 添加光澤效果
                    g2d.setColor(new Color(255, 255, 255, 100));
                    g2d.fillOval(x[i] + 5, y[i] + 5, TILE_SIZE / 2, TILE_SIZE / 2);

                    // 添加陰影效果
                    g2d.setColor(new Color(0, 0, 0, 50));
                    g2d.fillOval(x[i] + 3, y[i] + 3, TILE_SIZE, TILE_SIZE);
                } else {
                    // 身體使用漸變色
                    GradientPaint bodyGradient = new GradientPaint(
                        x[i], y[i], new Color(45, 180, 0), 
                        x[i] + TILE_SIZE, y[i] + TILE_SIZE, new Color(30, 150, 0)
                    );
                    g2d.setPaint(bodyGradient);
                    g2d.fillOval(x[i], y[i], TILE_SIZE, TILE_SIZE);

                    // 添加陰影效果
                    g2d.setColor(new Color(0, 0, 0, 50));
                    g2d.fillOval(x[i] + 3, y[i] + 3, TILE_SIZE, TILE_SIZE);
                }
            }

            // Draw second player's snake with realistic circular nodes
            for (int i = 0; i < snakeLength2; i++) {
                if (i == 0) {
                    // 頭部使用漸變色和光澤效果
                    GradientPaint headGradient = new GradientPaint(
                        x2[i], y2[i], new Color(0, 0, 255), 
                        x2[i] + TILE_SIZE, y2[i] + TILE_SIZE, new Color(0, 0, 200)
                    );
                    g2d.setPaint(headGradient);
                    g2d.fillOval(x2[i], y2[i], TILE_SIZE, TILE_SIZE);

                    // 添加光澤效果
                    g2d.setColor(new Color(255, 255, 255, 100));
                    g2d.fillOval(x2[i] + 5, y2[i] + 5, TILE_SIZE / 2, TILE_SIZE / 2);

                    // 添加陰影效果
                    g2d.setColor(new Color(0, 0, 0, 50));
                    g2d.fillOval(x2[i] + 3, y2[i] + 3, TILE_SIZE, TILE_SIZE);
                } else {
                    // 身體使用漸變色
                    GradientPaint bodyGradient = new GradientPaint(
                        x2[i], y2[i], new Color(0, 0, 180), 
                        x2[i] + TILE_SIZE, y2[i] + TILE_SIZE, new Color(0, 0, 120)
                    );
                    g2d.setPaint(bodyGradient);
                    g2d.fillOval(x2[i], y2[i], TILE_SIZE, TILE_SIZE);

                    // 添加陰影效果
                    g2d.setColor(new Color(0, 0, 0, 50));
                    g2d.fillOval(x2[i] + 3, y2[i] + 3, TILE_SIZE, TILE_SIZE);
                }
            }

            // Draw scores
            g.setColor(Color.WHITE);
            g.setFont(new Font("Microsoft JhengHei", Font.BOLD, 20)); // 修改字體
            g.drawString("分數: " + score, 10, 20);

            g.setColor(Color.CYAN);
            g.setFont(new Font("Microsoft JhengHei", Font.BOLD, 20));
            g.drawString("玩家2分數: " + score2, 10, 50);
        } else {
            showGameOver(g);
        }
    }

    private void showGameOver(Graphics g) {
        g.setColor(Color.RED);
        g.setFont(new Font("Microsoft JhengHei", Font.BOLD, 40)); // 修改字體
        FontMetrics metrics = getFontMetrics(g.getFont());
        g.drawString("遊戲結束", (GAME_WIDTH - metrics.stringWidth("遊戲結束")) / 2, GAME_HEIGHT / 2);

        g.setColor(Color.WHITE);
        g.setFont(new Font("Microsoft JhengHei", Font.BOLD, 20)); // 修改字體
        g.drawString("分數: " + score, (GAME_WIDTH - metrics.stringWidth("分數: " + score)) / 2, GAME_HEIGHT / 2 + 40);
        g.drawString("玩家2分數: " + score2, (GAME_WIDTH - metrics.stringWidth("玩家2分數: " + score2)) / 2, GAME_HEIGHT / 2 + 80);

        restartButton.setBounds((GAME_WIDTH - 120) / 2, GAME_HEIGHT / 2 + 120, 120, 30);
        restartButton.setVisible(true);
        speedSelector.setVisible(true); // 遊戲結束時顯示速度選擇器
    }

    private void move() {
        // 第一位玩家移動
        for (int i = snakeLength; i > 0; i--) {
            x[i] = x[i - 1];
            y[i] = y[i - 1];
        }
        switch (direction) {
            case 'U':
                y[0] -= TILE_SIZE;
                break;
            case 'D':
                y[0] += TILE_SIZE;
                break;
            case 'L':
                x[0] -= TILE_SIZE;
                break;
            case 'R':
                x[0] += TILE_SIZE;
                break;
        }

        // 第二位玩家移動
        for (int i = snakeLength2; i > 0; i--) {
            x2[i] = x2[i - 1];
            y2[i] = y2[i - 1];
        }
        switch (direction2) {
            case 'U':
                y2[0] -= TILE_SIZE;
                break;
            case 'D':
                y2[0] += TILE_SIZE;
                break;
            case 'L':
                x2[0] -= TILE_SIZE;
                break;
            case 'R':
                x2[0] += TILE_SIZE;
                break;
        }
    }

    private void checkCollision() {
        // 第一位玩家碰撞檢查
        for (int i = snakeLength; i > 0; i--) {
            if (x[0] == x[i] && y[0] == y[i]) {
                running = false;
            }
        }
        // 第二位玩家碰撞檢查
        for (int i = snakeLength2; i > 0; i--) {
            if (x2[0] == x2[i] && y2[0] == y2[i]) {
                running2 = false;
            }
        }

        // Check if head collides with walls and wrap around
        if (x[0] < 0) {
            x[0] = GAME_WIDTH - TILE_SIZE;
        } else if (x[0] >= GAME_WIDTH) {
            x[0] = 0;
        }

        if (y[0] < 0) {
            y[0] = GAME_HEIGHT - TILE_SIZE;
        } else if (y[0] >= GAME_HEIGHT) {
            y[0] = 0;
        }

        if (x2[0] < 0) {
            x2[0] = GAME_WIDTH - TILE_SIZE;
        } else if (x2[0] >= GAME_WIDTH) {
            x2[0] = 0;
        }

        if (y2[0] < 0) {
            y2[0] = GAME_HEIGHT - TILE_SIZE;
        } else if (y2[0] >= GAME_HEIGHT) {
            y2[0] = 0;
        }

        if (!running && !running2) {
            timer.stop();
            restartButton.setVisible(true);
        }
    }

    private void checkFood() {
        // 第一位玩家吃食物
        if (x[0] == foodX && y[0] == foodY) {
            snakeLength++;
            score++;
            spawnFood();
        }
        // 第二位玩家吃食物
        if (x2[0] == foodX && y2[0] == foodY) {
            snakeLength2++;
            score2++;
            spawnFood();
        }

        // If all tiles are occupied by the snake, reset the game
        if (snakeLength == TOTAL_TILES || snakeLength2 == TOTAL_TILES) {
            score += 10; // Bonus points for eating all apples
            score2 += 10; // Bonus points for eating all apples
            snakeLength = 3; // Reset snake length
            snakeLength2 = 3; // Reset second snake length
            spawnFood(); // Generate a new apple
        }
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        if (running || running2) {
            move();
            checkFood();
            checkCollision();
        }
        repaint();
    }
}
