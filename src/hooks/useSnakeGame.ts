import { useState, useCallback, useEffect, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

const GRID_SIZE = 20;
const SPEED_MAP: Record<Difficulty, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const directionRef = useRef<Direction>('RIGHT');
  const gameStateRef = useRef<GameState>('idle');
  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Position>({ x: 15, y: 15 });
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<Direction>('RIGHT');

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current !== null) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const moveSnake = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const currentSnake = [...snakeRef.current];
    const head = { ...currentSnake[0] };
    const dir = directionRef.current;

    lastDirectionRef.current = dir;

    switch (dir) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameState('gameover');
      stopGameLoop();
      const currentScore = scoreRef.current;
      const saved = localStorage.getItem('snake-high-score');
      const currentHigh = saved ? parseInt(saved, 10) : 0;
      if (currentScore > currentHigh) {
        localStorage.setItem('snake-high-score', currentScore.toString());
        setHighScore(currentScore);
      }
      return;
    }

    // Check self collision
    if (currentSnake.some((s) => s.x === head.x && s.y === head.y)) {
      setGameState('gameover');
      stopGameLoop();
      const currentScore = scoreRef.current;
      const saved = localStorage.getItem('snake-high-score');
      const currentHigh = saved ? parseInt(saved, 10) : 0;
      if (currentScore > currentHigh) {
        localStorage.setItem('snake-high-score', currentScore.toString());
        setHighScore(currentScore);
      }
      return;
    }

    const newSnake = [head, ...currentSnake];
    const currentFood = foodRef.current;

    // Check food collision
    if (head.x === currentFood.x && head.y === currentFood.y) {
      const newScore = scoreRef.current + 10;
      setScore(newScore);
      const newFood = getRandomPosition(newSnake);
      setFood(newFood);
      foodRef.current = newFood;
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    snakeRef.current = newSnake;
  }, [stopGameLoop]);

  const startGameLoop = useCallback(() => {
    stopGameLoop();
    const speed = SPEED_MAP[difficulty];
    gameLoopRef.current = window.setInterval(moveSnake, speed);
  }, [difficulty, moveSnake, stopGameLoop]);

  const startGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    const initialFood = getRandomPosition(initialSnake);
    setSnake(initialSnake);
    setFood(initialFood);
    setDirection('RIGHT');
    setScore(0);
    setGameState('playing');
    snakeRef.current = initialSnake;
    foodRef.current = initialFood;
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    scoreRef.current = 0;
  }, []);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused');
      stopGameLoop();
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing');
    }
  }, [stopGameLoop]);

  const restart = useCallback(() => {
    stopGameLoop();
    startGame();
  }, [stopGameLoop, startGame]);

  const changeDirection = useCallback((newDir: Direction) => {
    if (OPPOSITE[newDir] === lastDirectionRef.current) return;
    setDirection(newDir);
    directionRef.current = newDir;
  }, []);

  // Start/stop game loop based on game state
  useEffect(() => {
    if (gameState === 'playing') {
      startGameLoop();
    } else {
      stopGameLoop();
    }
    return stopGameLoop;
  }, [gameState, startGameLoop, stopGameLoop]);

  // Update speed when difficulty changes during play
  useEffect(() => {
    if (gameState === 'playing') {
      startGameLoop();
    }
  }, [difficulty]);

  return {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    gridSize: GRID_SIZE,
    startGame,
    togglePause,
    restart,
    changeDirection,
    setDifficulty,
  };
}
