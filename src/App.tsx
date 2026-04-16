/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Trophy, Gamepad2, Volume2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  duration: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

const DUMMY_TRACKS: Track[] = [
  {
    id: 1,
    title: "NEURAL_DRIFT_01",
    artist: "CYBER_GEN_AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "6:12"
  },
  {
    id: 2,
    title: "SYNTHETIC_RESONANCE",
    artist: "VOID_ENGINE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "7:05"
  },
  {
    id: 3,
    title: "GLITCH_CORE_V3",
    artist: "ALGO_RHYTHM",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "5:45"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = DUMMY_TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Ensure food doesn't spawn on snake
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood();
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood());
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': setIsPaused(p => !p); break;
        case 'r':
        case 'R': resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);

    // Draw Snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ffff' : '#39ff14';
      ctx.shadowBlur = index === 0 ? 20 : 10;
      ctx.shadowColor = index === 0 ? '#00ffff' : '#39ff14';
      ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [snake, food]);

  // --- Music Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex = currentTrackIndex + (dir === 'next' ? 1 : -1);
    if (nextIndex >= DUMMY_TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = DUMMY_TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-black">
      {/* Background Glitch Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-magenta blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-cyan blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <header className="z-10 mb-8 text-center">
        <h1 
          className="text-4xl md:text-6xl font-pixel glitch-text mb-2 tracking-tighter" 
          data-text="NEON_GLITCH"
        >
          NEON_GLITCH
        </h1>
        <div className="flex items-center justify-center gap-4 text-xs font-mono opacity-60">
          <span className="flex items-center gap-1"><Zap size={12} className="text-neon-green" /> SYSTEM_ONLINE</span>
          <span className="flex items-center gap-1"><Volume2 size={12} className="text-neon-magenta" /> AUDIO_ACTIVE</span>
        </div>
      </header>

      <main className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Left: Stats */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
          <div className="border border-neon-cyan/30 bg-black/40 backdrop-blur-md p-6 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan/50 group-hover:bg-neon-cyan transition-colors" />
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="text-neon-cyan" />
              <h2 className="font-pixel text-sm">SCORE_BOARD</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase opacity-50 mb-1">Current_Score</p>
                <p className="text-3xl font-pixel text-neon-cyan">{score.toString().padStart(4, '0')}</p>
              </div>
              <div className="h-px bg-neon-cyan/20" />
              <div>
                <p className="text-[10px] uppercase opacity-50 mb-1">High_Score</p>
                <p className="text-xl font-pixel text-neon-magenta">{highScore.toString().padStart(4, '0')}</p>
              </div>
            </div>
          </div>

          <div className="border border-neon-green/30 bg-black/40 backdrop-blur-md p-6 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-green/50 group-hover:bg-neon-green transition-colors" />
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="text-neon-green" />
              <h2 className="font-pixel text-sm">CONTROLS</h2>
            </div>
            <ul className="text-[10px] space-y-2 font-mono opacity-70">
              <li className="flex justify-between"><span>ARROWS</span> <span>MOVE</span></li>
              <li className="flex justify-between"><span>SPACE</span> <span>PAUSE</span></li>
              <li className="flex justify-between"><span>R_KEY</span> <span>RESET</span></li>
            </ul>
          </div>
        </div>

        {/* Center: Game Window */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="relative p-2 border-2 border-neon-cyan shadow-[0_0_30px_rgba(0,255,255,0.2)] bg-black screen-tear">
            {/* CRT Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-30" />
            
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={400} 
              className="w-full aspect-square max-w-[400px] block crt-flicker"
            />

            <AnimatePresence>
              {(isGameOver || isPaused) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                  {isGameOver ? (
                    <>
                      <h2 className="text-4xl font-pixel text-neon-magenta mb-6 glitch-text" data-text="GAME_OVER">GAME_OVER</h2>
                      <button 
                        onClick={resetGame}
                        className="px-8 py-3 bg-neon-magenta text-black font-pixel text-xs hover:bg-white transition-colors"
                      >
                        REBOOT_SYSTEM
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-pixel text-neon-cyan mb-6">SYSTEM_PAUSED</h2>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="px-8 py-3 bg-neon-cyan text-black font-pixel text-xs hover:bg-white transition-colors"
                      >
                        RESUME_PROCESS
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Right: Music Player */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3">
          <div className="border border-neon-magenta/30 bg-black/40 backdrop-blur-md p-6 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-magenta/50 group-hover:bg-neon-magenta transition-colors" />
            <div className="flex items-center gap-3 mb-6">
              <Music className="text-neon-magenta" />
              <h2 className="font-pixel text-sm">AUDIO_CORE</h2>
            </div>

            {/* Visualizer Mock */}
            <div className="flex items-end gap-1 h-12 mb-6">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [10, 40, 15, 35, 20] : 10 }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                  className="flex-1 bg-neon-magenta/40"
                />
              ))}
            </div>

            <div className="mb-6">
              <p className="text-[10px] uppercase opacity-50 mb-1">Now_Playing</p>
              <h3 className="font-pixel text-xs text-neon-magenta truncate mb-1">{currentTrack.title}</h3>
              <p className="text-[10px] font-mono text-neon-cyan/70">{currentTrack.artist}</p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <button onClick={() => skipTrack('prev')} className="text-neon-cyan hover:text-white transition-colors">
                <SkipBack size={20} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full border border-neon-magenta flex items-center justify-center text-neon-magenta hover:bg-neon-magenta hover:text-black transition-all"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>
              <button onClick={() => skipTrack('next')} className="text-neon-cyan hover:text-white transition-colors">
                <SkipForward size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase opacity-50 mb-2">Playlist_Data</p>
              {DUMMY_TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                  className={`w-full text-left p-2 text-[10px] font-mono flex justify-between items-center transition-colors ${
                    currentTrackIndex === idx ? 'bg-neon-magenta/20 text-neon-magenta' : 'hover:bg-white/5 opacity-60'
                  }`}
                >
                  <span>{track.id.toString().padStart(2, '0')} {track.title}</span>
                  <span>{track.duration}</span>
                </button>
              ))}
            </div>

            <audio 
              ref={audioRef} 
              src={currentTrack.url} 
              onEnded={() => skipTrack('next')}
            />
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="mt-12 w-full max-w-6xl border-t border-neon-cyan/20 pt-4 flex justify-between items-center text-[8px] font-mono opacity-40">
        <span>EST_20XX // NEURAL_NET_V4.2</span>
        <span className="animate-pulse">WAITING_FOR_INPUT...</span>
        <span>ENCRYPTED_STREAM_ACTIVE</span>
      </footer>
    </div>
  );
}
