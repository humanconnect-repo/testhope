"use client";
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export default function ImageUpload({ onImageUploaded, currentImageUrl, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestisce la selezione di un nuovo file
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset errori e successi precedenti
    setError(null);
    setSuccess(null);
    setUploading(false);

    // Validazione file
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setUploading(true);

    // Crea preview immediato
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    uploadImage(file);
  };

  // Funzione per forzare il re-upload dello stesso file
  const handleRetryUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const uploadImage = async (file: File) => {
    try {
      // Genera nome file unico
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `predictions/${fileName}`;

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from('prediction-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('prediction-images')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      setError(null);
      setSuccess('Immagine caricata con successo!');
      console.log('✅ Immagine caricata con successo:', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Errore nel caricamento dell\'immagine. Riprova selezionando lo stesso file o un altro.');
      // Mantieni il preview per permettere retry
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview immagine */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Input file */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-white dark:bg-dark-bg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Caricamento...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {preview ? 'Cambia immagine' : 'Seleziona immagine'}
            </>
          )}
        </label>
      </div>

      {/* Messaggio di successo */}
      {success && (
        <div className="text-sm text-green-600 dark:text-green-400">
          ✅ {success}
        </div>
      )}

      {/* Messaggio di errore */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
          <div className="mt-2">
            <button
              type="button"
              onClick={handleRetryUpload}
              className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded transition-colors"
            >
              Riprova upload
            </button>
          </div>
        </div>
      )}

      {/* Istruzioni */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>• Formato: JPG, PNG, GIF, WebP</p>
        <p>• Dimensione massima: 5MB</p>
        <p>• L'immagine verrà ridimensionata in formato quadrato</p>
      </div>
    </div>
  );
}
