import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, darkMode } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(username, password);
    setLoading(false);
  };

  const roles = [
    { id: 'admin', label: 'Admin', color: 'bg-red-100', textColor: 'text-red-600', letter: 'A', darkColor: 'dark:bg-red-900', darkTextColor: 'dark:text-red-300' },
    { id: 'teacher', label: 'Teacher', color: 'bg-blue-100', textColor: 'text-blue-600', letter: 'T', darkColor: 'dark:bg-blue-900', darkTextColor: 'dark:text-blue-300' },
    { id: 'student', label: 'Student', color: 'bg-green-100', textColor: 'text-green-600', letter: 'S', darkColor: 'dark:bg-green-900', darkTextColor: 'dark:text-green-300' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-black text-gray-900 dark:text-white tracking-wide">
            DPG INSTITUTE OF TECHNOLOGY AND MANAGEMENT
          </h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Your Role
            </label>
            <div className="flex space-x-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedRole === role.id
                      ? `${role.color} ${role.darkColor} border-${role.textColor.split('-')[1]}-300 dark:border-${role.darkTextColor.split('-')[1]}-600 shadow-md`
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`w-10 h-10 ${role.color} ${role.darkColor} rounded-full flex items-center justify-center mb-2`}>
                    <span className={`${role.textColor} ${role.darkTextColor} font-bold text-sm`}>{role.letter}</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    selectedRole === role.id ? `${role.textColor} ${role.darkTextColor}` : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {role.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 dark:focus:ring-offset-gray-800"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Currently selected: <span className="font-medium capitalize text-primary-600 dark:text-primary-400">{selectedRole}</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;