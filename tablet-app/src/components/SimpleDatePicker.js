// 简单的日期选择器组件（不依赖原生组件）
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, TextInput } from 'react-native-paper';

// 简化的日期选择器，兼容 DatePickerModal 的 API
export const DatePickerModal = ({ visible, onDismiss, date, onConfirm, mode = 'single', locale }) => {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (visible && date) {
      const d = new Date(date);
      setYear(d.getFullYear().toString());
      setMonth((d.getMonth() + 1).toString().padStart(2, '0'));
      setDay(d.getDate().toString().padStart(2, '0'));
    }
  }, [visible, date]);

  const handleConfirm = () => {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || 1;
    const d = parseInt(day) || 1;
    const selectedDate = new Date(y, m - 1, d);
    onConfirm({ date: selectedDate });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>选择日期</Dialog.Title>
        <Dialog.Content>
          <View style={styles.row}>
            <TextInput
              label="年"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="月"
              value={month}
              onChangeText={setMonth}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="日"
              value={day}
              onChangeText={setDay}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>取消</Button>
          <Button onPress={handleConfirm}>确定</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
  },
});
