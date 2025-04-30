"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DangerZoneButtons() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleDangerAction = async (action: string) => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch(`/api/admin/update-advanced?action=${action}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => handleDangerAction('purge-cache')}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Purge Cache'}
      </Button>
      
      <Button 
        variant="outline" 
        className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => handleDangerAction('reset-settings')}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Reset Site Settings'}
      </Button>
      
      {result && (
        <div className={`p-2 mt-2 text-sm rounded ${result.success ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
          {result.message || result.error}
        </div>
      )}
    </div>
  );
} 