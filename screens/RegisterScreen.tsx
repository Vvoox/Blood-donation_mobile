import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '../constants/Colors';
import { AuthStackParamList } from '../types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const BLOOD_TYPES = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  confirmPassword: string;
  bloodType: string;
  role: 'donor' | 'recipient' | '';
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
  bloodType?: string;
  role?: string;
}

export default function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    role: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email.';
    }
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!form.city.trim()) newErrors.city = 'City is required.';
    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!form.bloodType) newErrors.bloodType = 'Please select your blood type.';
    if (!form.role) newErrors.role = 'Please select your role.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Simulate registration (would call Keycloak admin API or backend registration endpoint)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Registration Successful',
        'Your account has been created! Please login to continue.',
        [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.message || 'Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    icon: string,
    options?: {
      keyboardType?: any;
      secureTextEntry?: boolean;
      toggleShow?: () => void;
      showToggle?: boolean;
      isVisible?: boolean;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[styles.inputWrapper, errors[field as keyof FormErrors] && styles.inputWrapperError]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={Colors.TextSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.TextSecondary}
          value={form[field] as string}
          onChangeText={(val) => updateForm(field, val)}
          keyboardType={options?.keyboardType || 'default'}
          secureTextEntry={options?.secureTextEntry && !options?.isVisible}
          autoCapitalize={
            field === 'email' || field === 'password' || field === 'confirmPassword'
              ? 'none'
              : 'words'
          }
        />
        {options?.toggleShow && (
          <TouchableOpacity onPress={options.toggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={options.isVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.TextSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field as keyof FormErrors] ? (
        <Text style={styles.errorText}>{errors[field as keyof FormErrors]}</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.White} />
          </TouchableOpacity>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add-outline" size={38} color={Colors.Primary} />
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join the BloodLink community</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={[styles.inputWrapper, errors.firstName && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={Colors.TextSecondary}
                  value={form.firstName}
                  onChangeText={(val) => updateForm('firstName', val)}
                  autoCapitalize="words"
                />
              </View>
              {errors.firstName ? (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              ) : null}
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={[styles.inputWrapper, errors.lastName && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={Colors.TextSecondary}
                  value={form.lastName}
                  onChangeText={(val) => updateForm('lastName', val)}
                  autoCapitalize="words"
                />
              </View>
              {errors.lastName ? (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              ) : null}
            </View>
          </View>

          {renderInput('Email Address', 'email', 'your@email.com', 'mail-outline', {
            keyboardType: 'email-address',
          })}
          {renderInput('Phone Number', 'phone', '+212 6XX XXX XXX', 'call-outline', {
            keyboardType: 'phone-pad',
          })}
          {renderInput('City', 'city', 'Your city', 'location-outline')}

          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Security</Text>

          {renderInput('Password', 'password', 'Min. 8 characters', 'lock-closed-outline', {
            secureTextEntry: true,
            isVisible: showPassword,
            toggleShow: () => setShowPassword(!showPassword),
          })}
          {renderInput('Confirm Password', 'confirmPassword', 'Re-enter password', 'lock-closed-outline', {
            secureTextEntry: true,
            isVisible: showConfirmPassword,
            toggleShow: () => setShowConfirmPassword(!showConfirmPassword),
          })}

          {/* Blood type selector */}
          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Blood Type</Text>
          <View style={styles.bloodTypeGrid}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeBadge,
                  form.bloodType === type && styles.bloodTypeBadgeSelected,
                ]}
                onPress={() => updateForm('bloodType', type)}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.bloodTypeBadgeText,
                    form.bloodType === type && styles.bloodTypeBadgeTextSelected,
                  ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.bloodType ? (
            <Text style={styles.errorText}>{errors.bloodType}</Text>
          ) : null}

          {/* Role selector */}
          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>I am...</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'donor' && styles.roleCardSelected,
              ]}
              onPress={() => updateForm('role', 'donor')}
              activeOpacity={0.8}>
              <Ionicons
                name="heart"
                size={28}
                color={form.role === 'donor' ? Colors.White : Colors.Primary}
              />
              <Text
                style={[
                  styles.roleCardText,
                  form.role === 'donor' && styles.roleCardTextSelected,
                ]}>
                I want to donate blood
              </Text>
              {form.role === 'donor' && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.White} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'recipient' && styles.roleCardSelected,
              ]}
              onPress={() => updateForm('role', 'recipient')}
              activeOpacity={0.8}>
              <Ionicons
                name="medkit"
                size={28}
                color={form.role === 'recipient' ? Colors.White : Colors.Primary}
              />
              <Text
                style={[
                  styles.roleCardText,
                  form.role === 'recipient' && styles.roleCardTextSelected,
                ]}>
                I need blood
              </Text>
              {form.role === 'recipient' && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.White} />
              )}
            </TouchableOpacity>
          </View>
          {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={Colors.White} size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.Primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 52,
    padding: 4,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.White,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.White,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.White,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 12,
  },
  sectionTitleMargin: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TextPrimary,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
  },
  inputWrapperError: {
    borderColor: Colors.Error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: Colors.TextPrimary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.Error,
    marginTop: 3,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  bloodTypeBadge: {
    width: 64,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.White,
    margin: 2,
  },
  bloodTypeBadgeSelected: {
    backgroundColor: Colors.Primary,
  },
  bloodTypeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.Primary,
  },
  bloodTypeBadgeTextSelected: {
    color: Colors.White,
  },
  roleContainer: {
    gap: 10,
    marginBottom: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.Primary,
    backgroundColor: Colors.White,
  },
  roleCardSelected: {
    backgroundColor: Colors.Primary,
  },
  roleCardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.Primary,
  },
  roleCardTextSelected: {
    color: Colors.White,
  },
  registerButton: {
    backgroundColor: Colors.Primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: Colors.White,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.TextSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.Primary,
    fontWeight: '700',
  },
});
