import { Zalo, ThreadType } from "zca-js";
import fs from "node:fs";

// ====== CẤU HÌNH ======
const QR_PATH = "./qr.png";          // ảnh QR chuyển khoản gửi cho user
const GROUP_ID = "ID_NHOM_CUA_BAN";  // lấy từ message.threadId khi bot nhận tin nhắn đầu tiên
const ADMIN_IDS = ["USER_ID_QTV_1", "USER_ID_QTV_2"]; // các UID được miễn kick (qtv)

// ====== ĐĂNG NHẬP ======
const zalo = new Zalo();
const api = await zalo.loginQR();

console.log("Bot đã đăng nhập, đang lắng nghe...");

// ====== 1. TỰ ĐỘNG GỬI QR KHI CÓ TỪ "mã"/"Mã" ======
api.listener.on("message", async (message) => {
  if (message.isSelf) return;
  if (message.type !== ThreadType.Group) return;

  const isPlainText = typeof message.data.content === "string";
  if (!isPlainText) return;

  const content = message.data.content.trim().toLowerCase();

  if (content.includes("mã")) {
    try {
      await api.sendMessage(
        {
          msg: "Đây là mã QR chuyển khoản 👇",
          attachments: [QR_PATH],
        },
        message.threadId,
        ThreadType.Group,
      );
    } catch (err) {
      console.error("Lỗi gửi QR:", err);
    }
  }
});

// ====== 2. KICK NGƯỜI ĐỔI AVATAR/ẢNH NỀN NHÓM (trừ qtv) ======
api.listener.on("group_event", async (event) => {
  try {
    const { threadId, type, data } = event;

    const isAvatarChange = type === "update_avatar" || type === "change_group_avatar";
    const isBackgroundChange = type === "update_background" || type === "change_group_background";

    if (!isAvatarChange && !isBackgroundChange) return;

    const actorId = data?.creatorId || data?.actorId || data?.uid;
    if (!actorId) return;

    if (ADMIN_IDS.includes(actorId)) return;

    await api.removeUserFromGroup(actorId, threadId);

    await api.sendMessage(
      {
        msg: `Thành viên vừa đổi ${isAvatarChange ? "ảnh đại diện" : "ảnh nền"} nhóm đã bị mời ra khỏi nhóm theo quy định.`,
      },
      threadId,
      ThreadType.Group,
    );
  } catch (err) {
    console.error("Lỗi xử lý group_event:", err);
  }
});

api.listener.start();

process.on("unhandledRejection", (err) => console.error("Unhandled:", err));
