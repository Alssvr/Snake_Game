import { useEffect, useRef, useMemo } from 'react';
import { useSnakeGame } from './hooks/useSnakeGame';
import { useSwipe } from './hooks/useSwipe';
import type { Direction, Difficulty } from './hooks/useSnakeGame';

function App() {
  const {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    gridSize,
    startGame,
    togglePause,
    restart,
    changeDirection,
    setDifficulty,
  } = useSnakeGame();

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Swipe support
  useSwipe(gameAreaRef, {
    onSwipe: (dir: Direction) => {
      if (gameState === 'playing') {
        changeDirection(dir);
      }
    },
  });

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
        W: 'UP',
        S: 'DOWN',
        A: 'LEFT',
        D: 'RIGHT',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        if (gameState === 'playing') {
          changeDirection(keyMap[e.key]);
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameover') {
          restart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeDirection, togglePause, restart]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / gridSize;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw food with glow
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize / 2 - 2;

    // Food glow
    const glowGradient = ctx.createRadialGradient(
      foodX, foodY, 0,
      foodX, foodY, cellSize
    );
    glowGradient.addColorStop(0, 'rgba(255, 75, 75, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 75, 75, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(food.x * cellSize - cellSize / 2, food.y * cellSize - cellSize / 2, cellSize * 2, cellSize * 2);

    // Food body
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    const foodGradient = ctx.createRadialGradient(
      foodX - 2, foodY - 2, 0,
      foodX, foodY, foodRadius
    );
    foodGradient.addColorStop(0, '#ff6b6b');
    foodGradient.addColorStop(1, '#ee5a24');
    ctx.fillStyle = foodGradient;
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1;
      const radius = 4;

      const isHead = index === 0;
      const progress = index / snake.length;

      // Snake color gradient from head to tail
      const r = Math.round(72 + (30 - 72) * progress);
      const g = Math.round(219 + (120 - 219) * progress);
      const b = Math.round(145 + (80 - 145) * progress);

      ctx.fillStyle = isHead ? '#4ade80' : `rgb(${r}, ${g}, ${b})`;

      // Rounded rectangle
      const rx = x + padding;
      const ry = y + padding;
      const rw = cellSize - padding * 2;
      const rh = cellSize - padding * 2;

      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();

      // Head details (eyes)
      if (isHead) {
        ctx.fillStyle = '#1a1a2e';
        const eyeSize = cellSize / 8;
        let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;

        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;
        const offset = cellSize / 4;

        switch (direction) {
          case 'UP':
            eye1X = centerX - offset;
            eye1Y = centerY - offset / 2;
            eye2X = centerX + offset;
            eye2Y = centerY - offset / 2;
            break;
          case 'DOWN':
            eye1X = centerX - offset;
            eye1Y = centerY + offset / 2;
            eye2X = centerX + offset;
            eye2Y = centerY + offset / 2;
            break;
          case 'LEFT':
            eye1X = centerX - offset / 2;
            eye1Y = centerY - offset;
            eye2X = centerX - offset / 2;
            eye2Y = centerY + offset;
            break;
          case 'RIGHT':
            eye1X = centerX + offset / 2;
            eye1Y = centerY - offset;
            eye2X = centerX + offset / 2;
            eye2Y = centerY + offset;
            break;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Overlay for non-playing states
    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Нажмите пробел для продолжения', canvas.width / 2, canvas.height / 2 + 20);
    }

    if (gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('ИГРА ОКОНЧЕНА', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px system-ui';
      ctx.fillText(`Счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
      ctx.font = '13px system-ui';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Нажмите R или кнопку для перезапуска', canvas.width / 2, canvas.height / 2 + 45);
    }
  }, [snake, food, direction, gameState, gridSize, score]);

  // Responsive canvas size
  const canvasSize = useMemo(() => {
    if (typeof window === 'undefined') return 400;
    const maxWidth = Math.min(window.innerWidth - 32, 500);
    return Math.floor(maxWidth / gridSize) * gridSize;
  }, [gridSize]);

  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Легко', color: 'bg-green-500' },
    { value: 'medium', label: 'Средне', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Сложно', color: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Header */}
      <div className="w-full max-w-[500px] mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
          🐍 Змейка
        </h1>

        {/* Score panel */}
        <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur rounded-xl px-4 py-3 border border-slate-700/50">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Счёт</div>
            <div className="text-2xl font-bold text-white">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Рекорд</div>
            <div className="text-2xl font-bold text-yellow-400">{highScore}</div>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div
        ref={gameAreaRef}
        className="relative rounded-2xl overflow-hidden shadow-2xl shadow-green-900/20 border-2 border-slate-700/50 touch-none"
        style={{ width: canvasSize, height: canvasSize }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="block"
        />

        {/* Start screen overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="text-5xl mb-2">🐍</div>
            <h2 className="text-2xl font-bold text-white">Змейка</h2>
            <p className="text-slate-300 text-sm text-center px-6">
              Управление: стрелки / WASD / свайпы
            </p>

            {/* Difficulty selector */}
            <div className="flex gap-2 mt-2">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    difficulty === d.value
                      ? `${d.color} text-white shadow-lg scale-105`
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-200 active:scale-95"
            >
              Начать игру
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-[500px] mt-4 space-y-3">
        {/* Action buttons */}
        <div className="flex gap-2 justify-center">
          {gameState === 'playing' && (
            <button
              onClick={togglePause}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <span>⏸</span> Пауза
            </button>
          )}
          {gameState === 'paused' && (
            <button
              onClick={togglePause}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <span>▶</span> Продолжить
            </button>
          )}
          {(gameState === 'gameover') && (
            <button
              onClick={restart}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 shadow-lg shadow-green-500/20"
            >
              <span>🔄</span> Заново
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={restart}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <span>🔄</span> Заново
            </button>
          )}
        </div>

        {/* Mobile D-pad */}
        <div className="flex flex-col items-center gap-1 md:hidden">
          <button
            onTouchStart={(e) => { e.preventDefault(); changeDirection('UP'); }}
            className="w-14 h-14 bg-slate-700/80 hover:bg-slate-600 active:bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl transition-colors touch-manipulation"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('LEFT'); }}
              className="w-14 h-14 bg-slate-700/80 hover:bg-slate-600 active:bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl transition-colors touch-manipulation"
            >
              ◀
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('DOWN'); }}
              className="w-14 h-14 bg-slate-700/80 hover:bg-slate-600 active:bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl transition-colors touch-manipulation"
            >
              ▼
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('RIGHT'); }}
              className="w-14 h-14 bg-slate-700/80 hover:bg-slate-600 active:bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl transition-colors touch-manipulation"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Difficulty selector (during game) */}
        {gameState === 'idle' && (
          <div className="hidden md:flex gap-2 justify-center">
            <span className="text-slate-400 text-sm self-center">Сложность:</span>
            {difficulties.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  difficulty === d.value
                    ? `${d.color} text-white shadow-lg`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Keyboard hints */}
        <div className="hidden md:flex justify-center gap-4 text-xs text-slate-500 mt-2">
          <span>← → ↑ ↓ — движение</span>
          <span>Пробел — пауза</span>
          <span>R — перезапуск</span>
        </div>
      </div>
    </div>
  );
}

export default App;
