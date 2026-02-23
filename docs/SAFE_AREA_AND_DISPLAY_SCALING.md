# Safe area and display scaling

## Android on-screen navigation / notches

The app uses **`react-native-safe-area-context`** so content stays above system UI (Android nav bar, iOS home indicator, notches).

- **`useSafeAreaInsets()`** returns `{ top, right, bottom, left }`. Use **`insets.bottom`** for any screen or component that has content or buttons at the bottom.
- When the device has on-screen navigation (e.g. Android 3-button nav), `insets.bottom` is non-zero. Adding it to `paddingBottom` or to the `bottom` position of absolutely positioned elements keeps them above the nav bar.
- **Already updated:** TeamChatScreen (input bar), BottomTabNavigator (tab bar), Drawer, ProfileScreen, Homescreen, AuthMain, OrganizationSwitcher, ShareMyChurchScreen, CheckInScreen (SafeAreaView).

**Adding safe area to a new screen:**  
Import `useSafeAreaInsets` from `react-native-safe-area-context`, then add `insets.bottom` to the bottom padding of your main scroll content and/or to any absolutely positioned bottom UI.

## Large display / font size (accessibility)

When users set **Display size** or **Font size** to Large or larger (Android) or use **Larger Text** (iOS), text can scale up and break layouts.

- **App-wide cap:** In `App.js`, `Text.defaultProps.maxFontSizeMultiplier = 1.35` limits how much system font scaling affects all `<Text>`. Text still scales a bit for accessibility but layout stays stable.
- To allow more scaling on a specific screen, pass `maxFontSizeMultiplier={2}` (or higher) to that screen’s `<Text>` components. To disable scaling for a label, use `maxFontSizeMultiplier={1}`.

No separate “detection” of “large UI” is required: the system applies font scale automatically, and we only cap it via `maxFontSizeMultiplier`.
