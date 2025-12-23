
import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusCircle, ArrowRight, BrainCircuit, User as UserIcon, Moon, Sun, 
  Clock, CheckCircle, RotateCcw, Database, Edit3, Save, Trash2, 
  Home, Loader2, Sparkles, Share2, LogOut, ShieldCheck, Trophy, Users,
  ChevronLeft, AlertCircle, Download, X as CloseIcon, Copy
} from 'lucide-react';
import { AppState, QuizSession, QuizSlot, User, Participant } from './types';
import QuizEditor from './components/QuizEditor';
import QuizTake from './components/QuizTake';
import KDTreeLogo from './components/KDTreeLogo';
import Auth from './components/Auth';

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

  // Detection of Import Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');
    if (importData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(importData))));
        if (decoded && decoded.questions) {
          setPendingImport(decoded);
          // Remove param from URL to keep it clean
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Lỗi giải mã bài tập chia sẻ", e);
      }
    }

    const savedUser = localStorage.getItem('brianquiz_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setState('HOME');
    }
  }, []);

  useEffect(() => {
    const savedSlots = localStorage.getItem('brianquiz_slots');
    if (savedSlots) setSlots(JSON.parse(savedSlots));
    
    const savedTheme = localStorage.getItem('brianquiz_theme');
    if (savedTheme === 'dark') setIsDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('brianquiz_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('brianquiz_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDark = () => {
    setIsDark(!isDark);
    sounds.click();
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
        score,
        total,
        completedAt: new Date().toLocaleString('vi-VN')
      };
      setSlots(prev => prev.map(s => s.id === activeSlotId ? {
        ...s,
        participants: [newParticipant, ...s.participants].slice(0, 100)
      } : s));
    }

    let interval = setInterval(() => sounds.loading(), 1200);
    setTimeout(() => {
      clearInterval(interval);
      setState('RESULT');
      const scoreTen = Math.round((score / total) * 100) / 10;
      if (scoreTen >= 5) sounds.congrats();
      else sounds.regret();
    }, 5000);
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
    // Encode quiz data into URL
    const quizData = btoa(unescape(encodeURIComponent(JSON.stringify(slot.quiz))));
    const url = `${window.location.origin}${window.location.pathname}?import=${quizData}`;
    navigator.clipboard.writeText(url);
    alert('Đã tạo liên kết bài tập "Canva-style"! Bạn có thể gửi link này cho bất kỳ ai.');
    sounds.click();
  };

  const handleImportToSlot = (slotId: number) => {
    if (!pendingImport) return;
    const targetSlot = slots.find(s => s.id === slotId);
    if (targetSlot?.quiz && !confirm(`Slot "${targetSlot.name}" đã có bài tập. Bạn có muốn ghi đè không?`)) {
      return;
    }
    saveToSlot(slotId, pendingImport);
    setPendingImport(null);
    sounds.congrats();
    alert(`Đã nhập bài tập "${pendingImport.title}" thành công vào ${targetSlot?.name}!`);
  };

  const renderContent = () => {
    switch (state) {
      case 'AUTH':
        return <Auth onAuthSuccess={handleAuthSuccess} />;
      case 'HOME':
        return (
          <div className="max-w-4xl mx-auto py-24 px-6 fade-in-up text-center">
            <div className="flex justify-center items-center gap-4 mb-10">
              <div className="flex items-center gap-2 px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-black border border-green-200 dark:border-green-800 shadow-sm">
                <ShieldCheck size={14} /> HI, {currentUser?.username.toUpperCase()}
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black text-slate-900 dark:text-white mb-12 leading-none tracking-tighter">
              Brian<span className="text-green-600">Quiz</span><br />
              <span className="text-3xl md:text-5xl text-slate-400 tracking-widest uppercase font-light">Sáng tạo & Chia sẻ</span>
            </h1>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-20">
              <button 
                onClick={() => { sounds.click(); setQuiz({ id: crypto.randomUUID(), title: 'Đề ôn tập mới', questions: [], timeLimit: 45 }); setState('EDIT'); setActiveSlotId(null); }}
                onMouseEnter={sounds.select}
                className="group relative bg-green-600 hover:bg-green-700 text-white px-16 py-8 rounded-[3rem] font-black text-3xl shadow-2xl hover:shadow-green-500/50 hover:-translate-y-2 transition-all flex items-center gap-6"
              >
                <PlusCircle size={40} className="animate-hover-rotate" /> SOẠN ĐỀ MỚI
              </button>

              <button 
                onClick={() => { sounds.click(); setShowLibrary(!showLibrary); }}
                onMouseEnter={sounds.select}
                className="group bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-16 py-8 rounded-[3rem] font-black text-3xl shadow-xl hover:shadow-2xl border-4 border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-all flex items-center gap-6"
              >
                <Database size={36} className="text-green-600 group-hover:animate-bounce" /> {showLibrary ? 'ĐÓNG THƯ VIỆN' : 'MỞ THƯ VIỆN'}
              </button>
            </div>

            {showLibrary && (
              <div className="grid md:grid-cols-3 gap-6 fade-in-up mt-12">
                {slots.map(slot => (
                  <div key={slot.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-4 border-slate-50 dark:border-slate-700 text-left hover:border-green-500 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                       <input 
                        className="bg-transparent font-black text-xl text-slate-900 dark:text-white focus:outline-none border-b-2 border-transparent focus:border-green-500 w-full mr-4"
                        value={slot.name}
                        onChange={(e) => setSlots(prev => prev.map(s => s.id === slot.id ? {...s, name: e.target.value} : s))}
                      />
                      {slot.quiz && (
                        <div className="flex gap-2">
                          <button onClick={() => shareSlot(slot)} title="Chia sẻ Link (Canva Style)" className="text-blue-500 hover:scale-110 transition-transform p-1"><Share2 size={18} /></button>
                          <button onClick={() => { if(confirm('Xóa?')) setSlots(prev => prev.map(s => s.id === slot.id ? {...s, quiz:null, updatedAt:null, participants: []} : s)); }} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                        </div>
                      )}
                    </div>
                    {slot.quiz ? (
                      <div>
                        <p className="text-slate-400 text-[10px] font-black mb-4 uppercase tracking-widest">{slot.quiz.questions.length} CÂU • {slot.participants.length} NGƯỜI THI</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setQuiz(slot.quiz); setActiveSlotId(slot.id); setState('EDIT'); setShowLibrary(false); sounds.click(); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl font-black text-xs hover:bg-green-600 hover:text-white transition-all uppercase">Sửa</button>
                          <button onClick={() => shareSlot(slot)} className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all uppercase flex items-center gap-2"><Share2 size={14} /> Share</button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl text-slate-300 text-xs font-black uppercase tracking-widest italic">Trống</div>
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
            onShare={(s) => shareSlot(s)}
          />
        ) : null;

      case 'NAME_ENTRY':
        return (
          <div className="max-w-xl mx-auto py-24 px-6 fade-in-up text-center">
            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-12 tracking-tighter">BẮT ĐẦU DỰ THI</h2>
            <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] shadow-2xl border-4 border-slate-50 dark:border-slate-700">
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-6">Nhập tên của bạn để lưu kết quả vào Slot</p>
              <input 
                type="text"
                autoFocus
                className="w-full p-8 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2rem] text-3xl font-black text-center outline-none transition-all mb-8 shadow-inner text-slate-900 dark:text-white"
                placeholder="Họ và tên..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && userName.trim() && setState('TAKE')}
              />
              <button 
                disabled={!userName.trim()}
                onClick={() => { sounds.click(); if(userName.trim()) setState('TAKE'); }}
                className="w-full py-8 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all"
              >
                VÀO PHÒNG THI
              </button>
            </div>
          </div>
        );

      case 'TAKE':
        return quiz ? (
          <QuizTake 
            quiz={quiz}
            userName={userName}
            onFinish={handleFinish}
            onExit={() => setState(activeSlotId ? 'HOME' : 'EDIT')}
          />
        ) : null;

      case 'CALCULATING':
        return (
          <div className="max-w-2xl mx-auto py-32 px-6 text-center fade-in-up">
            <div className="relative w-56 h-56 mx-auto mb-16">
               <div className="absolute inset-0 border-[12px] border-green-100 dark:border-slate-800 rounded-full"></div>
               <div className="absolute inset-0 border-[12px] border-green-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="animate-bounce">
                  <KDTreeLogo size="md" />
                 </div>
               </div>
            </div>
            <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter uppercase">AI Đang Phân Tích...</h2>
            <div className="flex justify-center gap-3 mb-10">
              {[1,2,3,4,5,6].map(i => <div key={i} className="w-4 h-16 bg-green-500 rounded-full loading-bar" style={{animationDelay: `${i*0.15}s`}}></div>)}
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-xs animate-pulse">KD-TREE ENGINE V5.0 • MOCK ANALYSIS</p>
          </div>
        );

      case 'RESULT':
        if (!result) return null;
        const scoreTen = Math.round((result.score / result.total) * 100) / 10;
        const evalData = getEvaluation(scoreTen);
        const currentSlot = slots.find(s => s.id === activeSlotId);
        
        return (
          <div className="max-w-4xl mx-auto py-12 px-6 fade-in-up">
            <div className="bg-white dark:bg-slate-800 rounded-[5rem] shadow-2xl p-16 border-8 border-white dark:border-slate-700 text-center relative overflow-hidden transition-all mb-12">
               <div className={`absolute top-0 right-0 px-12 py-6 rounded-bl-[4rem] font-black tracking-widest text-2xl ${evalData.bg} ${evalData.color} border-b-4 border-l-4 border-white dark:border-slate-700`}>
                XẾP LOẠI: {evalData.text.toUpperCase()}
              </div>
              <div className="mt-12">
                <div className="text-[10rem] mb-12 select-none animate-bounce">{evalData.emoji}</div>
                <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-none">{userName}</h2>
                <div className="grid grid-cols-2 gap-10 mb-16">
                  <div className="p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-white dark:border-slate-700 shadow-xl">
                    <span className="block text-slate-400 font-black text-xs uppercase tracking-widest mb-6">Câu đúng</span>
                    <span className="text-7xl font-black text-green-600">{result.score}<span className="text-3xl text-slate-200 dark:text-slate-700">/{result.total}</span></span>
                  </div>
                  <div className="p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-white dark:border-slate-700 shadow-xl">
                    <span className="block text-slate-400 font-black text-xs uppercase tracking-widest mb-6">Thang điểm 10</span>
                    <span className={`text-7xl font-black ${evalData.color}`}>{scoreTen}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-8">
                  <button onClick={() => { sounds.click(); setState('HOME'); }} className="flex-1 px-12 py-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-xl">
                    <Home size={28} className="inline mr-2" /> TRANG CHỦ
                  </button>
                  <button onClick={() => { sounds.click(); setState('TAKE'); }} className="flex-1 px-12 py-8 bg-green-600 hover:bg-green-700 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-6 transform hover:-translate-y-2 group">
                    <RotateCcw size={36} className="group-hover:animate-hover-rotate" /> THI LẠI
                  </button>
                </div>
              </div>
            </div>

            {/* BẢNG VÀNG THỐNG KÊ - HIỂN THỊ CHI TIẾT */}
            {currentSlot && (
              <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl p-12 border-4 border-slate-50 dark:border-slate-700 fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="flex items-center gap-4 mb-10 pb-6 border-b dark:border-slate-700">
                  <div className="p-4 bg-yellow-500 text-white rounded-2xl shadow-lg animate-pulse"><Trophy size={24} /></div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bảng Vàng Danh Dự</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Thành tích bài thi: {currentSlot.quiz?.title}</p>
                  </div>
                </div>

                {currentSlot.participants.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin">
                    {currentSlot.participants.map((p, idx) => {
                      const pScore = Math.round((p.score / p.total) * 100) / 10;
                      const pEval = getEvaluation(pScore);
                      return (
                        <div key={p.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-transparent hover:border-green-400 transition-all group">
                          <div className="flex items-center gap-6">
                            <span className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg ${
                              idx === 0 ? 'bg-yellow-400 text-white' : 
                              idx === 1 ? 'bg-slate-300 text-slate-600' : 
                              idx === 2 ? 'bg-orange-400 text-white' : 
                              'bg-white dark:bg-slate-800 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xl font-black text-slate-800 dark:text-white group-hover:text-green-600 transition-colors">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{p.completedAt} • {currentSlot.quiz?.title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-black ${pEval.color}`}>{pScore}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.score}/{p.total} CÂU</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
                    <Database size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4 opacity-20" />
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Hãy là người đầu tiên ghi tên vào bảng vàng!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-24 selection:bg-green-500 selection:text-white overflow-x-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 transition-all duration-700">
        <div className="max-w-7xl mx-auto px-8 h-32 flex items-center justify-between">
          <div className="flex items-center gap-6 cursor-pointer group" onClick={() => { sounds.click(); if (currentUser) setState('HOME'); }}>
            <KDTreeLogo size="md" />
            <div className="flex flex-col">
              <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Brian<span className="text-green-600">Quiz</span></span>
              <span className="text-[10px] font-black text-slate-400 tracking-[0.6em] uppercase mt-1">KD-Tree Edition</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {state !== 'HOME' && state !== 'AUTH' && (
              <button 
                onClick={() => { sounds.click(); setState('HOME'); }}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 border-transparent hover:border-green-500 shadow-sm group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">MENU CHÍNH</span>
              </button>
            )}

            <button onClick={toggleDark} className="w-16 h-16 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 rounded-[2rem] transition-all hover:scale-110 border-4 border-white dark:border-slate-700 shadow-sm relative overflow-hidden group">
               <div className={`transition-transform duration-500 ${isDark ? 'rotate-[360deg] scale-0' : 'rotate-0 scale-100'}`}><Moon size={32} /></div>
               <div className={`absolute transition-transform duration-500 ${isDark ? 'rotate-0 scale-100' : 'rotate-[-360deg] scale-0'}`}><Sun size={32} /></div>
            </button>
          </div>
        </div>
      </nav>

      <main className="mt-16">{renderContent()}</main>

      {/* IMPORT DIALOG (CANVA STYLE) */}
      {pendingImport && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[4rem] shadow-2xl border-8 border-white dark:border-slate-700 overflow-hidden">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <Download size={48} className="animate-bounce" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">Bạn nhận được bài tập mới!</h2>
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl mb-10 border-2 border-slate-100 dark:border-slate-700">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Tên bài tập:</p>
                <p className="text-3xl font-black text-green-600 mb-4">{pendingImport.title}</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">{pendingImport.questions.length} CÂU HỎI TRONG GÓI CHIA SẺ</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest text-left px-4">Lưu vào Slot của bạn:</p>
                <div className="grid grid-cols-1 gap-4">
                  {slots.map(slot => (
                    <button 
                      key={slot.id}
                      onClick={() => handleImportToSlot(slot.id)}
                      className="group w-full p-6 bg-slate-50 dark:bg-slate-900 hover:bg-green-600 border-4 border-transparent hover:border-white transition-all rounded-[2rem] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black group-hover:text-green-600">{slot.id}</div>
                        <div className="text-left">
                          <p className="text-xl font-black text-slate-900 dark:text-white group-hover:text-white">{slot.name}</p>
                          <p className="text-[10px] font-black text-slate-400 group-hover:text-green-100 uppercase tracking-widest">{slot.quiz ? 'Có sẵn bài tập (Sẽ ghi đè)' : 'Trống - Sẵn sàng'}</p>
                        </div>
                      </div>
                      <Save className="text-slate-300 group-hover:text-white group-hover:animate-bounce" />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setPendingImport(null)}
                className="mt-10 text-slate-400 hover:text-red-500 font-black text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <CloseIcon size={16} /> HỦY NHẬP DỮ LIỆU
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-40 py-24 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 font-black text-xs tracking-[1em] uppercase">© 2024 BrianQuiz AI • Secure Cloud Slot Engine</footer>
    </div>
  );
};

export default App;
