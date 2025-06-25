import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function Settings() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Greška pri odjavi:', error);
        return;
      }

      router.replace('/login');
    } catch (error) {
      console.error('Greška pri odjavi:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Postavke</Text>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
      >
        <LogOut size={24} color="white" />
        <Text style={styles.logoutText}>Odjava</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={showLogoutModal}
        title="Potvrda odjave"
        message="Jeste li sigurni da se želite odjaviti sa računa?"
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E42131',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
