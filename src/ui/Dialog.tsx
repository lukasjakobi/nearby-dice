import { Modal, View } from 'react-native';

import { Button, ButtonVariant } from './Button';
import { Text, TextVariant } from './Text';
import { useTheme } from './theme/ThemeProvider';
import { RADIUS } from './theme/tokens';

export type DialogAction = { label: string; onPress: () => void };

type DialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirm: DialogAction;
  cancel: DialogAction;
  /** Destructive confirms are red (most dialogs); "Jetzt starten" is primary. */
  destructive?: boolean;
};

/**
 * Modal alert dialog: title, one-sentence consequence, confirm first, cancel last.
 * Back (Android) equals cancel.
 */
export function Dialog({ visible, title, body, confirm, cancel, destructive = true }: DialogProps) {
  const { colors, reduceMotion } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={cancel.onPress}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderRadius: RADIUS.dialog,
            padding: 24,
            gap: 12,
          }}
        >
          <Text variant={TextVariant.DialogTitle}>{title}</Text>
          <Text variant={TextVariant.Body} size={14} color="muted">
            {body}
          </Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button
              label={confirm.label}
              onPress={confirm.onPress}
              variant={destructive ? ButtonVariant.Danger : ButtonVariant.Primary}
            />
            <Button
              label={cancel.label}
              onPress={cancel.onPress}
              variant={ButtonVariant.Secondary}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
