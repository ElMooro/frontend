import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Log Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Key is set' : 'Key is missing');

// Validation schema for login/signup
const AuthSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

// Validation schema for 2FA setup
const TwoFactorSetupSchema = Yup.object().shape({
  verificationCode: Yup.string()
    .required('Verification code is required')
    .matches(/^[0-9]{6}$/, 'Must be a 6-digit number'),
});

const Auth: React.FC = () => {
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [factorId, setFactorId] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  // Function to handle sign in
  const handleSignIn = async (values: { email: string; password: string }) => {
    try {
      setError('');
      setSuccess('');
      setEmailSent(false);
      
      console.log('Attempting to sign in with:', values.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) {
        console.error('Sign in error details:', error);
        
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again or reset your password.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
        } else {
          throw error;
        }
      }
      
      // If successful, the App component will handle the redirect
      setSuccess('Login successful!');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      console.error('Sign in error:', error);
    }
  };
  
  // Function to handle sign up
  const handleSignUp = async (values: { email: string; password: string }) => {
    try {
      setError('');
      setSuccess('');
      setEmailSent(false);
      
      console.log('Attempting to sign up with email:', values.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error('Sign up error details:', error);
        
        // Provide more user-friendly error messages for database errors
        if (error.message.includes('Database error')) {
          throw new Error('Database error when creating user. Please try again later or contact support.');
        } else {
          throw error;
        }
      }
      
      console.log('Sign up response data:', data);
      
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already registered. Please sign in instead.');
        return;
      }
      
      setEmailSent(true);
      setSuccess('Registration successful! Please check your email for the confirmation link.');
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      console.error('Sign up error:', error);
    }
  };
  
  // Function to handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      if (!resetEmail || !resetEmail.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      setSuccess('Password reset instructions have been sent to your email');
      setEmailSent(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset password instructions');
      console.error('Reset password error:', error);
    }
  };
  
  // Function to create a test user (for development purposes only)
  const createTestUser = async () => {
    try {
      setError('');
      setSuccess('');
      
      const testEmail = 'test@example.com';
      const testPassword = 'password123';
      
      // Create the test user using regular signup
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setSuccess('Test user already exists! You can sign in with test@example.com and password123');
        } else {
          throw error;
        }
      } else {
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setSuccess('Test user already exists! You can sign in with test@example.com and password123');
        } else {
          setSuccess('Test user created! Check the email for confirmation link or use the Supabase dashboard to confirm the user manually.');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create test user');
      console.error('Create test user error:', error);
    }
  };
  
  // Function to bypass authentication for development purposes
  const bypassAuth = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Create a fake session
      const fakeUser = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        role: 'authenticated',
        aud: 'authenticated',
      };
      
      // Store the fake session in localStorage to simulate a real session
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'fake-token-for-development',
          refresh_token: 'fake-refresh-token',
          user: fakeUser,
          expires_at: Date.now() + 3600000, // 1 hour from now
        },
        expiresAt: Date.now() + 3600000,
      }));
      
      // Reload the page to trigger the auth state change
      window.location.href = '/dashboard';
      
      setSuccess('Development bypass successful!');
    } catch (error: any) {
      setError(error.message || 'Failed to bypass authentication');
      console.error('Bypass auth error:', error);
    }
  };

  // Function to initiate 2FA setup
  const setupTwoFactor = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        throw error;
      }

      if (data) {
        console.log('2FA enrollment data:', data);
        setQrCodeUrl(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id); // Store the factor ID for later use
        setShowTwoFactorSetup(true);
      }
    } catch (error: any) {
      console.error('2FA setup error:', error);
      setError(error.message || 'Failed to set up two-factor authentication');
    }
  };

  // Function to verify and complete 2FA setup
  const verifyTwoFactor = async (values: { verificationCode: string }) => {
    try {
      if (!factorId) {
        throw new Error('Factor ID is missing. Please try setting up 2FA again.');
      }
      
      // First, challenge the MFA factor to get a challengeId
      const challengeResult = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });

      if (challengeResult.error) {
        throw challengeResult.error;
      }

      // Now verify with the challengeId and code
      const verifyResult = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeResult.data.id, // Use the challengeId from the challenge response
        code: values.verificationCode,
      });

      if (verifyResult.error) {
        throw verifyResult.error;
      }

      setSuccess('Two-factor authentication has been set up successfully!');
      setShowTwoFactorSetup(false);
    } catch (error: any) {
      setError(error.message || 'Failed to verify code');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-lg shadow-md p-8 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Financial Data Platform
      </h2>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 transition-colors duration-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4 transition-colors duration-200">
          {success}
        </div>
      )}

      {showTwoFactorSetup ? (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Set Up Two-Factor Authentication</h3>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
            Scan the QR code with your authenticator app (like Google Authenticator or Authy).
          </p>
          
          <div className="flex justify-center">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code for 2FA" className="w-48 h-48" />}
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded transition-colors duration-200">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all transition-colors duration-200">{secret}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">
              If you can't scan the QR code, you can manually enter this secret key in your app.
            </p>
          </div>

          <Formik
            initialValues={{ verificationCode: '' }}
            validationSchema={TwoFactorSetupSchema}
            onSubmit={verifyTwoFactor}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">
                    Verification Code
                  </label>
                  <Field
                    type="text"
                    name="verificationCode"
                    id="verificationCode"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 shadow-sm focus:border-light-accent dark:focus:border-dark-accent focus:ring-light-accent dark:focus:ring-dark-accent transition-colors duration-200"
                    placeholder="Enter the 6-digit code"
                  />
                  <ErrorMessage name="verificationCode" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400 transition-colors duration-200" />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowTwoFactorSetup(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-light-accent hover:bg-light-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-colors duration-200"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      ) : showResetPassword ? (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-center">Reset Your Password</h3>
          
          {emailSent && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">Check your email</p>
              <p className="text-sm">We've sent password reset instructions to your email address. Please check your inbox.</p>
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {emailSent && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">Check your email for the confirmation link</p>
              <p className="text-sm">We've sent a confirmation link to your email address. Please check your inbox and click the link to complete your registration.</p>
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={() => setIsSignUp(false)}
                className={`px-4 py-2 font-medium rounded-md ${!isSignUp ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`px-4 py-2 font-medium rounded-md ${isSignUp ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Sign Up
              </button>
            </div>
            
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={AuthSchema}
              onSubmit={isSignUp ? handleSignUp : handleSignIn}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="your@email.com"
                    />
                    <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Field
                      type="password"
                      name="password"
                      id="password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                  
                  {!isSignUp && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isSubmitting ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                  </button>
                </Form>
              )}
            </Formik>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={setupTwoFactor}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Set Up Two-Factor Authentication
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Enhance your account security with two-factor authentication
            </p>
            
            {/* Development helpers - remove in production */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={createTestUser}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Test User (Dev Only)
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Creates a test user with email: test@example.com and password: password123
              </p>
              
              <button
                onClick={bypassAuth}
                className="w-full mt-4 py-2 px-4 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Bypass Authentication (Dev Only)
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Skip authentication and access the dashboard directly (for development only)
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Auth;
