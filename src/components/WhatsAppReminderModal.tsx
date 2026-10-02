import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatMonthYear } from '../utils/format';

export interface WhatsAppReminderCustomer {
  _id: string;
  name: string;
  mobile: string;
  amount?: number;
}

interface WhatsAppReminderModalProps {
  visible: boolean;
  onClose: () => void;
  customer: WhatsAppReminderCustomer | null;
  month?: string;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  visible,
  onClose,
  customer,
  month,
}) => {
  const { user } = useAuth();
  const [pendingAmount, setPendingAmount] = useState<string>('300');
  const [language, setLanguage] = useState<'tamil' | 'english'>('tamil');
  const [message, setMessage] = useState<string>('');

  const companyName = user?.companyName || 'Cable Network';
  const adminName = user?.name || 'Administrator';
  const adminMobile = user?.mobile || '';

  const generateTemplate = (amt: string, lang: 'tamil' | 'english') => {
    if (!customer) return '';
    const displayAmount = amt.trim() || '300';
    const monthFormatted = month ? formatMonthYear(month) : '';

    if (lang === 'tamil') {
      return `வணக்கம் ${customer.name},

*${companyName}* கேபிள் டிவி சேவை${monthFormatted ? ` (${monthFormatted})` : ''}.

தங்களின் கேபிள் டிவி சந்தா நிலுவை பாக்கி தொகை: *₹${displayAmount}*.

தயவுசெய்து இத்தொகையை விரைவில் செலுத்துமாறு கேட்டுக்கொள்கிறோம்.

நன்றி & வாழ்த்துகள்,
*${adminName}*
${companyName}
தொடர்புக்கு: ${adminMobile}`;
    }

    return `Dear ${customer.name},

Greetings from *${companyName}* Cable TV${monthFormatted ? ` (${monthFormatted})` : ''}.

Your outstanding Cable TV subscription balance is: *₹${displayAmount}*.

Kindly settle this payment at your earliest convenience.

Thank you & Best regards,
*${adminName}*
${companyName}
Contact: ${adminMobile}`;
  };

  useEffect(() => {
    if (visible && customer) {
      const initialAmt = customer.amount && customer.amount > 0 ? String(customer.amount) : '300';
      setPendingAmount(initialAmt);
      setMessage(generateTemplate(initialAmt, language));
    }
  }, [visible, customer, language]);

  const handleAmountChange = (val: string) => {
    const rawVal = val.replace(/\D/g, '');
    setPendingAmount(rawVal);
    setMessage(generateTemplate(rawVal, language));
  };

  const handleLanguageChange = (lang: 'tamil' | 'english') => {
    setLanguage(lang);
    setMessage(generateTemplate(pendingAmount, lang));
  };

  const handleSendWhatsApp = async () => {
    if (!customer?.mobile) {
      Alert.alert('Error', 'Customer mobile number is missing');
      return;
    }

    const cleanMobile = customer.mobile.replace(/\D/g, '');
    const fullMobile = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${fullMobile}&text=${encodedMsg}`;
    const webFallbackUrl = `https://wa.me/${fullMobile}?text=${encodedMsg}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webFallbackUrl);
      }
      onClose();
    } catch {
      Alert.alert('WhatsApp Error', 'Could not launch WhatsApp. Please check if WhatsApp is installed.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Send WhatsApp Reminder</Text>
          <Text style={styles.subtitle}>
            {customer?.name} ({customer?.mobile})
          </Text>

          <Text style={styles.label}>Pending Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 300"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            value={pendingAmount}
            onChangeText={handleAmountChange}
          />

          <Text style={styles.label}>Template Language</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'tamil' && styles.langBtnActive]}
              onPress={() => handleLanguageChange('tamil')}>
              <Text style={[styles.langBtnText, language === 'tamil' && styles.langBtnTextActive]}>
                தமிழ் (Tamil)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, language === 'english' && styles.langBtnActive]}
              onPress={() => handleLanguageChange('english')}>
              <Text style={[styles.langBtnText, language === 'english' && styles.langBtnTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Message Preview</Text>
          <ScrollView style={styles.previewBox}>
            <TextInput
              style={styles.previewText}
              multiline
              value={message}
              onChangeText={setMessage}
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsappBtn} onPress={handleSendWhatsApp}>
              <Text style={styles.whatsappBtnText}>Open WhatsApp</Text>
            </TouchableOpacity>
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
    maxHeight: '85%',
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
    color: '#15803d',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  langBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  langBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  langBtnTextActive: {
    color: '#15803d',
    fontWeight: '700',
  },
  previewBox: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    marginTop: 4,
  },
  previewText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
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
  whatsappBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default WhatsAppReminderModal;
