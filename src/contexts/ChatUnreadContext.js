import React, { createContext, useContext } from 'react';

const ChatUnreadContext = createContext(null);

export const ChatUnreadProvider = ({ children, refreshUnreadCount }) => (
	<ChatUnreadContext.Provider value={{ refreshUnreadCount }}>
		{children}
	</ChatUnreadContext.Provider>
);

export const useChatUnreadRefresh = () => {
	const ctx = useContext(ChatUnreadContext);
	return ctx?.refreshUnreadCount ?? (() => {});
};
