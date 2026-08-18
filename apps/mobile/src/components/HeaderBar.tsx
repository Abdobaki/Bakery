import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export const HeaderBar: React.FC<{ title?: string; onLogout?: () => void }> = ({ title, onLogout }) => {
  const { currentUser, activeShift, settings, isOffline } = useAppStore();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.bakeryName}>{settings?.bakeryName || 'مخبزة الأصالة'}</Text>
          <View style={[styles.statusBadge, isOffline ? styles.offlineBadge : styles.onlineBadge]}>
            <Text style={styles.statusText}>{isOffline ? 'بدون إنترنت (Offline)' : 'متصل (Online)'}</Text>
          </View>
        </View>

        {currentUser && (
          <TouchableOpacity style={styles.userBadge} onPress={onLogout}>
            <Text style={styles.userName}>{currentUser.displayName}</Text>
            <Text style={styles.userRole}>{currentUser.role === 'OWNER' ? 'صاحب المخبزة' : 'أمين الصندوق'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {title && (
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>{title}</Text>
          {activeShift && (
            <View style={styles.shiftTag}>
              <Text style={styles.shiftTagText}>
                {activeShift.shiftType === 'MORNING' ? 'الوردية الصباحية' : 'الوردية المسائية'} (مفتوحة)
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brandContainer: {
    alignItems: 'flex-end'
  },
  bakeryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: 'System'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4
  },
  offlineBadge: {
    backgroundColor: '#b45309'
  },
  onlineBadge: {
    backgroundColor: '#15803d'
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600'
  },
  userBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-start'
  },
  userName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold'
  },
  userRole: {
    color: '#94a3b8',
    fontSize: 11
  },
  titleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b'
  },
  shiftTag: {
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  shiftTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
