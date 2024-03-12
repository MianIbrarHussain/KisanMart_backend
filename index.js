const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mongo = require("mongoose");
const authRouter = require("./src/routes/authRoutes");
const homeRouter = require("./src/routes/homeRoutes");
const dealsRouter = require("./src/routes/dealRoutes");
const cors = require("cors");
const { UserData, ChatData } = require("./src/schemes");
const { paramsCheck } = require("./src/components/helperFunctions");

const APP = express();
const server = http.createServer(APP);
const io = socketIO(server, {
  origin: "http://localhost:3001",
});

APP.use("/media", express.static("./src/media"));

APP.use(
  express.urlencoded({
    extended: false,
  })
);
APP.use(express.json());

APP.use(cors());

APP.use("/auth", authRouter);
APP.use("/home", homeRouter);
APP.use("/deal", dealsRouter);

function sendInitialChats(socket, userID) {
  ChatData.aggregate([{ $match: { recipients: { $in: [userID] } } }])
    .then((chats) => Promise.all(chats.map((k) => formatChatData(k, userID))))
    .then((finalData) => {
      socket.emit("chatUpdate", finalData);
    })
    .catch((error) => console.error("Error fetching chats:", error));
}

async function sendIndividualChats(socket, newChat) {
  const existingChat1 = await ChatData.findOne({
    recipients: { $all: [newChat.userID, newChat.recipientID] },
  });
  const existingChat2 = await ChatData.findOne({
    recipients: { $all: [newChat.recipientID, newChat.userID] },
  });
  const userData1 = await UserData.findById(newChat.recipientID);
  const userData2 = await UserData.findById(newChat.userID);

  socket.emit("newChat", {
    userID: newChat.userID,
    chatData: {
      chatID: existingChat1._id || existingChat2._id,
      recipientName: userData1.name,
      profilePicture: userData1.profilePicture,
      conversation: existingChat1.Messages || existingChat2.Messages,
    },
  });
  socket.broadcast.emit("newChat", {
    userID: newChat.recipientID,
    chatData: {
      chatID: existingChat1._id || existingChat2._id,
      recipientName: userData2.name,
      profilePicture: userData2.profilePicture,
      conversation: existingChat1.Messages || existingChat2.Messages,
    },
  });
}

async function formatChatData(k, userID) {
  let user1 = await UserData.findById(
    k.recipients[0] === userID ? k.recipients[1] : k.recipients[0]
  );
  return {
    chatID: k._id,
    recipientName: user1.name,
    profilePicture: user1.profilePicture,
    conversation: k.Messages,
    recipientID: user1._id,
  };
}

io.on("connection", (socket) => {
  const userID = socket.handshake.auth.userID;
  sendInitialChats(socket, userID);

  socket.on("newMessage", async (message) => {
    await handleNewMessage(message);
    socket.emit("newMessage", message);
    socket.broadcast.emit("newMessage", message);
  });

  socket.on("newChat", async (newChat) => {
    sendIndividualChats(socket, newChat);
  });

  socket.on("newOffer", async (newOffer) => {
    await handleNewOffer(newOffer);
    socket.emit("newOffer", {
      chatID: newOffer.chatID,
      message: {
        sender: newOffer.sender,
        isOffer: true,
        offerID: newOffer.offerID,
        message: "sent an offer",
      },
    });
    socket.broadcast.emit("newOffer", {
      chatID: newOffer.chatID,
      message: {
        sender: newOffer.sender,
        isOffer: true,
        offerID: newOffer.offerID,
        message: "sent an offer",
      },
    });
  });

  socket.on("dealUpdated", async (offerID) => {
    socket.emit("dealUpdated", offerID);
    socket.broadcast.emit("dealUpdated", offerID);
  });
});

async function handleNewOffer(newOffer) {
  try {
    const chat = await ChatData.findById(newOffer.chatID);

    chat.Messages.push({
      sender: newOffer.sender,
      isOffer: true,
      message: "sent an offer",
      offerID: newOffer.offerID,
    });

    await chat.save();
  } catch (error) {
    console.error("Error handling new offer:", error);
  }
}

async function handleNewMessage(messageData) {
  try {
    const chat = await ChatData.findById(messageData.chatID);

    chat.Messages.push({
      ...messageData.message,
      isOffer: false,
    });

    await chat.save();
  } catch (error) {
    console.error("Error handling new message:", error);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  try {
    mongo.connect("mongodb://0.0.0.0:27017/Kisan_Mart_BackEnd");
    console.log("ALL GOOD on " + PORT);
  } catch (error) {
    console.log("DB error=============");
  }
});
