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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
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
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

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

  const fetchSummary = useCallback(
    async (isRefresh = false) => {
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
    },
    [selectedYear, selectedMonth]
  );

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Safe Area Navigator Header */}
      <View
        style={[
          styles.navHeader,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}>
        <TouchableOpacity
          style={[styles.navArrow, { backgroundColor: colors.chipBg }]}
          onPress={handlePrevMonth}>
          <Text style={[styles.navArrowText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={[styles.navMonthText, { color: colors.text }]}>
            {formatMonthYear(selectedMonth)}
          </Text>
          <Text style={[styles.navSubText, { color: colors.textSecondary }]}>
            Performance & Collections
          </Text>
        </View>

        <View style={styles.navRightRow}>
          <TouchableOpacity
            style={[
              styles.navArrow,
              { backgroundColor: colors.chipBg },
              selectedMonth >= currentMonthStr && styles.navArrowDisabled,
            ]}
            onPress={handleNextMonth}
            disabled={selectedMonth >= currentMonthStr}>
            <Text
              style={[
                styles.navArrowText,
                { color: selectedMonth >= currentMonthStr ? colors.textMuted : colors.primary },
              ]}>
              ›
            </Text>
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: colors.chipBg }]}
            onPress={toggleTheme}>
            <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSummary(true)}
            tintColor={colors.primary}
          />
        }>
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
              Loading dashboard metrics...
            </Text>
          </View>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Total Subscribers */}
              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: isDark ? '#172554' : '#eff6ff', borderLeftColor: colors.primary },
                ]}>
                <Text style={[styles.kpiLabel, { color: isDark ? '#93c5fd' : '#475569' }]}>
                  Total Subscribers
                </Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {data?.customerCount || 0}
                </Text>
                <Text style={[styles.kpiSub, { color: isDark ? '#bfdbfe' : '#64748b' }]}>
                  Registered customers
                </Text>
              </View>

              {/* Card 2: This Month Collected */}
              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: isDark ? '#052e16' : '#f0fdf4', borderLeftColor: colors.success },
                ]}>
                <Text style={[styles.kpiLabel, { color: isDark ? '#86efac' : '#475569' }]}>
                  Collected This Month
                </Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {formatCurrency(data?.currentMonthCollection || 0)}
                </Text>
                <Text style={[styles.kpiSub, { color: isDark ? '#bbf7d0' : '#64748b' }]}>
                  {data?.paidCustomersCount || 0} Paid customers
                </Text>
              </View>

              {/* Card 3: This Month Pending */}
              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderLeftColor: colors.danger },
                ]}>
                <Text style={[styles.kpiLabel, { color: isDark ? '#fca5a5' : '#475569' }]}>
                  Pending This Month
                </Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {formatCurrency(data?.currentMonthPendingAmount || 0)}
                </Text>
                <Text style={[styles.kpiSub, { color: isDark ? '#fecaca' : '#64748b' }]}>
                  {data?.thisMonthNotPaidCount || 0} Unpaid customers
                </Text>
              </View>

              {/* Card 4: 1-Year Total Collection */}
              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: isDark ? '#3b0764' : '#faf5ff', borderLeftColor: '#9333ea' },
                ]}>
                <Text style={[styles.kpiLabel, { color: isDark ? '#d8b4fe' : '#475569' }]}>
                  1-Year Total Collection
                </Text>
                <Text style={[styles.kpiValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {formatCurrency(data?.oneYearCollection || 0)}
                </Text>
                <Text style={[styles.kpiSub, { color: isDark ? '#e9d5ff' : '#64748b' }]}>
                  Pending: {formatCurrency(data?.oneYearPendingAmount || 0)}
                </Text>
              </View>
            </View>

            {/* Monthly Trend List */}
            {data?.monthlyOverview && data.monthlyOverview.length > 0 && (
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Monthly Overview ({selectedYear})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overviewScroll}>
                  {data.monthlyOverview.map((item) => (
                    <View
                      key={item.month}
                      style={[
                        styles.overviewItem,
                        {
                          backgroundColor:
                            item.month === selectedMonth
                              ? isDark ? '#1e293b' : '#eff6ff'
                              : colors.chipBg,
                          borderColor:
                            item.month === selectedMonth ? colors.primary : colors.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.overviewMonthName,
                          {
                            color:
                              item.month === selectedMonth ? colors.primary : colors.text,
                          },
                        ]}>
                        {item.short}
                      </Text>
                      <Text style={[styles.overviewCollected, { color: colors.success }]}>
                        {formatCurrency(item.collected)}
                      </Text>
                      {item.pending > 0 && (
                        <Text style={[styles.overviewPending, { color: colors.danger }]}>
                          Due: {formatCurrency(item.pending)}
                        </Text>
                      )}
                      <Text style={[styles.overviewCount, { color: colors.textMuted }]}>
                        {item.paidCount} paid • {item.pendingCount} due
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Unpaid Customers Section */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.unpaidHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Unpaid Subscribers
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                  {filteredUnpaid.length} customers with pending balance for {formatMonthYear(selectedMonth)}
                </Text>
              </View>

              {/* Search Bar */}
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Search unpaid by name or mobile..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {filteredUnpaid.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: colors.success }]}>
                    🎉 No pending customers found for this month!
                  </Text>
                </View>
              ) : (
                filteredUnpaid.map((cust) => (
                  <View
                    key={cust._id}
                    style={[
                      styles.custCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                      },
                    ]}>
                    <View style={styles.custInfo}>
                      <Text style={[styles.custName, { color: colors.text }]}>{cust.name}</Text>
                      <Text style={[styles.custMobile, { color: colors.textSecondary }]}>
                        {cust.mobile}
                      </Text>
                      <Text style={[styles.custDue, { color: colors.danger }]}>
                        Due: {formatCurrency(cust.amount || 300)}
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.callActionBtn, { backgroundColor: colors.chipBg }]}
                        onPress={() => handleCall(cust.mobile)}>
                        <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                          📞 Call
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.whatsappActionBtn, { backgroundColor: colors.successBg }]}
                        onPress={() => setWhatsAppModalCust(cust)}>
                        <Text style={[styles.whatsappActionText, { color: colors.success }]}>
                          💬 WhatsApp
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.collectActionBtn, { backgroundColor: colors.primary }]}
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
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 2,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navArrowText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  navMonthText: {
    fontSize: 17,
    fontWeight: '700',
  },
  navSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
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
    borderLeftWidth: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  overviewScroll: {
    marginTop: 12,
    flexDirection: 'row',
  },
  overviewItem: {
    width: 100,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  overviewMonthName: {
    fontSize: 13,
    fontWeight: '700',
  },
  overviewCollected: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  overviewPending: {
    fontSize: 11,
    marginTop: 2,
  },
  overviewCount: {
    fontSize: 10,
    marginTop: 4,
  },
  unpaidHeader: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 12,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  custCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  custInfo: {
    marginBottom: 8,
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
  },
  custMobile: {
    fontSize: 13,
    marginTop: 1,
  },
  custDue: {
    fontSize: 13,
    fontWeight: '700',
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
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  whatsappActionBtn: {
    flex: 1.4,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  whatsappActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  collectActionBtn: {
    flex: 1.2,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  collectActionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default DashboardScreen;
