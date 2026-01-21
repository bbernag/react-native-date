import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SectionList,
  TextInput,
} from 'react-native';
import {
  now,
  format,
  formatUTC,
  fromComponents,
  getLocale,
  setLocale,
  getAvailableLocalesInfo,
  getLocaleDisplayName,
  type Locale,
  type LocaleInfo,
} from '@bernagl/react-native-date';

function FormattingScreen() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());
  const [showLocalePicker, setShowLocalePicker] = useState(false);
  const [localeSearch, setLocaleSearch] = useState('');
  const [timestamp, setTimestamp] = useState(now());

  // Update timestamp periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get available locales with full info from OS
  const availableLocales = getAvailableLocalesInfo();

  // Debug: log locale count (once on mount)
  useEffect(() => {
    console.log('Current locale from native:', getLocale());
    console.log('Available locales count:', availableLocales.length);
    console.log('First 5 locales:', availableLocales.slice(0, 5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter locales based on search
  const filteredLocales = availableLocales.filter((locale) => {
    const searchLower = localeSearch.toLowerCase();
    return (
      locale.code.toLowerCase().includes(searchLower) ||
      locale.displayName.toLowerCase().includes(searchLower) ||
      locale.nativeName.toLowerCase().includes(searchLower)
    );
  });

  // Group locales into sections by first letter of display name
  const localeSections = filteredLocales.reduce((acc, locale) => {
    const firstLetter = locale.displayName.charAt(0).toUpperCase();
    const existingSection = acc.find((s) => s.title === firstLetter);
    if (existingSection) {
      existingSection.data.push(locale);
    } else {
      acc.push({ title: firstLetter, data: [locale] });
    }
    return acc;
  }, [] as { title: string; data: LocaleInfo[] }[]);

  // Sort sections alphabetically
  localeSections.sort((a, b) => a.title.localeCompare(b.title));

  const handleLocaleChange = useCallback((locale: Locale) => {
    const success = setLocale(locale);
    if (success) {
      setCurrentLocale(locale);
    }
    setShowLocalePicker(false);
    setLocaleSearch('');
  }, []);

  // Use current date for all examples
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  // Generate all months (using 15th of each month)
  const allMonths = Array.from({ length: 12 }, (_, i) =>
    fromComponents({ year: currentYear, month: i + 1, day: 15 })
  );

  // Generate all days of the week (find a Sunday and iterate)
  const dayOfWeek = new Date().getDay();
  const allDays = Array.from({ length: 7 }, (_, i) =>
    fromComponents({
      year: currentYear,
      month: currentMonth,
      day: currentDay - dayOfWeek + i,
    })
  );

  // fromComponents example using current date
  const componentsExample = {
    year: currentYear,
    month: currentMonth,
    day: currentDay,
    hour: 14,
    minute: 30,
    second: 45,
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Formatting & Locale</Text>

      {/* Locale Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language / Locale</Text>
        <TouchableOpacity
          style={styles.localeSelector}
          onPress={() => setShowLocalePicker(true)}
        >
          <View>
            <Text style={styles.localeSelectorText}>
              {getLocaleDisplayName(currentLocale)}
            </Text>
            <Text style={styles.localeSelectorCode}>{currentLocale}</Text>
          </View>
          <Text style={styles.localeSelectorArrow}>▼</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Available locales: {availableLocales.length} (from device OS)
        </Text>
      </View>

      {/* 12-Hour Format Tokens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12-Hour Format</Text>
        <Text style={styles.label}>
          <Text style={styles.code}>hh:mm A</Text> →{' '}
          {format(timestamp, 'hh:mm A')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>h:mm a</Text> →{' '}
          {format(timestamp, 'h:mm a')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>hh:mm:ss A</Text> →{' '}
          {format(timestamp, 'hh:mm:ss A')}
        </Text>
        <View style={styles.tokenList}>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>hh</Text> = 2-digit 12h (01-12)
          </Text>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>h</Text> = 12h no padding (1-12)
          </Text>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>A</Text> = AM/PM uppercase
          </Text>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>a</Text> = am/pm lowercase
          </Text>
        </View>
      </View>

      {/* Month/Day Name Tokens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Month & Day Names (Localized)</Text>
        <Text style={styles.label}>
          <Text style={styles.code}>EEEE, MMMM dd, yyyy</Text>
        </Text>
        <Text style={styles.value}>
          {format(timestamp, 'EEEE, MMMM dd, yyyy')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>EEE, MMM dd</Text> →{' '}
          {format(timestamp, 'EEE, MMM dd')}
        </Text>
        <View style={styles.tokenList}>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>MMMM</Text> = Full month (December)
          </Text>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>MMM</Text> = Short month (Dec)
          </Text>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>EEEE</Text> = Full day (Wednesday)
          </Text>
          <Text style={styles.tokenItem}>
            <Text style={styles.code}>EEE</Text> = Short day (Wed)
          </Text>
        </View>
      </View>

      {/* All Months */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Months ({currentLocale})</Text>
        <View style={styles.monthDayGrid}>
          {allMonths.map((monthTs, i) => (
            <View key={i} style={styles.monthDayItem}>
              <Text style={styles.monthDayFull}>{format(monthTs, 'MMMM')}</Text>
              <Text style={styles.monthDayShort}>{format(monthTs, 'MMM')}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* All Days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Days ({currentLocale})</Text>
        <View style={styles.monthDayGrid}>
          {allDays.map((dayTs, i) => (
            <View key={i} style={styles.monthDayItem}>
              <Text style={styles.monthDayFull}>{format(dayTs, 'EEEE')}</Text>
              <Text style={styles.monthDayShort}>{format(dayTs, 'EEE')}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Escaped Literals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Escaped Literals</Text>
        <Text style={styles.label}>
          <Text style={styles.code}>{"yyyy-MM-dd'T'HH:mm:ss'Z'"}</Text>
        </Text>
        <Text style={styles.value}>
          {format(timestamp, "yyyy-MM-dd'T'HH:mm:ss'Z'")}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>{"MMMM 'of' yyyy"}</Text> →{' '}
          {format(timestamp, "MMMM 'of' yyyy")}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>{"'Today is' EEEE"}</Text> →{' '}
          {format(timestamp, "'Today is' EEEE")}
        </Text>
        <Text style={styles.hint}>
          Use single quotes to include literal text in patterns
        </Text>
      </View>

      {/* Live Formatting Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Examples (Current Time)</Text>
        <Text style={styles.label}>
          <Text style={styles.code}>HH:mm:ss</Text> →{' '}
          {format(timestamp, 'HH:mm:ss')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>h:mm:ss a</Text> →{' '}
          {format(timestamp, 'h:mm:ss a')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>EEEE</Text> → {format(timestamp, 'EEEE')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>MMMM yyyy</Text> →{' '}
          {format(timestamp, 'MMMM yyyy')}
        </Text>
      </View>

      {/* fromComponents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>fromComponents()</Text>
        <Text style={styles.hint}>Create timestamp from date components</Text>
        <Text style={styles.code}>
          {JSON.stringify(componentsExample, null, 2)}
        </Text>
        <Text style={styles.label}>
          Result:{' '}
          {format(fromComponents(componentsExample), 'yyyy-MM-dd HH:mm:ss')}
        </Text>
      </View>

      {/* UTC Formatting */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>UTC Formatting</Text>
        <Text style={styles.label}>
          <Text style={styles.code}>formatUTC()</Text> →{' '}
          {formatUTC(timestamp, 'yyyy-MM-dd HH:mm:ss')}
        </Text>
        <Text style={styles.label}>
          <Text style={styles.code}>format() (local)</Text> →{' '}
          {format(timestamp, 'yyyy-MM-dd HH:mm:ss')}
        </Text>
      </View>

      {/* All Format Tokens Reference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Format Tokens Reference</Text>
        <View style={styles.tokenGrid}>
          <View style={styles.tokenColumn}>
            <Text style={styles.tokenHeader}>Date</Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>yyyy</Text> Year
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>MM</Text> Month (01-12)
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>MMM</Text> Month short
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>MMMM</Text> Month full
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>dd</Text> Day (01-31)
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>EEE</Text> Day short
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>EEEE</Text> Day full
            </Text>
          </View>
          <View style={styles.tokenColumn}>
            <Text style={styles.tokenHeader}>Time</Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>HH</Text> Hour 24h
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>hh</Text> Hour 12h
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>h</Text> Hour 12h (no pad)
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>mm</Text> Minutes
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>ss</Text> Seconds
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>SSS</Text> Milliseconds
            </Text>
            <Text style={styles.tokenItem}>
              <Text style={styles.code}>a/A</Text> AM/PM
            </Text>
          </View>
        </View>
      </View>

      {/* Locale Picker Modal */}
      <Modal
        visible={showLocalePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocalePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity
              onPress={() => {
                setShowLocalePicker(false);
                setLocaleSearch('');
              }}
            >
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search locales..."
            value={localeSearch}
            onChangeText={setLocaleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <SectionList
            sections={localeSections}
            keyExtractor={(item) => item.code}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.localeItem,
                  item.code === currentLocale && styles.localeItemActive,
                ]}
                onPress={() => handleLocaleChange(item.code as Locale)}
              >
                <View style={styles.localeItemContent}>
                  <Text
                    style={[
                      styles.localeItemText,
                      item.code === currentLocale &&
                        styles.localeItemTextActive,
                    ]}
                  >
                    {item.displayName} ({item.code})
                  </Text>
                  {item.nativeName !== item.displayName && (
                    <Text style={styles.localeItemNative}>
                      {item.nativeName}
                    </Text>
                  )}
                </View>
                {item.code === currentLocale && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            stickySectionHeadersEnabled
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: 13,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    borderRadius: 3,
    color: '#d73a49',
  },
  tokenList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tokenItem: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  tokenGrid: {
    flexDirection: 'row',
  },
  tokenColumn: {
    flex: 1,
  },
  tokenHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  monthDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  monthDayItem: {
    width: '50%',
    paddingVertical: 6,
    paddingRight: 8,
  },
  monthDayFull: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  monthDayShort: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  localeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  localeSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  localeSelectorCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  localeSelectorArrow: {
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  localeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  localeItemActive: {
    backgroundColor: '#e8f4ff',
  },
  localeItemContent: {
    flex: 1,
  },
  localeItemText: {
    fontSize: 16,
    color: '#333',
  },
  localeItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  localeItemNative: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FormattingScreen;
