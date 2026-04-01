import React from 'react';

function Header() {
  return (
    <header className="w-full top-0 sticky bg-surface-container-highest text-on-surface flex items-center justify-between px-6 py-6 z-50">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-3xl">menu</span>
        <h1 className="font-headline font-extrabold tracking-tight text-2xl tracking-tighter">
          Member Portal
        </h1>
      </div>
    </header>
  );
}

export default Header;
