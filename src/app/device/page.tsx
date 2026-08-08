"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bluetooth } from "@phosphor-icons/react/Bluetooth";
import { BluetoothConnected } from "@phosphor-icons/react/BluetoothConnected";
import { CloudArrowDown } from "@phosphor-icons/react/CloudArrowDown";
import { WarningCircle } from "@phosphor-icons/react/WarningCircle";
import { ValveControlPanel } from "@/components/device/ValveControlPanel";
import {
  connectBluetooth,
  type BluetoothConnection,
} from "@/lib/bluetooth";
import { BleSampleDetails } from "@/components/device/BleSampleDetails";
import {
  clearActiveBluetoothConnection,
  getActiveBluetoothConnection,
  setActiveBluetoothConnection,
} from "@/lib/bluetooth-session";
import type { ValveAck, ValveId } from "@/lib/valve-protocol";
import { createFlightSeed, seedProfiles } from "@/lib/seed";
import { useAppStore } from "@/store/useAppStore";
import { translate } from "@/i18n/messages";

export default function DevicePage() {
  const locale = useAppStore((state) => state.locale);
  const deviceState = useAppStore((state) => state.deviceState);
  const deviceName = useAppStore((state) => state.deviceName);
  const notice = useAppStore((state) => state.notice);
  const pressureHistory = useAppStore((state) => state.pressureHistory);
  const setDevice = useAppStore((state) => state.setDevice);
  const beginLiveSession = useAppStore((state) => state.beginLiveSession);
  const loadSeedProfile = useAppStore((state) => state.loadSeedProfile);
  const replacePressureHistory = useAppStore(
    (state) => state.replacePressureHistory,
  );
  const [supported, setSupported] = useState(false);
  const [pendingCommand, setPendingCommand] = useState(false);
  const [lastValveAck, setLastValveAck] = useState<ValveAck | null>(null);
  const [valveState, setValveState] = useState({ left: false, right: false });
  const connection = useRef<BluetoothConnection | null>(null);
  const commandTimeout = useRef<number | null>(null);
  const latest = pressureHistory.at(-1);
  const liveSample = latest?.source === "bluetooth" ? latest : null;

  const handleValveAcknowledgement = (ack: ValveAck) => {
    clearCommandTimeout();
    setPendingCommand(false);
    setLastValveAck(ack);
    setValveState({ left: ack.leftOpen, right: ack.rightOpen });
  };

  useEffect(() => {
    setSupported(window.isSecureContext && Boolean(navigator.bluetooth));
    connection.current = getActiveBluetoothConnection();
    connection.current?.setValveAckHandler(handleValveAcknowledgement);
    return () => {
      if (commandTimeout.current !== null) {
        window.clearTimeout(commandTimeout.current);
      }
      connection.current?.setValveAckHandler(() => undefined);
    };
  }, []);

  const clearCommandTimeout = () => {
    if (commandTimeout.current === null) return;
    window.clearTimeout(commandTimeout.current);
    commandTimeout.current = null;
  };

  const waitForAcknowledgement = () => {
    clearCommandTimeout();
    setPendingCommand(true);
    commandTimeout.current = window.setTimeout(() => {
      commandTimeout.current = null;
      setPendingCommand(false);
      setDevice(
        "connected",
        connection.current?.deviceName ?? "AeroBalance-XIAO",
        locale === "zh-CN"
          ? "未收到阀门控制确认，请先点击全部关闭并检查固件。"
          : "No valve acknowledgement received. Close both valves and check the firmware.",
      );
    }, 2_500);
  };

  const handleConnect = async () => {
    const sessionId = `ble-${Date.now()}`;
    beginLiveSession(sessionId);
    setDevice("scanning", null, null);
    try {
      const nextConnection = await connectBluetooth(
        sessionId,
        (sample) => {
          useAppStore.getState().appendPressureSample(sample);
          if (
            sample.valveLeftOpen !== undefined &&
            sample.valveRightOpen !== undefined
          ) {
            setValveState({
              left: sample.valveLeftOpen,
              right: sample.valveRightOpen,
            });
          }
        },
        () =>
          setDevice(
            "failed",
            null,
            locale === "zh-CN"
              ? "设备发送了无效数据，请检查固件格式。"
              : "The device sent invalid data. Check the firmware payload.",
          ),
        () => {
          clearCommandTimeout();
          setPendingCommand(false);
          setValveState({ left: false, right: false });
          setDevice(
            "disconnected",
            null,
            locale === "zh-CN"
              ? "设备连接已断开，自动重连失败，请重新连接。"
              : "The device disconnected and automatic reconnection failed. Connect again.",
          );
          if (connection.current) {
            clearActiveBluetoothConnection(connection.current);
            connection.current = null;
          }
        },
        (attempt, maxAttempts) => {
          clearCommandTimeout();
          setPendingCommand(false);
          setDevice(
            "reconnecting",
            "AeroBalance-XIAO",
            locale === "zh-CN"
              ? `蓝牙短暂断开，正在自动重连（${attempt}/${maxAttempts}）...`
              : `Bluetooth dropped. Reconnecting automatically (${attempt}/${maxAttempts})...`,
          );
        },
        () => {
          setPendingCommand(false);
          setDevice(
            "connected",
            "AeroBalance-XIAO",
            locale === "zh-CN"
              ? "蓝牙连接已自动恢复。"
              : "Bluetooth connection restored automatically.",
          );
        },
        handleValveAcknowledgement,
      );
      connection.current = nextConnection;
      nextConnection.setValveAckHandler(handleValveAcknowledgement);
      setActiveBluetoothConnection(nextConnection);
      setLastValveAck(null);
      setValveState({ left: false, right: false });
      setDevice("connected", nextConnection.deviceName, null);
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

  const handlePulse = async (valve: ValveId, durationMs: number) => {
    if (!connection.current) return;
    waitForAcknowledgement();
    try {
      await connection.current.pulseValve(valve, durationMs);
    } catch {
      clearCommandTimeout();
      setPendingCommand(false);
      setDevice(
        "connected",
        connection.current.deviceName,
        locale === "zh-CN"
          ? "阀门命令发送失败，请检查蓝牙连接。"
          : "Valve command failed. Check the Bluetooth connection.",
      );
    }
  };

  const handleStop = async () => {
    if (!connection.current) return;
    waitForAcknowledgement();
    try {
      await connection.current.stopValves();
    } catch {
      clearCommandTimeout();
      setPendingCommand(false);
      setDevice(
        "connected",
        connection.current.deviceName,
        locale === "zh-CN"
          ? "关闭命令发送失败，请断开设备电源并检查蓝牙。"
          : "Stop command failed. Power down the device and check Bluetooth.",
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
              : "AeroBalance-XIAO"}
          </strong>
          <p>
            {deviceState === "connected"
              ? locale === "zh-CN"
                ? "实时 BLE 数据正在同步，完整样本见下方"
                : "Live BLE data is syncing. The full sample appears below."
              : locale === "zh-CN"
                ? "通过 Web Bluetooth 接收气压、温度、估算海拔和原始传感器数据"
                : "Receive pressure, temperature, estimated altitude, and raw sensor data over Web Bluetooth"}
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

      <ValveControlPanel
        locale={locale}
        connected={deviceState === "connected"}
        pending={pendingCommand}
        leftOpen={valveState.left}
        rightOpen={valveState.right}
        lastAck={lastValveAck}
        onPulse={handlePulse}
        onStop={handleStop}
      />

      {liveSample && <BleSampleDetails sample={liveSample} locale={locale} />}

      <div className="device-actions">
        <button
          type="button"
          className="action-button"
          disabled={
            !supported ||
            deviceState === "scanning" ||
            deviceState === "reconnecting" ||
            deviceState === "connected"
          }
          onClick={handleConnect}
        >
          <Bluetooth size={20} weight="fill" />
          <span>
            {deviceState === "connected"
              ? locale === "zh-CN"
                ? "已连接 AeroBalance"
                : "AeroBalance Connected"
              : deviceState === "reconnecting"
                ? locale === "zh-CN"
                  ? "正在自动重连..."
                  : "Reconnecting..."
                : deviceState === "scanning"
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
