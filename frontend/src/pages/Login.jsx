import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets.js';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

import { FiEyeOff, FiEye } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedIn, getUserData, setUserEmail } = useContext(AppContent);
  const [state, setState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
    
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!email || !password) {
        toast.error('Please enter both email and password.');
        return;
    }

    try {
        axios.defaults.withCredentials = true;

        if (state === 'Sign Up') {
          const { data } = await axios.post(`${backendUrl}/api/auth/register`, {
            name,
            email,
            password
          });

          if (data.success) {
            setUserEmail(email); 
            setIsLoggedIn(true);
            navigate('/email-verify');
            toast.success(data.message || 'Registration successful!');
          }
        } else {
          const { data } = await axios.post(`${backendUrl}/api/auth/login`, {
            email,
            password
          });

          if (data.success) {
            setIsLoggedIn(true);
            getUserData();
            navigate('/');
            toast.success(data.message || 'Login successful!');
          }
        }
    } catch (error) {
      console.error('Error during authentication:', error);

      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (Array.isArray(errorData.message)) {
          errorData.message.forEach(err => toast.error(err.msg || err));
        } else {
          toast.error(errorData.message || 'Authentication failed');
        }
      } else {
        toast.error('Network error. Please try again.');
      }
    }
  };

  return (
      <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-plant-green-lightest to-earth-light">
          <img
              onClick={() => navigate('/dashboard')}
              src={assets.logo}
              alt="Plant Z Logo"
              className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
          />
          
          {/* Decorative plant elements */}
          <div className="absolute bottom-10 left-10 opacity-70 hidden md:block">
              <div className="animate-plant-wiggle">
                  <span className="text-6xl">🌿</span>
              </div>
          </div>
          <div className="absolute top-20 right-10 opacity-70 hidden md:block">
              <div className="animate-plant-grow">
                  <span className="text-6xl">🌱</span>
              </div>
          </div>
          
          <div className="bg-white p-10 rounded-xl shadow-lg w-full sm:w-96 text-plant-green-dark border-2 border-plant-green-light">
              <h2 className="text-3xl font-primary font-bold text-plant-green-darkest text-center mb-3">
                  {state === 'Sign Up' ? 'Create Account' : 'Login'}
              </h2>
              <p className="text-center font-secondary text-sm mb-6 text-text-secondary">
                  {state === 'Sign Up' ? 'Create your account to get started with plant care' : 'Welcome back to your plant care journey!'}
              </p>

              <form onSubmit={onSubmitHandler}>
                  {state === 'Sign Up' && (
                      <div className="mb-4 flex items-center gap-3 w-full px-5 py-3 rounded-full bg-earth-light border border-earth-medium">
                          <img src={assets.person_icon} alt="" />
                          <input
                              onChange={(e) => setName(e.target.value)}
                              value={name}
                              className="bg-transparent outline-none font-secondary w-full"
                              type="text"
                              placeholder="Full Name"
                              required
                          />
                      </div>
                  )}

                  <div className="mb-4 flex items-center gap-3 w-full px-5 py-3 rounded-full bg-earth-light border border-earth-medium">
                      <img src={assets.mail_icon} alt="" />
                      <input
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                          className="bg-transparent outline-none font-secondary w-full"
                          type="text"
                          placeholder="Email id"
                          required
                      />
                  </div>
                  <div className="mb-4">
                      <div className="flex items-center gap-3 w-full px-5 py-3 rounded-full bg-earth-light border border-earth-medium relative">
                          <img src={assets.lock_icon} alt="" />
                          <input
                              onChange={(e) => {
                                  setPassword(e.target.value);
                              }}
                              value={password}
                              className="bg-transparent outline-none font-secondary w-full"
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              required
                          />
                          <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-4 text-xl text-[#b3c0ff] rounded-full transition-all"
                              tabIndex={-1}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                              {showPassword ? <FiEye/> : <FiEyeOff/>}
                          </button>
                      </div>
                  </div>

                  {state === 'Login' && (
                      <p
                          onClick={() => navigate('/reset-password')}
                          className="mb-4 text-accent-blue-dark cursor-pointer font-secondary hover:underline"
                      >
                          Forgot password?
                      </p>
                  )}

                  <button className="w-full py-3 rounded-full bg-gradient-to-r from-plant-green-medium to-plant-green-dark text-white font-primary font-medium hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      {state}
                  </button>
              </form>

              {state === 'Sign Up' ? (
                  <p className="text-text-secondary text-center text-sm mt-4 font-secondary">
                      Already have an account?{' '}
                      <span onClick={() => setState('Login')} className="text-plant-green-dark cursor-pointer hover:underline font-semibold">
                          Login here
                      </span>
                  </p>
              ) : (
                  <p className="text-text-secondary text-center text-sm mt-4 font-secondary">
                      Don't have an account?{' '}
                      <span onClick={() => setState('Sign Up')} className="text-plant-green-dark cursor-pointer hover:underline font-semibold">
                          Sign up
                      </span>
                  </p>
              )}
              
              {/* Plant decorative element */}
              <div className="text-center mt-6 opacity-80">
                  <span className="text-2xl">🌱</span>
              </div>
          </div>
      </div>
  );
};

export default Login;
