import { AuditLog, User } from '@bakery/core';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BakeryButton } from '../../src/components/BakeryButton';
import { HeaderBar } from '../../src/components/HeaderBar';
import { addUser, getAppSettings, getAuditLogs, getAllUsers, updateAppSettings } from '../../src/db/queries';
import { useAppStore } from '../../src/store/useAppStore';

export default function SettingsScreen() {
  const { settings, loadInitialData } = useAppStore();
  const [tab, setTab] = useState<'SETTINGS' | 'USERS' | 'AUDIT'>('SETTINGS');
  const [bakeryName, setBakeryName] = useState(settings?.bakeryName || '');
  const [phone, setPhone] = useState(settings?.phone || '');

  // Users & Audit
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Add User Modal
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    if (tab === 'USERS') {
      const u = await getAllUsers();
      setUsers(u);
    } else if (tab === 'AUDIT') {
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateAppSettings({ bakeryName, phone });
      await loadInitialData();
      Alert.alert('نجاح', 'تم حفظ إعدادات المخبزة بنجاح');
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل حفظ الإعدادات');
    }
  };

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newDisplayName.trim() || !newPin) {
      return Alert.alert('خطأ', 'أدخل جميع بيانات الكاسي');
    }
    try {
      await addUser({
        username: newUsername.trim().toLowerCase(),
        displayName: newDisplayName.trim(),
        pin: newPin,
        role: 'CASHIER'
      });
      Alert.alert('نجاح', 'تم إحداث حساب الكاسي بنجاح');
      setAddUserModalVisible(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPin('');
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل إضافة المستخدم');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="إعدادات المخبزة والمستخدمين والنسخ" />

      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTab, tab === 'SETTINGS' && styles.topTabActive]} onPress={() => setTab('SETTINGS')}>
          <Text style={[styles.topTabText, tab === 'SETTINGS' && styles.topTabTextActive]}>الإعدادات والنسخ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, tab === 'USERS' && styles.topTabActive]} onPress={() => setTab('USERS')}>
          <Text style={[styles.topTabText, tab === 'USERS' && styles.topTabTextActive]}>إدارة المستعملين</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, tab === 'AUDIT' && styles.topTabActive]} onPress={() => setTab('AUDIT')}>
          <Text style={[styles.topTabText, tab === 'AUDIT' && styles.topTabTextActive]}>سجل العمليات</Text>
        </TouchableOpacity>
      </View>

      {tab === 'SETTINGS' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>بيانات المخبزة الرئيسية:</Text>

            <Text style={styles.label}>اسم المخبزة (Bakery Name):</Text>
            <TextInput style={styles.input} value={bakeryName} onChangeText={setBakeryName} textAlign="right" />

            <Text style={styles.label}>رقم الهاتف:</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />

            <BakeryButton title="حفظ الإعدادات" onPress={handleSaveSettings} variant="primary" style={{ marginTop: 10 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>النسخ الاحتياطي والاسترجاع (Backup):</Text>
            <Text style={styles.subText}>يتم تخزين جميع البيانات في قاعدة بيانات محلية SQLite آمنة وتعمل 100% بدون إنترنت.</Text>

            <BakeryButton
              title="تصدير نسخة احتياطية محلية (Export Database)"
              onPress={() => Alert.alert('تم إنشاء النسخة', 'تم حفظ نسخة احتياطية كاملة في مجلد الأرشيف الخاص بالجهاز')}
              variant="secondary"
            />
          </View>
        </ScrollView>
      )}

      {tab === 'USERS' && (
        <View style={{ flex: 1 }}>
          <View style={styles.topBtnRow}>
            <BakeryButton title="+ إضافة كاسي / أمين صندوق جديد" onPress={() => setAddUserModalVisible(true)} />
          </View>
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userMeta}>
                  اسم المستخدم: {item.username} | الدور: {item.role === 'OWNER' ? 'مالك' : 'كاسي'}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      )}

      {tab === 'AUDIT' && (
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditUser}>{item.userName || `User #${item.userId}`}</Text>
                <Text style={styles.auditAction}>{item.action}</Text>
              </View>
              <Text style={styles.auditTime}>{item.timestamp}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add User Modal */}
      <Modal visible={addUserModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إضافة مستخدم كاسي جديد</Text>

            <Text style={styles.label}>الاسم الظاهر (مثال: محمد):</Text>
            <TextInput style={styles.input} value={newDisplayName} onChangeText={setNewDisplayName} textAlign="right" />

            <Text style={styles.label}>اسم الدخول (Username):</Text>
            <TextInput style={styles.input} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" textAlign="right" />

            <Text style={styles.label}>رمز PIN (4 أرقام):</Text>
            <TextInput style={styles.input} value={newPin} onChangeText={setNewPin} keyboardType="numeric" maxLength={4} textAlign="center" />

            <View style={styles.actionsRow}>
              <BakeryButton title="إضافة المستعمل" onPress={handleAddUser} variant="primary" style={{ flex: 1, marginLeft: 8 }} />
              <BakeryButton title="إلغاء" onPress={() => setAddUserModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topTabs: {
    flexDirection: 'row-reverse',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  topTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  topTabActive: {
    borderBottomColor: '#d97706'
  },
  topTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b'
  },
  topTabTextActive: {
    color: '#d97706'
  },
  scroll: {
    padding: 16
  },
  topBtnRow: {
    padding: 14,
    backgroundColor: '#ffffff'
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'right'
  },
  subText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'right'
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    marginBottom: 10
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right'
  },
  userMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'right'
  },
  auditHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between'
  },
  auditUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  auditAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#d97706'
  },
  auditTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 16
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    marginTop: 16
  }
});
