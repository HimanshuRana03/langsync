import { Server } from "socket.io";
import dbConnect from "@/lib/mongodb";
import Room from "@/models/Room";
import axios from "axios";

const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(
      "http://localhost:5001/translate",
      {
        q: text,
        source: "auto",
        target: targetLang,
        format: "text",
      },
      {
        headers: { accept: "application/json" },
      }
    );
    return response.data.translatedText;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
};

const userSocketMap = {}; 

const SocketHandler = async (req, res) => {
  if (res.socket.server.io) {
    console.log("Socket already running");
  } else {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    await dbConnect();

    io.on("connection", (socket) => {
      console.log("Socket server connected");

      
      socket.on("disconnect", () => {
        for (const [userId, sockId] of Object.entries(userSocketMap)) {
          if (sockId === socket.id) {
            delete userSocketMap[userId];
            break;
          }
        }
      });

      socket.on("join-room", async (roomId, userId, userName, userLanguage) => {
        console.log(`User ${userId} joined room ${roomId}`);
        socket.join(roomId);

        userSocketMap[userId] = socket.id;

        await Room.updateOne(
          { roomId },
          {
            $addToSet: {
              participants: { 
                id:userId,
                name: userName, 
                language: userLanguage || "en",
               },
            },
          },
          { upsert: true }
        );

        socket.broadcast.to(roomId).emit("user-connected", userId);
      });

      socket.on("set-language", async ({ roomId, userId, languageCode }) => {
        try {
          await Room.updateOne(
            { roomId,"participants.id": userId },
            { $set: { "participants.$.language": languageCode } },
            
          );
          console.log(`Language set for ${userId} to ${languageCode}`);
        } catch (error) {
          console.error("Failed to update language:", error);
        }
      });

      socket.on("user-toggle-audio", (userId, roomId) => {
        socket.broadcast.to(roomId).emit("user-toggle-audio", userId);
      });

      socket.on("user-toggle-video", (userId, roomId) => {
        socket.broadcast.to(roomId).emit("user-toggle-video", userId);
      });

      socket.on("user-leave", (userId, roomId) => {
        socket.broadcast.to(roomId).emit("user-leave", userId);
      });

      socket.on("chat-message", async ({ roomId, message }) => {
        try {
          const storedMessage = {
            sender: message.sender,
            type: message.type,
            content:
              message.type === "audio"
                ? Buffer.from(message.content)
                : message.content,
            timestamp: message.timestamp,
          };

          
          await Room.updateOne(
            { roomId },
            { $push: { messages: storedMessage } },
            { upsert: true }
          );

          const roomDoc = await Room.findOne({ roomId });
          

          for (const participant of roomDoc.participants) {
            const userId = participant.id;
            
            let contentToSend = storedMessage.content;
            const targetSocketId = userSocketMap[userId];
            const isSender = userId === storedMessage.sender;
            if (
              !isSender &&
              storedMessage.type === "text" &&
              participant.language
            ){ 
            try{
              const translated = await translateText(
                storedMessage.content,
                participant.language
              );
              contentToSend=translated;
            }catch (err) {
              console.error(`Translation failed for ${userId}:`, err);
            }
          }

            
            if (!isSender&&targetSocketId) {
              io.to(targetSocketId).emit("chat-message", {
                message: {
                  ...storedMessage,
                  content:contentToSend,
                },
              });
            }
          }
        } catch (error) {
          console.error("Error processing chat-message:", error);
        }
      });
    });
  }

  res.end();
};

export default SocketHandler;
