import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import styles from "@/styles/home.module.css";
import { useState } from "react";
import Image from "next/image";
export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const createAndJoin = () => {
    const roomId = uuidv4();
    router.push(`/${roomId}`);
  };
  const joinRoom = () => {
    if (roomId) {
      router.push(`/${roomId}`);
    } else {
      alert("invalid room id");
    }
  };
  return (
    <div className={styles.wrapper}>
     
      <div className={styles.left}>
        <h1 className={styles.heading}>LangSync lets you speak and type in your language — and everyone hears and reads it in theirs</h1>
        <p className={styles.subheading}>
        You speak. They understand. No matter the language.
        </p>
        <div className={styles.inputRow}>
        <button className={styles.button} onClick={createAndJoin}>
          Create Meeting
        </button>
          <input
            className={styles.input}
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button className={styles.joinButton} onClick={joinRoom}>
            Join
          </button>
        </div>

      </div>
      <div className={styles.right}>
        <Image
          src="/—Pngtree—friends video chat communication scene_5773169.png"
          alt="LangSync communication"
          width={550}
          height={600}
        />
      </div>
    </div>
  );
}
