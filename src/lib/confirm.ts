import { Alert } from 'react-native';

export function confirmAsync(
  title: string,
  message: string,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
