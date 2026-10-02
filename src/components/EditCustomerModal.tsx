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
import { Customer, GridCustomer } from '../types/collection.types';

interface EditCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  customer: Customer | GridCustomer | null;
  onCustomerUpdated: () => void;
  onCustomerDeleted: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  onClose,
  customer,
  onCustomerUpdated,
  onCustomerDeleted,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setMobile(customer.mobile || '');
      setStatus(customer.status || 'active');
    }
  }, [customer, visible]);

  const handleMobileChange = (val: string) => {
    const rawVal = val.replace(/\D/g, '');
    if (rawVal.length <= 10) {
      setMobile(rawVal);
    }
  };

  const handleUpdate = async () => {
    if (!customer?._id) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Customer name is required');
      return;
    }

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      Alert.alert('Validation Error', 'Mobile number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    try {
      await collectionApi.updateCustomer(customer._id, {
        name: trimmedName,
        mobile,
        status,
      });
      onCustomerUpdated();
      onClose();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.message || err?.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!customer?._id) return;

    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}? This will remove all associated collections.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await collectionApi.deleteCustomer(customer._id);
              onCustomerDeleted();
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete customer');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Edit Customer</Text>
          <Text style={styles.subtitle}>Update subscriber details or subscription status</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={handleMobileChange}
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusBtn, status === 'active' && styles.statusBtnActive]}
              onPress={() => setStatus('active')}>
              <Text style={[styles.statusBtnText, status === 'active' && styles.statusBtnTextActive]}>
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, status === 'inactive' && styles.statusBtnInactive]}
              onPress={() => setStatus('inactive')}>
              <Text style={[styles.statusBtnText, status === 'inactive' && styles.statusBtnTextInactive]}>
                Inactive
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting || loading}>
              {deleting ? (
                <ActivityIndicator color="#ef4444" size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete</Text>
              )}
            </TouchableOpacity>

            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading || deleting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading || deleting}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
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
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    marginTop: 2,
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
    marginTop: 6,
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
  statusBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  statusBtnInactive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statusBtnTextActive: {
    color: '#15803d',
  },
  statusBtnTextInactive: {
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
    minWidth: 90,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default EditCustomerModal;
