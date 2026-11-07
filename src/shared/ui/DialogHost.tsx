import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { reportError } from '@shared/utils/reportError';
import { closeDialog, currentDialog, DialogAction, subscribeDialog } from './dialog';
import { AppText, Button } from './primitives';

const ROW_LIMIT = 2;
const MAX_WIDTH = 420;

function run(action: DialogAction) {
  closeDialog();
  void Promise.resolve(action.onPress?.()).catch(reportError);
}

export function DialogHost() {
  const dialog = useSyncExternalStore(subscribeDialog, currentDialog);
  const colors = useTheme();
  const { t } = useTranslation();
  const inRow = (dialog?.actions.length ?? 0) <= ROW_LIMIT;

  return (
    <Modal visible={dialog !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={closeDialog}>
      <Pressable accessibilityLabel={t('dialog.dismiss')} onPress={closeDialog} style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        {dialog ? (
          <Pressable accessibilityRole="alert" accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="subtitle" bold>
              {dialog.title}
            </AppText>
            {dialog.message ? <AppText tone="muted">{dialog.message}</AppText> : null}
            <View style={inRow ? styles.row : styles.column}>
              {dialog.actions.map((action) => (
                <View key={action.label} style={inRow ? styles.flex : null}>
                  <Button label={action.label} variant={action.tone ?? 'primary'} onPress={() => run(action)} />
                </View>
              ))}
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: MAX_WIDTH, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  column: { gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
});
