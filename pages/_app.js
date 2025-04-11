import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/context/socket";

export default function App({ Component, pageProps:{session,...pageProps} }) {
  return (
    <SessionProvider session={session}>
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
    </SessionProvider>
  );
}
