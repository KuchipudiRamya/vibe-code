/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 100; // Faster, more frantic

const TRACKS = [
  {
    id: 1,
    title: "AUDIO_STREAM_0x01.dat",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "CORRUPTED_SECTOR_99.wav",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "GHOST_IN_THE_MACHINE.mp3",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) break;
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGamePaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isGamePaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 16); // Hex-like scoring
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isGamePaused, food]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        setIsGamePaused(p => !p);
        return;
      }

      if (gameOver) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') directionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') directionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') directionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') directionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("ERR_AUDIO_STREAM_FAIL:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] font-pixel flex flex-col items-center justify-center p-4 scanlines relative z-10">
      <div className="static-bg"></div>
      
      <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} onEnded={nextTrack} />

      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-end mb-4 z-20">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-bold uppercase glitch" data-text="SNAKE.EXE">
            SNAKE.EXE
          </h1>
          <p className="text-[#FF00FF] text-sm md:text-base mt-2 bg-black inline-block border border-[#FF00FF] px-2 py-1 jitter">
            SYS.VER.9.0.1_GLITCH
          </p>
        </div>
        <div className="text-right border-2 border-[#00FFFF] p-2 bg-black">
          <div className="text-xs text-[#FF00FF] uppercase mb-1">DATA_EXTRACTED</div>
          <div className="text-2xl md:text-3xl">
            0x{score.toString(16).padStart(4, '0').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-20">
        <div 
          className="relative bg-black border-4 border-[#00FFFF] overflow-hidden"
          style={{ 
            width: `${GRID_SIZE * 20}px`, 
            height: `${GRID_SIZE * 20}px`,
            boxShadow: '8px 8px 0px #FF00FF'
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #00FFFF 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          {/* Snake */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            return (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className={`absolute ${isHead ? 'bg-[#FF00FF] z-10' : 'bg-[#00FFFF] z-0'}`}
                style={{
                  left: `${segment.x * 20}px`,
                  top: `${segment.y * 20}px`,
                  width: '20px',
                  height: '20px',
                  border: '1px solid #000'
                }}
              />
            );
          })}

          {/* Food */}
          <div
            className="absolute bg-[#FF00FF] jitter"
            style={{
              left: `${food.x * 20}px`,
              top: `${food.y * 20}px`,
              width: '20px',
              height: '20px',
              border: '2px solid #00FFFF'
            }}
          />

          {/* Overlays */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30">
              <div className="bg-black border-4 border-[#FF00FF] flex flex-col items-center justify-center w-[90%] h-[70%] p-4 text-center">
                <h2 className="text-3xl md:text-4xl text-[#FF00FF] uppercase mb-4 glitch" data-text="FATAL EXCEPTION">FATAL EXCEPTION</h2>
                <p className="text-[#00FFFF] mb-8 text-lg">MEM_DUMP: 0x{score.toString(16).toUpperCase()}</p>
                <motion.button 
                  onClick={resetGame}
                  className="px-4 py-2 bg-[#00FFFF] text-black font-bold uppercase border-2 border-transparent hover:bg-black hover:text-[#00FFFF] hover:border-[#00FFFF] transition-none cursor-pointer"
                  animate={{ 
                    x: [-2, 2, -2, 2, 0],
                    y: [1, -1, 1, -1, 0]
                  }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                >
                  [ INITIATE_RECOVERY ]
                </motion.button>
              </div>
            </div>
          )}

          {isGamePaused && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
              <h2 className="text-3xl text-[#00FFFF] uppercase border-y-4 border-[#FF00FF] py-2 w-full text-center bg-black jitter">
                PROCESS_SUSPENDED
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Controls Hint */}
      <div className="mt-4 text-[#FF00FF] text-sm uppercase flex gap-4 z-20 bg-black px-2 border border-[#FF00FF]">
        <span>INPUT: [W A S D]</span>
        <span>INTERRUPT: [SPACE]</span>
      </div>

      {/* Music Player */}
      <div className="w-full max-w-2xl mt-8 bg-black border-2 border-[#00FFFF] p-4 z-20 relative">
        <div className="absolute -top-3 left-4 bg-black px-2 text-[#FF00FF] text-sm">AUDIO_SUBSYSTEM</div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
          
          {/* Track Info */}
          <div className="flex-1 w-full border border-[#00FFFF] p-2 bg-[#001111] relative overflow-hidden">
            <div className="text-xs text-[#FF00FF] mb-1">STREAMING_TARGET:</div>
            <div className={`font-bold text-lg truncate ${isPlaying ? 'jitter' : ''}`}>
              {TRACKS[currentTrackIndex].title}
            </div>
            {isPlaying && (
              <div className="absolute right-2 top-2 text-[#FF00FF] text-xs animate-pulse">
                [ACTIVE]
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={prevTrack} className="px-3 py-1 bg-black border border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black cursor-pointer">
              [ &lt;&lt; ]
            </button>
            
            <button onClick={togglePlayPause} className="px-4 py-1 bg-[#FF00FF] text-black font-bold border border-[#FF00FF] hover:bg-black hover:text-[#FF00FF] cursor-pointer">
              {isPlaying ? '[ || ]' : '[ &gt; ]'}
            </button>
            
            <button onClick={nextTrack} className="px-3 py-1 bg-black border border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black cursor-pointer">
              [ &gt;&gt; ]
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-full md:w-auto border border-[#00FFFF] p-1 bg-black">
            <span className="text-[#FF00FF] text-xs px-1">VOL</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 appearance-none bg-black border border-[#00FFFF] h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#FF00FF] cursor-pointer"
            />
          </div>

        </div>
      </div>

    </div>
  );
}
