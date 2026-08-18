import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  disabled?: boolean;
  style?: ViewStyle;
}

export const BakeryButton: React.FC<Props> = ({ title, onPress, variant = 'primary', disabled, style }) => {
  const getBackgroundColor = () => {
    if (disabled) return '#94a3b8';
    switch (variant) {
      case 'primary':
        return '#d97706'; // Warm Bakery Orange/Amber
      case 'secondary':
        return '#475569';
      case 'success':
        return '#16a34a';
      case 'danger':
        return '#dc2626';
      case 'warning':
        return '#ca8a04';
      default:
        return '#d97706';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: getBackgroundColor() }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  text: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'System'
  }
});
