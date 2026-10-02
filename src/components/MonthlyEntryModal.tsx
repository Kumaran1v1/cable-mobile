import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collectionApi } from '../api/collectionApi';
import { MonthlyEntry } from '../types/collection.types';
import { formatMonthYear } from '../utils/format';

interface MonthlyEntryModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerMobile: string;
  month: string; // YYYY-MM
  existingEntry?: MonthlyEntry | null;
  onSaved: () => void;
}

export const MonthlyEntryModal: React.FC<MonthlyEntryModalProps> = ({
  visible,
  onClose,
  customerId,
  customerName,
  customerMobile,
  month,
  existingEntry,
  onSaved,
}) => {
  const [amount, setAmount] = useState<string>('300');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingEntry) {
        setAmount(existingEntry.amount !== undefined ? String(existingEntry.amount) : '300');
        setPaymentStatus(existingEntry.paymentStatus || 'PAID');
        setRemarks(existingEntry.remarks || '');
      } else {
        setAmount('300');
        setPaymentStatus('PAID');
        setRemarks('');
      }
    }
  }, [existingEntry, visible]);

  const handleAmountChange = (val: string) => {
    const rawVal = val.replace(/\D/g, '');
    setAmount(rawVal);
  };

  const handleSave = async () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount (₹0 or greater)');
      return;
    }

    setLoading(true);
    try {
      await collectionApi.saveMonthlyEntry({
        customerId,
        month,
        amount: numAmount,
        paymentStatus,
        paidAmount: paymentStatus === 'PAID' ? numAmount : 0,
        remarks: remarks.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.message || err?.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!existingEntry?._id) return;

    Alert.alert('Remove Entry', 'Are you sure you want to remove this monthly entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await collectionApi.deleteMonthlyEntry(existingEntry._id!);
            onSaved();
            onClose();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete entry');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Record Collection</Text>
          <Text style={styles.subtitle}>
            {customerName} • {formatMonthYear(month)}
          </Text>

          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>Mobile: {customerMobile}</Text>
          </View>

          <Text style={styles.label}>Collection Amount (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 300"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            value={amount}
            onChangeText={handleAmountChange}
          />

          <Text style={styles.label}>Payment Status</Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusBtn, paymentStatus === 'PAID' && styles.paidBtnActive]}
              onPress={() => setPaymentStatus('PAID')}>
              <Text
                style={[
                  styles.statusBtnText,
                  paymentStatus === 'PAID' && styles.paidBtnTextActive,
                ]}>
                ✓ Paid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, paymentStatus === 'PENDING' && styles.pendingBtnActive]}
              onPress={() => setPaymentStatus('PENDING')}>
              <Text
                style={[
                  styles.statusBtnText,
                  paymentStatus === 'PENDING' && styles.pendingBtnTextActive,
                ]}>
                ⏳ Pending
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Remarks (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. GPay, Cash, Partial, etc."
            placeholderTextColor="#94a3b8"
            value={remarks}
            onChangeText={setRemarks}
          />

          <View style={styles.btnRow}>
            {existingEntry?._id ? (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={deleting || loading}>
                {deleting ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <Text style={styles.deleteBtnText}>Remove</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View />
            )}

            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading || deleting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading || deleting}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  infoBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  paidBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  pendingBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  paidBtnTextActive: {
    color: '#15803d',
  },
  pendingBtnTextActive: {
    color: '#b91c1c',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    minWidth: 110,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default MonthlyEntryModal;
