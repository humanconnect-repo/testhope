"use client";
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

interface ExistingImage {
  name: string;
  path: string;
  url: string;
}

export default function ImageUpload({ onImageUploaded, currentImageUrl, className = '' }: ImageUploadProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [manualUrl, setManualUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carica le immagini esistenti quando si apre il tab
  useEffect(() => {
    if (activeTab === 'existing' && existingImages.length === 0) {
      loadExistingImages();
    }
  }, [activeTab]);

  // Aggiorna preview quando cambia currentImageUrl
  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

  const loadExistingImages = async () => {
    try {
      setLoadingImages(true);
      setError(null);

      // Lista tutti i file nella cartella predictions
      const { data, error: listError } = await supabase.storage
        .from('prediction-images')
        .list('predictions/', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        throw listError;
      }

      // Genera URL pubblici per ogni immagine
      const images: ExistingImage[] = (data || [])
        .filter((file: any) => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
        })
        .map((file: any) => {
          const path = `predictions/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('prediction-images')
            .getPublicUrl(path);
          
          return {
            name: file.name,
            path: path,
            url: publicUrl
          };
        });

      setExistingImages(images);
    } catch (error) {
      console.error('Error loading existing images:', error);
      setError('Errore nel caricamento delle immagini esistenti');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleSelectExistingImage = (imageUrl: string) => {
    setPreview(imageUrl);
    onImageUploaded(imageUrl);
    setError(null);
    setSuccess('Immagine selezionata!');
  };

  const handleManualUrl = () => {
    if (!manualUrl.trim()) {
      setError('Inserisci un URL valido');
      return;
    }

    // Validazione base URL
    try {
      new URL(manualUrl);
      setPreview(manualUrl);
      onImageUploaded(manualUrl);
      setError(null);
      setSuccess('URL immagine impostato!');
    } catch {
      setError('URL non valido');
    }
  };

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
      
      // Aggiorna la lista delle immagini esistenti
      if (activeTab === 'existing') {
        loadExistingImages();
      }
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
    setManualUrl('');
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'existing'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Scegli esistente
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Carica nuova
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'url'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Inserisci URL
          </button>
        </nav>
      </div>

      {/* Contenuto tab: Scegli esistente */}
      {activeTab === 'existing' && (
        <div className="space-y-4">
          {loadingImages ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Caricamento immagini...</span>
            </div>
          ) : existingImages.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              Nessuna immagine trovata nello storage
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                {existingImages.map((image) => (
                  <button
                    key={image.path}
                    type="button"
                    onClick={() => handleSelectExistingImage(image.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      preview === image.url
                        ? 'border-2 border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {preview === image.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={loadExistingImages}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >
                🔄 Ricarica immagini
              </button>
            </>
          )}
        </div>
      )}

      {/* Contenuto tab: Carica nuova */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>• Formato: JPG, PNG, GIF, WebP</p>
            <p>• Dimensione massima: 5MB</p>
            <p>• L'immagine verrà ridimensionata in formato quadrato</p>
          </div>
        </div>
      )}

      {/* Contenuto tab: Inserisci URL */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleManualUrl}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Usa URL
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Inserisci l'URL completo di un'immagine esistente
          </p>
        </div>
      )}

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
          {activeTab === 'upload' && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleRetryUpload}
                className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded transition-colors"
              >
                Riprova upload
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
