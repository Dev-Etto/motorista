import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export function ThemedStatusBar() {
  const scheme = useColorScheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
