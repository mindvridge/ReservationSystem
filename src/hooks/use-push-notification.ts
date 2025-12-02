"use client";

import { useState, useEffect, useCallback } from "react";

type NotificationPermission = "default" | "denied" | "granted";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
}

export function usePushNotification() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: true,
  });

  // 초기화
  useEffect(() => {
    const init = async () => {
      // 브라우저 지원 확인
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
        }));
        return;
      }

      // 현재 권한 상태 확인
      const permission = Notification.permission as NotificationPermission;

      // 구독 상태 확인
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (error) {
        console.error("Failed to check subscription:", error);
      }

      setState({
        isSupported,
        permission,
        isSubscribed,
        isLoading: false,
      });
    };

    init();
  }, []);

  // 서비스 워커 등록
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }, []);

  // 알림 권한 요청
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      return "denied" as NotificationPermission;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      console.error("Failed to request permission:", error);
      return "denied" as NotificationPermission;
    }
  }, [state.isSupported]);

  // 푸시 알림 구독
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error("Push notifications not supported");
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // 서비스 워커 등록
      await registerServiceWorker();

      // 권한 요청
      const permission = await requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // 푸시 구독 생성
      const registration = await navigator.serviceWorker.ready;

      // VAPID 공개키가 없으면 기본 구독만 활성화
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey는 실제 VAPID 키가 있을 때 추가
      });

      console.log("Push subscription:", subscription);

      // ArrayBuffer를 Base64로 변환하는 헬퍼 함수
      const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
        if (!buffer) return "";
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      // 서버에 구독 정보 저장
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
            auth: arrayBufferToBase64(subscription.getKey("auth")),
          },
        }),
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.isSupported, registerServiceWorker, requestPermission]);

  // 푸시 알림 구독 해제
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // 서버에서 구독 정보 삭제
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // 테스트 알림 보내기
  const sendTestNotification = useCallback(async () => {
    if (state.permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("테스트 알림", {
      body: "푸시 알림이 정상적으로 작동합니다!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: "test",
      data: { url: "/dashboard" },
    });
  }, [state.permission]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
