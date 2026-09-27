import { sendChatMessage } from "../services/chatbotService.js";
import mongoose from "mongoose";

// ── Helper: get the admin_tickets collection directly ──────────────────────
const getTicketsCollection = () => {
  return mongoose.connection.db.collection("admin_tickets");
};

// ── POST /api/chat ──────────────────────────────────────────────────────────
export const handleChatMessage = async (req, res) => {
  try {
    const { message, userId, userName, userEmail } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        response: "Please provide a message.",
        intent: "empty",
        confidence: 0.0,
      });
    }

    // Use userId from body (sent by frontend) OR from JWT token if authenticated
    const resolvedUserId = userId || (req.user ? req.user.id : null);
    const resolvedUserName = userName || (req.user ? req.user.name : null);
    const resolvedUserEmail = userEmail || (req.user ? req.user.email : null);

    const result = await sendChatMessage(message.trim(), resolvedUserId, resolvedUserName, resolvedUserEmail);

    res.json(result);
  } catch (error) {
    console.error("Chat controller error:", error);
    res.status(500).json({
      response: "Our chat service is temporarily unavailable. Please try again later.",
      intent: "error",
      confidence: 0.0,
    });
  }
};

// ── GET /api/chat/tickets ───────────────────────────────────────────────────
export const getAdminTickets = async (req, res) => {
  try {
    const tickets = await getTicketsCollection()
      .aggregate([
        // Sort newest first
        { $sort: { timestamp: -1 } },
        // Try to join user info if user_id is a valid ObjectId
        {
          $addFields: {
            userObjectId: {
              $cond: {
                if: {
                  $regexMatch: {
                    input: { $ifNull: ["$user_id", ""] },
                    regex: /^[a-f\d]{24}$/i,
                  },
                },
                then: { $toObjectId: "$user_id" },
                else: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userObjectId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$userInfo", 0] },
          },
        },
        {
          $project: {
            message: 1,
            intent: 1,
            reason: 1,
            status: 1,
            timestamp: 1,
            user_id: 1,
            "user.name": 1,
            "user.email": 1,
            "user.phone": 1,
          },
        },
      ])
      .toArray();

    res.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ message: "Failed to fetch support tickets" });
  }
};

// ── PUT /api/chat/tickets/:id ───────────────────────────────────────────────
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    await getTicketsCollection().updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status,
          resolvedAt: status === "resolved" ? new Date() : undefined,
          resolvedBy: req.user.id,
        },
      }
    );

    res.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ message: "Failed to update ticket" });
  }
};
