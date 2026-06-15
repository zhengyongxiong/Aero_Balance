"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bluetooth,
  BluetoothConnected,
  CloudArrowDown,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  connectBluetooth,
  type BluetoothConnection,
} from "@/lib/bluetooth";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import { translate } from "@/i18n/messages";

export default function DevicePage() {
  const locale = useAppStore((state) => state.locale);
  const deviceState = useAppStore((state) => state.deviceState);
  const deviceName = useAppStore((state) => state.deviceName);
  const notice = useAppStore((state) => state.notice);
  const setDevice = useAppStore((state) => state.setDevice);
  const appendPressureSample = useAppStore(
    (state) => state.appendPressureSample,
  );
  const loadSeedProfile = useAppStore((state) => state.loadSeedProfile);
  const replacePressureHistory = useAppStore(
    (state) => state.replacePressureHistory,
  );
  const [supported, setSupported] = useState(false);
  const connection = useRef<BluetoothConnection | null>(null);

  useEffect(() => {
    setSupported(window.isSecureContext && Boolean(navigator.bluetooth));
    return () => {
      void connection.current?.disconnect();
    };
  }, []);

  const handleConnect = async () => {
    setDevice("scanning", null, null);
    try {
      connection.current = await connectBluetooth(
        `ble-${Date.now()}`,
        appendPressureSample,
        () =>
          setDevice(
            "failed",
            null,
            locale === "zh-CN"
              ? "设备发送了无效数据，请检查固件格式。"
              : "The device sent invalid data. Check the firmware payload.",
          ),
        () =>
          setDevice(
            "disconnected",
            null,
            locale === "zh-CN"
              ? "设备连接已断开。"
              : "The device was disconnected.",
          ),
      );
      setDevice("connected", connection.current.deviceName, null);
    } catch (error) {
      const unsupported =
        error instanceof Error &&
        error.message === "WEB_BLUETOOTH_UNSUPPORTED";
      setDevice(
        unsupported ? "unsupported" : "failed",
        null,
        locale === "zh-CN"
          ? unsupported
            ? "请使用支持 Web Bluetooth 的 Chromium 浏览器并通过 HTTPS 访问。"
            : "未能连接设备，请确认设备已开启并靠近浏览器。"
          : unsupported
            ? "Use a Chromium browser with Web Bluetooth over HTTPS."
            : "Could not connect. Confirm the device is on and nearby.",
      );
    }
  };

  const prepareMockDemo = () => {
    loadSeedProfile(seedProfiles[0]);
    replacePressureHistory(
      createFlightSeed("device-demo").filter(
        (sample) => sample.phase === "descent",
      ),
    );
  };

  return (
    <main className="page-container">
      <p className="page-subtitle">{translate(locale, "nav.device")}</p>
      <h1 className="page-title">
        {locale === "zh-CN" ? "设备连接" : "Device Connection"}
      </h1>

      <section className="device-panel card card-highlight">
        <span className="device-panel__icon">
          {deviceState === "connected" ? (
            <BluetoothConnected size={42} weight="duotone" />
          ) : (
            <Bluetooth size={42} weight="duotone" />
          )}
        </span>
        <div>
          <strong>
            {deviceState === "connected"
              ? deviceName
              : "AeroBalance ESP32-C3"}
          </strong>
          <p>
            {deviceState === "connected"
              ? locale === "zh-CN"
                ? "实时压力数据正在同步"
                : "Live pressure data is syncing"
              : locale === "zh-CN"
                ? "通过 Web Bluetooth 接收压力、温度和电量数据"
                : "Receive pressure, temperature, and battery data over Web Bluetooth"}
          </p>
        </div>
      </section>

      {!supported && (
        <div className="device-notice">
          <WarningCircle size={18} weight="fill" />
          <span>
            {locale === "zh-CN"
              ? "当前环境不支持 Web Bluetooth，仍可使用完整模拟演示。"
              : "Web Bluetooth is unavailable here. The complete mock demo remains available."}
          </span>
        </div>
      )}

      {notice && <div className="device-notice">{notice}</div>}

      <div className="device-actions">
        <button
          type="button"
          className="action-button"
          disabled={!supported || deviceState === "scanning"}
          onClick={handleConnect}
        >
          <Bluetooth size={20} weight="fill" />
          <span>
            {deviceState === "scanning"
              ? locale === "zh-CN"
                ? "正在搜索..."
                : "Searching..."
              : locale === "zh-CN"
                ? "连接 AeroBalance"
                : "Connect AeroBalance"}
          </span>
        </button>
        <Link
          href="/flight"
          className="action-button action-button--secondary"
          onClick={prepareMockDemo}
        >
          <CloudArrowDown size={20} weight="duotone" />
          <span>{translate(locale, "action.mock")}</span>
        </Link>
      </div>
    </main>
  );
}
