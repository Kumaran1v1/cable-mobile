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
  Linking,
  Alert,
} from 'react-native';
import { dashboardApi } from '../../api/dashboardApi';
import { DashboardSummaryData, UnpaidCustomerItem } from '../../types/dashboard.types';
import {
  formatCurrency,
  formatMonthYear,
  getOffsetMonthString,
  getCurrentMonthString,
} from '../../utils/format';
import { WhatsAppReminderModal } from '../../components/WhatsAppReminderModal';
import { MonthlyEntryModal } from '../../components/MonthlyEntryModal';

export const DashboardScreen = () => {
  const currentMonthStr = getCurrentMonthString();
  const currentYear = currentMonthStr.split('-')[0];

  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [whatsAppModalCust, setWhatsAppModalCust] = useState<UnpaidCustomerItem | null>(null);
  const [entryModalCust, setEntryModalCust] = useState<UnpaidCustomerItem | null>(null);

  const fetchSummary = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await dashboardApi.getSummary(selectedYear, selectedMonth);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePrevMonth = () => {
    const prev = getOffsetMonthString(selectedMonth, -1);
    setSelectedMonth(prev);
    setSelectedYear(prev.split('-')[0]);
  };

  const handleNextMonth = () => {
    if (selectedMonth >= currentMonthStr) return;
    const next = getOffsetMonthString(selectedMonth, 1);
    setSelectedMonth(next);
    setSelectedYear(next.split('-')[0]);
  };

  const filteredUnpaid = useMemo(() => {
    if (!data?.unpaidCustomers) return [];
    if (!searchQuery.trim()) return data.unpaidCustomers;
    const q = searchQuery.toLowerCase().trim();
    return data.unpaidCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q)
    );
  }, [data?.unpaidCustomers, searchQuery]);

  const handleCall = (mobile: string) => {
    Linking.openURL(`tel:${mobile}`);
  };

  return (
    <View style={styles.container}>
      {/* Month Navigator Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.navArrow} onPress={handlePrevMonth}>
          <Text style={styles.navArrowText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={styles.navMonthText}>{formatMonthYear(selectedMonth)}</Text>
          <Text style={styles.navSubText}>Summary & Collections</Text>
        </View>

        <TouchableOpacity
          style={[styles.navArrow, selectedMonth >= currentMonthStr && styles.navArrowDisabled]}
          onPress={handleNextMonth}
          disabled={selectedMonth >= currentMonthStr}>
          <Text
            style={[
              styles.navArrowText,
              selectedMonth >= currentMonthStr && styles.navArrowTextDisabled,
            ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSummary(true)} />
        }>
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderText}>Loading dashboard metrics...</Text>
          </View>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Total Subscribers */}
              <View style={[styles.kpiCard, styles.kpiBlue]}>
                <Text style={styles.kpiLabel}>Total Subscribers</Text>
                <Text style={styles.kpiValue}>{data?.customerCount || 0}</Text>
                <Text style={styles.kpiSub}>Registered customers</Text>
              </View>

              {/* Card 2: This Month Collected */}
              <View style={[styles.kpiCard, styles.kpiGreen]}>
                <Text style={styles.kpiLabel}>Collected This Month</Text>
                <Text style={styles.kpiValue}>
                  {formatCurrency(data?.currentMonthCollection || 0)}
                </Text>
                <Text style={styles.kpiSub}>{data?.paidCustomersCount || 0} Paid customers</Text>
              </View>

              {/* Card 3: This Month Pending */}
              <View style={[styles.kpiCard, styles.kpiRed]}>
                <Text style={styles.kpiLabel}>Pending This Month</Text>
                <Text style={styles.kpiValue}>
                  {formatCurrency(data?.currentMonthPendingAmount || 0)}
                </Text>
                <Text style={styles.kpiSub}>{data?.thisMonthNotPaidCount || 0} Unpaid customers</Text>
              </View>

              {/* Card 4: 1-Year Total Collection */}
              <View style={[styles.kpiCard, styles.kpiPurple]}>
                <Text style={styles.kpiLabel}>1-Year Total Collection</Text>
                <Text style={styles.kpiValue}>
                  {formatCurrency(data?.oneYearCollection || 0)}
                </Text>
                <Text style={styles.kpiSub}>
                  Pending: {formatCurrency(data?.oneYearPendingAmount || 0)}
                </Text>
              </View>
            </View>

            {/* Monthly Trend List */}
            {data?.monthlyOverview && data.monthlyOverview.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Monthly Overview ({selectedYear})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overviewScroll}>
                  {data.monthlyOverview.map((item) => (
                    <View
                      key={item.month}
                      style={[
                        styles.overviewItem,
                        item.month === selectedMonth && styles.overviewItemActive,
                      ]}>
                      <Text
                        style={[
                          styles.overviewMonthName,
                          item.month === selectedMonth && styles.overviewMonthNameActive,
                        ]}>
                        {item.short}
                      </Text>
                      <Text style={styles.overviewCollected}>{formatCurrency(item.collected)}</Text>
                      {item.pending > 0 && (
                        <Text style={styles.overviewPending}>Due: {formatCurrency(item.pending)}</Text>
                      )}
                      <Text style={styles.overviewCount}>
                        {item.paidCount} paid • {item.pendingCount} due
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Unpaid Customers Section */}
            <View style={styles.sectionCard}>
              <View style={styles.unpaidHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Unpaid Subscribers</Text>
                  <Text style={styles.sectionSub}>
                    {filteredUnpaid.length} customers with pending balance for {formatMonthYear(selectedMonth)}
                  </Text>
                </View>
              </View>

              {/* Search Bar */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search unpaid by name or mobile..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {filteredUnpaid.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>🎉 No pending customers found for this month!</Text>
                </View>
              ) : (
                filteredUnpaid.map((cust) => (
                  <View key={cust._id} style={styles.custCard}>
                    <View style={styles.custInfo}>
                      <Text style={styles.custName}>{cust.name}</Text>
                      <Text style={styles.custMobile}>{cust.mobile}</Text>
                      <Text style={styles.custDue}>Due: {formatCurrency(cust.amount || 300)}</Text>
                    </View>

                    <View style={styles.actionRow}>
                      {/* Call Button */}
                      <TouchableOpacity
                        style={styles.callActionBtn}
                        onPress={() => handleCall(cust.mobile)}>
                        <Text style={styles.actionBtnText}>📞 Call</Text>
                      </TouchableOpacity>

                      {/* WhatsApp Reminder Button */}
                      <TouchableOpacity
                        style={styles.whatsappActionBtn}
                        onPress={() => setWhatsAppModalCust(cust)}>
                        <Text style={styles.whatsappActionText}>💬 WhatsApp</Text>
                      </TouchableOpacity>

                      {/* Collect Button */}
                      <TouchableOpacity
                        style={styles.collectActionBtn}
                        onPress={() => setEntryModalCust(cust)}>
                        <Text style={styles.collectActionText}>₹ Collect</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        visible={!!whatsAppModalCust}
        onClose={() => setWhatsAppModalCust(null)}
        customer={whatsAppModalCust}
        month={selectedMonth}
      />

      {/* Monthly Entry Quick Collect Modal */}
      {entryModalCust && (
        <MonthlyEntryModal
          visible={!!entryModalCust}
          onClose={() => setEntryModalCust(null)}
          customerId={entryModalCust._id}
          customerName={entryModalCust.name}
          customerMobile={entryModalCust.mobile}
          month={selectedMonth}
          existingEntry={entryModalCust.existingEntry}
          onSaved={() => {
            fetchSummary();
            setEntryModalCust(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    backgroundColor: '#f1f5f9',
  },
  navArrowText: {
    fontSize: 26,
    color: '#2563eb',
    fontWeight: '700',
    lineHeight: 30,
  },
  navArrowTextDisabled: {
    color: '#cbd5e1',
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  navMonthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  navSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },
  kpiBlue: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  kpiGreen: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  kpiRed: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  kpiPurple: {
    backgroundColor: '#faf5ff',
    borderLeftWidth: 4,
    borderLeftColor: '#9333ea',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748b',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  overviewScroll: {
    marginTop: 12,
    flexDirection: 'row',
  },
  overviewItem: {
    width: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overviewItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  overviewMonthName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  overviewMonthNameActive: {
    color: '#2563eb',
  },
  overviewCollected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 4,
  },
  overviewPending: {
    fontSize: 11,
    color: '#b91c1c',
    marginTop: 2,
  },
  overviewCount: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  unpaidHeader: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },
  custCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  custInfo: {
    marginBottom: 8,
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  custMobile: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  custDue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  callActionBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  whatsappActionBtn: {
    flex: 1.4,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
  },
  whatsappActionText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
  },
  collectActionBtn: {
    flex: 1.2,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  collectActionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default DashboardScreen;
