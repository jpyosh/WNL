import React, { useState } from 'react';
import { UploadCloud, CheckCircle, Loader2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  orderId: string;
  onUpload: (file: File) => Promise<void>;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, orderId, onUpload, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file);
      setIsSuccess(true);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />

      <div className="relative bg-brand-dark border border-white/10 w-full max-w-md p-8 text-center shadow-2xl animate-fade-in-up">
        {!isSuccess ? (
          <>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">UPLOAD RECEIPT</h2>
            <p className="text-gray-400 mb-6 text-sm">
                Order ID: <span className="font-mono text-white">{orderId}</span><br/>
                Please upload a screenshot of your payment to verify your order.
            </p>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 mb-6 hover:border-white/50 transition-colors relative">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                    <p className="text-white font-medium break-all">{file.name}</p>
                ) : (
                    <p className="text-gray-500 text-sm">Click to browse or drag file here</p>
                )}
            </div>

            <button 
                onClick={handleSubmit}
                disabled={!file || isUploading}
                className="w-full bg-white text-black py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Receipt'}
            </button>
          </>
        ) : (
          <div className="py-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">ORDER COMPLETE</h2>
            <p className="text-gray-400 mb-8">
                Your receipt has been uploaded successfully. We will process your order shortly.
            </p>
            <button 
                onClick={onClose}
                className="w-full border border-white text-white py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
                Back to Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};