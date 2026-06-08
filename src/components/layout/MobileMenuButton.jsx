import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

export default function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed top-4 right-4 z-40 lg:hidden p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[260px] p-0 border-l">
        <div onClick={() => setIsOpen(false)}>
          <Sidebar isMobileSheet={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
}