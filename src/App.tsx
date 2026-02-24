/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Play, RotateCcw, Volume2, VolumeX, Timer } from 'lucide-react';
import { QUESTIONS } from './constants';
import { GameState, TeamState } from './types';

// Sound URLs (using common free assets)
const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Ting
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Boing
  timer: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Tick
  cheer: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Cheer
  bg: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Fun background
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [team1, setTeam1] = useState<TeamState>({ score: 0, name: 'TEAM 1', color: 'blue' });
  const [team2, setTeam2] = useState<TeamState>({ score: 0, name: 'TEAM 2', color: 'pink' });
  const [timeLeft, setTimeLeft] = useState(15);
  const [answeredBy, setAnsweredBy] = useState<number | null>(null); // 1 for Team 1, 2 for Team 2
  const [isMuted, setIsMuted] = useState(false);
  const [feedback, setFeedback] = useState<{ team: number; correct: boolean } | null>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundUrl: string) => {
    if (isMuted) return;
    const audio = new Audio(soundUrl);
    audio.play().catch(() => {});
  }, [isMuted]);

  useEffect(() => {
    if (gameState === 'PLAYING' && !isMuted) {
      if (!bgMusicRef.current) {
        bgMusicRef.current = new Audio(SOUNDS.bg);
        bgMusicRef.current.loop = true;
        bgMusicRef.current.volume = 0.2;
      }
      bgMusicRef.current.play().catch(() => {});
    } else {
      bgMusicRef.current?.pause();
    }
    return () => bgMusicRef.current?.pause();
  }, [gameState, isMuted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0 && !answeredBy) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playSound(SOUNDS.wrong);
            handleNextQuestion();
            return 15;
          }
          if (prev <= 4) playSound(SOUNDS.timer);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, answeredBy, playSound]);

  const handleNextQuestion = useCallback(() => {
    setAnsweredBy(null);
    setFeedback(null);
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(15);
    } else {
      setGameState('FINISHED');
      playSound(SOUNDS.cheer);
    }
  }, [currentQuestionIndex, playSound]);

  const handleAnswer = (team: number, optionIndex: number) => {
    if (answeredBy || gameState !== 'PLAYING') return;

    setAnsweredBy(team);
    const isCorrect = optionIndex === QUESTIONS[currentQuestionIndex].correctAnswer;

    if (isCorrect) {
      playSound(SOUNDS.correct);
      setFeedback({ team, correct: true });
      if (team === 1) {
        setTeam1((prev) => ({ ...prev, score: prev.score + 1 }));
      } else {
        setTeam2((prev) => ({ ...prev, score: prev.score + 1 }));
      }
    } else {
      playSound(SOUNDS.wrong);
      setFeedback({ team, correct: false });
    }

    setTimeout(handleNextQuestion, 1500);
  };

  const startGame = () => {
    setTeam1({ score: 0, name: 'TEAM 1', color: 'blue' });
    setTeam2({ score: 0, name: 'TEAM 2', color: 'pink' });
    setCurrentQuestionIndex(0);
    setTimeLeft(15);
    setGameState('PLAYING');
    setAnsweredBy(null);
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-stone-100 font-sans overflow-hidden text-slate-900">
      {/* Header / Scoreboard */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-white shadow-md z-50 flex items-center justify-between px-8 border-b border-black/5">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Team 1</span>
            <div className="flex gap-1">
              {Array.from({ length: team1.score }).map((_, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600">{team1.score}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 px-4 py-1 bg-slate-100 rounded-full">
            <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <span className={`text-xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-slate-700'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
            Câu {currentQuestionIndex + 1} / {QUESTIONS.length}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-3xl font-black text-pink-600">{team2.score}</div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Team 2</span>
            <div className="flex gap-1">
              {Array.from({ length: team2.score }).map((_, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="pt-20 h-screen flex relative">
        {gameState === 'START' && (
          <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
            <motion.h1 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-black mb-4 text-slate-900 tracking-tighter"
            >
              ĐẤU TRƯỜNG <span className="text-blue-600">SO</span> <span className="text-pink-600">SÁNH</span>
            </motion.h1>
            <p className="text-xl text-slate-500 mb-8 max-w-md">
              So sánh các số có bốn chữ số. Đội nào nhanh tay và đúng nhất sẽ giành chiến thắng!
            </p>
            <button
              onClick={startGame}
              className="group relative px-12 py-6 bg-slate-900 text-white rounded-2xl font-bold text-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
            >
              <Play className="w-8 h-8 fill-current" />
              BẮT ĐẦU CHƠI
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <>
            {/* Split Screen */}
            <div className="w-1/2 h-full border-r border-black/5 bg-blue-50/30 flex flex-col items-center justify-center p-8 relative">
              <div className="absolute top-8 left-8 text-blue-200 font-black text-8xl pointer-events-none select-none">T1</div>
              <div className="w-full max-w-md space-y-6 z-10">
                <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-100 text-center">
                  <h2 className="text-5xl font-black text-slate-800 tracking-tight">{currentQuestion.question}</h2>
                </div>
                <div className="grid gap-4">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      disabled={!!answeredBy}
                      onClick={() => handleAnswer(1, idx)}
                      className={`
                        w-full py-6 rounded-2xl text-3xl font-bold transition-all
                        ${answeredBy === 1 && feedback?.correct && idx === currentQuestion.correctAnswer ? 'bg-green-500 text-white scale-105 shadow-lg' : ''}
                        ${answeredBy === 1 && !feedback?.correct && idx !== currentQuestion.correctAnswer ? 'bg-slate-200 text-slate-400 opacity-50' : ''}
                        ${answeredBy === 1 && !feedback?.correct && idx === currentQuestion.correctAnswer ? 'bg-green-100 text-green-600 border-2 border-green-500' : ''}
                        ${!answeredBy ? 'bg-white text-blue-600 border-2 border-blue-100 hover:bg-blue-600 hover:text-white hover:scale-[1.02] active:scale-95 shadow-md' : 'cursor-default'}
                      `}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {feedback?.team === 1 && (
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1.5, rotate: 0 }}
                  className="absolute z-20"
                >
                  {feedback.correct ? (
                    <div className="bg-green-500 text-white px-6 py-2 rounded-full font-black text-2xl shadow-2xl">ĐÚNG RỒI! 🎉</div>
                  ) : (
                    <div className="bg-red-500 text-white px-6 py-2 rounded-full font-black text-2xl shadow-2xl">SAI MẤT RỒI! 😢</div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="w-1/2 h-full bg-pink-50/30 flex flex-col items-center justify-center p-8 relative">
              <div className="absolute top-8 right-8 text-pink-200 font-black text-8xl pointer-events-none select-none">T2</div>
              <div className="w-full max-w-md space-y-6 z-10">
                <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-pink-100 text-center">
                  <h2 className="text-5xl font-black text-slate-800 tracking-tight">{currentQuestion.question}</h2>
                </div>
                <div className="grid gap-4">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      disabled={!!answeredBy}
                      onClick={() => handleAnswer(2, idx)}
                      className={`
                        w-full py-6 rounded-2xl text-3xl font-bold transition-all
                        ${answeredBy === 2 && feedback?.correct && idx === currentQuestion.correctAnswer ? 'bg-green-500 text-white scale-105 shadow-lg' : ''}
                        ${answeredBy === 2 && !feedback?.correct && idx !== currentQuestion.correctAnswer ? 'bg-slate-200 text-slate-400 opacity-50' : ''}
                        ${answeredBy === 2 && !feedback?.correct && idx === currentQuestion.correctAnswer ? 'bg-green-100 text-green-600 border-2 border-green-500' : ''}
                        ${!answeredBy ? 'bg-white text-pink-600 border-2 border-pink-100 hover:bg-pink-600 hover:text-white hover:scale-[1.02] active:scale-95 shadow-md' : 'cursor-default'}
                      `}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {feedback?.team === 2 && (
                <motion.div 
                  initial={{ scale: 0, rotate: 20 }}
                  animate={{ scale: 1.5, rotate: 0 }}
                  className="absolute z-20"
                >
                  {feedback.correct ? (
                    <div className="bg-green-500 text-white px-6 py-2 rounded-full font-black text-2xl shadow-2xl">ĐÚNG RỒI! 🎉</div>
                  ) : (
                    <div className="bg-red-500 text-white px-6 py-2 rounded-full font-black text-2xl shadow-2xl">SAI MẤT RỒI! 😢</div>
                  )}
                </motion.div>
              )}
            </div>
          </>
        )}

        {gameState === 'FINISHED' && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            {/* Confetti / Fireworks simulation with motion */}
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth - window.innerWidth / 2, 
                  y: window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5,
                  rotate: 0
                }}
                animate={{ 
                  y: -100,
                  rotate: 360,
                  opacity: [0, 1, 1, 0]
                }}
                transition={{ 
                  duration: Math.random() * 2 + 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className={`absolute w-4 h-4 rounded-full ${['bg-yellow-400', 'bg-blue-400', 'bg-pink-400', 'bg-green-400'][Math.floor(Math.random() * 4)]}`}
              />
            ))}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="relative z-10"
            >
              <Trophy className="w-48 h-48 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
              <h2 className="text-7xl font-black text-white mb-2 tracking-tighter">ĐỘI CHIẾN THẮNG!</h2>
              <div className={`text-8xl font-black mb-8 ${team1.score > team2.score ? 'text-blue-400' : team2.score > team1.score ? 'text-pink-400' : 'text-yellow-400'}`}>
                {team1.score > team2.score ? 'TEAM 1' : team2.score > team1.score ? 'TEAM 2' : 'HÒA NHAU!'}
              </div>
              
              <div className="flex gap-12 justify-center mb-12">
                <div className="text-center">
                  <div className="text-blue-400 text-xl font-bold uppercase tracking-widest mb-1">Team 1</div>
                  <div className="text-5xl font-black text-white">{team1.score}</div>
                </div>
                <div className="text-center">
                  <div className="text-pink-400 text-xl font-bold uppercase tracking-widest mb-1">Team 2</div>
                  <div className="text-5xl font-black text-white">{team2.score}</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-bold text-xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-6 h-6" />
                CHƠI LẠI
              </button>
            </motion.div>
          </div>
        )}
      </main>

      {/* Controls */}
      <div className="fixed bottom-6 right-6 flex gap-3 z-50">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-4 bg-white/80 backdrop-blur shadow-lg rounded-2xl text-slate-600 hover:text-slate-900 transition-colors"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
