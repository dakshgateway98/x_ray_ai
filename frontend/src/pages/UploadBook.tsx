import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadBook } from "@/services/bookService";
import { useState } from "react";

const bookUploadSchema = z.object({
  file: z.instanceof(FileList).refine(files => files.length > 0, "A file is required."),
});

type BookUploadFormData = z.infer<typeof bookUploadSchema>;

const UploadBook = () => {
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookUploadFormData>({
    resolver: zodResolver(bookUploadSchema),
  });

  const onSubmit = async (data: BookUploadFormData) => {
    setMessage(null);
    try {
      await uploadBook(data.file[0]);
      setMessage("Book uploaded successfully!");
      reset();
    } catch (error) {
      setMessage("Failed to upload book.");
      console.error(error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Upload Medical Textbook</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">Book (PDF, DOCX, TXT)</label>
          <input type="file" id="file" {...register("file")} accept=".pdf,.docx,.txt" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>}
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Upload Book
        </button>
        {message && <p className="mt-4 text-center">{message}</p>}
      </form>
    </div>
  );
};

export default UploadBook;