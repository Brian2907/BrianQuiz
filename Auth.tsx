
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, Circle, ShieldAlert, ShieldCheck as ShieldOk } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Password Criteria Logic
  const criteria = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password),
    noSpace: !/\s/.test(password) && password.length > 0
  }), [password]);

  const strengthScore = useMemo(() => {
    return Object.values(criteria).filter(Boolean).length;
  }, [criteria]);

  const isPasswordValid = strengthScore === 6;

  useEffect(() => {
    if ((window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse,
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        // Fix GSI_LOGGER: width must be a numeric string
        { theme: "outline", size: "large", width: "400", shape: "pill" }
      );
    }
  }, []);

  const handleGoogleCredentialResponse = (response: any) => {
    try {
      const decoded: any = jwtDecode(response.credential);
      const googleUser: User = { id: `google_${decoded.sub}`, username: decoded.name || decoded.email.split('@')[0] };
      const usersStr = localStorage.getItem('brianquiz_users_db') || '[]';
      const users: User[] = JSON.parse(usersStr);
      if (!users.find(u => u.id === googleUser.id)) {
        users.push(googleUser);
        localStorage.setItem('brianquiz_users_db', JSON.stringify(users));
      }
      onAuthSuccess(googleUser);
    } catch (e) {
      setError("Xác thực Google thất bại!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const usersStr = localStorage.getItem('brianquiz_users_db') || '[]';
    const users: (User & { password?: string })[] = JSON.parse(usersStr);

    if (isLogin) {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) onAuthSuccess({ id: user.id, username: user.username });
      else setError('Tài khoản hoặc mật khẩu không chính xác!');
    } else {
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError('Tên người dùng đã được đăng ký độc quyền!');
        return;
      }
      if (!isPasswordValid) {
        setError('Mật khẩu chưa đạt chuẩn bảo mật Brian-Security!');
        return;
      }
      const newUser = { id: crypto.randomUUID(), username: username.trim(), password };
      users.push(newUser);
      localStorage.setItem('brianquiz_users_db', JSON.stringify(users));
      onAuthSuccess({ id: newUser.id, username: newUser.username });
    }
  };

  const getStrengthLabel = () => {
    if (strengthScore <= 2) return { text: 'YẾU', color: 'bg-red-500' };
    if (strengthScore <= 4) return { text: 'TRUNG BÌNH', color: 'bg-yellow-500' };
    if (strengthScore < 6) return { text: 'MẠNH', color: 'bg-blue-500' };
    return { text: 'TỐI ƯU', color: 'bg-green-500' };
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 transition-all duration-500 ${met ? 'text-green-500 scale-105' : 'text-slate-400 opacity-60'}`}>
      {met ? <CheckCircle2 size={16} className="animate-pulse" /> : <Circle size={16} />}
      <span className={`text-[10px] font-black uppercase tracking-widest ${met ? 'font-black' : 'font-bold'}`}>{text}</span>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-12 px-6 fade-in-up">
      <div className="bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl p-10 md:p-14 border-8 border-white dark:border-slate-700 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 via-green-500 to-emerald-500 animate-pulse"></div>
        
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black mb-10 border-2 border-green-100 dark:border-green-800 uppercase tracking-widest shadow-sm">
          <ShieldCheck size={14} className="animate-pulse" /> Brian Identity Engine v4.0
        </div>
        
        <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase leading-none">{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
        <p className="text-slate-400 font-bold mb-12 uppercase tracking-[0.3em] text-[10px] italic">Bảo mật đa tầng • Đồng bộ đám mây</p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left mb-10">
          <div className="relative group">
            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-all group-focus-within:scale-125" size={24} />
            <input 
              type="text" placeholder="Tên người dùng độc quyền"
              className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2.5rem] text-xl font-bold outline-none transition-all dark:text-white shadow-inner"
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-4">
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-all group-focus-within:scale-125" size={24} />
              <input 
                type={showPassword ? "text" : "password"} placeholder="Mật khẩu bảo mật"
                className="w-full pl-16 pr-20 py-6 bg-slate-50 dark:bg-slate-900 border-4 border-transparent focus:border-green-500 rounded-[2.5rem] text-xl font-bold outline-none transition-all dark:text-white shadow-inner"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-500 hover:scale-110 transition-transform">
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>

            {!isLogin && (
              <div className="px-6 space-y-4 fade-in-up">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Độ mạnh mật khẩu</span>
                    <span className={`text-[10px] font-black tracking-widest uppercase ${getStrengthLabel().color.replace('bg-', 'text-')}`}>{getStrengthLabel().text}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${getStrengthLabel().color}`} 
                      style={{ width: `${(strengthScore / 6) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                  <RequirementItem met={criteria.length} text="Tối thiểu 8 ký tự" />
                  <RequirementItem met={criteria.upper} text="Chữ cái IN HOA" />
                  <RequirementItem met={criteria.lower} text="Chữ cái thường" />
                  <RequirementItem met={criteria.number} text="Ít nhất 1 chữ số" />
                  <RequirementItem met={criteria.special} text="Ký tự đặc biệt" />
                  <RequirementItem met={criteria.noSpace} text="Không khoảng trắng" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl border-2 border-red-100 dark:border-red-900/30 text-xs font-black uppercase tracking-widest animate-shake">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <button 
            disabled={!isLogin && !isPasswordValid}
            className={`w-full py-8 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 group ${
              !isLogin && !isPasswordValid 
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed grayscale' 
                : 'bg-green-600 hover:bg-green-700 hover:-translate-y-2 hover:shadow-green-500/50'
            }`}
          >
            {isLogin ? (
              <>XÁC NHẬN TRUY CẬP <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" /></>
            ) : (
              isPasswordValid ? (
                <>KHỞI TẠO NGAY <ShieldOk size={32} className="group-hover:scale-125 transition-transform" /></>
              ) : (
                <>CHƯA ĐỦ TIÊU CHUẨN <ShieldAlert size={32} className="animate-pulse" /></>
              )
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-10">
          <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
          <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase italic">Xác Thực Cổng Google</p>
          <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
        </div>

        <div className="flex justify-center mb-10 hover:scale-[1.02] transition-transform">
          <div id="googleBtn"></div>
        </div>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-slate-500 dark:text-slate-400 font-black hover:text-green-600 transition-colors uppercase text-xs tracking-[0.2em] border-b-4 border-transparent hover:border-green-600 pb-2"
        >
          {isLogin ? 'Người dùng mới? Đăng ký tại đây' : 'Đã có tài khoản Brian? Quay lại'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
