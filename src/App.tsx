/**
 * Root Application Component & Navigation Controller
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SplashScreen } from './screens/SplashScreen';
import { GardenDashboardScreen } from './screens/GardenDashboardScreen';
import { TreeDetailScreen } from './screens/TreeDetailScreen';
import { ArchiveGalleryScreen } from './screens/ArchiveGalleryScreen';
import { CompendiumScreen } from './screens/CompendiumScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NavTabId } from './components/BottomNavBar';
import { TreeModel } from './types';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { PerformanceProvider } from './context/PerformanceContext';
import { zenAudioService } from './services/ZenAudioService';

const AppContent: React.FC = () => {
  const { colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'garden' | 'treeDetail' | 'archive' | 'compendium' | 'settings'>('splash');
  const [selectedTree, setSelectedTree] = useState<TreeModel | null>(null);
  const [previousScreen, setPreviousScreen] = useState<'garden' | 'archive'>('garden');

  useEffect(() => {
    // Khởi động nhạc nền Zen khi bắt đầu vào game
    zenAudioService.initialize().catch(() => {});
  }, []);

  const handleSplashFinish = () => {
    setCurrentScreen('garden');
  };

  const handleSelectTree = (tree: TreeModel) => {
    setSelectedTree(tree);
    if (currentScreen === 'archive' || currentScreen === 'garden') {
      setPreviousScreen(currentScreen);
    }
    setCurrentScreen('treeDetail');
  };

  const handleBackToGarden = () => {
    setCurrentScreen(previousScreen || 'garden');
  };

  const handleNavigateTab = (tab: NavTabId) => {
    if (tab === 'garden') setCurrentScreen('garden');
    if (tab === 'archive') setCurrentScreen('archive');
    if (tab === 'compendium') setCurrentScreen('compendium');
    if (tab === 'settings') setCurrentScreen('settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Screen 0: Splash Screen */}
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {/* Screen 1: Khu Vườn Zen (Garden Dashboard) */}
      {currentScreen === 'garden' && (
        <GardenDashboardScreen
          onSelectTree={handleSelectTree}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* Screen 2: Chi Tiết Cây & Zen View */}
      {currentScreen === 'treeDetail' && selectedTree && (
        <TreeDetailScreen
          tree={selectedTree}
          onBack={handleBackToGarden}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* Screen 3: Nhà Kính Danh Dự (Archive Gallery) */}
      {currentScreen === 'archive' && (
        <ArchiveGalleryScreen
          onSelectTree={handleSelectTree}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* Screen 4: Bách Thảo Thư Viện (Botanical Compendium) */}
      {currentScreen === 'compendium' && (
        <CompendiumScreen
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* Screen 5: Cài Đặt & Hướng Dẫn NFC */}
      {currentScreen === 'settings' && (
        <SettingsScreen
          onNavigateTab={handleNavigateTab}
        />
      )}
    </View>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PerformanceProvider>
          <AppContent />
        </PerformanceProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

export default App;
