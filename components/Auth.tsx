
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Sparkles } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    const usersStr = localStorage.getItem('brianquiz_users_db') || '[]';
    const users: User[] = JSON.parse(usersStr);

    if (isLogin) {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        onAuthSuccess({ id: user.id, username: user.username });
      } else {
        setError('Sai tên đăng nhập hoặc mật khẩu!');
      }
    } else {
      if (users.find(u => u.username === username)) {
        setError('Tên đăng nhập đã tồn tại!');
        return;
      }
      const newUser: User = { id: crypto.randomUUID(), username, password };
      users.push(newUser);
      localStorage.setItem('brianquiz_users_db', JSON.stringify(users));
      onAuthSuccess({ id: newUser.id, username: newUser.username });
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-6 fade-in-up">
      <div className="bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl p-12 border-8 border-white dark:border-slate-700 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black mb-8 border border-blue-100 dark:border-blue-800 uppercase tracking-widest">
          <ShieldCheck size={14} /> Hệ thống bảo mật KD-Tree
        </div>
        
        <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
          {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
        </h2>
        <p className="text-slate-400 font-bold mb-12 uppercase tracking-[0.2em] text-xs italic">Truy cập để lưu trữ & chia sẻ đề thi</p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="relative group">
            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" size={24} />
            <input 
              type="text"
              placeholder="Tên đăng nhập"
              className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2rem] text-xl font-bold outline-none transition-all dark:text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" size={24} />
            <input 
              type="password"
              placeholder="Mật khẩu"
              className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2rem] text-xl font-bold outline-none transition-all dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-center font-black text-sm uppercase animate-shake">{error}</p>}

          <button className="w-full py-8 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 group">
            {isLogin ? 'TIẾP TỤC' : 'TẠO TÀI KHOẢN'} <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></div>
          <p className="text-slate-400 font-bold text-xs">HOẶC</p>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></div>
        </div>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="mt-8 text-slate-500 dark:text-slate-400 font-black hover:text-green-600 transition-colors uppercase text-sm tracking-widest"
        >
          {isLogin ? 'Bạn chưa có tài khoản? Đăng ký ngay' : 'Bạn đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
