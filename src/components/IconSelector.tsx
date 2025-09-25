import React from 'react';
import { 
  Inbox, 
  Briefcase, 
  Home, 
  Heart, 
  Star, 
  Target, 
  BookOpen, 
  ShoppingCart, 
  Car, 
  Plane, 
  Gamepad2, 
  Music, 
  Camera, 
  Code, 
  Palette,
  Zap,
  Shield,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const iconOptions = [
  { name: 'Inbox', icon: Inbox, value: 'inbox' },
  { name: 'Work', icon: Briefcase, value: 'briefcase' },
  { name: 'Home', icon: Home, value: 'home' },
  { name: 'Heart', icon: Heart, value: 'heart' },
  { name: 'Star', icon: Star, value: 'star' },
  { name: 'Target', icon: Target, value: 'target' },
  { name: 'Book', icon: BookOpen, value: 'book' },
  { name: 'Shopping', icon: ShoppingCart, value: 'shopping' },
  { name: 'Car', icon: Car, value: 'car' },
  { name: 'Plane', icon: Plane, value: 'plane' },
  { name: 'Game', icon: Gamepad2, value: 'game' },
  { name: 'Music', icon: Music, value: 'music' },
  { name: 'Camera', icon: Camera, value: 'camera' },
  { name: 'Code', icon: Code, value: 'code' },
  { name: 'Palette', icon: Palette, value: 'palette' },
  { name: 'Zap', icon: Zap, value: 'zap' },
  { name: 'Shield', icon: Shield, value: 'shield' },
  { name: 'Trophy', icon: Trophy, value: 'trophy' },
  { name: 'Lightbulb', icon: Lightbulb, value: 'lightbulb' },
];

interface IconSelectorProps {
  selectedIcon?: string;
  onIconSelect: (icon: string) => void;
}

export function IconSelector({ selectedIcon, onIconSelect }: IconSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
      {iconOptions.map((option) => {
        const IconComponent = option.icon;
        return (
          <Button
            key={option.value}
            variant={selectedIcon === option.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-12 w-12 p-0 flex items-center justify-center',
              selectedIcon === option.value 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            )}
            onClick={() => onIconSelect(option.value)}
            title={option.name}
          >
            <IconComponent className="h-5 w-5" />
          </Button>
        );
      })}
    </div>
  );
}