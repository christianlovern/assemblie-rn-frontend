import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from 'react';
import { createThemedStyles } from '../shared/styles/globalStyles';
import { lightenColor } from '../shared/helper/colorFixer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themes = {
	lightened: (organization) => ({
		primary: organization?.primaryColor || '#2f3131',
		secondary: organization?.secondaryColor || '#4b95a3',
		accent: organization?.accentColor || '#9D94E8',
		accentText: organization?.accentColor || '#666563',
		bottomAppBar: '#F8F8F8',
		scaffoldBackground: '#F5F5F5',
		warning: '#AD4343',
		divider: organization?.accentColor || '#CCCCCC',
		cardBackground: '#FFFFFF',
		textWhite: '#FFFFFF',
		lightPurple: '#867fcd',
		buttons: {
			primary: {
				background: organization?.primaryColor || '#2f3131',
				text: '#FFFFFF',
				border: 'transparent',
			},
			secondary: {
				background: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: 'transparent',
			},
			hollow: {
				background: organization?.secondaryColor || '#4b95a3',
				text: 'white',
				border: organization?.primaryColor || '#2f3131',
			},
			gradient: {
				from: organization?.primaryColor || '#2f3131',
				to: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: organization?.primaryColor || '#2f3131',
			},
		},
		backgrounds: {
			main: {
				type: 'gradient',
				from: organization?.primaryColor || '#2f3131',
				to: lightenColor(organization?.primaryColor || '#2f3131', 15),
			},
		},
	}),
	default: (organization) => ({
		primary: organization?.primaryColor || '#2f3131',
		secondary: organization?.secondaryColor || '#4b95a3',
		accent: organization?.accentColor || '#9D94E8',
		accentText: organization?.accentColor || '#666563',
		bottomAppBar: '#F8F8F8',
		scaffoldBackground: '#F5F5F5',
		warning: '#AD4343',
		divider: organization?.accentColor || '#CCCCCC',
		cardBackground: '#FFFFFF',
		textWhite: '#FFFFFF',
		lightPurple: '#867fcd',
		buttons: {
			primary: {
				background: lightenColor(
					organization?.primaryColor || '#2f3131',
					15
				),
				text: '#FFFFFF',
				border: organization?.primaryColor || '#2f3131',
			},
			secondary: {
				background: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: 'transparent',
				border: organization?.primaryColor || '#2f3131',
			},
			hollow: {
				background: 'transparent',
				text: 'white',
				border: organization?.secondaryColor || '#4b95a3',
			},

			gradient: {
				from: lightenColor(organization?.primaryColor || '#2f3131', 15),
				to: lightenColor(organization?.secondaryColor || '#4b95a3', 15),
				text: '#FFFFFF',
			},
		},
		backgrounds: {
			main: {
				type: 'gradient',
				from: organization?.primaryColor || '#2f3131',
				to: lightenColor(organization?.primaryColor || '#2f3131', 15),
			},
		},
	}),
	// Add your new theme here
	accentDivider: (organization) => ({
		primary: organization?.primaryColor || '#2f3131',
		secondary: organization?.secondaryColor || '#4b95a3',
		accent: organization?.accentColor || '#9D94E8',
		accentText: organization?.accentColor || '#666563',
		bottomAppBar: '#F8F8F8',
		scaffoldBackground: '#F5F5F5',
		warning: '#AD4343',
		divider: organization?.accentColor || '#9D94E8', // Uses accent color for divider
		cardBackground: '#FFFFFF',
		textWhite: '#FFFFFF',
		lightPurple: '#867fcd',
		buttons: {
			primary: {
				background: organization?.primaryColor || '#2f3131',
				text: '#FFFFFF',
				border: organization?.accentColor || '#9D94E8',
			},
			secondary: {
				background: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: organization?.accentColor || '#9D94E8',
			},
			hollow: {
				background: 'transparent',
				text: organization?.accentColor || '#9D94E8',
				border: organization?.accentColor || '#9D94E8',
			},
			gradient: {
				from: organization?.primaryColor || '#2f3131',
				to: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: organization?.accentColor || '#9D94E8',
			},
		},
		backgrounds: {
			main: {
				type: 'gradient',
				from: organization?.primaryColor || '#2f3131',
				to: lightenColor(organization?.primaryColor || '#2f3131', 15),
			},
		},
	}),
	// Add more themes as needed
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children, initialTheme = 'default' }) => {
	const [currentTheme, setCurrentTheme] = useState(initialTheme);
	const [organization, setOrganization] = useState(null);
	const [colorMode, setColorMode] = useState('dark'); // 'light' or 'dark'

	// Load color mode from storage on mount
	useEffect(() => {
		const loadColorMode = async () => {
			try {
				const savedMode = await AsyncStorage.getItem('colorMode');
				if (savedMode) {
					setColorMode(savedMode);
				}
			} catch (error) {
				console.error('Error loading color mode:', error);
			}
		};
		loadColorMode();
	}, []);

	// Save color mode to storage when it changes
	const toggleColorMode = useCallback(async () => {
		const newMode = colorMode === 'light' ? 'dark' : 'light';
		setColorMode(newMode);
		try {
			await AsyncStorage.setItem('colorMode', newMode);
		} catch (error) {
			console.error('Error saving color mode:', error);
		}
	}, [colorMode]);

	useEffect(() => {
		console.log('Current theme:', currentTheme);
		console.log('Organization data:', organization);
		console.log('Color mode:', colorMode);
	}, [currentTheme, organization, colorMode]);

	const updateTheme = useCallback((newOrganization) => {
		console.log('updateTheme called with:', newOrganization);
		if (!newOrganization) {
			console.log('Resetting theme to default');
			setOrganization(null);
			setCurrentTheme('default');
			return;
		}

		// Handle primary-light theme mapping
		let themeName = newOrganization?.theme || 'default';
		themeName = themeName === 'primary-light' ? 'lightened' : themeName;

		// Update the organization and theme
		setOrganization(newOrganization);
		setCurrentTheme(themeName);
	}, []);

	// Generate colors based on theme and color mode
	const baseColors = themes[currentTheme]?.(organization) || {};
	
	// Define mode-based colors
	const modeColors = {
		background: colorMode === 'light' ? '#EaE0C8' : '#10192b',
		text: colorMode === 'light' ? '#000000' : '#FFFFFF',
		textSecondary: colorMode === 'light' ? '#666666' : '#CCCCCC',
		cardBackground: colorMode === 'light' ? '#FFFFFF' : '#1a2332',
		border: colorMode === 'light' ? '#E0E0E0' : '#2a3441',
	};

	// Merge base colors with mode colors
	const colors = {
		...baseColors,
		...modeColors,
		// Override background to use mode-based color
		background: modeColors.background,
		// Use organization primary for buttons/highlights
		primary: organization?.primaryColor || '#2f3131',
		secondary: organization?.secondaryColor || '#4b95a3',
		// Update button colors to use primary
		buttons: {
			primary: {
				background: organization?.primaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: 'transparent',
			},
			secondary: {
				background: organization?.secondaryColor || '#2f3131',
				text: '#FFFFFF',
				border: 'transparent',
			},
			hollow: {
				background: 'transparent',
				text: organization?.primaryColor || '#4b95a3',
				border: organization?.primaryColor || '#4b95a3',
			},
			gradient: {
				from: organization?.primaryColor || '#4b95a3',
				to: organization?.secondaryColor || '#2f3131',
				text: '#FFFFFF',
			},
		},
	};

	console.log('Theme generation:', {
		currentTheme,
		colorMode,
		organizationIsNull: organization === null,
		generatedColors: colors,
	});

	const value = {
		theme: currentTheme,
		updateTheme,
		colors,
		organization,
		colorMode,
		toggleColorMode,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
