import React, { useState } from 'react';
import { Send, CheckCircle, Snowflake } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { RSVPFormData } from '../types';

const RSVP: React.FC = () => {
  const [formData, setFormData] = useState<RSVPFormData>({
    fullName: '',
    email: '',
    attendance: null,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.email || !formData.attendance) {
      setError('Please complete all fields before submitting.');
      return;
    }

    if (!supabase) {
      setError('Supabase belum dikonfigurasi. Cek VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('rsvps').insert({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        attendance: formData.attendance,
      });

      if (insertError) {
        throw insertError;
      }

      setIsSubmitted(true);
      setFormData({ fullName: '', email: '', attendance: null });
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-700">
        <div className="bg-white p-12 rounded-2xl shadow-lg text-center max-w-md w-full border border-green-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 font-display">Thank you!</h2>
          <p className="text-gray-600 mb-8">
            Your RSVP has been successfully submitted. We look forward to seeing you!
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-primary hover:text-blue-700 font-medium hover:underline"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4 text-primary/20">
            <Snowflake size={48} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3 font-display">
            Confirm Your Attendance
          </h1>
          <p className="text-gray-500 text-lg">
            Please let us know if you'll be joining the S203 Christmas Celebration.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 space-y-8"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Student Email
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Enter your student email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 font-display">Will you be attending?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:bg-blue-50/50 ${
                  formData.attendance === 'yes'
                    ? 'border-primary bg-blue-50 ring-1 ring-primary'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <input
                  type="radio"
                  name="attendance"
                  value="yes"
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  checked={formData.attendance === 'yes'}
                  onChange={() => setFormData({ ...formData, attendance: 'yes' })}
                />
                <span className="ml-3 font-medium text-gray-900">Yes, I'll be there!</span>
              </label>

              <label
                className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                  formData.attendance === 'no'
                    ? 'border-gray-400 bg-gray-100 ring-1 ring-gray-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="attendance"
                  value="no"
                  className="w-4 h-4 text-gray-500 border-gray-300 focus:ring-gray-500"
                  checked={formData.attendance === 'no'}
                  onChange={() => setFormData({ ...formData, attendance: 'no' })}
                />
                <span className="ml-3 font-medium text-gray-700">No, I can't make it</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.fullName.trim() ||
              !formData.email.trim() ||
              !formData.attendance
            }
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transform active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit RSVP'}</span>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default RSVP;
