import { v4 as uuidv4 } from "uuid"
import { useRouter } from "next/navigation"
import styles from "@/styles/home.module.css"
import { useState } from "react";

export default function Home() {
const router=useRouter();
const [roomId,setRoomId]= useState("");
const createAndJoin=()=>{
  const roomId=uuidv4();
  router.push(`/${roomId}`)
}
const joinRoom=()=>
{
  if(roomId)
  {
    router.push(`/${roomId}`);
    alert("invalid room id");
  }
  else{
    alert("invalid room id");
  }
}
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        Welcome to LangSync
        <div>
          <input className={styles.input} placeholder="Enter Your Name"/>
          
          <input className={styles.input} placeholder="Enter the Room Id" value={roomId} onChange={(e)=>setRoomId(e?.target?.value)}/>
          <button className={styles.button} onClick={joinRoom}>Join Room</button>
        </div>
        <span className={styles.separator}> --OR-- </span>
        <button className={styles.button} onClick={createAndJoin}>Create New Room</button>
      </h1>
    </div>
  )
}
