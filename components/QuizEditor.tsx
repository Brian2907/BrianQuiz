
import React, { useState, useMemo } from 'react';
import { Question, QuestionType, QuizSession, QuizSlot } from '../types';
import { Plus, Trash2, Save, Play, Clock, Database, ChevronDown, ChevronLeft, AlertTriangle, X, ArrowDown, AlertCircle, Sparkles } from 'lucide-react';
import { generateAIQuestions } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner.tsx';

interface QuizEditorProps {
  quiz: QuizSession;
  slots: QuizSlot[];
  activeSlotId: number | null;
  onSave: (updatedQuiz: QuizSession) => void;
  onSaveToSlot: (slotId: number, currentQuiz: QuizSession) => void;
  onStart: () => void;
  onShare: (slot: QuizSlot) => void;
  onBack: () => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, slots, activeSlotId, onSave, onSaveToSlot, onStart, onBack }) => {
  const [editedQuiz, setEditedQuiz] = useState<QuizSession>(quiz);
  const [lastSavedQuiz, setLastSavedQuiz] = useState<QuizSession>(quiz);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [slotToConfirm, setSlotToConfirm] = useState<QuizSlot | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [highlightErrors, setHighlightErrors] = useState(false);
  
  // State for AI generation
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper validation logic
  const isQuestionInvalid = (q: Question) => {
    if (q.questionText.trim() === '') return true;
    if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
      return q.options.some(opt => opt.trim() === '');
    }
    return false;
  };

  // Reactive validation state
  const validationResults = useMemo(() => {
    const hasQuestions = editedQuiz.questions.length > 0;
    const invalidQuestion = editedQuiz.questions.find(isQuestionInvalid);
    
    if (!hasQuestions) return { error: "Hệ thống chưa phát hiện câu hỏi nào. Vui lòng thêm câu hỏi trước khi bắt đầu!", type: 'EMPTY' };
    if (invalidQuestion) {
      const msg = invalidQuestion.questionText.trim() === '' 
        ? "Cảnh báo: Tồn tại câu hỏi có nội dung trống. Vui lòng kiểm tra lại!"
        : "Cảnh báo: Nội dung các phương án trả lời (ABCD) không được để trống!";
      return { error: msg, type: 'CONTENT', questionId: invalidQuestion.id };
    }
    return null;
  }, [editedQuiz]);

  const isDirty = JSON.stringify(lastSavedQuiz) !== JSON.stringify(editedQuiz);

  const handleBackAttempt = () => {
    if (isDirty) {
      setShowExitWarning(true);
    } else {
      onBack();
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      questionText: '',
      options: type === QuestionType.MULTIPLE_CHOICE ? ['', '', '', ''] : undefined,
      correctAnswer: type === QuestionType.MULTIPLE_CHOICE ? 'A' : 'True',
    };
    setEditedQuiz({ ...editedQuiz, questions: [...editedQuiz.questions, newQuestion] });
  };

  // Handler for AI question generation
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    try {
      const newQuestions = await generateAIQuestions(aiTopic);
      if (newQuestions.length > 0) {
        setEditedQuiz(prev => ({
          ...prev,
          questions: [...prev.questions, ...newQuestions]
        }));
        setAiTopic('');
      } else {
        alert("Brian-AI không thể tạo câu hỏi cho chủ đề này. Vui lòng thử lại!");
      }
    } catch (e) {
      console.error(e);
      alert("Hệ thống AI đang bận hoặc gặp lỗi kết nối!");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeQuestion = (id: string) => {
    setEditedQuiz({
      ...editedQuiz,
      questions: editedQuiz.questions.filter(q => q.id !== id)
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setEditedQuiz({
      ...editedQuiz,
      questions: editedQuiz.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    });
  };

  const handleSlotSaveAttempt = (slot: QuizSlot) => {
    if (slot.quiz) {
      setSlotToConfirm(slot);
    } else {
      onSaveToSlot(slot.id, editedQuiz);
      setLastSavedQuiz(editedQuiz);
      setShowSaveMenu(false);
    }
  };

  const confirmOverwrite = () => {
    if (slotToConfirm) {
      onSaveToSlot(slotToConfirm.id, editedQuiz);
      setLastSavedQuiz(editedQuiz);
      setSlotToConfirm(null);
      setShowSaveMenu(false);
    }
  };

  const scrollToFirstError = () => {
    if (validationResults?.questionId) {
      const element = document.getElementById(`q-${validationResults.questionId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const validateAndStart = () => {
    if (validationResults) {
      setHighlightErrors(true);
      return;
    }
    if (isDirty) {
      setShowExitWarning(true);
      return;
    }
    onSave(editedQuiz);
    onStart();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 fade-in-up relative">
      <button 
        onClick={handleBackAttempt}
        className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 hover:text-green-600 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl border-4 border-slate-50 dark:border-slate-700 hover-lift transition-all group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> QUAY LẠI MENU CHÍNH
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-8 md:p-12 border-8 border-white dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b-4 dark:border-slate-700 pb-10 gap-8">
          <div className="flex-1 w-full">
            <input
              type="text"
              className="w-full text-4xl md:text-5xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 rounded-[2rem] px-6 py-2 transition-all"
              value={editedQuiz.title}
              onChange={(e) => setEditedQuiz({ ...editedQuiz, title: e.target.value })}
            />
            <p className="text-slate-400 dark:text-slate-500 font-black mt-3 px-6 uppercase tracking-[0.3em] text-[10px] italic">Cấu hình Đề thi Đám mây</p>
          </div>
          
          <div className="flex flex-col gap-6 w-full md:w-auto">
            <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-4 border-slate-100 dark:border-slate-700 shadow-inner">
              <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <Clock size={16} className="animate-pulse" /> Thời gian (Phút)
              </div>
              <div className="flex gap-2">
                {[5, 15, 45, 90, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditedQuiz({ ...editedQuiz, timeLimit: t })}
                    className={`flex-1 px-4 py-3 rounded-2xl text-xs font-black transition-all ${
                      editedQuiz.timeLimit === t 
                      ? 'bg-green-600 text-white shadow-lg scale-110' 
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-transparent hover:border-green-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 relative">
              <div className="flex-1 relative">
                <button 
                  onClick={() => setShowSaveMenu(!showSaveMenu)}
                  className={`w-full h-full flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] font-black text-sm transition-all group border-4 shadow-md ${
                    isDirty 
                    ? 'bg-white dark:bg-slate-800 border-orange-500 text-orange-600 animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-700 border-transparent text-slate-700 dark:text-white hover:border-green-400'
                  }`}
                >
                  <Save size={20} className={isDirty ? "animate-bounce" : ""} /> {isDirty ? "LƯU NGAY" : "ĐÃ LƯU"} <ChevronDown size={18} className={`transition-transform ${showSaveMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showSaveMenu && (
                  <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] p-6 border-4 border-slate-50 dark:border-slate-800 z-50 fade-in-up">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Slot Lưu trữ</p>
                    <div className="space-y-2">
                      {slots.map(slot => (
                        <button 
                          key={slot.id} 
                          onClick={() => handleSlotSaveAttempt(slot)}
                          className="w-full text-left p-4 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-black text-xs uppercase mb-1 flex items-center gap-3 transition-all"
                        >
                          <Database size={16} className="text-green-500" />
                          <div>
                            <div>{slot.name}</div>
                            <div className="text-[9px] opacity-60 italic">{slot.quiz ? 'Ghi đè dữ liệu' : 'Slot còn trống'}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={validateAndStart} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-lg shadow-xl hover:-translate-y-1 transition-all group">
                <Play size={24} fill="currentColor" className="group-hover:scale-125 transition-transform" /> THI NGAY
              </button>
            </div>
          </div>
        </div>

        {highlightErrors && validationResults && (
          <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-[2.5rem] border-4 border-red-100 dark:border-red-900/30 animate-shake mb-10 shadow-lg relative group overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-2 bg-red-600"></div>
            <div className="flex items-center gap-5 flex-1 w-full">
              <div className="bg-red-600 p-4 rounded-2xl shadow-xl animate-pulse">
                <AlertTriangle size={36} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-2xl uppercase tracking-tighter mb-1">Cảnh báo hệ thống</h4>
                <p className="font-bold text-sm opacity-80">{validationResults.error}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              {validationResults.type === 'CONTENT' && (
                <button 
                  onClick={scrollToFirstError}
                  className="flex-1 md:flex-none px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-red-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group/scroll"
                >
                  <ArrowDown size={16} className="group-hover/scroll:translate-y-1 transition-transform" /> ĐI TỚI CÂU LỖI
                </button>
              )}
              <button onClick={() => setHighlightErrors(false)} className="p-3 hover:bg-red-200 dark:hover:bg-red-800/40 rounded-full transition-colors">
                <X size={28} />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {editedQuiz.questions.map((q, idx) => {
            const isInvalid = highlightErrors && isQuestionInvalid(q);
            return (
              <div 
                key={q.id} 
                id={`q-${q.id}`}
                className={`p-8 md:p-12 border-4 rounded-[3.5rem] bg-slate-50/50 dark:bg-slate-900/30 relative group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl ${
                  isInvalid 
                  ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.25)] dark:border-red-600 ring-4 ring-red-100 dark:ring-red-900/20' 
                  : 'border-slate-50 dark:border-slate-700'
                }`}
              >
                <button onClick={() => removeQuestion(q.id)} className="absolute top-8 right-8 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md border-2 border-slate-100 dark:border-slate-700">
                  <Trash2 size={24} />
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <span className={`${isInvalid ? 'bg-red-600' : 'bg-green-600'} text-white font-black px-6 py-2 rounded-2xl text-xs tracking-widest uppercase shadow-lg transition-colors`}>
                    CÂU {idx + 1} {isInvalid && '• LỖI NỘI DUNG'}
                  </span>
                </div>
                <textarea
                  className={`w-full p-8 bg-white dark:bg-slate-800 border-4 rounded-[2rem] outline-none mb-8 font-black text-2xl dark:text-white transition-all shadow-inner ${
                    isInvalid && q.questionText.trim() === '' 
                    ? 'border-red-300 dark:border-red-900/50 focus:border-red-500' 
                    : 'border-slate-100 dark:border-slate-700 focus:border-green-500'
                  }`}
                  placeholder="Nhập nội dung câu hỏi..."
                  value={q.questionText}
                  onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
                />
                {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {['A', 'B', 'C', 'D'].map((label, i) => {
                      const isOptionEmpty = highlightErrors && q.options![i].trim() === '';
                      return (
                        <div key={label} className="flex items-center gap-4 group/option">
                          <button
                            onClick={() => updateQuestion(q.id, { correctAnswer: label })}
                            className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-2xl border-4 transition-all shadow-sm ${
                              q.correctAnswer === label 
                              ? 'bg-green-500 border-green-500 text-white scale-110 shadow-lg' 
                              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 group-hover/option:border-green-300 group-hover/option:scale-105'
                            }`}
                          >
                            {label}
                          </button>
                          <input
                            type="text"
                            className={`flex-1 p-5 bg-white dark:bg-slate-800 border-4 rounded-2xl outline-none font-bold transition-all shadow-sm ${
                              isOptionEmpty 
                              ? 'border-red-200 dark:border-red-900/40 focus:border-red-500' 
                              : 'border-slate-100 dark:border-slate-700 focus:border-green-500'
                            } dark:text-white focus:shadow-green-100 dark:focus:shadow-green-900/10`}
                            placeholder={`Đáp án ${label}...`}
                            value={q.options[i]}
                            onChange={(e) => {
                              const newOptions = [...q.options!];
                              newOptions[i] = e.target.value;
                              updateQuestion(q.id, { options: newOptions });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === QuestionType.TRUE_FALSE && (
                  <div className="flex gap-6 animate-fade-in">
                    {['True', 'False'].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateQuestion(q.id, { correctAnswer: val })}
                        className={`flex-1 py-8 rounded-[2.5rem] font-black text-2xl border-4 transition-all shadow-md ${
                          q.correctAnswer === val ? 'bg-green-500 border-green-500 text-white scale-105 shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-green-200 hover:scale-102'
                        }`}
                      >
                        {val === 'True' ? 'ĐÚNG' : 'SAI'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-20 p-16 border-8 border-dashed border-slate-100 dark:border-slate-700 rounded-[4rem] flex flex-col items-center justify-center gap-10 bg-slate-50/30 dark:bg-slate-900/10">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Sparkles className="text-blue-500 animate-pulse" size={24} />
              <h3 className="text-slate-400 dark:text-slate-500 font-black text-2xl uppercase tracking-[0.4em] italic">Brian-AI Quiz Engine</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text"
                placeholder="Nhập chủ đề để AI soạn đề tự động..."
                className="flex-1 p-6 bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-700 rounded-[2rem] font-bold outline-none focus:border-green-500 transition-all dark:text-white"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                disabled={isGenerating}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiTopic.trim()}
                className="px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-lg shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                <Sparkles size={24} className={isGenerating ? 'animate-spin' : 'group-hover:scale-125 transition-transform'} />
                {isGenerating ? 'ĐANG SOẠN...' : 'TẠO ĐỀ AI'}
              </button>
            </div>
            {isGenerating && <LoadingSpinner />}
          </div>

          <div className="h-1 w-full max-w-md bg-slate-100 dark:bg-slate-800 rounded-full"></div>

          <h3 className="text-slate-400 dark:text-slate-500 font-black text-2xl uppercase tracking-[0.4em] italic">Thêm Thủ Công</h3>
          <div className="flex flex-wrap justify-center gap-8">
            <button 
              onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)} 
              className="relative flex items-center gap-4 px-12 py-6 bg-white dark:bg-slate-800 border-4 border-green-100 text-green-600 rounded-[2rem] hover:bg-green-50 dark:hover:bg-green-900/20 transition-all font-black text-xl shadow-2xl group hover-lift overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-6 h-6 bg-green-500 mcq-anim-a flex items-center justify-center text-[10px] text-white font-black opacity-0 transition-opacity group-hover:opacity-100 z-0">A</div>
              <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 mcq-anim-b flex items-center justify-center text-[10px] text-white font-black opacity-0 transition-opacity group-hover:opacity-100 z-0">B</div>
              <div className="absolute bottom-0 left-0 w-6 h-6 bg-green-500 mcq-anim-c flex items-center justify-center text-[10px] text-white font-black opacity-0 transition-opacity group-hover:opacity-100 z-0">C</div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 mcq-anim-d flex items-center justify-center text-[10px] text-white font-black opacity-0 transition-opacity group-hover:opacity-100 z-0">D</div>
              <Plus size={28} className="group-hover:rotate-180 transition-transform duration-500 z-10" /> 
              <span className="z-10 uppercase">Trắc Nghiệm</span>
            </button>

            <button 
              onClick={() => addQuestion(QuestionType.TRUE_FALSE)} 
              className="relative flex items-center gap-4 px-12 py-6 bg-white dark:bg-slate-800 border-4 border-emerald-100 text-emerald-600 rounded-[2rem] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all font-black text-xl shadow-2xl group hover-lift overflow-hidden"
            >
              <div className="absolute inset-0 flex pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0">
                <div className="tf-layer-green absolute left-0 top-0 h-full bg-[#22c55e] z-0"></div>
                <div className="tf-layer-red absolute right-0 top-0 h-full bg-[#ef4444] z-0"></div>
              </div>
              <Plus size={28} className="group-hover:rotate-180 transition-transform duration-500 z-10" /> 
              <span className="z-10 uppercase">Đúng / Sai</span>
            </button>
          </div>
        </div>
      </div>

      {slotToConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[4rem] shadow-3xl border-8 border-red-100 dark:border-slate-700 overflow-hidden animate-stack-grow">
            <div className="p-10 text-center">
              <AlertTriangle size={60} className="mx-auto text-red-500 mb-6 animate-bounce" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">CẢNH BÁO GHI ĐÈ</h3>
              <p className="mb-8 font-bold text-slate-500 dark:text-slate-400">Slot "{slotToConfirm.name}" hiện đang có dữ liệu. Việc ghi đè sẽ làm mất dữ liệu cũ vĩnh viễn.</p>
              <div className="flex flex-col gap-4">
                <button onClick={confirmOverwrite} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl">XÁC NHẬN GHI ĐÈ</button>
                <button onClick={() => setSlotToConfirm(null)} className="w-full py-6 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-white rounded-[2rem] font-black uppercase text-xs tracking-widest">HỦY BỎ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExitWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-3xl border-8 border-orange-100 dark:border-slate-700 p-10 text-center animate-stack-grow">
            <AlertCircle size={60} className="mx-auto text-orange-500 mb-6 animate-bounce" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Thay đổi chưa lưu!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Bạn có các thay đổi chưa được lưu vào hệ thống. Bạn có chắc chắn muốn thoát không?</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={onBack}
                className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl"
              >
                THOÁT KHÔNG LƯU
              </button>
              <button 
                onClick={() => setShowExitWarning(false)}
                className="w-full py-5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest"
              >
                QUAY LẠI CHỈNH SỬA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizEditor;
