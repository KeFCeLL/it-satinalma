import React, { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Ara...", ...props }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-8 w-full"
        {...props}
      />
    </div>
  );
} 