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
    [PlayerTag.Host]: { label: t('common.hostTag'), background: 'ink', color: 'bg' },
    [PlayerTag.You]: { label: t('common.youTag'), background: 'primary', color: 'onPrimary' },
  };

  return looks[tag];
}

function statusLook(t: TFunction, status: RowStatus): { label: string; color: ColorToken } {
  const looks: Record<RowStatus, ReturnType<typeof statusLook>> = {
    [RowStatus.Connected]: { label: t('common.connected'), color: 'ok' },
    [RowStatus.Reconnecting]: { label: t('common.reconnectingPeer'), color: 'danger' },
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
};

/**
 * A lobby row inside the players' `ListGroup`: avatar, name with tags. Being connected is the
 * normal case and goes unsaid; only a reconnecting player gets a status line.
 */
export function PlayerRow({ row, onMenu }: PlayerRowProps) {
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
        minHeight: 60,
        paddingVertical: 8,
        paddingLeft: 14,
        paddingRight: onMenu ? 4 : 14,
      }}
    >
      <Avatar
        initial={row.avatar.initial}
        color={row.avatar.color}
        size={40}
        dimmed={reconnecting}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text variant={TextVariant.BodyStrong}>{row.name}</Text>
          {row.tags.map((tag) => (
            <Tag key={tag} {...tagLook(t, tag)} />
          ))}
        </View>
        {reconnecting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Spinner color={colors[status.color]} size={14} strokeWidth={3} />
            <Text variant={TextVariant.Caption} color={status.color} style={{ flexShrink: 1 }}>
              {status.label}
            </Text>
          </View>
        ) : null}
      </View>
      {onMenu ? (
        <IconButton
          icon={IconName.More}
          label={t('lobby.playerActions', { name: row.name })}
          onPress={onMenu}
          color="muted"
          size={44}
        />
      ) : null}
    </View>
  );
}
