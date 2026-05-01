import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) => {
  const base = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none';

  const variants = {
    primary: 'bg-brand-onyx text-brand-cream hover:bg-neutral-800 border border-brand-onyx',
    outline: 'bg-transparent text-brand-onyx border border-brand-onyx hover:bg-brand-onyx hover:text-brand-cream',
    ghost: 'bg-transparent text-neutral-600 border border-neutral-200 hover:border-neutral-400',
  };

  const sizes = {
    sm: 'px-5 py-2 text-[10px]',
    md: 'px-8 py-3 text-[11px]',
    lg: 'px-10 py-4 text-xs',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
