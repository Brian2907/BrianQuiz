import React, { useState } from 'react';
import { Question, QuestionType, QuizSession, QuizSlot } from '../types';
import { Plus, Trash2, Save, Play, Clock, Database, ChevronDown } from 'lucide-react';

interface QuizEditorProps {
  quiz: QuizSession;
  slots: QuizSlot[];
  onSave: (updatedQuiz: QuizSession) => void;
  onSaveToSlot: (slotId: number, currentQuiz: QuizSession) => void;
  onStart: () => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, slots, onSave, onSaveToSlot, onStart }) => {
  const [editedQuiz, setEditedQuiz] = useState<QuizSession>(quiz);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

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

  const setTimeLimit = (minutes: number) => {
    setEditedQuiz({ ...editedQuiz, timeLimit: minutes });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b dark:border-slate-700 pb-8 gap-6">
        <div className="flex-1 w-full">
          <input
            type="text"
            className="w-full text-4xl font-black text-slate-800 dark:text-white bg-transparent border-none focus:outline-none focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/50 rounded-2xl px-4 transition-all"
            value={editedQuiz.title}
            onChange={(e) => setEditedQuiz({ ...editedQuiz, title: e.target.value })}
          />
          <p className="text-slate-400 dark:text-slate-500 font-bold mt-2 px-4 uppercase tracking-widest text-xs italic">Cấu hình chi tiết đề thi</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
              <Clock size={14} className="animate-pulse" /> Thời gian làm bài (Phút)
            </div>
            <div className="flex gap-2">
              {[5, 15, 45, 90, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeLimit(t)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-black transition-all ${
                    editedQuiz.timeLimit === t 
                    ? 'bg-green-600 text-white shadow-lg scale-105' 
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:border-green-400 border-2 border-transparent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <button 
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-2xl font-bold transition-all group">
                <Save size={20} className="group-hover:animate-hover-bounce" /> Lưu <ChevronDown size={16} className={`transition-transform ${showSaveMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showSaveMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 border-2 border-slate-50 dark:border-slate-800 z-50">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Chọn Slot lưu trữ</p>
                  <div className="space-y-1">
                    {slots.map(slot => (
                      <button 
                        key={slot.id}
                        onClick={() => { onSaveToSlot(slot.id, editedQuiz); setShowSaveMenu(false); }}
                        className="w-full text-left p-3 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all border border-transparent hover:border-green-200 flex items-center gap-3 group">
                        <Database size={16} className="text-green-500 group-hover:animate-bounce" />
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{slot.name}</p>
                          <p className="text-[10px] text-slate-400">{slot.quiz ? 'Ghi đè đề hiện tại' : 'Còn trống'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => { onSave(editedQuiz); onStart(); }} className="flex-1 flex items-center justify-center gap-2 px-10 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all group">
              <Play size={20} fill="currentColor" className="group-hover:animate-hover-pulse" /> Thi ngay
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {editedQuiz.questions.map((q, idx) => (
          <div key={q.id} className="p-8 border-2 border-slate-50 dark:border-slate-700 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/30 relative group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl">
            <button onClick={() => removeQuestion(q.id)} className="absolute top-6 right-6 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 group/trash">
              <Trash2 size={24} className="group-hover/trash:animate-hover-rotate" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-green-600 text-white font-black px-4 py-1.5 rounded-xl text-sm">CÂU {idx + 1}</span>
            </div>
            <textarea
              className="w-full p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900 focus:border-green-500 outline-none mb-6 min-h-[100px] font-bold text-xl text-slate-900 dark:text-white transition-all shadow-inner"
              placeholder="Nội dung câu hỏi..."
              value={q.questionText}
              onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
            />
            {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['A', 'B', 'C', 'D'].map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuestion(q.id, { correctAnswer: label })}
                      className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl border-4 transition-all shadow-sm ${
                        q.correctAnswer === label ? 'bg-green-500 border-green-500 text-white scale-110 shadow-green-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:border-green-400'
                      }`}
                    >
                      {label}
                    </button>
                    <input
                      type="text"
                      className="flex-1 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-green-500 text-slate-900 dark:text-white font-bold transition-all shadow-sm"
                      placeholder={`Đáp án ${label}...`}
                      value={q.options[i]}
                      onChange={(e) => {
                        const newOptions = [...q.options!];
                        newOptions[i] = e.target.value;
                        updateQuestion(q.id, { options: newOptions });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {q.type === QuestionType.TRUE_FALSE && (
              <div className="flex gap-6">
                {['True', 'False'].map((val) => (
                  <button
                    key={val}
                    onClick={() => updateQuestion(q.id, { correctAnswer: val })}
                    className={`flex-1 py-5 rounded-2xl font-black text-xl border-4 transition-all shadow-sm ${
                      q.correctAnswer === val ? 'bg-green-500 border-green-500 text-white scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-green-400'
                    }`}
                  >
                    {val === 'True' ? 'Đúng' : 'Sai'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 p-12 border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[3rem] flex flex-col items-center justify-center gap-8 bg-slate-50/30 dark:bg-slate-900/10">
        <h3 className="text-slate-400 dark:text-slate-500 font-black text-xl uppercase tracking-widest">Thêm câu hỏi mới</h3>
        <div className="flex flex-wrap justify-center gap-6">
          <button onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)} className="flex items-center gap-3 px-10 py-5 bg-white dark:bg-slate-800 border-2 border-green-100 dark:border-green-900 text-green-600 rounded-3xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all font-black text-lg shadow-xl group">
            <Plus size={24} className="group-hover:animate-hover-rotate" /> TRẮC NGHIỆM
          </button>
          <button onClick={() => addQuestion(QuestionType.TRUE_FALSE)} className="flex items-center gap-3 px-10 py-5 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900 text-emerald-600 rounded-3xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all font-black text-lg shadow-xl group">
            <Plus size={24} className="group-hover:animate-hover-rotate" /> ĐÚNG / SAI
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;