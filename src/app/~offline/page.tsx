import { CloudSlash } from "@phosphor-icons/react/dist/ssr";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <CloudSlash size={52} weight="duotone" />
      <p>AeroBalance Offline</p>
      <h1>演示资源暂不可用</h1>
      <span>
        首次打开需要网络连接。完成首次加载后，应用外壳可离线使用。
      </span>
    </main>
  );
}
