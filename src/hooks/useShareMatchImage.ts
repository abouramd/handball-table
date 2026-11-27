import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import type { ShareCardRef } from '../components/MatchShareCard';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Shares a match report as a PNG through the phone's share sheet.
 * While `sharing` is true the screen mounts the share card off-screen and
 * passes `cardRef` to it; the card is captured, shared, then unmounted.
 */
export function useShareMatchImage() {
  const cardRef = useRef<ShareCardRef>(null);
  const [available, setAvailable] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    // The app ships for phones; image capture is not supported on web.
    if (Platform.OS === 'web') return;
    let alive = true;
    Sharing.isAvailableAsync()
      .then((ok) => alive && setAvailable(ok))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      // Let the card mount and lay out before it is captured.
      await nextFrame();
      await nextFrame();
      if (!cardRef.current) throw new Error('share card not mounted');
      // iOS: renderInContext handles tall images (a long match); the default
      // drawViewHierarchyInRect fails on them. The card has no gradients or scroll views.
      const uri = await captureRef(cardRef, { result: 'tmpfile', format: 'png', quality: 1, width: 1080, useRenderInContext: true });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share match' });
    } catch {
      Alert.alert("Couldn't create the image", 'Try again.');
    } finally {
      setSharing(false);
    }
  };

  return { available, sharing, share, cardRef };
}
