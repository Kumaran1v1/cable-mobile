import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus states for glowing input borders
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Background floating ambient glow
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance Fade & Slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Glowing Logo Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Ambient Background Floating Spheres
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 15,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: -15,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: -20,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 10,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, pulseAnim, floatAnim1, floatAnim2]);

  // Trigger shake animation on error
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier and password');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to connect to server. Check credentials.';
      setErrorMessage(msg);
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setIdentifier('admin');
    setPassword('admin');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Deep Cyber Gradient Background Base */}
      <View style={styles.deepBg}>
        {/* Glowing Ambient Mesh Orbs */}
        <Animated.View
          style={[
            styles.glowOrbTeal,
            {
              transform: [{ translateY: floatAnim1 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowOrbBlue,
            {
              transform: [{ translateY: floatAnim2 }],
            },
          ]}
        />
        <View style={styles.gridOverlay} />
      </View>

      {/* Floating Theme Mode Toggle */}
      <TouchableOpacity
        style={[styles.themeBtn, { top: Math.max(insets.top, 16) }]}
        onPress={toggleTheme}
        activeOpacity={0.8}>
        <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 20,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled">
        {/* Animated Card with Shake & Fade Physics */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}>
          {/* Glowing Animated Brand Emblem */}
          <Animated.View
            style={[
              styles.logoHalo,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>📡</Text>
            </View>
          </Animated.View>

          {/* Header Typography */}
          <Text style={styles.appTitle}>Cable Connect</Text>
          <Text style={styles.appSubtitle}>Network & Field Collection Portal</Text>

          {/* Quick Demo Pill */}
          <TouchableOpacity style={styles.demoPill} onPress={fillDemoAdmin}>
            <Text style={styles.demoPillText}>⚡ Auto-fill Admin Login</Text>
          </TouchableOpacity>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Input 1: Identifier / Mobile / Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IDENTIFIER / USERNAME / MOBILE</Text>
            <View
              style={[
                styles.inputWrapper,
                identifierFocused && styles.inputWrapperFocused,
              ]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. admin or 9876543210"
                placeholderTextColor="#64748b"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                onFocus={() => setIdentifierFocused(true)}
                onBlur={() => setIdentifierFocused(false)}
              />
            </View>
          </View>

          {/* Input 2: Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animated Login Action Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isSubmitting}
              activeOpacity={0.9}>
              {isSubmitting ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator color="#0f172a" size="small" />
                  <Text style={styles.submitButtonTextLoading}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Sign In to Dashboard →</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer Security Badges */}
          <View style={styles.securityRow}>
            <Text style={styles.securityText}>🔒 256-bit Encrypted Session</Text>
            <Text style={styles.securityDot}>•</Text>
            <Text style={styles.securityText}>Live Render API</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  deepBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#070a12',
    overflow: 'hidden',
  },
  glowOrbTeal: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(13, 148, 136, 0.28)',
  },
  glowOrbBlue: {
    position: 'absolute',
    bottom: -80,
    right: -50,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    backgroundColor: 'transparent',
  },
  themeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  logoHalo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    marginBottom: 16,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2dd4bf',
    elevation: 4,
  },
  logoIcon: {
    fontSize: 26,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  demoPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  demoPillText: {
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#2dd4bf',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#f8fafc',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2dd4bf',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#090d16',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  submitButtonTextLoading: {
    color: '#090d16',
    fontSize: 15,
    fontWeight: '700',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
  },
  securityDot: {
    color: '#475569',
    fontSize: 10,
  },
});

export default LoginScreen;
