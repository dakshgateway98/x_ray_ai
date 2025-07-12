import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPatient } from "@/services/patientService";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
});

type PatientFormData = z.infer<typeof patientSchema>;

const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch 
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const dateOfBirth = watch("date_of_birth");

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const onSubmit = async (data: PatientFormData) => {
    try {
      setSubmitting(true);
      await createPatient(data);
      navigate("/patients");
    } catch (error) {
      console.error("Failed to create patient", error);
      alert("Failed to create patient. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-bold">Add New Patient</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input 
                type="text" 
                id="name" 
                {...register("name")} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter patient's full name"
              />
              {errors.name && (
                <p className="text-red-600 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Date of Birth Field */}
            <div className="space-y-2">
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input 
                type="date" 
                id="date_of_birth" 
                {...register("date_of_birth")} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date_of_birth && (
                <p className="text-red-600 text-sm">{errors.date_of_birth.message}</p>
              )}
              {dateOfBirth && (
                <p className="text-sm text-gray-600">
                  Age: {calculateAge(dateOfBirth)} years old
                </p>
              )}
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select 
                id="gender" 
                {...register("gender")} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-600 text-sm">{errors.gender.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Patient...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Patient
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPatient; 