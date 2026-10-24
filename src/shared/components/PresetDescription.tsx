import { useTranslation } from 'react-i18next';

import type { PresetId } from '@/domain';
import { Text, TextVariant } from '@/ui';

/** "**Klassisch.** Freie Feldwahl, …" under the preset grid. */
export function PresetDescription({ preset }: { preset: PresetId }) {
  const { t } = useTranslation();
  const title = t(`labels.preset.${preset}.title`);
  const description = t(`labels.preset.${preset}.description`);

  return (
    <Text
      variant={TextVariant.Body}
      size={14}
      color="muted"
      style={{ lineHeight: 20, paddingHorizontal: 2 }}
    >
      <Text variant={TextVariant.Body} size={14} weight={600}>
        {`${title}.`}
      </Text>{' '}
      {description}
    </Text>
  );
}
