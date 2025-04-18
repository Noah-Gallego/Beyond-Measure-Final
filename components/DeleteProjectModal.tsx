'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  isDeleting: boolean;
}

export default function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  isDeleting
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  // Reset the confirm text when the modal opens or closes
  useEffect(() => {
    setConfirmText('');
    setIsConfirmEnabled(false);
  }, [isOpen]);

  // Check if the confirmation text matches the project title
  useEffect(() => {
    setIsConfirmEnabled(confirmText.toLowerCase() === projectTitle.toLowerCase());
  }, [confirmText, projectTitle]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-full flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            Delete Project
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            This action cannot be undone. This will permanently delete your project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-3 text-sm text-gray-700">
            To confirm, please type the project name:
            <span className="font-medium"> {projectTitle}</span>
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type project name here..."
            className="border-gray-300 focus:border-[#3AB5E9] focus:ring-[#3AB5E9]"
            autoFocus
          />
          {confirmText && !isConfirmEnabled && (
            <p className="mt-2 text-xs text-red-500">
              The text you entered doesn't match the project name.
            </p>
          )}
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={!isConfirmEnabled || isDeleting}
            className="flex-1 gap-2"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 