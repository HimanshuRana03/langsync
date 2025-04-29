import { useEffect, useState, useRef } from "react";
import { cloneDeep } from "lodash";
import { useSocket } from "@/context/socket";
import usePeer from "@/hooks/usePeer";
import useMediaStream from "@/hooks/useMediaStream";
import usePlayer from "@/hooks/usePlayer";
import Player from "@/component/Player";
import Bottom from "@/component/Bottom";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import CopySection from "@/component/CopySection";
import styles from "@/styles/room.module.css";

const Room = () => {
  const socket = useSocket();
  const { roomId } = useRouter().query;
  const { peer, myId } = usePeer();
  const { stream } = useMediaStream();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeoutRef = useRef(null);
  const {
    players,
    setPlayers,
    playerHighlighted,
    nonHighlightedPlayers,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  } = usePlayer(myId, roomId, peer);

  const { data: session } = useSession();

  const [users, setUsers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const chatRef = useRef(null);

  const toggleChat = () => {
    setChatOpen((prev) => {
      if (!prev) setShowNotification(false);
      return !prev;
    });
  };

  const sendMessage = () => {
    if (newMsg.trim()) {
      const message = {
        sender: session?.user?.name || "Anonymous",
        content: newMsg,
        type: "text",
        timestamp: Date.now(),
      };
      socket.emit("chat-message", { roomId, message });
      setMessages((prev) => [...prev, message]);
      setNewMsg("");
    }
  };
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      clearTimeout(recordingTimeoutRef.current);
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Voice recording not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && !audioTrack.enabled) {
        audioTrack.enabled = true;
      }
      toggleAudio(myId);
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size === 0) return;

        audioBlob.arrayBuffer().then((buffer) => {
          const voiceMessage = {
            sender: session?.user?.name || "Anonymous",
            content: buffer,
            type: "audio",
            timestamp: Date.now(),
          };
          socket.emit("chat-message", { roomId, message: voiceMessage });
          const localURL = URL.createObjectURL(audioBlob);
          setMessages((prev) => [
            ...prev,
            {
              ...voiceMessage,
              content: localURL,
            },
          ]);
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 120000);
    } catch (err) {
      console.error("Error starting voice recording:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleIncomingMessage = ({ message }) => {
      if (message.type === "audio" && message.content instanceof ArrayBuffer) {
        const blob = new Blob([message.content], { type: "audio/webm" });
        const audioURL = URL.createObjectURL(blob);
        message.content = audioURL;
      }

      setMessages((prev) => [...prev, message]);
      if (!chatOpen) setShowNotification(true);
    };
    socket.on("chat-message", handleIncomingMessage);
    return () => {
      socket.off("chat-message", handleIncomingMessage);
    };
  }, [socket, chatOpen]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!socket || !peer || !stream) return;
    const handleUserConnected = (newUser) => {
      const call = peer.call(newUser, stream);
      call.on("stream", (incomingStream) => {
        setPlayers((prev) => ({
          ...prev,
          [newUser]: {
            url: incomingStream,
            muted: true,
            playing: true,
          },
        }));
        setUsers((prev) => ({ ...prev, [newUser]: call }));
      });
    };
    socket.on("user-connected", handleUserConnected);
    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [peer, setPlayers, socket, stream]);

  useEffect(() => {
    if (!socket) return;
    const handleToggleAudio = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].muted = !copy[userId].muted;
        return { ...copy };
      });
    };
    const handleToggleVideo = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].playing = !copy[userId].playing;
        return { ...copy };
      });
    };
    const handleUserLeave = (userId) => {
      users[userId]?.close();
      const playersCopy = cloneDeep(players);
      delete playersCopy[userId];
      setPlayers(playersCopy);
    };
    socket.on("user-toggle-audio", handleToggleAudio);
    socket.on("user-toggle-video", handleToggleVideo);
    socket.on("user-leave", handleUserLeave);
    return () => {
      socket.off("user-toggle-audio", handleToggleAudio);
      socket.off("user-toggle-video", handleToggleVideo);
      socket.off("user-leave", handleUserLeave);
    };
  }, [players, setPlayers, socket, users]);

  useEffect(() => {
    if (!peer || !stream) return;
    peer.on("call", (call) => {
      const callerId = call.peer;
      call.answer(stream);
      call.on("stream", (incomingStream) => {
        setPlayers((prev) => ({
          ...prev,
          [callerId]: {
            url: incomingStream,
            muted: true,
            playing: true,
          },
        }));
        setUsers((prev) => ({ ...prev, [callerId]: call }));
      });
    });
  }, [peer, setPlayers, stream]);

  useEffect(() => {
    if (!stream || !myId) return;
    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        url: stream,
        muted: true,
        playing: true,
      },
    }));
  }, [myId, setPlayers, stream]);

  return (
    <>
      <div className={styles.activePlayerContainer}>
        {playerHighlighted && (
          <Player
            url={playerHighlighted.url}
            muted={playerHighlighted.muted}
            playing={playerHighlighted.playing}
            isActive
          />
        )}
      </div>
      <div className={styles.inActivePlayerContainer}>
        {Object.keys(nonHighlightedPlayers).map((playerId) => {
          const { url, muted, playing } = nonHighlightedPlayers[playerId];
          return (
            <Player
              key={playerId}
              url={url}
              muted={muted}
              playing={playing}
              isActive={false}
            />
          );
        })}
      </div>

      <div
        className={`${styles.chatSection} ${chatOpen ? styles.chatOpen : ""}`}
      >
        <div className={styles.chatHeader}>
          <h3>Chat</h3>
          <button className={styles.closeBtn} onClick={toggleChat}>
            X
          </button>
        </div>
        <div className={styles.chatMessages} ref={chatRef}>
          {messages.map((msg, index) => (
            <div key={index} className={styles.chatBubble}>
              <strong>{msg.sender}:</strong>{" "}
              {msg.type === "audio" ? (
                <audio controls src={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          ))}
        </div>
        <div className={styles.chatInputRow}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder="Type a message..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className={styles.sendButton}>
            Send
          </button>
          <button
            onClick={toggleVoiceRecording}
            className={`${styles.voiceButton} ${
              isRecording ? styles.recording : ""
            }`}
          >
            {isRecording ? "⏹ Stop" : "🎤 Record"}
          </button>
        </div>
      </div>
      <CopySection roomId={roomId} />
      <Bottom
        muted={playerHighlighted?.muted}
        playing={playerHighlighted?.playing}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        leaveRoom={leaveRoom}
        toggleChat={toggleChat}
        showNotification={showNotification}
      />
    </>
  );
};

export default Room;
