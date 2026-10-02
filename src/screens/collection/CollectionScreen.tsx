import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { collectionApi } from '../../api/collectionApi';
import { GridCustomer, MonthlyEntry, Customer } from '../../types/collection.types';
import { formatCurrency, formatMonthYear, getCurrentMonthString } from '../../utils/format';
import { CreateCustomerModal } from '../../components/CreateCustomerModal';
import { EditCustomerModal } from '../../components/EditCustomerModal';
import { MonthlyEntryModal } from '../../components/MonthlyEntryModal';
import { YouTubeHeader } from '../../components/YouTubeHeader';
import { CollectionSkeleton, YouTubeTopProgressBar } from '../../components/YouTubeSkeleton';

const MONTH_NAMES = [
  { num: '01', short: 'Jan', full: 'January' },
  { num: '02', short: 'Feb', full: 'February' },
  { num: '03', short: 'Mar', full: 'March' },
  { num: '04', short: 'Apr', full: 'April' },
  { num: '05', short: 'May', full: 'May' },
  { num: '06', short: 'Jun', full: 'June' },
  { num: '07', short: 'Jul', full: 'July' },
  { num: '08', short: 'Aug', full: 'August' },
  { num: '09', short: 'Sep', full: 'September' },
  { num: '10', short: 'Oct', full: 'October' },
  { num: '11', short: 'Nov', full: 'November' },
  { num: '12', short: 'Dec', full: 'December' },
];

export const CollectionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark, toggleTheme } = useTheme();

  const currentSystemDate = new Date();
  const currentYear = currentSystemDate.getFullYear().toString();
  const currentMonthNum = String(currentSystemDate.getMonth() + 1).padStart(2, '0');
  const currentYearMonth = `${currentYear}-${currentMonthNum}`;

  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [customers, setCustomers] = useState<GridCustomer[]>([]);
  const [monthSummaries, setMonthSummaries] = useState<
    Record<string, { totalAmount: number; totalPaid: number; totalPending: number }>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editCustomer, setEditCustomer] = useState<GridCustomer | null>(null);
  const [entryModalState, setEntryModalState] = useState<{
    visible: boolean;
    customerId: string;
    customerName: string;
    customerMobile: string;
    month: string;
    existingEntry: MonthlyEntry | null;
  }>({
    visible: false,
    customerId: '',
    customerName: '',
    customerMobile: '',
    month: '',
    existingEntry: null,
  });

  const fetchGridData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const res = await collectionApi.getYearGrid(selectedYear);
        setCustomers(res.data || []);
        setMonthSummaries(res.monthSummaries || {});
        setLoadError(null);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Server connecting or warming up...';
        setLoadError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    fetchGridData();
  }, [fetchGridData]);

  // Screen focus re-verification
  useFocusEffect(
    useCallback(() => {
      if (customers.length === 0 && !loading) {
        fetchGridData();
      }
    }, [customers.length, loading, fetchGridData])
  );

  // Year navigation
  const handlePrevYear = () => {
    const prev = (parseInt(selectedYear, 10) - 1).toString();
    setSelectedYear(prev);
  };

  const handleNextYear = () => {
    const nextNum = parseInt(selectedYear, 10) + 1;
    if (nextNum > parseInt(currentYear, 10)) return;
    setSelectedYear(nextNum.toString());
  };

  // Filter customers by search and status
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      const activeMonthKey = selectedYear === currentYear ? currentYearMonth : `${selectedYear}-12`;
      result = result.filter((c) => {
        const entry = c.entries?.[activeMonthKey];
        const isPaid = entry?.paymentStatus === 'PAID';
        if (statusFilter === 'paid') return isPaid;
        if (statusFilter === 'pending') return !isPaid;
        return true;
      });
    }

    return result;
  }, [customers, searchQuery, statusFilter, selectedYear, currentYear, currentYearMonth]);

  // Handle cell click on a specific month for a customer
  const handleCellClick = (customer: GridCustomer, monthStr: string) => {
    if (monthStr > currentYearMonth) {
      Alert.alert('Future Month', 'Cannot record entries for future months.');
      return;
    }

    const existing = customer.entries?.[monthStr] || null;
    setEntryModalState({
      visible: true,
      customerId: customer._id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      month: monthStr,
      existingEntry: existing,
    });
  };

  const handleOpenHistory = (cust: GridCustomer) => {
    const customerObj: Customer = {
      _id: cust._id,
      name: cust.name,
      mobile: cust.mobile,
      status: cust.status,
    };
    navigation.navigate('CustomerHistory', {
      customer: customerObj,
      initialMonth: currentYearMonth,
    });
  };

  // Active year totals
  const yearTotalPaid = useMemo(() => {
    return Object.values(monthSummaries).reduce((acc, m) => acc + (m.totalPaid || 0), 0);
  }, [monthSummaries]);

  const yearTotalPending = useMemo(() => {
    return Object.values(monthSummaries).reduce((acc, m) => acc + (m.totalPending || 0), 0);
  }, [monthSummaries]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* YouTube Style App Header with Sidebar Drawer & Profile Avatar */}
      <YouTubeHeader
        onNavigateTab={(tab) => navigation.navigate(tab)}
        title={selectedYear}
        subtitle="12-Month Matrix"
        showMonthNavigator={true}
        selectedMonth={selectedYear}
        onPrevMonth={handlePrevYear}
        onNextMonth={handleNextYear}
        canNextMonth={selectedYear < currentYear}
      />

      {/* YouTube Red Animated Progress Bar */}
      <YouTubeTopProgressBar active={loading || refreshing} />

      {/* Render Server Cold-Start / Retry Banner */}
      {loadError && !loading && (
        <View style={styles.errorBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>⚡ Connection Notice</Text>
            <Text style={styles.errorMessage}>{loadError}</Text>
          </View>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchGridData(false)}
            activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Year Financial Summary Strip with + Add Subscriber Action */}
      <View
        style={[
          styles.summaryStrip,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subscribers</Text>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{customers.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Collected</Text>
          <Text style={[styles.summaryVal, { color: colors.success }]}>
            {formatCurrency(yearTotalPaid)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          <Text style={[styles.summaryVal, { color: colors.danger }]}>
            {formatCurrency(yearTotalPending)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}>
          <Text style={styles.quickAddBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View
        style={[
          styles.filterBox,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="Search by subscriber name or 10-digit mobile..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filterChipRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: statusFilter === 'all' ? colors.chipActiveBg : colors.chipBg },
            ]}
            onPress={() => setStatusFilter('all')}>
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'all' ? '#ffffff' : colors.textSecondary },
              ]}>
              All ({customers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: statusFilter === 'paid' ? colors.success : colors.chipBg },
            ]}
            onPress={() => setStatusFilter('paid')}>
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'paid' ? '#ffffff' : colors.textSecondary },
              ]}>
              Paid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: statusFilter === 'pending' ? colors.danger : colors.chipBg },
            ]}
            onPress={() => setStatusFilter('pending')}>
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === 'pending' ? '#ffffff' : colors.textSecondary },
              ]}>
              Pending
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer List with 12-Month Calendar Grid */}
      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchGridData(true)}
            tintColor={colors.primary}
            colors={['#ef4444', colors.primary]}
          />
        }>
        {loading && !refreshing && customers.length === 0 ? (
          <CollectionSkeleton />
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Subscribers Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {searchQuery ? 'Try another name or mobile' : 'Tap "+ Add" to create your first subscriber'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((cust) => {
            return (
              <View
                key={cust._id}
                style={[
                  styles.customerCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}>
                {/* Subscriber Card Header */}
                <View style={styles.cardTopRow}>
                  <View style={styles.subscriberInfo}>
                    <Text style={[styles.custName, { color: colors.text }]}>{cust.name}</Text>
                    <Text style={[styles.custMobile, { color: colors.textSecondary }]}>
                      {cust.mobile}
                    </Text>
                  </View>

                  <View style={styles.cardHeaderActions}>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: colors.chipBg }]}
                      onPress={() => handleOpenHistory(cust)}>
                      <Text style={[styles.smallBtnText, { color: colors.primary }]}>📜 History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallIconBtn, { backgroundColor: colors.chipBg }]}
                      onPress={() => setEditCustomer(cust)}>
                      <Text style={{ fontSize: 13 }}>⚙️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 12-Month Interactive Calendar Grid */}
                <Text style={[styles.gridNotice, { color: colors.textMuted }]}>
                  Tap any month to record / update collection:
                </Text>
                <View style={styles.calendarGrid}>
                  {MONTH_NAMES.map((m) => {
                    const monthKey = `${selectedYear}-${m.num}`;
                    const entry = cust.entries?.[monthKey];
                    const isFuture = monthKey > currentYearMonth;
                    const isCurrent = monthKey === currentYearMonth;
                    const isPaid = entry?.paymentStatus === 'PAID';
                    const isPending = entry?.paymentStatus === 'PENDING' || (!isPaid && !isFuture);

                    let cellBg = colors.chipBg;
                    let textColor = colors.textSecondary;
                    let badgeLabel = '';

                    if (isFuture) {
                      cellBg = isDark ? '#1a2234' : '#f1f5f9';
                      textColor = colors.textMuted;
                    } else if (isPaid) {
                      cellBg = isDark ? '#064e3b' : '#dcfce7';
                      textColor = isDark ? '#a7f3d0' : '#15803d';
                      badgeLabel = entry?.amount ? `₹${entry.amount}` : 'PAID';
                    } else if (isPending) {
                      cellBg = isDark ? '#7f1d1d' : '#fee2e2';
                      textColor = isDark ? '#fca5a5' : '#b91c1c';
                      badgeLabel = 'DUE';
                    }

                    return (
                      <TouchableOpacity
                        key={m.num}
                        disabled={isFuture}
                        style={[
                          styles.monthCell,
                          {
                            backgroundColor: cellBg,
                            borderColor: isCurrent ? colors.primary : colors.cardBorder,
                            borderWidth: isCurrent ? 2 : 1,
                          },
                        ]}
                        onPress={() => handleCellClick(cust, monthKey)}>
                        <Text
                          style={[
                            styles.monthCellLabel,
                            { color: textColor },
                            isCurrent && { fontWeight: '800' },
                          ]}>
                          {m.short}
                        </Text>
                        <Text style={[styles.monthCellAmount, { color: textColor }]}>
                          {isFuture ? '—' : badgeLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCustomerCreated={() => {
          fetchGridData();
        }}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        visible={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        customer={editCustomer}
        onCustomerUpdated={() => {
          fetchGridData();
        }}
        onCustomerDeleted={() => {
          fetchGridData();
        }}
      />

      {/* Monthly Entry Modal */}
      <MonthlyEntryModal
        visible={entryModalState.visible}
        onClose={() =>
          setEntryModalState((prev) => ({ ...prev, visible: false }))
        }
        customerId={entryModalState.customerId}
        customerName={entryModalState.customerName}
        customerMobile={entryModalState.customerMobile}
        month={entryModalState.month}
        existingEntry={entryModalState.existingEntry}
        onSaved={() => {
          fetchGridData();
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
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  yearArrow: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  yearArrowDisabled: {
    opacity: 0.4,
  },
  yearArrowText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryStrip: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#cbd5e1',
    opacity: 0.5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  filterBox: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
  },
  customerCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subscriberInfo: {
    flex: 1,
  },
  custName: {
    fontSize: 16,
    fontWeight: '700',
  },
  custMobile: {
    fontSize: 13,
    marginTop: 2,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridNotice: {
    fontSize: 11,
    marginTop: 10,
    marginBottom: 6,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '15%',
    minWidth: 46,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthCellAmount: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
  errorMessage: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  quickAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  quickAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default CollectionScreen;
