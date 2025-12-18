"use client";

import { scanReceipt } from '@/actions/transaction';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

const ReceiptScanner = ({ onScanComplete }) => {
  const fileInputRef = useRef(null);
  const [scanReceiptLoading, setScanReceiptLoading] = useState(false);

  const handleReceiptScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setScanReceiptLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call the server action directly
      const result = await scanReceipt(formData);

      if (result) {
        onScanComplete(result);
        toast.success("Receipt scanned successfully");
      }
    } catch (error) {
      console.error("Scanning failed:", error);
      toast.error("Failed to scan receipt");
    } finally {
      setScanReceiptLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptScanner;