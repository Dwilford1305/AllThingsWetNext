'use client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {

  if (!isOpen) return null;

  const loginHref = '/api/auth/login';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
          <a href={loginHref} className="w-full">
            <Button className="w-full">
              Sign In with Auth0
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
