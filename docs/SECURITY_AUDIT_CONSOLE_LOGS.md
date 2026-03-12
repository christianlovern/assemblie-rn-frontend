# Security Audit: Console Logs & Sensitive Data

**Date:** 2025-03-08  
**Scope:** Full app audit for console logs and other outputs that could leak sensitive information.

## Summary of Changes

### 1. **Authentication & Token (Critical)**
- **api/tokenStorage.js** – Removed all logs: token length, getToken null, getTokenSetAt null, removeToken, and error objects in catch blocks.
- **api/apiClient.js** – Removed refresh/ensureValidToken debug logs; removed detailed refresh-failure logs; only sign-out path remains without logging token/response.
- **context.js** – Removed all SessionRestore logs (including token substring, tokenSetAt, getCurrentSession result); removed `setUserAndToken` token log and `Auth state` log.
- **api/authService.js** – Removed getCurrentSession request/response/user logs; removed login/guest/signup/logout/verify error logs that could expose response data.
- **AuthMain.js, SignAuth.js, SignUp.js** – Removed logs of token, user data, org data, signup response, stored token, and form values (e.g. credentials). Removed commented-out passwords in SignAuth.js.

### 2. **API Routes**
- **api/announcementRoutes.js** – Stopped logging error.response.data and error.response.status.
- **api/teamRoutes.js** – Removed debugging interceptors that logged request URL/method/headers and response status/data; removed auth-header error log.
- **api/ministryRoutes.js** – Removed response.data.ministries log and generic error logs in catch blocks.
- **api/userRoutes.js** – Removed signInGuest/signUpUser request/response logs and all catch blocks that logged error.response.data/status or error.request.
- **api/familyMemberRoutes.js** – Removed “DELETING FAMILY MEMBER”, “CANCELING CONNECTION REQUEST”, and “CANCEL CONNECTION RESPONSE” logs.
- **api/schedulesRoutes.js** – Removed “Blocking dates” data log.

### 3. **Push & Notifications**
- **src/utils/notificationUtils.js** – Removed push token obtained log, “Sending notification payload”, all error.response/error.response.data/status logs, device unregistration success log, and app icon badge clear log.

### 4. **App & Context**
- **App.js** – Removed deep link query params log; removed checkout/check-in deep link failure warns; removed “Notification received (foreground)” log.
- **AppContext.js** – Removed ErrorBoundary logs of error and errorInfo; removed “AppContext starting to render” and “App starting in mode” logs.
- **contexts/ThemeContext.js** – Removed current theme, organization data, color mode, updateTheme args, “Resetting theme to default”, and “Theme generation” logs; removed color load/save error logs.

### 5. **Screens & Components**
- **CheckInScreen** – Removed logs of check-ins payload, today’s check-ins, user/family member IDs, check-in/check-out payloads and responses, and error.response; kept user-facing Alert for validation.
- **ContactScreen** – Removed contact topics fetch warn, teamsData/response.teams logs, teamUsers log, team users fetch error, and phone app error log.
- **ProfileScreen** – Removed result.assets[0].uri log, “CANCELING CONNECTION REQUEST”, and cancel connection request error log.
- **FileViewScreen** – Removed fileUrl log.
- **CarouselModal** – Removed eventData.rsvpUsers log, calendar/RSVP error details (message, stack, eventData, calendarId), response.event.rsvpUsers log, and RSVP error log.
- **EditFamilyMemberDrawer** – Removed familyMember log.

### 6. **Biometric / Auth UX**
- **AuthMain.js** – Removed “values” (could contain password), “res signInUser error”, “ERROR” (error object), biometric check/enrollment log, “Attempting biometric…” options log, “Biometric authentication result”, “User cancelled” log, “Biometric authentication failed” (result.error); removed guest sign-in error log; generic biometric catch no longer exposes error.message in alert.

## Remaining console.* Usage

Many files still use `console.error` / `console.warn` in catch blocks with only a short message (e.g. “Failed to fetch X”). These were left in place when they do not log:
- Tokens, passwords, or auth headers  
- Full response bodies or error.response.data  
- User/org IDs or PII  

**Recommendation:** For production, consider:
- A logging abstraction that strips or redacts sensitive fields and is disabled or reduced in production.
- Replacing remaining `console.error('...', error)` with message-only logs so error objects (and any attached response data) are never written to logs.

## Other Security Notes

- **No hardcoded secrets** found in the audited files (API_BASE_URL is a public backend URL).
- **Commented credentials** in SignAuth.js (email/password) were removed.
- **Deep links** – Logging of query params (e.g. orgId, orgPin, token) was removed so they are not written to device logs.
