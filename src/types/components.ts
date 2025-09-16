import type{ Theme } from '@/types/index';

// 主题状态类型
export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// UI组件类型
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}