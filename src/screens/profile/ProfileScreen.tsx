import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { BASE_URL } from '../../config/env';
import { YouTubeHeader } from '../../components/YouTubeHeader';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        companyName: companyName.trim(),
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      await userApi.updateProfile(payload);
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
      setPassword('');
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.message || err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* YouTube Style App Header with Sidebar Drawer & Profile Avatar */}
      <YouTubeHeader
        subtitle="Operator Account"
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}>
        {/* Profile Card Header */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.name || 'A').substring(0, 2).toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.userRole, { color: colors.primary }]}>
            {user?.role?.toUpperCase() || 'COLLECTION AGENT'}
          </Text>
          <Text style={[styles.companyName, { color: colors.textSecondary }]}>
            {user?.companyName || 'Cable Network'}
          </Text>
        </View>

        {/* Details / Edit Form Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Account Details</Text>
            <TouchableOpacity
              style={[styles.editToggleBtn, { backgroundColor: colors.primaryLight }]}
              onPress={() => setIsEditing(!isEditing)}>
              <Text style={[styles.editToggleText, { color: colors.primary }]}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isEditing ? colors.inputBg : colors.chipBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            editable={isEditing}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mobile Number</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isEditing ? colors.inputBg : colors.chipBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            editable={isEditing}
            keyboardType="number-pad"
            value={mobile}
            onChangeText={setMobile}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isEditing ? colors.inputBg : colors.chipBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            editable={isEditing}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cable Operator / Company</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isEditing ? colors.inputBg : colors.chipBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            editable={isEditing}
            value={companyName}
            onChangeText={setCompanyName}
          />

          {isEditing && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                New Password (leave blank to keep current)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Display / Theme Mode Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Display Theme</Text>
          <View style={styles.themeToggleRow}>
            <View>
              <Text style={[styles.themeRowTitle, { color: colors.text }]}>
                {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Text>
              <Text style={[styles.themeRowSub, { color: colors.textSecondary }]}>
                Switch between high-contrast dark and daytime light
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.themeSwitchBtn,
                { backgroundColor: isDark ? colors.primary : '#e2e8f0' },
              ]}
              onPress={toggleTheme}>
              <Text style={[styles.themeSwitchText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                {isDark ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System & Connection Status */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>System Information</Text>
          <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Version</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>v1.0.0 (Cable Connect)</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Live Server</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>
              {BASE_URL.replace('/api', '')}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>API Health</Text>
            <Text style={[styles.infoVal, { color: colors.success }]}>● Connected</Text>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}
          onPress={handleLogout}>
          <Text style={[styles.logoutBtnText, { color: colors.danger }]}>
            Log Out from Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  companyName: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  themeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  themeRowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  themeSwitchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  themeSwitchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
