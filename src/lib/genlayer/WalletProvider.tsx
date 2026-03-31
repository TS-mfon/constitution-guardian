import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  isMetaMaskInstalled as checkMetaMask,
  connectMetaMask,
  switchAccount,
  getAccounts,
  getCurrentChainId,
  isOnGenLayerNetwork,
  getEthereumProvider,
} from "./client";

const DISCONNECT_FLAG = "wallet_disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  switchWalletAccount: () => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null, chainId: null, isConnected: false,
    isLoading: true, isMetaMaskInstalled: false, isOnCorrectNetwork: false,
  });

  useEffect(() => {
    const init = async () => {
      const installed = checkMetaMask();
      if (!installed) {
        setState(s => ({ ...s, isLoading: false, isMetaMaskInstalled: false }));
        return;
      }
      if (localStorage.getItem(DISCONNECT_FLAG) === "true") {
        setState(s => ({ ...s, isLoading: false, isMetaMaskInstalled: true }));
        return;
      }
      try {
        const accounts = await getAccounts();
        const chainId = await getCurrentChainId();
        const correctNetwork = await isOnGenLayerNetwork();
        setState({
          address: accounts[0] || null, chainId,
          isConnected: accounts.length > 0, isLoading: false,
          isMetaMaskInstalled: true, isOnCorrectNetwork: correctNetwork,
        });
      } catch {
        setState(s => ({ ...s, isLoading: false, isMetaMaskInstalled: true }));
      }
    };
    init();
  }, []);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) localStorage.removeItem(DISCONNECT_FLAG);
      const chainId = await getCurrentChainId();
      const correctNetwork = await isOnGenLayerNetwork();
      setState(prev => ({
        ...prev, address: accounts[0] || null, chainId,
        isConnected: accounts.length > 0, isOnCorrectNetwork: correctNetwork,
      }));
    };

    const handleChainChanged = async (chainId: string) => {
      const correctNetwork = parseInt(chainId, 16) === 61999;
      const accounts = await getAccounts();
      setState(prev => ({
        ...prev, chainId, address: accounts[0] || null,
        isConnected: accounts.length > 0, isOnCorrectNetwork: correctNetwork,
      }));
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const address = await connectMetaMask();
      const chainId = await getCurrentChainId();
      const correctNetwork = await isOnGenLayerNetwork();
      localStorage.removeItem(DISCONNECT_FLAG);
      setState({ address, chainId, isConnected: true, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correctNetwork });
      return address;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    localStorage.setItem(DISCONNECT_FLAG, "true");
    setState(prev => ({ ...prev, address: null, isConnected: false }));
  }, []);

  const switchWalletAccount = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const newAddress = await switchAccount();
      const chainId = await getCurrentChainId();
      const correctNetwork = await isOnGenLayerNetwork();
      localStorage.removeItem(DISCONNECT_FLAG);
      setState({ address: newAddress, chainId, isConnected: true, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correctNetwork });
      return newAddress;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connectWallet, disconnectWallet, switchWalletAccount }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
