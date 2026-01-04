
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, Loader2, Copy, Wallet } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(''); // Clear error on new file selection
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage('');
    
    try {
      await onUpload(file);
      setIsSuccess(true);
    } catch (error) {
      console.error("Upload failed", error);
      setErrorMessage('Upload failed. Please try again or check your connection.');
      // If it's a specific Supabase error object, you might want to show error.message
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />

      <div className="relative bg-brand-dark border border-white/10 w-full max-w-lg p-8 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh] overflow-y-auto">
        {!isSuccess ? (
          <>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-wide text-white mb-2">PAYMENT & VERIFICATION</h2>
                <p className="text-gray-400 text-sm">Order ID: <span className="font-mono text-white">{orderId}</span></p>
            </div>

            {/* Payment Details Section */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-blue-400">
                    <Wallet className="w-5 h-5" />
                    <span className="font-bold tracking-wider">GCASH PAYMENT</span>
                </div>
                
                {/* QR Code */}
                <div className="bg-white p-2 rounded-lg inline-block mb-4 max-w-[200px] w-full aspect-square">
                     <img 
                        src="/GCASH.jpg" 
                        alt="GCash QR Code" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=QR+Code';
                        }}
                    />
                </div>

                <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-widest">Send Payment To</p>
                    <p className="text-xl font-bold text-white">Jan Patrick Y.</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-lg font-mono text-white/90">0961 395 8412</p>
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
                <label className="block text-xs uppercase tracking-wider text-gray-500 text-center">
                    Upload Payment Screenshot
                </label>
                
                <div className={`border-2 border-dashed rounded-lg p-6 hover:border-white/50 transition-colors relative text-center ${errorMessage ? 'border-red-500 bg-red-500/5' : 'border-white/20'}`}>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {file ? (
                        <div className="flex flex-col items-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                            <p className="text-white font-medium break-all text-sm">{file.name}</p>
                            <p className="text-gray-500 text-xs mt-1">Click to change</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
                            <p className="text-gray-500 text-sm">Click to browse or drag file here</p>
                        </div>
                    )}
                </div>

                {errorMessage && (
                  <p className="text-red-500 text-xs text-center font-bold">{errorMessage}</p>
                )}

                <button 
                    onClick={handleSubmit}
                    disabled={!file || isUploading}
                    className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                    {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Receipt'}
                </button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 tracking-tighter">ORDER RECEIVED</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
                Thank you. Your receipt has been uploaded successfully.<br/>
                We will verify your payment and ship your item soon.
            </p>
            <button 
                onClick={onClose}
                className="w-full border border-white text-white py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
                Back to Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
