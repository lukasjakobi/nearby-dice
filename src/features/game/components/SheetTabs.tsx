import { Pressable, StyleSheet, View } from 'react-native';

import { RADIUS, Text, TextVariant, useTheme } from '@/ui';

import type { SheetView } from '../view';

type SheetTabsProps = {
  sheet: SheetView;
  onSelect: (index: number) => void;
};

/**
 * "×1 ×2 ×3": on my turn I switch sheets; on someone else's turn the tabs only show
 * which sheet they have open, marked with a dot in their colour.
 */
export function SheetTabs({ sheet, onSelect }: SheetTabsProps) {
  const { colors } = useTheme();
  const disabled = !sheet.tabsEnabled;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={sheet.title}
      style={[styles.track, { backgroundColor: colors.surface2 }]}
    >
      {sheet.tabs?.map((label, index) => {
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
            style={[styles.tab, selected && { backgroundColor: colors.primary }]}
          >
            <Text
              variant={TextVariant.Label}
              size={13}
              weight={600}
              color={selected ? 'onPrimary' : disabled ? 'muted' : 'ink'}
              align="center"
            >
              {label}
            </Text>
            {marked ? (
              <View
                testID="sheet-tab-marker"
                style={[styles.marker, { backgroundColor: sheet.owner.color }]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: 3,
    gap: 2,
    borderRadius: RADIUS.pill,
  },
  tab: {
    flex: 1,
    height: 30,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  marker: { width: 6, height: 6, borderRadius: 3 },
});
