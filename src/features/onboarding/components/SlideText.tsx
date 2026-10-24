import { View } from 'react-native';

import { Font, fontFamily, Text } from '@/ui';

export function SlideText({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        size={34}
        align="center"
        accessibilityRole="header"
        style={{ fontFamily: fontFamily(Font.Display, 600), lineHeight: 40 }}
      >
        {title}
      </Text>
      {body ? (
        <Text size={17} color="muted" align="center">
          {body}
        </Text>
      ) : null}
    </View>
  );
}
