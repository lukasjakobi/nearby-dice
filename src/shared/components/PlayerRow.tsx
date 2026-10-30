import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import type { TFunction } from '@/i18n';
import { Avatar, IconButton, IconName, Spinner, Tag, Text, TextVariant, useTheme } from '@/ui';
import type { ColorToken } from '@/ui';

import type { AvatarView } from '../view/avatar';

export enum PlayerTag {
  Host = 'host',
  You = 'you',
}

export enum RowStatus {
  Connected = 'connected',
  Reconnecting = 'reconnecting',
}

function tagLook(
  t: TFunction,
  tag: PlayerTag,
): { label: string; background: ColorToken; color: ColorToken } {
  const looks: Record<PlayerTag, ReturnType<typeof tagLook>> = {
    [PlayerTag.Host]: { label: t('common.hostTag'), background: 'accent', color: 'onAccent' },
    [PlayerTag.You]: { label: t('common.youTag'), background: 'surface2', color: 'ink' },
  };

  return looks[tag];
}

function statusLook(
  t: TFunction,
  status: RowStatus,
): { label: string; color: ColorToken; busy: boolean } {
  const looks: Record<RowStatus, ReturnType<typeof statusLook>> = {
    [RowStatus.Connected]: { label: t('common.connected'), color: 'ok', busy: false },
    [RowStatus.Reconnecting]: { label: t('common.reconnectingPeer'), color: 'danger', busy: true },
  };

  return looks[status];
}

export type PlayerRowView = {
  id: string;
  name: string;
  avatar: AvatarView;
  tags: PlayerTag[];
  status: RowStatus;
};

type PlayerRowProps = {
  row: PlayerRowView;
  /** Shows the ⋯ button (host lobby, non-host rows). */
  onMenu?: () => void;
  menuLabel?: string;
};

/** A lobby row: avatar, name with tags, connection status. */
export function PlayerRow({ row, onMenu, menuLabel }: PlayerRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = statusLook(t, row.status);
  const reconnecting = row.status === RowStatus.Reconnecting;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 68,
        paddingVertical: 10,
        paddingLeft: 12,
        paddingRight: onMenu ? 8 : 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: reconnecting ? colors.danger : colors.line,
        backgroundColor: colors.surface,
      }}
    >
      <Avatar initial={row.avatar.initial} color={row.avatar.color} dimmed={reconnecting} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text variant={TextVariant.BodyStrong}>{row.name}</Text>
          {row.tags.map((tag) => (
            <Tag key={tag} {...tagLook(t, tag)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {status.busy ? <Spinner color={colors[status.color]} size={14} strokeWidth={3} /> : null}
          <Text variant={TextVariant.Caption} color={status.color} style={{ flexShrink: 1 }}>
            {status.label}
          </Text>
        </View>
      </View>
      {onMenu ? (
        <IconButton
          icon={IconName.More}
          label={menuLabel ?? ''}
          onPress={onMenu}
          color="muted"
          size={44}
        />
      ) : null}
    </View>
  );
}
