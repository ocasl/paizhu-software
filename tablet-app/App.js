// App主入口
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3LightTheme, Text } from 'react-native-paper';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { initDatabase } from './src/database/operations';

// 页面导入
import HomeScreen from './src/screens/HomeScreen';
import DailyCheckScreen from './src/screens/DailyCheckScreen';
import WeeklyCheckScreen from './src/screens/WeeklyCheckScreen';
import MonthlyCheckScreen from './src/screens/MonthlyCheckScreen';
import ImmediateCheckScreen from './src/screens/ImmediateCheckScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SyncExportScreen from './src/screens/SyncExportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

// 自定义主题
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#667eea',
    secondary: '#764ba2',
  },
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDB();
  }, []);

  const initDB = async () => {
    try {
      await initDatabase();
      setDbReady(true);
    } catch (err) {
      console.error('数据库初始化失败:', err);
      setError(err.message);
    }
  };

  // 加载中
  if (!dbReady && !error) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>正在初始化...</Text>
      </View>
    );
  }

  // 错误
  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>初始化失败</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#667eea',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: '智慧派驻检察', headerShown: false }}
          />
          <Stack.Screen
            name="DailyCheck"
            component={DailyCheckScreen}
            options={{ title: '日检察' }}
          />
          <Stack.Screen
            name="WeeklyCheck"
            component={WeeklyCheckScreen}
            options={{ title: '周检察' }}
          />
          <Stack.Screen
            name="MonthlyCheck"
            component={MonthlyCheckScreen}
            options={{ title: '月检察' }}
          />
          <Stack.Screen
            name="ImmediateCheck"
            component={ImmediateCheckScreen}
            options={{ title: '及时检察' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: '历史记录' }}
          />
          <Stack.Screen
            name="SyncExport"
            component={SyncExportScreen}
            options={{ title: '同步导出' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '平板设置' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#606266',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F56C6C',
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: '#909399',
  },
});
