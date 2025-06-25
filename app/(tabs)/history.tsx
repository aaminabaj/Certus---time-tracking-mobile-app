import { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { format, differenceInHours, differenceInMinutes, parseISO, startOfMonth, endOfMonth, isBefore, endOfDay } from 'date-fns';
import { bs } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react-native';

type TimeEntry = {
  id: number;
  clock_in: string;
  clock_out: string | null;
};

type Month = {
  label: string;
  value: Date;
};

export default function History() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Month>(() => {
    const now = new Date();
    return {
      label: format(now, 'MMMM yyyy', { locale: bs }),
      value: now,
    };
  });

  const months: Month[] = (() => {
    const currentDate = new Date();
    const result: Month[] = [];
    let date = currentDate;
    
    while (date >= new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)) {
      result.push({
        label: format(date, 'MMMM yyyy', { locale: bs }),
        value: new Date(date),
      });
      date = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    }
    
    return result;
  })();

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      const filtered = entries.filter((entry) => {
        const entryDate = parseISO(entry.clock_in);
        return (
          entryDate >= startOfMonth(selectedMonth.value) &&
          entryDate <= endOfMonth(selectedMonth.value)
        );
      });
      setFilteredEntries(filtered);
    }
  }, [selectedMonth, entries]);

  async function fetchTimeEntries() {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('clock_in', { ascending: false });

    if (error) {
      console.error('Error fetching time entries:', error);
    } else {
      setEntries(data || []);
    }
  }

  const formatDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return '---';
    
    const startDate = new Date(clockIn);
    const endDate = new Date(clockOut);
    
    const hours = differenceInHours(endDate, startDate);
    const minutes = differenceInMinutes(endDate, startDate) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const renderItem = ({ item }: { item: TimeEntry }) => (
    <View style={styles.entryCard}>
      <Text style={styles.date}>
        {format(new Date(item.clock_in), 'dd. MMMM yyyy.', { locale: bs })}
      </Text>
      <View style={styles.timeContainer}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Prijava</Text>
          <Text style={styles.time}>
            {format(new Date(item.clock_in), 'HH:mm:ss')}
          </Text>
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Odjava</Text>
          <Text style={styles.time}>
            {item.clock_out
              ? format(new Date(item.clock_out), 'HH:mm:ss')
              : '---'}
          </Text>
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Sati rada</Text>
          <Text style={styles.time}>
            {formatDuration(item.clock_in, item.clock_out)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historija rada</Text>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.monthSelector}
          onPress={() => setShowMonthPicker(!showMonthPicker)}
        >
          <Text style={styles.monthText}>{selectedMonth.label}</Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>

        {showMonthPicker && (
          <ScrollView 
            style={styles.monthDropdown}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {months.map((month, index) => (
              <TouchableOpacity
                key={`${month.value.toISOString()}-${index}`}
                style={styles.monthOption}
                onPress={() => {
                  setSelectedMonth(month);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[
                  styles.monthOptionText,
                  month.label === selectedMonth.label && styles.selectedMonthText
                ]}>
                  {month.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filteredEntries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 30,
    marginTop: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    zIndex: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 16,
    color: '#333',
  },
  monthDropdown: {
    position: 'absolute',
    top: '100%',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  monthOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMonthText: {
    color: '#0077B6',
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  time: {
    fontSize: 16,
    color: '#0077B6',
    fontWeight: '500',
  },
});