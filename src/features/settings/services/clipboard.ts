import * as Clipboard from 'expo-clipboard';

/** Puts `text` on the system clipboard. */
export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
