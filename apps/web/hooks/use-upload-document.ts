import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';

// We will create this toast component in a later step.
// For now, we are setting up the logic that will use it.
// import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = 'http://localhost:8000';


const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload document.');
  }

  return response.json();
};

/**
 * A custom hook that provides a mutation function for uploading a document.
 * It uses TanStack Query's `useMutation` to handle the API call state
 * (loading, error, success) and integrates with our Zustand store and toasts.
 */
export const useUploadDocument = () => {
  const addDocument = useAppStore((state) => state.addDocument);
  // const { toast } = useToast();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (data, variables) => {
      // On success, add the document name to our global store.
      addDocument(variables.name);
      console.log('Upload successful:', data.message);
      // toast({
      //   title: 'Upload Successful',
      //   description: data.message,
      // });
    },
    onError: (error) => {
      console.error('Upload failed:', error.message);
      // toast({
      //   title: 'Upload Failed',
      //   description: error.message,
      //   variant: 'destructive',
      // });
    },
  });
};
