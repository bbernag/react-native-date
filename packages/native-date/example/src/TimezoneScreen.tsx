import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  now,
  getTimezone,
  getAvailableTimezones,
  formatInTimezone,
  getTimezoneOffsetForTimestamp,
} from '@bernagl/react-native-date';

// Common timezones to show at the top
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

function TimezoneScreen() {
  const [currentTime, setCurrentTime] = useState(now());
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deviceTimezone = getTimezone();
  const allTimezones = getAvailableTimezones();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter timezones based on search
  const filteredTimezones = searchQuery
    ? allTimezones.filter((tz) =>
        tz.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [
        ...COMMON_TIMEZONES,
        ...allTimezones.filter((tz) => !COMMON_TIMEZONES.includes(tz)),
      ];

  const handleSelectTimezone = useCallback((tz: string) => {
    setSelectedTimezone(tz);
    setShowPicker(false);
    setSearchQuery('');
  }, []);

  // Format offset as +HH:MM or -HH:MM
  const formatOffset = (offsetMinutes: number): string => {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    return `${sign}${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
  };

  const deviceOffset = getTimezoneOffsetForTimestamp(currentTime);
  const selectedOffset = (() => {
    // Calculate offset by comparing UTC time with timezone time
    const utcTime = formatInTimezone(currentTime, 'HH:mm', 'UTC');
    const tzTime = formatInTimezone(currentTime, 'HH:mm', selectedTimezone);
    // Parse times and calculate difference
    const utcParts = utcTime.split(':').map(Number);
    const tzParts = tzTime.split(':').map(Number);
    const utcH = utcParts[0] ?? 0;
    const utcM = utcParts[1] ?? 0;
    const tzH = tzParts[0] ?? 0;
    const tzM = tzParts[1] ?? 0;
    let diff = tzH * 60 + tzM - (utcH * 60 + utcM);
    // Handle day boundary
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    return diff;
  })();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Timezone Converter</Text>

        {/* Device Timezone */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Device Timezone</Text>
            <Text style={styles.offsetBadge}>
              UTC{formatOffset(deviceOffset)}
            </Text>
          </View>
          <Text style={styles.timezone}>{deviceTimezone}</Text>
          <Text style={styles.time}>
            {formatInTimezone(currentTime, 'HH:mm:ss', deviceTimezone)}
          </Text>
          <Text style={styles.date}>
            {formatInTimezone(currentTime, 'yyyy-MM-dd', deviceTimezone)}
          </Text>
        </View>

        {/* Selected Timezone */}
        <View style={[styles.card, styles.selectedCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Selected Timezone</Text>
            <Text style={styles.offsetBadge}>
              UTC{formatOffset(selectedOffset)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.timezone}>{selectedTimezone}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.timeSelected}>
            {formatInTimezone(currentTime, 'HH:mm:ss', selectedTimezone)}
          </Text>
          <Text style={styles.date}>
            {formatInTimezone(currentTime, 'yyyy-MM-dd', selectedTimezone)}
          </Text>
        </View>

        {/* Time Difference */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Time Difference</Text>
          <Text style={styles.diffText}>
            {(() => {
              const diff = selectedOffset - deviceOffset;
              if (diff === 0) return 'Same time';
              const hours = Math.floor(Math.abs(diff) / 60);
              const mins = Math.abs(diff) % 60;
              const ahead = diff > 0 ? 'ahead' : 'behind';
              if (mins === 0) {
                return `${hours} hour${hours !== 1 ? 's' : ''} ${ahead}`;
              }
              return `${hours}h ${mins}m ${ahead}`;
            })()}
          </Text>
        </View>

        {/* Quick Select */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Quick Select</Text>
          <View style={styles.quickSelectGrid}>
            {COMMON_TIMEZONES.slice(0, 8).map((tz) => (
              <TouchableOpacity
                key={tz}
                style={[
                  styles.quickSelectButton,
                  selectedTimezone === tz && styles.quickSelectButtonActive,
                ]}
                onPress={() => setSelectedTimezone(tz)}
              >
                <Text
                  style={[
                    styles.quickSelectText,
                    selectedTimezone === tz && styles.quickSelectTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {tz.split('/').pop()?.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Timezone Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search timezones..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              data={filteredTimezones}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.timezoneItem,
                    item === selectedTimezone && styles.timezoneItemSelected,
                  ]}
                  onPress={() => handleSelectTimezone(item)}
                >
                  <Text
                    style={[
                      styles.timezoneItemText,
                      item === selectedTimezone &&
                        styles.timezoneItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {COMMON_TIMEZONES.includes(item) && (
                    <Text style={styles.commonBadge}>Common</Text>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  offsetBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timezone: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  time: {
    fontSize: 36,
    fontWeight: '300',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  timeSelected: {
    fontSize: 36,
    fontWeight: '300',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerArrow: {
    fontSize: 14,
    color: '#007AFF',
  },
  diffText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  quickSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
    alignItems: 'center',
  },
  quickSelectButtonActive: {
    backgroundColor: '#007AFF',
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  quickSelectTextActive: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 16,
  },
  timezoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  timezoneItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  timezoneItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  timezoneItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  commonBadge: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 16,
  },
});

export default TimezoneScreen;
