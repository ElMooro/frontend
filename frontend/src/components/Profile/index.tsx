import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '../../context/ThemeContext';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Validation schema for profile
const ProfileSchema = Yup.object().shape({
  fullName: Yup.string()
    .max(100, 'Name is too long')
    .required('Full name is required'),
  company: Yup.string()
    .max(100, 'Company name is too long'),
  jobTitle: Yup.string()
    .max(100, 'Job title is too long'),
});

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not found');
        }
        
        setUser(user);
        
        // Get user profile from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setProfile(data);
        } else {
          // Create a new profile if it doesn't exist
          const newProfile = {
            id: user.id,
            email: user.email,
            full_name: '',
            company: '',
            job_title: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);
          
          if (insertError) throw insertError;
          
          setProfile(newProfile);
        }
      } catch (error: any) {
        console.error('Error loading profile:', error);
        setError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, []);
  
  const updateProfile = async (values: any) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      if (!user) throw new Error('User not found');
      
      const updates = {
        id: user.id,
        full_name: values.fullName,
        company: values.company,
        job_title: values.jobTitle,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);
      
      if (error) throw error;
      
      setProfile({
        ...profile,
        ...updates,
      });
      
      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Account Information</h2>
          <p className="text-gray-600 dark:text-gray-400">Email: {user?.email}</p>
          <p className="text-gray-600 dark:text-gray-400">Account created: {new Date(user?.created_at).toLocaleDateString()}</p>
        </div>
        
        <Formik
          initialValues={{
            fullName: profile?.full_name || '',
            company: profile?.company || '',
            jobTitle: profile?.job_title || '',
          }}
          validationSchema={ProfileSchema}
          onSubmit={updateProfile}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <Field
                  type="text"
                  name="fullName"
                  id="fullName"
                  placeholder="Your full name"
                />
                <ErrorMessage name="fullName" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company (Optional)
                </label>
                <Field
                  type="text"
                  name="company"
                  id="company"
                  placeholder="Your company"
                />
                <ErrorMessage name="company" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
              </div>
              
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Title (Optional)
                </label>
                <Field
                  type="text"
                  name="jobTitle"
                  id="jobTitle"
                  placeholder="Your job title"
                />
                <ErrorMessage name="jobTitle" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Profile;