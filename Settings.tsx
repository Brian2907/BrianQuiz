
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  User as UserIcon, ChevronLeft, Save, Upload, AlertCircle
} from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdate: (user: User) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate, onBack }) => {
  const [editedUser, setEditedUser] = useState<User>(user);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = JSON.stringify(user) !== JSON.stringify(editedUser);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser({ ...editedUser, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const usersStr = localStorage.getItem('brianquiz_users_db') || '[]';
    const users: User[] = JSON.parse(usersStr);
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, ...editedUser } : u);
    localStorage.setItem('brianquiz_users_db', JSON.stringify(updatedUsers));
    
    onUpdate(editedUser);
    onBack();
  };

  const handleBackAttempt = () => {
    if (hasChanges) {
      setShowExitWarning(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 fade-in-up">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={handleBackAttempt}
          className="flex items-center gap-4 px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 hover:text-green-600 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl border-4 border-slate-50 dark:border-slate-700 hover-lift transition-all"
        >
          <ChevronLeft size={24} /> QUAY LẠI
        </button>
        <div className="text-right">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Cài Đặt Hệ Thống</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">BrianQuiz Core Engine</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[4rem] shadow-2xl border-8 border-white dark:border-slate-700 text-center relative group overflow-hidden">
            <div className="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mb-8 border-8 border-green-500 relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
              {editedUser.avatar ? (
                <img src={editedUser.avatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <UserIcon size={80} className="text-slate-300" />
              )}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload size={32} className="text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate mb-2">{editedUser.username}</h3>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[5rem] shadow-2xl border-8 border-white dark:border-slate-700">
            <div className="space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest px-4 border-l-4 border-blue-500">
                  <UserIcon size={18} /> Thông tin định danh
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Họ và Tên</label>
                    <input 
                      type="text" 
                      className="w-full pl-8 pr-8 py-6 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2rem] font-black text-lg outline-none dark:text-white shadow-inner" 
                      value={editedUser.username}
                      onChange={e => setEditedUser({...editedUser, username: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              <button 
                onClick={handleSave}
                className="w-full py-10 bg-green-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-green-700 hover:-translate-y-2 transition-all flex items-center justify-center gap-6 group"
              >
                <Save size={32} className="group-hover:animate-bounce" /> LƯU THAY ĐỔI CÀI ĐẶT
              </button>
            </div>
          </div>
        </div>
      </div>

      {showExitWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-3xl border-8 border-orange-100 dark:border-slate-700 p-10 text-center animate-stack-grow">
            <AlertCircle size={60} className="mx-auto text-orange-500 mb-6 animate-bounce" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Thay đổi chưa lưu!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Bạn đã thực hiện thay đổi trong cài đặt. Bạn có chắc chắn muốn thoát mà không lưu không?</p>
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

export default Settings;
