import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  type: {
    type: String,
    enum: ["text", "audio"],
    required: true,
  },
  content: mongoose.Schema.Types.Mixed,
  timestamp: Number,
});


const participantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  language: { type: String, default: "en" }, 
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  participants: [participantSchema], 
  messages: [messageSchema],
});

export default mongoose.models.Room || mongoose.model("Room", roomSchema);
