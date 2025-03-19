import React, { createContext, useContext, useState, useCallback } from 'react';
import { createThemedStyles } from '../shared/styles/globalStyles';
import { lightenColor } from '../shared/helper/colorFixer';

const themes = {
	lightened: (organization) => ({
		primary: organization?.primaryColor || '##2f3131',
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
				background: organization?.primaryColor || '##2f3131',
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
				border: organization?.primaryColor || '##2f3131',
			},
			gradient: {
				from: organization?.primaryColor || '##2f3131',
				to: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: organization?.primaryColor || '##2f3131',
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
		primary: organization?.primaryColor || '##2f3131',
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
					organization?.primaryColor || '##2f3131',
					15
				),
				text: '#FFFFFF',
				border: organization?.primaryColor || '##2f3131',
			},
			secondary: {
				background: organization?.secondaryColor || '#4b95a3',
				text: '#FFFFFF',
				border: 'transparent',
				border: organization?.primaryColor || '##2f3131',
			},
			hollow: {
				background: 'transparent',
				text: 'white',
				border: organization?.secondaryColor || '#4b95a3',
			},

			gradient: {
				from: lightenColor(
					organization?.primaryColor || '##2f3131',
					15
				),
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
		primary: organization?.primaryColor || '##2f3131',
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
				background: organization?.primaryColor || '##2f3131',
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
				from: organization?.primaryColor || '##2f3131',
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

	const updateTheme = useCallback((newOrganization) => {
		if (!newOrganization) {
			// Reset everything to default when signing out
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

	// Generate the current theme colors using the organization data
	const colors = themes[currentTheme]?.(organization) || themes.default(null); // Pass null to get default colors

	const value = {
		theme: currentTheme,
		updateTheme,
		colors,
		organization,
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
