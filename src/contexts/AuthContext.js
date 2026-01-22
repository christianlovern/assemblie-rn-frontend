import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../../api/authService';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const token = await SecureStore.getItemAsync('userToken');
			if (token) {
				const user = await authService.getCurrentSession();
				setUser(user);
			}
		} catch (error) {
			console.error('Auth check failed:', error);
		} finally {
			setLoading(false);
		}
	};

	const login = async (email, password) => {
		const response = await authService.login(email, password);
		setUser(response.user);
		return response;
	};

	const guestLogin = async (orgPin) => {
		const response = await authService.guestLogin(orgPin);
		setUser(response.user);
		return response;
	};

	const signup = async (userData) => {
		const response = await authService.signup(userData);
		setUser(response.user);
		return response;
	};

	const logout = async () => {
		await authService.logout();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				guestLogin,
				signup,
				logout,
				isAuthenticated: !!user,
			}}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
