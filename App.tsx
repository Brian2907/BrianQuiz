
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlusCircle, ArrowRight, BrainCircuit, User as UserIcon, Moon, Sun, 
  Clock, CheckCircle, RotateCcw, Database, Edit3, Save, Trash2, 
  Home, Loader2, Sparkles, Share2, LogOut, ShieldCheck, Trophy, Users,
  ChevronLeft, AlertCircle, Download, X as CloseIcon, Copy, Zap, Terminal,
  Settings as SettingsIcon, Palette
} from 'lucide-react';
import { AppState, QuizSession, QuizSlot, User, Participant } from './types';
import QuizEditor from './components/QuizEditor';
import QuizTake from './components/QuizTake';
import KDTreeLogo from './components/KDTreeLogo';
import Auth from './components/Auth';
import Settings from './components/Settings';
import Modal from './components/Modal';

const useSound = () => {
  const playTone = useCallback((freqs: number[], type: OscillatorType = 'sine', duration = 0.2, volume = 0.05) => {
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
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + duration);
      });
    } catch (e) {}
  }, []);

  return {
    click: () => playTone([880], 'sine', 0.1),
    select: () => playTone([440], 'sine', 0.05),
    correct: () => playTone([523.25, 659.25], 'sine', 0.3),
    wrong: () => playTone([110], 'sawtooth', 0.3, 0.03),
    congrats: () => playTone([523.25, 659.25, 783.99, 1046.50], 'sine', 0.6),
    regret: () => playTone([440, 523.25, 659.25], 'triangle', 0.6, 0.03),
    urgent: () => playTone([1000], 'sine', 0.05, 0.1),
    loading: () => playTone([330, 440], 'triangle', 0.4, 0.02)
  };
};

const getEvaluation = (scoreTen: number) => {
  if (scoreTen >= 9.5) return { text: 'Xuất sắc', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', emoji: '👑' };
  if (scoreTen >= 8.0) return { text: 'Giỏi', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', emoji: '🌟' };
  if (scoreTen >= 6.5) return { text: 'Khá', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', emoji: '👍' };
  if (scoreTen >= 5.0) return { text: 'Trung bình', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', emoji: '😐' };
  return { text: 'Yếu', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', emoji: '😅' };
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('AUTH');
  const [previousState, setPreviousState] = useState<AppState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quiz, setQuiz] = useState<QuizSession | null>(null);
  const [userName, setUserName] = useState('');
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [pendingImport, setPendingImport] = useState<QuizSession | null>(null);
  const [slots, setSlots] = useState<QuizSlot[]>([
    { id: 1, shareId: 's1', name: 'Slot 1', quiz: null, updatedAt: null, participants: [] },
    { id: 2, shareId: 's2', name: 'Slot 2', quiz: null, updatedAt: null, participants: [] },
    { id: 3, shareId: 's3', name: 'Slot 3', quiz: null, updatedAt: null, participants: [] },
  ]);

  const sounds = useSound();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');
    if (importData) {
      sessionStorage.setItem('brian_share_pending', importData);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedUser = localStorage.getItem('brianquiz_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const usersStr = localStorage.getItem('brianquiz_users_db') || '[]';
      const users: User[] = JSON.parse(usersStr);
      const dbUser = users.find(u => u.id === parsedUser.id);
      setCurrentUser(dbUser || parsedUser);
      setState('HOME');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const userKey = `brian_cloud_data_${currentUser.id}`;
      const savedSlots = localStorage.getItem(userKey);
      if (savedSlots) setSlots(JSON.parse(savedSlots));

      const pending = sessionStorage.getItem('brian_share_pending');
      if (pending) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(pending))));
          if (decoded && decoded.questions) {
            setPendingImport(decoded);
            sessionStorage.removeItem('brian_share_pending');
          }
        } catch (e) {}
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = `brian_cloud_data_${currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(slots));
    }
  }, [slots, currentUser]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('brianquiz_theme');
    if (savedTheme === 'dark') setIsDark(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('brianquiz_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDark = () => {
    setIsDark(!isDark);
    sounds.click();
  };

  const openSettings = () => {
    if (!currentUser || state === 'SETTINGS') return;
    sounds.click();
    setPreviousState(state);
    setState('SETTINGS');
  };

  const closeSettings = () => {
    sounds.click();
    const targetState = previousState === 'SETTINGS' ? 'HOME' : (previousState || 'HOME');
    setState(targetState);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('brianquiz_user', JSON.stringify(user));
    setState('HOME');
    sounds.congrats();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('brianquiz_user');
    setState('AUTH');
    sounds.click();
  };

  const handleFinish = (score: number, total: number) => {
    setResult({ score, total });
    setState('CALCULATING');
    
    if (activeSlotId) {
      const newParticipant: Participant = {
        id: crypto.randomUUID(),
        name: userName || "Ẩn danh",
        avatar: currentUser?.avatar,
        score,
        total,
        completedAt: new Date().toLocaleString('vi-VN')
      };
      setSlots(prev => prev.map(s => s.id === activeSlotId ? {
        ...s,
        participants: [newParticipant, ...s.participants].slice(0, 100)
      } : s));
    }

    let interval = setInterval(() => sounds.loading(), 1000);
    setTimeout(() => {
      clearInterval(interval);
      setState('RESULT');
      const scoreTen = Math.round((score / total) * 100) / 10;
      if (scoreTen >= 5) sounds.congrats();
      else sounds.regret();
    }, 4500);
  };

  const saveToSlot = (slotId: number, currentQuiz: QuizSession) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { 
      ...s, 
      quiz: { ...currentQuiz, id: currentQuiz.id || crypto.randomUUID() }, 
      updatedAt: new Date().toLocaleString('vi-VN') 
    } : s));
    setActiveSlotId(slotId);
    sounds.correct();
  };

  const shareSlot = (slot: QuizSlot) => {
    if (!slot.quiz) return;
    try {
      const quizData = btoa(unescape(encodeURIComponent(JSON.stringify(slot.quiz))));
      const url = `${window.location.origin}${window.location.pathname}?import=${quizData}`;
      navigator.clipboard.writeText(url);
      alert('Brian-share: Đã sao chép liên kết đám mây!');
      sounds.click();
    } catch (e) {}
  };

  const handleImportToSlot = (slotId: number) => {
    if (!pendingImport) return;
    saveToSlot(slotId, pendingImport);
    setPendingImport(null);
    sounds.congrats();
  };

  const renderContent = () => {
    switch (state) {
      case 'AUTH':
        return <Auth onAuthSuccess={handleAuthSuccess} />;
      case 'HOME':
        return (
          <div className="max-w-4xl mx-auto py-20 px-6 fade-in-up text-center">
            <div className="flex justify-center items-center gap-4 mb-8">
               <div className="flex items-center gap-3 px-6 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-white">
                  {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="m-1" />}
                </div>
                {currentUser?.username.toUpperCase()}
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black text-slate-900 dark:text-white mb-12 leading-none tracking-tighter">
              Brian<span className="text-green-600 animate-pulse">Quiz</span><br />
              <span className="text-2xl md:text-4xl text-slate-400 tracking-[0.4em] uppercase font-light">Infinite Cloud</span>
            </h1>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-20">
              <button 
                onClick={() => { sounds.click(); setQuiz({ id: crypto.randomUUID(), title: 'Đề ôn tập mới', questions: [], timeLimit: 45 }); setState('EDIT'); setActiveSlotId(null); }}
                className="group relative bg-green-600 hover:bg-green-700 text-white px-16 py-8 rounded-[3rem] font-black text-3xl shadow-2xl hover:shadow-green-500/50 hover:-translate-y-2 transition-all flex items-center gap-6"
              >
                <PlusCircle size={40} className="animate-hover-rotate" /> SOẠN ĐỀ
              </button>

              <button 
                onClick={() => { sounds.click(); setShowLibrary(!showLibrary); }}
                className="group bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-16 py-8 rounded-[3rem] font-black text-3xl shadow-xl hover:shadow-2xl border-4 border-slate-50 dark:border-slate-700 hover:-translate-y-2 transition-all flex items-center gap-6"
              >
                <Database size={36} className="text-green-600 group-hover:animate-bounce" /> {showLibrary ? 'ĐÓNG KHO' : 'KHO ĐỀ'}
              </button>
            </div>

            {showLibrary && (
              <div className="fade-in-up mt-12 text-left grid md:grid-cols-3 gap-6">
                {slots.map((slot, i) => (
                  <div key={slot.id} style={{animationDelay: `${i * 0.1}s`}} className="fade-in-up bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-4 border-slate-50 dark:border-slate-700 hover:border-green-500 hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <input 
                        className="bg-transparent font-black text-xl text-slate-900 dark:text-white focus:outline-none border-b-2 border-transparent focus:border-green-500 w-full"
                        value={slot.name}
                        onChange={(e) => setSlots(prev => prev.map(s => s.id === slot.id ? {...s, name: e.target.value} : s))}
                      />
                      {slot.quiz && (
                        <div className="flex gap-2">
                          <button onClick={() => shareSlot(slot)} className="text-blue-500 hover:scale-125 transition-transform p-1"><Share2 size={18} /></button>
                          <button onClick={() => setSlots(prev => prev.map(s => s.id === slot.id ? {...s, quiz:null, updatedAt:null, participants: []} : s))} className="text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 size={18} /></button>
                        </div>
                      )}
                    </div>
                    {slot.quiz ? (
                      <div className="space-y-4">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{slot.quiz.questions.length} CÂU • {slot.participants.length} THI</p>
                        <button onClick={() => { setQuiz(slot.quiz); setActiveSlotId(slot.id); setState('EDIT'); setShowLibrary(false); sounds.click(); }} className="w-full py-4 bg-slate-100 dark:bg-slate-900 rounded-2xl font-black text-xs hover:bg-green-600 hover:text-white transition-all uppercase tracking-widest">Truy cập</button>
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center border-4 border-dashed border-slate-50 dark:border-slate-700 rounded-3xl text-slate-300 text-[10px] font-black uppercase italic tracking-widest">Trống</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'EDIT':
        return quiz ? (
          <QuizEditor 
            quiz={quiz} 
            slots={slots} 
            activeSlotId={activeSlotId} 
            onSave={(updated) => setQuiz(updated)} 
            onSaveToSlot={saveToSlot} 
            onStart={() => setState('NAME_ENTRY')} 
            onShare={shareSlot}
            onBack={() => setState('HOME')}
          />
        ) : null;

      case 'SETTINGS':
        return currentUser ? <Settings user={currentUser} onUpdate={setCurrentUser} onBack={closeSettings} /> : null;

      case 'NAME_ENTRY':
        return (
          <div className="max-w-xl mx-auto py-16 px-6 space-y-8 fade-in-up text-center">
            <button 
              onClick={() => setState('EDIT')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 hover:text-green-600 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl border-4 border-slate-50 dark:border-slate-700 hover-lift transition-all group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> QUAY LẠI CHỈNH SỬA
            </button>

            <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-[4rem] shadow-2xl border-8 border-white dark:border-slate-700">
              <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter uppercase leading-none">Xác minh danh tính</h2>
              <input 
                type="text" autoFocus className="w-full p-8 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2.5rem] text-3xl font-black text-center outline-none transition-all mb-10 shadow-inner dark:text-white"
                placeholder="Tên của bạn..." value={userName} onChange={(e) => setUserName(e.target.value)}
              />
              <button disabled={!userName.trim()} onClick={() => { sounds.click(); setState('TAKE'); }} className="w-full py-8 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:-translate-y-2 hover:shadow-green-500/50 transition-all flex items-center justify-center gap-4 group">
                BẮT ĐẦI THI <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" />
              </button>
            </div>
          </div>
        );

      case 'TAKE':
        return quiz ? <QuizTake quiz={quiz} userName={userName} onFinish={handleFinish} onExit={() => setState(activeSlotId ? 'HOME' : 'EDIT')} /> : null;

      case 'CALCULATING':
        return (
          <div className="max-w-2xl mx-auto py-32 px-6 text-center fade-in-up">
            <div className="relative w-56 h-56 mx-auto mb-16">
               <div className="absolute inset-0 border-[12px] border-green-100 dark:border-slate-800 rounded-full animate-pulse"></div>
               <div className="absolute inset-0 border-[12px] border-green-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center animate-bounce-slow"><KDTreeLogo size="md" /></div>
            </div>
            <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter uppercase italic">Brian-AI Analysing...</h2>
            <div className="flex justify-center items-end gap-3 h-20">
              {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(d => (
                <div key={d} className="w-4 bg-green-500 rounded-full loading-bar" style={{animationDelay: `${d}s`}}></div>
              ))}
            </div>
          </div>
        );

      case 'RESULT':
        if (!result) return null;
        const scoreTen = Math.round((result.score / result.total) * 100) / 10;
        const evalData = getEvaluation(scoreTen);
        const currentSlot = slots.find(s => s.id === activeSlotId);
        
        return (
          <div className="max-w-4xl mx-auto py-12 px-6 fade-in-up space-y-12">
            <div className="bg-white dark:bg-slate-800 rounded-[5rem] shadow-2xl p-16 border-8 border-white dark:border-slate-700 text-center relative overflow-hidden">
               <div className={`absolute top-0 right-0 px-12 py-6 rounded-bl-[4rem] font-black text-2xl ${evalData.bg} ${evalData.color} border-b-4 border-l-4 border-white dark:border-slate-700 uppercase tracking-widest`}>{evalData.text}</div>
              <div className="mt-10">
                <div className="text-[10rem] mb-12 animate-bounce select-none">{evalData.emoji}</div>
                <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-16">{userName}</h2>
                <div className="grid grid-cols-2 gap-10 mb-16">
                  <div className="p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-white dark:border-slate-700 shadow-inner group">
                    <span className="block text-slate-400 font-black text-xs uppercase mb-4 tracking-widest">Câu đúng</span>
                    <span className="text-8xl font-black text-green-600 group-hover:scale-110 transition-transform block">{result.score}/{result.total}</span>
                  </div>
                  <div className="p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-white dark:border-slate-700 shadow-inner group">
                    <span className="block text-slate-400 font-black text-xs uppercase mb-4 tracking-widest">Điểm số</span>
                    <span className={`text-8xl font-black ${evalData.color} group-hover:scale-110 transition-transform block`}>{scoreTen}</span>
                  </div>
                </div>
                <div className="flex gap-8">
                  <button onClick={() => setState('HOME')} className="flex-1 py-8 bg-slate-100 dark:bg-slate-700 rounded-[2.5rem] font-black text-2xl hover:bg-slate-200 transition-all">TRANG CHỦ</button>
                  <button onClick={() => setState('TAKE')} className="flex-1 py-8 bg-green-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:shadow-green-500/50 hover:-translate-y-1 transition-all">THI LẠI</button>
                </div>
              </div>
            </div>

            {currentSlot && (
              <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl p-12 border-8 border-white dark:border-slate-700 fade-in-up">
                <div className="flex items-center gap-6 mb-10 pb-8 border-b-4 dark:border-slate-700">
                  <Trophy className="text-yellow-500 animate-bounce" size={40} />
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bảng Vàng Danh Dự</h3>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Đề thi: {currentSlot.quiz?.title}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {currentSlot.participants.map((p, idx) => {
                    const pScore = Math.round((p.score / p.total) * 100) / 10;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-4 border-transparent hover:border-green-400 hover:translate-x-4 transition-all group">
                        <div className="flex items-center gap-8">
                          {/* RANKED AVATAR BORDERS: No numbers, just beautiful borders */}
                          <div className={`w-20 h-20 rounded-3xl overflow-hidden border-[6px] flex items-center justify-center bg-white shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 ${
                            idx === 0 ? 'border-[#FFD700] ring-4 ring-yellow-200/50 animate-pulse' : 
                            idx === 1 ? 'border-[#C0C0C0] ring-4 ring-slate-200/50' : 
                            idx === 2 ? 'border-[#CD7F32] ring-4 ring-orange-200/50' : 'border-white dark:border-slate-700 shadow-sm'
                          }`}>
                            {p.avatar ? (
                              <img src={p.avatar} className="w-full h-full object-cover" alt={p.name} />
                            ) : (
                              <UserIcon className="text-slate-300" size={40} />
                            )}
                          </div>
                          <div>
                            <p className="text-3xl font-black text-slate-800 dark:text-white group-hover:text-green-600 transition-colors uppercase tracking-tighter">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.completedAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <p className={`text-5xl font-black ${getEvaluation(pScore).color}`}>{pScore}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl sticky top-0 z-50 border-b-4 dark:border-slate-800 h-32 flex items-center px-12 justify-between">
        <div className="flex items-center gap-6 cursor-pointer group" onClick={() => { if(currentUser) { sounds.click(); setState('HOME'); } }}>
          <KDTreeLogo size="md" />
          <div className="flex flex-col">
            <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none group-hover:text-green-600 transition-colors">Brian<span className="text-green-600 group-hover:text-slate-900 dark:group-hover:text-white">Quiz</span></span>
            <span className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase mt-1">Cloud Sync Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={openSettings} 
            disabled={!currentUser}
            title={!currentUser ? "Đăng nhập để vào cài đặt" : "Cài đặt hệ thống"}
            className={`w-16 h-16 flex items-center justify-center rounded-[2rem] shadow-sm border-4 transition-all group ${
              state === 'SETTINGS' 
              ? 'bg-green-600 border-green-500' 
              : !currentUser 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                : 'bg-slate-50 dark:bg-slate-800 border-white dark:border-slate-700 hover:scale-110'
            }`}
          >
             <SettingsIcon size={32} className={`${state === 'SETTINGS' ? 'text-white rotate-180' : 'text-slate-400 group-hover:text-green-600 group-hover:rotate-180'} transition-all duration-700`} />
          </button>
          <button onClick={toggleDark} className="w-16 h-16 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-[2rem] shadow-sm border-4 border-white dark:border-slate-700 hover:scale-110 transition-transform">
             {isDark ? <Sun size={32} className="text-yellow-400 animate-hover-rotate" /> : <Moon size={32} className="text-slate-600 animate-hover-rotate" />}
          </button>
        </div>
      </nav>

      <main className="mt-12">{renderContent()}</main>

      {pendingImport && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[4rem] shadow-2xl border-8 border-white dark:border-slate-700 p-12 text-center fade-in-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-500 animate-pulse"></div>
            <Zap size={60} className="mx-auto text-blue-500 mb-8 animate-bounce" />
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Cloud Signal Found!</h2>
            <p className="text-slate-400 font-bold text-xs mb-10 uppercase tracking-widest">Đồng bộ đề thi từ đám mây Brian-share</p>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[3rem] border-4 border-slate-100 dark:border-slate-800 mb-10 shadow-inner group">
              <p className="text-4xl font-black text-blue-600 group-hover:scale-105 transition-transform">{pendingImport.title}</p>
            </div>
            <div className="space-y-4">
              {slots.map(slot => (
                <button key={slot.id} onClick={() => handleImportToSlot(slot.id)} className="w-full p-6 bg-slate-50 dark:bg-slate-900 hover:bg-blue-600 hover:text-white border-4 border-transparent hover:border-white transition-all rounded-[2rem] flex items-center justify-between group">
                  <div className="text-left">
                    <p className="text-xl font-black">{slot.name}</p>
                    <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">{slot.quiz ? 'Ghi đè' : 'Slot trống'}</p>
                  </div>
                  <Download className="group-hover:animate-bounce" />
                </button>
              ))}
            </div>
            <button onClick={() => setPendingImport(null)} className="mt-10 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest">Hủy bỏ đồng bộ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
