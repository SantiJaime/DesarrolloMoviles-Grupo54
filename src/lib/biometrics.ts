import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricSupport {
  available: boolean;
  label: string;
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  const { AuthenticationType } = LocalAuthentication;
  let label = 'biometría';
  if (types.includes(AuthenticationType.FINGERPRINT)) label = 'huella dactilar';
  else if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) label = 'reconocimiento facial';

  return { available: hasHardware && isEnrolled, label };
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar PIN',
    disableDeviceFallback: false,
  });
  return result.success;
}
