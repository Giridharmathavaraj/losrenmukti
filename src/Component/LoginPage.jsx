import React, { useState } from 'react';
import { useNavigate } from '@/Component/router-hooks';
import { useForm } from 'react-hook-form';
import { Lock, User } from 'lucide-react';
import './LoginPage.css';
import { getApiUrl } from '../apiConfig';

const LoginPage = ({ onLogin }) => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const onSubmit = async (formData) => {
        setApiError('');
        setIsLoading(true);

        try {
            const response = await fetch(getApiUrl('/api/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: formData.username, password: formData.password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user info to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('role', data.role);
                data.companyId && localStorage.setItem('companyId', data.companyId);
                // Call the parent handler
                if (onLogin) onLogin(data.token, data.username);
                // Redirect to dashboard
                navigate('/');
            } else {
                setApiError(data.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            setApiError('An error occurred. Please check your connection to the server.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Welcome Back</h2>
                    <p>Please enter your details to sign in</p>
                </div>

                {apiError && <div className="login-error-message">{apiError}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-wrapper">
                            <User size={20} className="input-icon" />
                            <input
                                type="text"
                                id="username"
                                placeholder="Enter your username"
                                {...register('username', { required: 'Username is required' })}
                            />
                        </div>
                        {errors.username && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.username.message}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                {...register('password', { required: 'Password is required' })}
                            />
                        </div>
                        {errors.password && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.password.message}</span>}
                    </div>

                    <button
                        type="submit"
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
