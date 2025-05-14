const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key is missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Set up Supabase authentication
 */
async function setupAuth() {
  try {
    console.log('Setting up Supabase authentication...');
    
    // Enable email/password sign-in
    const { error: signInError } = await supabase.auth.admin.updateConfig({
      email_auth: {
        enabled: true
      }
    });
    
    if (signInError) {
      console.error('Error enabling email/password sign-in:', signInError);
      throw signInError;
    }
    
    console.log('Email/password sign-in enabled');
    
    // Enable 2FA
    const { error: mfaError } = await supabase.auth.admin.updateConfig({
      mfa: {
        enabled: true,
        default_required: true
      }
    });
    
    if (mfaError) {
      console.error('Error enabling 2FA:', mfaError);
      throw mfaError;
    }
    
    console.log('Two-factor authentication (2FA) enabled');
    
    // Set up email templates
    const { error: templateError } = await supabase.auth.admin.updateConfig({
      email_templates: {
        confirmation: {
          subject: 'Confirm your email for Economic Data Platform',
          content: 'Please confirm your email by clicking the following link: {{ .ConfirmationURL }}'
        },
        recovery: {
          subject: 'Reset your password for Economic Data Platform',
          content: 'Please reset your password by clicking the following link: {{ .RecoveryURL }}'
        },
        magic_link: {
          subject: 'Your magic link for Economic Data Platform',
          content: 'Please sign in by clicking the following link: {{ .MagicLinkURL }}'
        },
        invite: {
          subject: 'You have been invited to Economic Data Platform',
          content: 'You have been invited to join Economic Data Platform. Please sign up by clicking the following link: {{ .InviteURL }}'
        }
      }
    });
    
    if (templateError) {
      console.error('Error setting up email templates:', templateError);
      throw templateError;
    }
    
    console.log('Email templates set up');
    
    console.log('Supabase authentication setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Supabase authentication:', error);
    process.exit(1);
  }
}

// Run setup
setupAuth();