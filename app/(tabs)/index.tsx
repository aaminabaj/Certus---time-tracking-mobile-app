import { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      if (activeEntry) {
        const diff =
          new Date().getTime() - new Date(activeEntry.clockInTime).getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsedTime(
          `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeEntry]);

  useEffect(() => {
    checkActiveTimeEntry();
  }, []);

  const checkActiveTimeEntry = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('time_entries')
        .select('id, clock_in')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .limit(1);

      if (error) return console.error(error);
      if (data.length > 0) {
        const clockIn = new Date(data[0].clock_in);
        setActiveEntry({
          id: data[0].id,
          clockInTime: clockIn,
        });
        setClockInTime(clockIn);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClockIn = async () => {
    if (isClockingIn || activeEntry) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setIsClockingIn(true);
      const now = new Date();
      const { data, error } = await supabase
        .from('time_entries')
        .insert({ user_id: user.id, clock_in: now.toISOString() })
        .select('id')
        .single();

      if (error) return console.error(error);

      setActiveEntry({ id: data.id, clockInTime: now });
      setClockInTime(now);
    } catch (error) {
      console.error(error);
    } finally {
      setIsClockingIn(false);
      setShowClockInModal(false);
    }
  };

  const handleClockOut = async () => {
    if (isClockingOut || !activeEntry) return;
    try {
      setIsClockingOut(true);
      const now = new Date();
      await supabase
        .from('time_entries')
        .update({ clock_out: now.toISOString() })
        .eq('id', activeEntry.id);
      setActiveEntry(null);
      setElapsedTime('00:00');
      setClockOutTime(now);
    } catch (error) {
      console.error(error);
    } finally {
      setIsClockingOut(false);
      setShowClockOutModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Dobro došli u Certus aplikaciju!</Text>
      <Text style={styles.date}>
        {format(currentTime, 'EEEE, dd. MMMM yyyy.', { locale: bs })}
      </Text>
      <Text style={styles.time}>{format(currentTime, 'HH:mm')}</Text>
      <View style={styles.clockContainer}>
        <Text style={[styles.elapsedTime, !activeEntry && styles.elapsedTimeInactive]}>
          {elapsedTime}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clockInButton]}
          onPress={() => setShowClockInModal(true)}
          disabled={!!activeEntry}
        >
          <Text style={styles.buttonText}>Prijava</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.clockOutButton]}
          onPress={() => setShowClockOutModal(true)}
          disabled={!activeEntry}
        >
          <Text style={styles.buttonText}>Odjava</Text>
        </TouchableOpacity>
      </View>
      {clockInTime && (
        <Text style={styles.timeLabel}>
          Prijava: {format(clockInTime, 'HH:mm:ss')}
        </Text>
      )}
      {clockOutTime && (
        <Text style={styles.timeLabel}>
          Odjava: {format(clockOutTime, 'HH:mm:ss')}
        </Text>
      )}
      <ConfirmModal
        visible={showClockInModal}
        title="Potvrdi prijavu"
        message="Jeste li sigurni da se želite prijaviti?"
        onConfirm={handleClockIn}
        onCancel={() => setShowClockInModal(false)}
      />
      <ConfirmModal
        visible={showClockOutModal}
        title="Potvrdi odjavu"
        message="Jeste li sigurni da se želite odjaviti?"
        onConfirm={handleClockOut}
        onCancel={() => setShowClockOutModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  date: { 
    fontSize: 16, 
    marginBottom: 10 
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    padding: 65,
  },
  time: { 
    fontSize: 20, 
    marginBottom: 20 
  },
  elapsedTime: {
    fontSize: 30,
    marginTop: 12,
    marginBottom: 12,
    color: '#000',
  },
  elapsedTimeInactive: {
    color: '#999',
  },
  buttonContainer: { 
    flexDirection: 'row', 
    marginTop: 40 
  },
  button: { 
    padding: 15, 
    borderRadius: 10, 
    marginHorizontal: 20 
  },
  clockInButton: { 
    backgroundColor: '#E42131' 
  },
  clockOutButton: { 
    backgroundColor: '#689BB6' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  timeLabel: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});