import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
                {
                    'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md': variant === 'primary',
                    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm': variant === 'secondary',
                    'bg-slate-900 text-white hover:bg-slate-800 shadow-sm': variant === 'dark',
                    'h-9 px-4 py-2 text-sm': size === 'sm',
                    'h-10 px-4 py-2': size === 'md',
                    'h-11 px-8 py-2 text-lg': size === 'lg',
                },
                className
            )}
            {...props}
        />
    );
});
Button.displayName = 'Button';
