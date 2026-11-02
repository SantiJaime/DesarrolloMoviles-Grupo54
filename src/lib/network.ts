import * as Network from "expo-network";
import { useEffect, useState } from "react";

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: Network.NetworkStateType;
}

export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return true;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      const online = await checkNetworkStatus();
      if (isMounted) setIsOnline(online);
    }

    check();
    const timer = setInterval(check, 5000);
    const subscription = Network.addNetworkStateListener((state) => {
      if (isMounted)
        setIsOnline(
          Boolean(state.isConnected && state.isInternetReachable !== false),
        );
    });

    return () => {
      isMounted = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return { isOnline };
}
