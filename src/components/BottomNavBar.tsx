/**
 * Bottom Navigation Bar Component (Themed & Localized)
 * Project: Fractal Tree NFC Mobile Game
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { CompendiumRepository } from '../storage/repositories/CompendiumRepository';

export type NavTabId = 'garden' | 'archive' | 'compendium' | 'settings';

interface BottomNavBarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  hasNewCompendium?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  hasNewCompendium = false
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [hasUnviewed, setHasUnviewed] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    CompendiumRepository.getStats()
      .then(st => {
        if (isMounted) setHasUnviewed(st.hasUnviewedNew);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const showNotification = (hasNewCompendium || hasUnviewed) && activeTab !== 'compendium';

  const getTabColor = (tab: NavTabId) => {
    return activeTab === tab ? colors.primary : colors.textMuted;
  };

  return (
    <View
      style={[
        styles.navBar,
        {
          backgroundColor: colors.navBarBg,
          borderTopColor: colors.border
        }
      ]}
    >
      {/* Tab 1: Vườn Cây */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.tab,
          activeTab === 'garden' && {
            backgroundColor: colors.primaryLight
          }
        ]}
        onPress={() => onSelectTab('garden')}
      >
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L12 22M12 2C7 6 4 11 4 16C4 18.5 5.5 21 8 21.8M12 2C17 6 20 11 20 16C20 18.5 18.5 21 16 21.8"
            stroke={getTabColor('garden')}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
        <Text
          style={[
            styles.tabText,
            { color: getTabColor('garden') },
            activeTab === 'garden' && styles.tabTextActive
          ]}
        >
          {t('nav.garden')}
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Nhà Kính */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.tab,
          activeTab === 'archive' && {
            backgroundColor: colors.primaryLight
          }
        ]}
        onPress={() => onSelectTab('archive')}
      >
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
            stroke={getTabColor('archive')}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M9 21V12H15V21"
            stroke={getTabColor('archive')}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
        <Text
          style={[
            styles.tabText,
            { color: getTabColor('archive') },
            activeTab === 'archive' && styles.tabTextActive
          ]}
        >
          {t('nav.archive')}
        </Text>
      </TouchableOpacity>

      {/* Tab 3: Thư Viện Bách Thảo */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.tab,
          activeTab === 'compendium' && {
            backgroundColor: colors.primaryLight
          }
        ]}
        onPress={() => onSelectTab('compendium')}
      >
        <View style={styles.iconWrapper}>
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
              stroke={getTabColor('compendium')}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
              stroke={getTabColor('compendium')}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M8.5 7h7M8.5 11h5"
              stroke={getTabColor('compendium')}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>
          {showNotification && (
            <View style={[styles.notificationDot, { backgroundColor: '#ef4444' }]} />
          )}
        </View>
        <Text
          style={[
            styles.tabText,
            { color: getTabColor('compendium') },
            activeTab === 'compendium' && styles.tabTextActive
          ]}
        >
          {t('nav.compendium')}
        </Text>
      </TouchableOpacity>

      {/* Tab 4: Cài Đặt */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.tab,
          activeTab === 'settings' && {
            backgroundColor: colors.primaryLight
          }
        ]}
        onPress={() => onSelectTab('settings')}
      >
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="12"
            r="3"
            stroke={getTabColor('settings')}
            strokeWidth="2"
          />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            stroke={getTabColor('settings')}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
        <Text
          style={[
            styles.tabText,
            { color: getTabColor('settings') },
            activeTab === 'settings' && styles.tabTextActive
          ]}
        >
          {t('nav.settings')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    height: 64,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 4
  },
  iconWrapper: {
    position: 'relative'
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff'
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600'
  },
  tabTextActive: {
    fontWeight: '700'
  }
});
