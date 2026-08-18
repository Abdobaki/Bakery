import { User } from '@bakery/core';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BakeryButton } from '../src/components/BakeryButton';
import { getAllUsers } from '../src/db/queries';
import { useAppStore } from '../src/store/useAppStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setCurrentUser, settings } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const uList = await getAllUsers();
    setUsers(uList);
    if (uList.length > 0) {
      setSelectedUser(uList[0]);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleLogin = () => {
    if (!selectedUser) {
      Alert.alert('تنبيه', 'اختر مستخدماً');
      return;
    }

    if (selectedUser.pinHash && pin !== selectedUser.pinHash) {
      Alert.alert('خطأ', 'رمز PIN غير صحيح');
      setPin('');
      return;
    }

    setCurrentUser(selectedUser);

    if (selectedUser.role === 'OWNER') {
      router.replace('/(owner)/dashboard');
    } else {
      router.replace('/(cashier)/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoTitle}>{settings?.bakeryName || 'مخبزة الأصالة'}</Text>
        <Text style={styles.subtitle}>نظام إدارة المخبزة الذكي (Offline-First Bakery System)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>اختر مستخدماً للدخول:</Text>

        <View style={styles.userList}>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userChip, selectedUser?.id === user.id && styles.userChipSelected]}
              onPress={() => {
                setSelectedUser(user);
                setPin('');
              }}
            >
              <Text style={[styles.userName, selectedUser?.id === user.id && styles.userNameSelected]}>{user.displayName}</Text>
              <Text style={[styles.userRole, selectedUser?.id === user.id && styles.userRoleSelected]}>
                {user.role === 'OWNER' ? 'مالك المخبزة' : 'أمين الصندوق'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.pinLabel}>أدخل رمز PIN (4 أرقام):</Text>
        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={[styles.pinDot, pin.length > index && styles.pinDotFilled]} />
          ))}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['C', '0', '⌫']].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.keyBtn}
                  onPress={() => {
                    if (key === 'C') setPin('');
                    else if (key === '⌫') handleDelete();
                    else handleKeyPress(key);
                  }}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <BakeryButton title="تسجيل الدخول" onPress={handleLogin} variant="primary" style={styles.loginBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'right',
    marginBottom: 12
  },
  userList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  userChip: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 4,
    alignItems: 'center',
    minWidth: 100
  },
  userChipSelected: {
    backgroundColor: '#d97706'
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc'
  },
  userNameSelected: {
    color: '#ffffff'
  },
  userRole: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  userRoleSelected: {
    color: '#fef3c7'
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 10
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d97706',
    marginHorizontal: 8
  },
  pinDotFilled: {
    backgroundColor: '#d97706'
  },
  keypad: {
    marginBottom: 16
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  keyBtn: {
    backgroundColor: '#334155',
    width: '30%',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc'
  },
  loginBtn: {
    marginTop: 8
  }
});
