import React, { useState, useEffect } from 'react';

function MemberLogin({ onLoginSuccess }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeLIFF = async () => {
      if (!window.liff) {
        setTimeout(() => {
          if (window.liff) {
            initializeLIFF();
          } else {
            setError('LINE SDK failed to load');
            setLoading(false);
          }
        }, 1000);
        return;
      }

      const liffId = process.env.REACT_APP_LIFF_ID_PROFILE || process.env.REACT_APP_LIFF_ID;

      if (!liffId) {
        setError('System configuration error');
        setLoading(false);
        return;
      }

      try {
        await window.liff.init({ liffId });

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile();
          onLoginSuccess?.(profile);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(`LINE login failed: ${err.message}`);
        setLoading(false);
      }
    };

    initializeLIFF();
  }, [onLoginSuccess]);

  const handleLogin = () => {
    window.liff.login();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fae44b]">
        <div className="text-[#121212] text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fae44b] px-6">
        <div className="text-[#121212] text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#fae44b] font-['Plus_Jakarta_Sans']">
      <header className="w-full sticky top-0 bg-[#fae44b] text-[#121212] flex items-center justify-between px-6 py-6 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl">menu</span>
          <h1 className="font-extrabold tracking-tight text-2xl">Member Portal</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md px-6 pb-12 flex flex-col">
        <div className="relative w-full aspect-[4/5] mb-8 overflow-hidden rounded-[2.5rem] bg-[#121212]/5 shadow-[0_12px_40px_0_rgba(18,18,18,0.1)]">
          <img
            alt="Group of diverse youth smiling"
            className="w-full h-full object-cover"
            src="https://i.imgur.com/AtnfAtf.png"
          />
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#121212]/20 to-transparent"></div>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-6xl font-extrabold text-[#121212] leading-[0.85] tracking-tighter uppercase">
            WELCOME<br />BACK
          </h2>
          <p className="text-lg font-medium text-[#121212]/80 max-w-[280px] leading-snug">
            Join the energy. Your community is waiting for your next big spark.
          </p>
        </div>

        <div className="mt-auto space-y-6">
          <button
            onClick={handleLogin}
            className="bg-[#06C755] w-full py-5 rounded-full flex items-center justify-center gap-4 text-white font-bold text-lg shadow-[0_12px_30px_-5px_rgba(6,199,85,0.4)] active:scale-[0.97] transition-all hover:brightness-105"
          >
            <svg fill="currentColor" height="28" viewBox="0 0 24 24" width="28" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 10.304c0-4.579-5.383-8.304-12-8.304s-12 3.725-12 8.304c0 4.105 4.27 7.54 10.046 8.18.391.085.923.258 1.058.592.121.301.079.773.038 1.077l-.17 1.021c-.053.313-.244 1.226 1.05 0 1.294-1.226 6.981-4.111 9.516-7.039 1.607-1.802 2.461-3.621 2.461-5.431z"></path>
            </svg>
            <span>Login with LINE</span>
          </button>

          <div className="text-center px-4">
            <p className="text-[0.7rem] font-bold text-[#121212]/60 uppercase tracking-[0.15em] leading-relaxed">
              By continuing, you agree to our <br />
              <a className="underline decoration-1 underline-offset-4 text-[#121212]" href="#">Terms</a> &amp; <a className="underline decoration-1 underline-offset-4 text-[#121212]" href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </main>

      <div className="fixed -bottom-12 -right-12 w-48 h-48 bg-[#121212]/5 rounded-full pointer-events-none blur-3xl"></div>
      <div className="fixed top-1/4 -left-12 w-32 h-32 bg-white/30 rounded-full pointer-events-none blur-2xl"></div>
    </div>
  );
}

export default MemberLogin;
