import { Pressable, StyleSheet, View } from 'react-native';

import { RADIUS, SIZE, Text, TextVariant, useTheme } from '@/ui';

import type { SheetView } from '../view';

type SheetTabsProps = {
  sheet: SheetView;
  tabs: string[];
  onSelect: (index: number) => void;
};

/**
 * "×1 ×2 ×3": on my turn I switch sheets; on someone else's turn the tabs only show
 * which sheet they have open, marked with a dot in their colour.
 */
export function SheetTabs({ sheet, tabs, onSelect }: SheetTabsProps) {
  const { colors } = useTheme();
  const disabled = !sheet.tabsEnabled;

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={sheet.title} style={styles.row}>
      {tabs.map((label, index) => {
        const selected = index === sheet.selectedTab;
        const marked = sheet.turnTab?.index === index;

        return (
          <Pressable
            key={label}
            onPress={() => onSelect(index)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={marked ? `${label}, ${sheet.turnTab!.label}` : label}
            accessibilityState={{ checked: selected, disabled }}
            style={[styles.tab, { backgroundColor: selected ? colors.primary : colors.surface2 }]}
          >
            <Text
              variant={TextVariant.Label}
              size={14}
              color={selected ? 'onPrimary' : disabled ? 'muted' : 'ink'}
              align="center"
            >
              {label}
            </Text>
            {marked ? (
              <View
                testID="sheet-tab-marker"
                style={[
                  styles.marker,
                  { backgroundColor: sheet.owner.color, borderColor: colors.surface },
                ]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    minHeight: SIZE.touch,
    paddingHorizontal: 6,
    borderRadius: RADIUS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
