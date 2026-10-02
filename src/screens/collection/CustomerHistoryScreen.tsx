import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { collectionApi } from '../../api/collectionApi';
import { Customer, MonthlyEntry } from '../../types/collection.types';
import { formatCurrency, formatMonthYear, formatDate } from '../../utils/format';
import { MonthlyEntryModal } from '../../components/MonthlyEntryModal';
import { WhatsAppReminderModal } from '../../components/WhatsAppReminderModal';

export const CustomerHistoryScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const customer: Customer = route.params?.customer;

  const [history, setHistory] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals
  const [entryModalState, setEntryModalState] = useState<{
    visible: boolean;
    month: string;
    existingEntry: MonthlyEntry | null;
  }>({
    visible: false,
    month: '',
    existingEntry: null,
  });

  const [whatsappModalVisible, setWhatsappModalVisible] = useState<boolean>(false);

  const fetchHistory = useCallback(
    async (isRefresh = false) => {
      if (!customer?._id) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await collectionApi.getCustomerHistory(customer._id);
        setHistory(res.data || []);
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to load customer history');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customer?._id]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPaid = history
    .filter((e) => e.paymentStatus === 'PAID')
    .reduce((sum, e) => sum + (e.paidAmount ?? e.amount), 0);

  const totalPending = history
    .filter((e) => e.paymentStatus === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleCall = () => {
    if (customer?.mobile) {
      Linking.openURL(`tel:${customer.mobile}`);
    }
  };

  const handleRowPress = (entry: MonthlyEntry) => {
    setEntryModalState({
      visible: true,
      month: entry.month,
      existingEntry: entry,
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer History</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} />
        }>
        {/* Customer Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={styles.custName}>{customer?.name}</Text>
              <Text style={styles.custMobile}>{customer?.mobile}</Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                customer?.status === 'active' ? styles.activeBadgeGreen : styles.activeBadgeRed,
              ]}>
              <Text
                style={[
                  styles.activeBadgeText,
                  customer?.status === 'active' ? styles.activeBadgeTextGreen : styles.activeBadgeTextRed,
                ]}>
                {customer?.status?.toUpperCase() || 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Direct Communication Buttons */}
          <View style={styles.commsRow}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Text style={styles.callBtnText}>📞 Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsappBtn} onPress={() => setWhatsappModalVisible(true)}>
              <Text style={styles.whatsappBtnText}>💬 WhatsApp Reminder</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Paid</Text>
              <Text style={[styles.metricValue, styles.metricPaid]}>{formatCurrency(totalPaid)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Outstanding Due</Text>
              <Text style={[styles.metricValue, styles.metricPending]}>
                {formatCurrency(totalPending)}
              </Text>
            </View>
          </View>
        </View>

        {/* History Timeline */}
        <View style={styles.historySection}>
          <Text style={styles.sectionHeading}>Payment Records ({history.length} Months)</Text>
          <Text style={styles.sectionSubtitle}>Tap any month to update or record collection</Text>

          {loading && !refreshing ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No monthly collection records found yet</Text>
            </View>
          ) : (
            history.map((entry) => {
              const isPaid = entry.paymentStatus === 'PAID';
              return (
                <TouchableOpacity
                  key={entry._id || entry.month}
                  style={styles.entryRow}
                  onPress={() => handleRowPress(entry)}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryMonth}>{formatMonthYear(entry.month)}</Text>
                    {entry.updatedAt ? (
                      <Text style={styles.entryDate}>Recorded: {formatDate(entry.updatedAt)}</Text>
                    ) : null}
                    {entry.remarks ? (
                      <Text style={styles.entryRemarks}>Note: {entry.remarks}</Text>
                    ) : null}
                  </View>

                  <View style={styles.entryRight}>
                    <Text style={[styles.entryAmount, isPaid ? styles.amountPaid : styles.amountPending]}>
                      {formatCurrency(entry.amount)}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        isPaid ? styles.badgePaid : styles.badgePending,
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          isPaid ? styles.badgeTextPaid : styles.badgeTextPending,
                        ]}>
                        {isPaid ? '✓ PAID' : '⏳ PENDING'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Monthly Entry Edit Modal */}
      {entryModalState.visible && (
        <MonthlyEntryModal
          visible={entryModalState.visible}
          onClose={() => setEntryModalState((prev) => ({ ...prev, visible: false }))}
          customerId={customer._id}
          customerName={customer.name}
          customerMobile={customer.mobile}
          month={entryModalState.month}
          existingEntry={entryModalState.existingEntry}
          onSaved={() => {
            fetchHistory();
          }}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        visible={whatsappModalVisible}
        onClose={() => setWhatsappModalVisible(false)}
        customer={{
          _id: customer._id,
          name: customer.name,
          mobile: customer.mobile,
          amount: totalPending > 0 ? totalPending : 300,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  backBtnText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  custName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  custMobile: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeGreen: {
    backgroundColor: '#dcfce7',
  },
  activeBadgeRed: {
    backgroundColor: '#fee2e2',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadgeTextGreen: {
    color: '#15803d',
  },
  activeBadgeTextRed: {
    color: '#b91c1c',
  },
  commsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  whatsappBtn: {
    flex: 1.3,
    backgroundColor: '#dcfce7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsappBtnText: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  metricPaid: {
    color: '#15803d',
  },
  metricPending: {
    color: '#dc2626',
  },
  historySection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  loaderBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  entryLeft: {
    flex: 1,
  },
  entryMonth: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  entryDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  entryRemarks: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountPaid: {
    color: '#15803d',
  },
  amountPending: {
    color: '#dc2626',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
  },
  badgePaid: {
    backgroundColor: '#dcfce7',
  },
  badgePending: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextPaid: {
    color: '#15803d',
  },
  badgeTextPending: {
    color: '#b91c1c',
  },
});

export default CustomerHistoryScreen;
