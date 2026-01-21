import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ComparisonScreen, NativeTestScreen } from '@rn-packages/native-date-examples';

type Tab = 'test' | 'compare';

function TabBar({
  activeTab,
  onChangeTab,
}: {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}) {
  return (
    <View style={tabStyles.container}>
      <TouchableOpacity
        style={[tabStyles.tab, activeTab === 'test' && tabStyles.activeTab]}
        onPress={() => onChangeTab('test')}
      >
        <Text
          style={[
            tabStyles.tabText,
            activeTab === 'test' && tabStyles.activeTabText,
          ]}
        >
          Tests
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[tabStyles.tab, activeTab === 'compare' && tabStyles.activeTab]}
        onPress={() => onChangeTab('compare')}
      >
        <Text
          style={[
            tabStyles.tabText,
            activeTab === 'compare' && tabStyles.activeTabText,
          ]}
        >
          Compare
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('test');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Expo + react-native-date</Text>
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
      {activeTab === 'test' && <NativeTestScreen />}
      {activeTab === 'compare' && <ComparisonScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
});
