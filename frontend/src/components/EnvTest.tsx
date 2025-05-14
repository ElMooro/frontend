import React from 'react';

const EnvTest: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Environment Variables Test</h2>
      <div className="space-y-2">
        <p>
          <strong>REACT_APP_SUPABASE_URL:</strong>{' '}
          {process.env.REACT_APP_SUPABASE_URL || 'Not set'}
        </p>
        <p>
          <strong>REACT_APP_SUPABASE_ANON_KEY:</strong>{' '}
          {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set'}
        </p>
        <p>
          <strong>REACT_APP_API_URL:</strong>{' '}
          {process.env.REACT_APP_API_URL || 'Not set'}
        </p>
      </div>
    </div>
  );
};

export default EnvTest;