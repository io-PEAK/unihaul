import prisma from "../lib/prisma.js";
import { deleteFile } from "./uploadController.js";

const getAttachmentPreview = (msg) => {
  if (msg.content) return msg.content;
  if (msg.fileType === "image" || msg.imageUrl) return "Photo";
  if (msg.fileType === "video") return "Video";
  if (msg.fileType === "pdf") return "Document";
  return "";
};

// GET /messages/conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, deletedBySender: { not: true } },
          { receiverId: userId, deletedByReceiver: { not: true } },
        ],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        item: {
          select: {
            id: true,
            title: true,
            status: true,
            sellerId: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const convoMap = new Map();
    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const key = `${msg.itemId ?? "null"}-${otherUser.id}`;
      if (!convoMap.has(key)) {
        convoMap.set(key, {
          conversation_id: key,
          item_id: msg.itemId,
          item_title: msg.item?.title || (msg.itemId ? "Item" : null),
          item_status: msg.item?.status || null,
          item_seller_id: msg.item?.sellerId || null,
          item_image: msg.item?.images?.[0] || null,
          other_user_id: otherUser.id,
          other_user_name:
            `${otherUser.firstName} ${otherUser.lastName}`.trim(),
          other_user_avatar: otherUser.avatar || null,
          last_message: getAttachmentPreview(msg),
          last_message_at: msg.createdAt,
          unread_count: !msg.read && msg.receiverId === userId ? 1 : 0,
          chat_request_id: null,
          chat_request_status: null,
          is_request_sender: false,
          isNew: false,
        });
      } else {
        const existing = convoMap.get(key);
        if (!msg.read && msg.receiverId === userId) {
          existing.unread_count = (existing.unread_count || 0) + 1;
        }
      }
    }

    const chatRequests = await prisma.chatRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: "pending" },
          { senderId: userId, status: "accepted" },
          { receiverId: userId, status: "accepted" },
        ],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        item: {
          select: {
            id: true,
            title: true,
            status: true,
            sellerId: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const req of chatRequests) {
      const isSender = req.senderId === userId;
      const other = isSender ? req.receiver : req.sender;
      const key = `${req.itemId ?? "null"}-${other.id}`;

      if (convoMap.has(key)) {
        const existing = convoMap.get(key);
        existing.chat_request_id = req.id;
        existing.chat_request_status = req.status;
        existing.is_request_sender = isSender;

        if (req.status === "pending" && isSender) {
          if (
            req.message &&
            (!existing.last_message_at ||
              req.createdAt > existing.last_message_at)
          ) {
            existing.last_message = req.message;
            existing.last_message_at = req.createdAt;
          }
        }

        existing.isNew =
          req.status === "accepted" &&
          existing.unread_count === 0 &&
          !existing.last_message;
        continue;
      }

      convoMap.set(key, {
        conversation_id: key,
        item_id: req.itemId,
        item_title: req.item?.title || null,
        item_status: req.item?.status || null,
        item_seller_id: req.item?.sellerId || null,
        item_image: req.item?.images?.[0] || null,
        other_user_id: other.id,
        other_user_name: `${other.firstName} ${other.lastName}`.trim(),
        other_user_avatar: other.avatar || null,
        last_message: req.message || null,
        last_message_at: req.createdAt,
        unread_count: 0,
        chat_request_id: req.id,
        chat_request_status: req.status,
        is_request_sender: isSender,
        isNew: req.status === "accepted",
      });
    }

    res.json(Array.from(convoMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get conversations" });
  }
};

// GET /messages/:itemId?otherUserId=
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rawItemId = req.params.itemId;
    const itemId =
      rawItemId === "null" || rawItemId === "0" ? null : parseInt(rawItemId);
    const otherUserId = parseInt(req.query.otherUserId);

    const [messages, chatReq] = await Promise.all([
      prisma.message.findMany({
        where: {
          itemId: itemId ?? null,
          OR: [
            {
              senderId: userId,
              receiverId: otherUserId,
              deletedBySender: { not: true },
            },
            {
              senderId: otherUserId,
              receiverId: userId,
              deletedByReceiver: { not: true },
            },
          ],
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.chatRequest.findFirst({
        where: {
          itemId: itemId ?? null,
          status: { in: ["pending", "accepted"] },
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    await prisma.message.updateMany({
      where: {
        itemId: itemId ?? null,
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    let result = [...messages];
    if (chatReq?.message) {
      // Check using strict creation time logic so duplicates never happen once moved to DB
      const alreadySaved = messages.some(
        (m) =>
          new Date(m.createdAt).getTime() ===
            new Date(chatReq.createdAt).getTime() &&
          m.senderId === chatReq.senderId,
      );

      if (!alreadySaved) {
        result.push({
          id: "req-" + chatReq.id,
          senderId: chatReq.senderId,
          receiverId: chatReq.receiverId,
          itemId: chatReq.itemId,
          content: chatReq.message,
          read: true,
          createdAt: chatReq.createdAt,
          _synthetic: true,
        });
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
    }

    res.json(result.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      itemId: msg.itemId,
      content: msg.content || "",
      imageUrl: msg.imageUrl || null,
      fileUrl: msg.fileUrl || null,
      fileType: msg.fileType || null,
      fileName: msg.fileName || null,
      fileSize: msg.fileSize || null,
      publicId: msg.publicId || null,
      isCloudDeleted: msg.isCloudDeleted || false,
      createdAt: msg.createdAt,
      _synthetic: msg._synthetic || false,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get messages" });
  }
};

// POST /messages
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, itemId, content, imageUrl, fileUrl: reqFileUrl, attachmentType } = req.body;
    const text = content?.trim() || "";
    if (!receiverId || (!text && !imageUrl && !reqFileUrl)) {
      return res.status(400).json({
        error: "receiverId and at least one of content, imageUrl, or fileUrl is required",
      });
    }
    const senderId = req.user.userId;
    const parsedReceiverId = parseInt(receiverId);
    const parsedItemId = itemId && itemId !== "null" ? parseInt(itemId) : null;

    // Find if an accepted request strictly for this item exists
    const acceptedRequest = await prisma.chatRequest.findFirst({
      where: {
        itemId: parsedItemId,
        status: "accepted",
        OR: [
          { senderId, receiverId: parsedReceiverId },
          { senderId: parsedReceiverId, receiverId: senderId },
        ],
      },
    });

    if (!acceptedRequest) {
      // Check if ANY accepted request exists between these two users ever.
      const anyAcceptedRequest = await prisma.chatRequest.findFirst({
        where: {
          status: "accepted",
          OR: [
            { senderId, receiverId: parsedReceiverId },
            { senderId: parsedReceiverId, receiverId: senderId },
          ],
        },
      });

      const existing = await prisma.chatRequest.findFirst({
        where: { senderId, receiverId: parsedReceiverId, itemId: parsedItemId },
      });

      if (existing?.status === "pending" && !anyAcceptedRequest) {
        return res.status(409).json({
          error: "Chat request already pending",
          requestPending: true,
        });
      }

      if (!text && !imageUrl && !reqFileUrl) {
        return res.status(400).json({
          error: "First message for a new request must include text, image, or file.",
        });
      }

      if (existing)
        await prisma.chatRequest.delete({ where: { id: existing.id } });

      // If trusted, auto-accept this new item thread!
      const statusToSet = anyAcceptedRequest ? "accepted" : "pending";

      const chatReq = await prisma.chatRequest.create({
        data: {
          senderId,
          receiverId: parsedReceiverId,
          itemId: parsedItemId,
          // Keep request preview meaningful for text or image-only first messages.
          message: statusToSet === "pending" ? text || "Photo" : null,
          status: statusToSet,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              institution: true,
            },
          },
          item: { select: { id: true, title: true, images: true } },
        },
      });

      const socketIo = req.io;
      const onlineUsers = socketIo?._onlineUsers;
      if (statusToSet === "pending") {
        onlineUsers?.get(String(parsedReceiverId))?.forEach((sid) => {
          socketIo.to(sid).emit("new-chat-request", {
            id: chatReq.id,
            sender: chatReq.sender,
            message: chatReq.message,
            itemId: parsedItemId,
            item: chatReq.item,
            createdAt: chatReq.createdAt,
          });
        });
        return res.status(202).json({
          routedAsRequest: true,
          requestId: chatReq.id,
          status: "pending",
        });
      } else {
        // Ping receiver so their UI fetches the newly created auto-accepted thread
        onlineUsers?.get(String(parsedReceiverId))?.forEach((sid) => {
          socketIo.to(sid).emit("request-accepted", {
            requestId: chatReq.id,
            itemId: parsedItemId,
            seller: chatReq.sender,
          });
        });
      }
    }

    // Normal message creation...
    const { fileUrl, fileType, fileName, fileSize, publicId } = req.body;
    
    const expiresAt = (fileUrl || imageUrl) 
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
      : null;

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: parsedReceiverId,
        itemId: parsedItemId,
        content: text,
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileName: fileName || null,
        fileSize: fileSize ? parseInt(fileSize) : null,
        publicId: publicId || null,
        expiresAt,
        read: false,
      },
    });

    const [sender, item] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true, avatar: true },
      }),
      parsedItemId
        ? prisma.item.findUnique({
            where: { id: parsedItemId },
            select: { title: true },
          })
        : null,
    ]);

    const richMessage = {
      ...message,
      senderName: sender ? `${sender.firstName} ${sender.lastName}`.trim() : "",
      senderAvatar: sender?.avatar || null,
      itemTitle: item?.title || "",
    };

    const socketIo = req.io;
    const onlineUsers = socketIo?._onlineUsers;
    [String(parsedReceiverId), String(senderId)].forEach((uid) => {
      onlineUsers
        ?.get(uid)
        ?.forEach((sid) => socketIo.to(sid).emit("new-message", richMessage));
    });

    res.status(201).json(richMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// GET /messages/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: req.user.userId,
        read: false,
        deletedByReceiver: { not: true },
      },
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

// GET /messages/unread
export const getUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await prisma.message.findMany({
      where: { receiverId: userId, read: false, deletedByReceiver: { not: true } },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        item: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(
      messages.map((msg) => ({
        id: msg.id,
        senderId: msg.sender.id,
        senderName: `${msg.sender.firstName} ${msg.sender.lastName}`.trim(),
        senderAvatar: msg.sender.avatar || null,
        itemId: msg.itemId,
        itemTitle: msg.item?.title || "Item",
        content: getAttachmentPreview(msg),
        imageUrl: msg.imageUrl || null,
        fileUrl: msg.fileUrl || null,
        fileType: msg.fileType || null,
        fileName: msg.fileName || null,
        isCloudDeleted: msg.isCloudDeleted,
        createdAt: msg.createdAt,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get unread messages" });
  }
};

// POST /messages/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    await prisma.message.updateMany({
      where: { receiverId: req.user.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// POST /messages/mark-convo-read
export const markConvoRead = async (req, res) => {
  try {
    const { itemId, otherUserId } = req.body;
    if (!otherUserId)
      return res.status(400).json({ error: "otherUserId is required" });
    await prisma.message.updateMany({
      where: {
        itemId:
          itemId === null || itemId === undefined || itemId === "null"
            ? null
            : parseInt(itemId),
        senderId: parseInt(otherUserId),
        receiverId: req.user.userId,
        read: false,
      },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark convo as read" });
  }
};

// DELETE /messages/conversation/:itemId/:otherUserId
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rawItemId = req.params.itemId;
    const itemId =
      rawItemId === "null" || rawItemId === "0" ? null : parseInt(rawItemId);
    const otherUserId = parseInt(req.params.otherUserId);

    if (!otherUserId)
      return res.status(400).json({ error: "otherUserId is required" });

    const [bySender, byReceiver] = await Promise.all([
      prisma.message.updateMany({
        where: {
          itemId: itemId ?? null,
          senderId: userId,
          receiverId: otherUserId,
        },
        data: { deletedBySender: true },
      }),
      prisma.message.updateMany({
        where: {
          itemId: itemId ?? null,
          senderId: otherUserId,
          receiverId: userId,
        },
        data: { deletedByReceiver: true },
      }),
    ]);

    // Cleanup Logic: Permanently delete messages marked as deleted by BOTH users
    const doubleDeleted = await prisma.message.findMany({
      where: {
        itemId: itemId ?? null,
        deletedBySender: true,
        deletedByReceiver: true,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      select: { id: true, publicId: true, fileType: true },
    });

    if (doubleDeleted.length > 0) {
      // 1. Delete from Cloudinary
      for (const msg of doubleDeleted) {
        if (msg.publicId) {
          const resourceType =
            msg.fileType === "video" ? "video" : 
            (msg.fileType === "image" || !msg.fileType) ? "image" : "raw";
          
          // Fire and forget deletion
          deleteFile(msg.publicId, resourceType);
        }
      }

      // 2. Delete from Database
      await prisma.message.deleteMany({
        where: { id: { in: doubleDeleted.map((m) => m.id) } },
      });
    }

    await prisma.chatRequest.deleteMany({
      where: {
        itemId: itemId ?? null,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
    });

    const socketIo = req.io;
    const onlineUsers = socketIo?._onlineUsers;
    onlineUsers?.get(String(otherUserId))?.forEach((sid) => {
      socketIo.to(sid).emit("convo-deleted-by-other", {
        itemId: itemId,
        otherUserId: userId,
      });
    });

    res.json({ success: true, deleted: bySender.count + byReceiver.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};