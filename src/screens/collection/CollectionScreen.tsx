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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collectionApi } from '../../api/collectionApi';
import { GridCustomer, MonthlyEntry, Customer } from '../../types/collection.types';
import { formatCurrency, formatMonthYear, getCurrentMonthString } from '../../utils/format';
import { CreateCustomerModal } from '../../components/CreateCustomerModal';
import { EditCustomerModal } from '../../components/EditCustomerModal';
import { MonthlyEntryModal } from '../../components/MonthlyEntryModal';

const MONTH_TABS = [
  { num: '01', short: 'Jan' },
  { num: '02', short: 'Feb' },
  { num: '03', short: 'Mar' },
  { num: '04', short: 'Apr' },
  { num: '05', short: 'May' },
  { num: '06', short: 'Jun' },
  { num: '07', short: 'Jul' },
  { num: '08', short: 'Aug' },
  { num: '09', short: 'Sep' },
  { num: '10', short: 'Oct' },
  { num: '11', short: 'Nov' },
  { num: '12', short: 'Dec' },
];

export const CollectionScreen = () => {
  const navigation = useNavigation<any>();
  const currentMonthStr = getCurrentMonthString();
  const currentYear = currentMonthStr.split('-')[0];
  const currentMonthNum = currentMonthStr.split('-')[1];

  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonthNum, setSelectedMonthNum] = useState<string>(currentMonthNum);
  const [customers, setCustomers] = useState<GridCustomer[]>([]);
  const [monthSummaries, setMonthSummaries] = useState<
    Record<string, { totalAmount: number; totalPaid: number; totalPending: number }>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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

  const selectedFullMonth = `${selectedYear}-${selectedMonthNum}`;

  const fetchGridData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await collectionApi.getYearGrid(selectedYear);
        setCustomers(res.data || []);
        setMonthSummaries(res.monthSummaries || {});
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to load collections');
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

  // Filter customers by search and payment status for the selected month
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => {
        const entry = c.entries?.[selectedFullMonth];
        const isPaid = entry?.paymentStatus === 'PAID';
        if (statusFilter === 'paid') return isPaid;
        if (statusFilter === 'pending') return !isPaid;
        return true;
      });
    }

    return result;
  }, [customers, searchQuery, statusFilter, selectedFullMonth]);

  const currentSummary = monthSummaries[selectedFullMonth] || {
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
  };

  const handleOpenEntry = (cust: GridCustomer) => {
    const existing = cust.entries?.[selectedFullMonth] || null;
    setEntryModalState({
      visible: true,
      customerId: cust._id,
      customerName: cust.name,
      customerMobile: cust.mobile,
      month: selectedFullMonth,
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
      initialMonth: selectedFullMonth,
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Year Selector */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Monthly Collections</Text>
          <Text style={styles.headerSub}>{formatMonthYear(selectedFullMonth)}</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Month Tabs Bar */}
      <View style={styles.monthTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthTabsScroll}>
          {MONTH_TABS.map((tab) => {
            const isActive = tab.num === selectedMonthNum;
            return (
              <TouchableOpacity
                key={tab.num}
                style={[styles.monthTab, isActive && styles.monthTabActive]}
                onPress={() => setSelectedMonthNum(tab.num)}>
                <Text style={[styles.monthTabText, isActive && styles.monthTabTextActive]}>
                  {tab.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Monthly Collection Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Target</Text>
          <Text style={styles.summaryValue}>{formatCurrency(currentSummary.totalAmount)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Collected</Text>
          <Text style={[styles.summaryValue, styles.summaryPaid]}>
            {formatCurrency(currentSummary.totalPaid)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, styles.summaryPending]}>
            {formatCurrency(currentSummary.totalPending)}
          </Text>
        </View>
      </View>

      {/* Search & Filter Controls */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or 10-digit mobile..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}>
            <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
              All ({customers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'paid' && styles.filterChipActive]}
            onPress={() => setStatusFilter('paid')}>
            <Text style={[styles.filterChipText, statusFilter === 'paid' && styles.filterChipTextActive]}>
              Paid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
            onPress={() => setStatusFilter('pending')}>
            <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchGridData(true)} />
        }>
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderText}>Loading subscribers...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Customers Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try matching another name or number' : 'Click "+ Add Customer" above to add'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((cust) => {
            const entry = cust.entries?.[selectedFullMonth];
            const isPaid = entry?.paymentStatus === 'PAID';
            const amount = entry?.amount !== undefined ? entry.amount : 300;

            return (
              <View key={cust._id} style={styles.customerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameBlock}>
                    <Text style={styles.custName}>{cust.name}</Text>
                    <Text style={styles.custMobile}>{cust.mobile}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isPaid ? styles.statusBadgePaid : styles.statusBadgePending,
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isPaid ? styles.statusBadgeTextPaid : styles.statusBadgeTextPending,
                      ]}>
                      {isPaid ? `✓ Paid ${formatCurrency(amount)}` : `⏳ Due ${formatCurrency(amount)}`}
                    </Text>
                  </View>
                </View>

                {entry?.remarks ? (
                  <Text style={styles.remarksText}>Note: {entry.remarks}</Text>
                ) : null}

                {/* Actions Footer */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionCollectBtn}
                    onPress={() => handleOpenEntry(cust)}>
                    <Text style={styles.actionCollectText}>
                      {isPaid ? '✏️ Edit Payment' : '₹ Record Collection'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionHistoryBtn}
                    onPress={() => handleOpenHistory(cust)}>
                    <Text style={styles.actionHistoryText}>📜 History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => setEditCustomer(cust)}>
                    <Text style={styles.actionEditText}>⚙️</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  monthTabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  monthTabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  monthTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  monthTabActive: {
    backgroundColor: '#2563eb',
  },
  monthTabText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  monthTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  summaryPaid: {
    color: '#16a34a',
  },
  summaryPending: {
    color: '#dc2626',
  },
  filterSection: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 32,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: {
    flex: 1,
  },
  custName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  custMobile: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgePaid: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextPaid: {
    color: '#15803d',
  },
  statusBadgeTextPending: {
    color: '#b91c1c',
  },
  remarksText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  actionCollectBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
  },
  actionCollectText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '700',
  },
  actionHistoryBtn: {
    flex: 1.2,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  actionHistoryText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  actionEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionEditText: {
    fontSize: 15,
  },
});

export default CollectionScreen;
