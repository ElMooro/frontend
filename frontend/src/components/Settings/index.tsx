import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '../../context/ThemeContext';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Validation schema for settings
const SettingsSchema = Yup.object().shape({
  defaultTimeFrame: Yup.string()
    .oneOf(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], 'Invalid time frame')
    .required('Default time frame is required'),
  defaultCalculation: Yup.string()
    .oneOf([
      'value', 
      'period-to-period', 
      'period-to-period-percent', 
      'day-to-day', 
      'day-to-day-percent', 
      'week-to-week', 
      'week-to-week-percent', 
      'quarter-to-quarter', 
      'quarter-to-quarter-percent', 
      'year-to-year', 
      'year-to-year-percent'
    ], 'Invalid calculation type')
    .required('Default calculation is required'),
  showEvents: Yup.boolean(),
  maxDataSets: Yup.number()
    .min(1, 'Must allow at least 1 dataset')
    .max(10, 'Cannot exceed 10 datasets')
    .required('Maximum datasets is required'),
});

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const getSettings = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not found');
        }
        
        setUser(user);
        
        // Get user settings from settings table
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setSettings(data);
        } else {
          // Create default settings if they don't exist
          const defaultSettings = {
            user_id: user.id,
            default_time_frame: 'monthly',
            default_calculation: 'value',
            show_events: true,
            max_data_sets: 5,
            dashboard_widgets: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert([defaultSettings]);
          
          if (insertError) throw insertError;
          
          setSettings(defaultSettings);
        }
      } catch (error: any) {
        console.error('Error loading settings:', error);
        setError(error.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    getSettings();
  }, []);
  
  const updateSettings = async (values: any) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      if (!user) throw new Error('User not found');
      
      const updates = {
        user_id: user.id,
        default_time_frame: values.defaultTimeFrame,
        default_calculation: values.defaultCalculation,
        show_events: values.showEvents,
        max_data_sets: values.maxDataSets,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(updates);
      
      if (error) throw error;
      
      setSettings({
        ...settings,
        ...updates,
      });
      
      setSuccess('Settings updated successfully!');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      setError(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!user?.email) throw new Error('User email not found');
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings?reset=true`,
      });
      
      if (error) throw error;
      
      setSuccess('Password reset instructions have been sent to your email');
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      setError(error.message || 'Failed to send password reset instructions');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-accent dark:border-dark-accent transition-colors duration-200"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
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
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Change Password</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send a password reset link to your email</p>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover transition-colors duration-200"
                >
                  Reset Password
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Theme</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between light and dark mode</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-light-accent dark:bg-dark-accent text-white rounded hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover transition-colors duration-200"
                >
                  {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Chart Settings</h2>
          
          <Formik
            initialValues={{
              defaultTimeFrame: settings?.default_time_frame || 'monthly',
              defaultCalculation: settings?.default_calculation || 'value',
              showEvents: settings?.show_events ?? true,
              maxDataSets: settings?.max_data_sets || 5,
            }}
            validationSchema={SettingsSchema}
            onSubmit={updateSettings}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label htmlFor="defaultTimeFrame" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Time Frame
                  </label>
                  <Field
                    as="select"
                    name="defaultTimeFrame"
                    id="defaultTimeFrame"
                    className="block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-light-accent dark:focus:border-dark-accent focus:ring-light-accent dark:focus:ring-dark-accent bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Field>
                  <ErrorMessage name="defaultTimeFrame" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                </div>
                
                <div>
                  <label htmlFor="defaultCalculation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Calculation Type
                  </label>
                  <Field
                    as="select"
                    name="defaultCalculation"
                    id="defaultCalculation"
                    className="block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-light-accent dark:focus:border-dark-accent focus:ring-light-accent dark:focus:ring-dark-accent bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  >
                    <option value="value">Actual Value</option>
                    <option value="period-to-period">Period to Period Change</option>
                    <option value="period-to-period-percent">Period to Period % Change</option>
                    <option value="day-to-day">Day to Day Change</option>
                    <option value="day-to-day-percent">Day to Day % Change</option>
                    <option value="week-to-week">Week to Week Change</option>
                    <option value="week-to-week-percent">Week to Week % Change</option>
                    <option value="quarter-to-quarter">Quarter to Quarter Change</option>
                    <option value="quarter-to-quarter-percent">Quarter to Quarter % Change</option>
                    <option value="year-to-year">Year to Year Change</option>
                    <option value="year-to-year-percent">Year to Year % Change</option>
                  </Field>
                  <ErrorMessage name="defaultCalculation" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                </div>
                
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    name="showEvents"
                    id="showEvents"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showEvents" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Show historical events by default
                  </label>
                </div>
                
                <div>
                  <label htmlFor="maxDataSets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Datasets to Compare (1-10)
                  </label>
                  <Field
                    type="number"
                    name="maxDataSets"
                    id="maxDataSets"
                    min="1"
                    max="10"
                    className="block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                  />
                  <ErrorMessage name="maxDataSets" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default Settings;