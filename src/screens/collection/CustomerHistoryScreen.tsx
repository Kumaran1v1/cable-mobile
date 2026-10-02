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
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { collectionApi } from '../../api/collectionApi';
import { Customer, MonthlyEntry } from '../../types/collection.types';
import { formatCurrency, formatMonthYear, formatDate } from '../../utils/format';
import { MonthlyEntryModal } from '../../components/MonthlyEntryModal';
import { WhatsAppReminderModal } from '../../components/WhatsAppReminderModal';

export const CustomerHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Safe Area Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.chipBg }]}
          onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Customer History</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            tintColor={colors.primary}
          />
        }>
        {/* Customer Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={[styles.custName, { color: colors.text }]}>{customer?.name}</Text>
              <Text style={[styles.custMobile, { color: colors.textSecondary }]}>
                {customer?.mobile}
              </Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                customer?.status === 'active'
                  ? { backgroundColor: colors.successBg }
                  : { backgroundColor: colors.dangerBg },
              ]}>
              <Text
                style={[
                  styles.activeBadgeText,
                  customer?.status === 'active'
                    ? { color: colors.success }
                    : { color: colors.danger },
                ]}>
                {customer?.status?.toUpperCase() || 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Direct Communication Buttons */}
          <View style={styles.commsRow}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: colors.chipBg }]}
              onPress={handleCall}>
              <Text style={[styles.callBtnText, { color: colors.text }]}>📞 Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.whatsappBtn, { backgroundColor: colors.successBg }]}
              onPress={() => setWhatsappModalVisible(true)}>
              <Text style={[styles.whatsappBtnText, { color: colors.success }]}>
                💬 WhatsApp Reminder
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics */}
          <View
            style={[
              styles.metricsRow,
              { backgroundColor: colors.chipBg, borderColor: colors.cardBorder },
            ]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Paid</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Outstanding Due
              </Text>
              <Text style={[styles.metricValue, { color: colors.danger }]}>
                {formatCurrency(totalPending)}
              </Text>
            </View>
          </View>
        </View>

        {/* History Timeline */}
        <View
          style={[
            styles.historySection,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Payment Records ({history.length} Months)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap any month to update or record collection
          </Text>

          {loading && !refreshing ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No monthly collection records found yet
              </Text>
            </View>
          ) : (
            history.map((entry) => {
              const isPaid = entry.paymentStatus === 'PAID';
              return (
                <TouchableOpacity
                  key={entry._id || entry.month}
                  style={[styles.entryRow, { borderBottomColor: colors.cardBorder }]}
                  onPress={() => handleRowPress(entry)}>
                  <View style={styles.entryLeft}>
                    <Text style={[styles.entryMonth, { color: colors.text }]}>
                      {formatMonthYear(entry.month)}
                    </Text>
                    {entry.updatedAt ? (
                      <Text style={[styles.entryDate, { color: colors.textMuted }]}>
                        Recorded: {formatDate(entry.updatedAt)}
                      </Text>
                    ) : null}
                    {entry.remarks ? (
                      <Text style={[styles.entryRemarks, { color: colors.textSecondary }]}>
                        Note: {entry.remarks}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.entryRight}>
                    <Text
                      style={[
                        styles.entryAmount,
                        { color: isPaid ? colors.success : colors.danger },
                      ]}>
                      {formatCurrency(entry.amount)}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: isPaid ? colors.successBg : colors.dangerBg },
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          { color: isPaid ? colors.success : colors.danger },
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
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
  },
  custMobile: {
    fontSize: 14,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  commsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  callBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  whatsappBtn: {
    flex: 1.3,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  historySection: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
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
    fontSize: 14,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  entryLeft: {
    flex: 1,
  },
  entryMonth: {
    fontSize: 15,
    fontWeight: '600',
  },
  entryDate: {
    fontSize: 11,
    marginTop: 2,
  },
  entryRemarks: {
    fontSize: 12,
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default CustomerHistoryScreen;
