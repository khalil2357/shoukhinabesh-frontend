import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-brand-onyx text-brand-cream hover:bg-brand-gold",
      secondary: "bg-brand-gold text-brand-onyx hover:bg-brand-onyx hover:text-brand-cream",
      outline: "border border-brand-onyx text-brand-onyx hover:bg-brand-onyx hover:text-brand-cream",
      ghost: "hover:bg-neutral-100 text-brand-onyx"
    };

    const sizes = {
      sm: "h-9 px-4",
      md: "h-11 px-8",
      lg: "h-14 px-10 text-sm"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
