import api from './api';

export interface Book {
  id: number;
  filename: string;
  status: string;
}

export const uploadBook = (file: File): Promise<Book> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/books/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
}; 