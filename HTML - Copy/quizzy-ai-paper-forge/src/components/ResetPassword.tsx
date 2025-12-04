import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeClosed } from 'lucide-react';

export const ResetPassword = () => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchParams] = useSearchParams();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract tokens from URL if present (handles email confirmation or password reset)
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const next = searchParams.get('next') || '/profile';

    if (token && type === 'recovery') {
      // This is a password reset flow
      setAccessToken(token);
      setRefreshToken(searchParams.get('refresh_token'));
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      if (accessToken && refreshToken) {
        // This is a password reset flow
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Your password has been updated successfully!',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h2>
      {message ? (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
             <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
             <div className="relative">
            <input
              id="password"
                type={showPassword? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              style={{ color: 'black' }}
              required
            />
             <button
                type="button"
                onClick={() =>  setShowPassword(!showPassword) }
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                { showPassword === true ?(
                  <Eye className="h-5 w-5 text-gray-400"   />
                ) :
                (
                  <EyeClosed className="h-5 w-5 text-gray-400"  />
                )
                }
              </button>
              </div>
          </div>
          </div>
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                style={{ color: "black" }}
                required
              />
              {/* <button
                type="button"
                onClick={() =>  setShowPassword(!showPassword) }
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                { showPassword === true ?(
                  <Eye className="h-5 w-5 text-gray-400"   />

                ) :
                (

                  <EyeClosed className="h-5 w-5 text-gray-400"  />

                )

                }
              </button> */}
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
