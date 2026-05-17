import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// eslint-disable-next-line react-refresh/only-export-components
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md border border-transparent',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md border border-transparent',
    ghost: 'hover:bg-slate-100 text-slate-700',
  };
  const sizes = {
    default: 'h-11 px-4 py-2 text-base',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-14 px-8 text-lg font-medium',
    icon: 'h-11 w-11 flex justify-center items-center',
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export const Input = React.forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
});

export const Card = ({ className, children, ...props }) => {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
};
