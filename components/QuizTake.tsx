
import React, { useState, useEffect, useCallback } from 'react';
import { QuizSession, QuestionType } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Timer, Check, X, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import KDTreeLogo from './KDTreeLogo';

interface QuizTakeProps {
  quiz: QuizSession;
  userName: string;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}

const QuizTake: React.FC<QuizTakeProps> = ({ quiz, userName, onFinish, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState((quiz.timeLimit || 45) * 60);
  
  const currentQuestion = quiz.questions[currentIndex];
  const isAnswered = answers.hasOwnProperty(currentQuestion.id);

  const playTone = useCallback((freqs: number[], type: OscillatorType = 'sine', duration = 0.2, volume = 0.05) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(volume, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + duration);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + duration);
      });
    } catch(e) {}
  }, [soundEnabled]);

  useEffect(() => {
    if (timeLeft <= 0) { onFinish(0, quiz.questions.length); return; }
    
    // Âm thanh khẩn cấp khi dưới 5 phút
    if (timeLeft <= 300 && timeLeft % 10 === 0) {
      playTone([1000], 'sine', 0.05, 0.1);
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelect = (answer: string) => {
    if (isAnswered) return;
    setAnswers({ ...answers, [currentQuestion.id]: answer });
    if (answer === currentQuestion.correctAnswer) {
      playTone([523.25, 659.25], 'sine', 0.3); // Correct
    } else {
      playTone([110], 'sawtooth', 0.3, 0.03); // Wrong
    }
  };

  const getOptionStatusClass = (label: string) => {
    if (!isAnswered) return 'border-slate-100 dark:border-slate-700 option-btn';
    const selectedAnswer = answers[currentQuestion.id];
    const isCorrect = label === currentQuestion.correctAnswer;
    const isUserChoice = label === selectedAnswer;
    if (isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-900/30 ring-4 ring-green-100 dark:ring-green-900/50 scale-105 z-10';
    if (isUserChoice && !isCorrect) return 'border-red-500 bg-red-50 dark:bg-red-900/30 ring-4 ring-red-100 dark:ring-red-900/50';
    return 'border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in-up">
      <div className="flex items-center justify-between mb-12">
        <button onClick={onExit} onMouseEnter={() => playTone([440])} className="text-slate-500 hover:text-red-500 transition-all font-black bg-white dark:bg-slate-800 px-8 py-4 rounded-[1.5rem] shadow-xl border-4 border-slate-50 dark:border-slate-700 group">
          <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex-1 flex flex-col items-center px-6">
          <div className="mb-4"><KDTreeLogo size="sm" /></div>
          <div className={`inline-flex items-center gap-4 px-10 py-4 rounded-full font-black text-3xl mb-3 border-4 transition-all ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white dark:bg-slate-800 dark:text-white border-slate-50 dark:border-slate-700 shadow-2xl'}`}>
            <Timer size={36} className={timeLeft < 300 ? 'animate-spin' : ''} /> {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
          </div>
          <div className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">CÂU {currentIndex + 1} / {quiz.questions.length} • {userName}</div>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-6 rounded-[1.5rem] bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-700 text-slate-400 hover:scale-110 shadow-xl transition-all">
          {soundEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl overflow-hidden border-8 border-white dark:border-slate-700">
        <div className="h-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }} />
        </div>
        <div className="p-12 md:p-20">
          <div className="mb-16">
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">{currentQuestion.questionText}</h3>
          </div>
          <div className="space-y-6 mb-20">
            {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options?.map((option, i) => {
              const label = ['A', 'B', 'C', 'D'][i];
              return (
                <button key={label} disabled={isAnswered} onClick={() => handleSelect(label)} onMouseEnter={() => !isAnswered && playTone([440])} className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border-4 text-left shadow-lg group ${getOptionStatusClass(label)}`}>
                  <div className="flex items-center gap-8">
                    <span className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-2xl ${answers[currentQuestion.id] === label ? 'bg-green-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>{label}</span>
                    <span className="text-2xl font-bold">{option}</span>
                  </div>
                  {isAnswered && (label === currentQuestion.correctAnswer ? <Check className="text-green-600 animate-bounce" size={40} strokeWidth={4} /> : answers[currentQuestion.id] === label && <X className="text-red-600" size={40} strokeWidth={4} />)}
                </button>
              );
            })}
            {currentQuestion.type === QuestionType.TRUE_FALSE && (
              <div className="grid grid-cols-2 gap-8">
                {['True', 'False'].map(val => (
                  <button key={val} disabled={isAnswered} onClick={() => handleSelect(val)} onMouseEnter={() => !isAnswered && playTone([440])} className={`p-16 rounded-[4rem] border-4 text-center group ${getOptionStatusClass(val)}`}>
                    <span className="text-4xl font-black">{val === 'True' ? 'ĐÚNG' : 'SAI'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-12 border-t-4 border-slate-50 dark:border-slate-700">
            {isAnswered && (
              currentIndex < quiz.questions.length - 1 ? (
                <button onClick={() => { playTone([880]); setCurrentIndex(prev => prev + 1); }} className="px-16 py-8 bg-green-600 text-white rounded-[2.5rem] font-black text-3xl shadow-xl flex items-center gap-4 group">TIẾP THEO <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" /></button>
              ) : (
                <button onClick={() => { playTone([880]); onFinish(Object.keys(answers).filter(k => answers[k] === quiz.questions.find(q => q.id === k)?.correctAnswer).length, quiz.questions.length); }} className="px-16 py-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-xl flex items-center gap-4 group">NỘP BÀI <CheckCircle size={32} className="group-hover:animate-hover-rotate" /></button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
