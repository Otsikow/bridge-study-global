import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function ImageUpload({ value, onChange, trigger, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
    },
    multiple: false,
    disabled: isUploading
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      toast.success('Image URL added');
    }
  };

  const removeImage = () => {
    onChange('');
  };

  if (trigger) {
    return (
      <div className={className}>
        {trigger}
        <input
          {...getInputProps()}
          type="file"
          accept="image/*"
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Preview */}
      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isUploading ? 'Uploading...' : isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to select a file
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WebP up to 5MB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="image-url">Or enter image URL</Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUrlSubmit();
              }
            }}
          />
          <Button
            variant="outline"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}