export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events?: any[];
}

export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
};

export const generateMonthGrid = (year: number, month: number): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysOfPrevMonth = getDaysInMonth(year, month - 1);

    const grid: CalendarDay[] = [];
    const today = new Date();

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysOfPrevMonth - i);
        grid.push({
            date,
            isCurrentMonth: false,
            isToday: isSameDay(date, today),
        });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        grid.push({
            date,
            isCurrentMonth: true,
            isToday: isSameDay(date, today),
        });
    }

    // Next month padding
    const remainingCells = 42 - grid.length; // 6 rows * 7 columns = 42
    for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i);
        grid.push({
            date,
            isCurrentMonth: false,
            isToday: isSameDay(date, today),
        });
    }

    return grid;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
};

export const getMonthName = (monthIndex: number): string => {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
};
