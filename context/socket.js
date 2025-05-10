import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.name) return;

    const connection = io({
      query: {
        userId: session.user.name, 
      },
    });

    console.log("Socket connection established", connection);
    setSocket(connection);

    connection.on("connect_error", async (err) => {
      console.error("Error establishing socket connection:", err);
      await fetch("/api/socket");
    });

    return () => {
      connection.disconnect();
    };
  }, [session?.user?.name]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
