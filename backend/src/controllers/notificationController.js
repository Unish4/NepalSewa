import Notification from "../models/Notification.js";

// ─── GET /api/notifications 
export const getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/notifications/unread-count 
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/notifications/:id/read 
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true },
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/notifications/read-all 
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true },
    );
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
