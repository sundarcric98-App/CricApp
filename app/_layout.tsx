import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import Colors from '../src/constants/colors';
import { store } from '../src/store/store';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.onSurface,
    border: Colors.outlineVariant,
  },
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider value={CustomDarkTheme}>
          <StatusBar style="light" backgroundColor={Colors.surface} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.surface },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/verify-otp" options={{ headerShown: false }} />
            <Stack.Screen name="auth/set-profile-pin" options={{ headerShown: false }} />
            <Stack.Screen name="tournament/create" options={{ headerShown: false }} />
            <Stack.Screen name="team/create" options={{ headerShown: false }} />
            <Stack.Screen name="teams/index" options={{ headerShown: false }} />
            <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="commentary/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="scoring/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
