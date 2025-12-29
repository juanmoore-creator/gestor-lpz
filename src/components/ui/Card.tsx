import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}
        {...props}
    >
        {children}
    </div>
);
