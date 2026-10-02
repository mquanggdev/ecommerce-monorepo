// Escape ký tự HTML để chống XSS khi nhúng dữ liệu người dùng vào innerHTML
const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

// Chỉ chấp nhận đường dẫn file do file-manager trả về, dạng /media/...
const safeFilePath = (file) => {
  const path = String(file ?? "");
  if (!path.startsWith("/media/")) return null;
  if (path.includes("..")) return null;
  return path.split("/").map(encodeURIComponent).join("/");
};

// Output AI hiển thị dạng văn bản thuần, giữ nguyên xuống dòng
const aiContentBox = document.querySelector("#chat-ai-suggest-reply .inner-content");
if (aiContentBox) {
  aiContentBox.style.whiteSpace = "pre-wrap";
}

// Logic nhắn tin của Admin
const formChat = document.querySelector("[form-chat]");
if(formChat) {
  const inputContent = formChat.querySelector("[input-content]");
  const buttonSend = formChat.querySelector("[button-send]");
  const chatRoomId = document.querySelector("[chat-room-id]").getAttribute("chat-room-id");
  const chatDetail = document.querySelector(".chat-detail");
  const chatBody = document.querySelector(".chat-body");
  const chatFile = document.querySelector("#chat-file");
  const chatAttach = document.querySelector("#chat-attach");
  const chatPreview = document.querySelector("#chat-preview");
  let selectedFiles = [];

  // Khởi tạo SocketIO bên Admin
  const socket = io({
    auth: {
      roomId: chatRoomId
    }
  });

  buttonSend.addEventListener("click", async () => {
    // Gửi files lên backend để lấy link file
    let fileUrls = [];
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append("files", file);
      });
      formData.append("roomId", chatRoomId);

      const res = await fetch(`/${pathAdmin}/chat/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.code === "success") {
        fileUrls = data.fileUrls;
      }
    }
    
    const content = inputContent.value.trim();
    if(content || fileUrls.length > 0) {
      // Gửi tin nhắn lên cho server
      socket.emit("CLIENT_SEND_MESSAGE", {
        content: content,
        files: fileUrls
      });
      inputContent.value = "";
      selectedFiles = [];
      chatPreview.innerHTML = "";
      chatPreview.classList.add("d-none");
    }
  })

  // Hàm hiển thị tin nhắn
  const appendMessage = (item, isPrepend = false) => {
    const elementMessage = document.createElement("div");
    elementMessage.classList.add("d-flex");
    if(item.senderRole == "admin") {
      elementMessage.classList.add("flex-row-reverse");
    }
    elementMessage.setAttribute("id", item._id);
    let html = "";
    // Thêm nút xóa
    if (item.senderRole == "admin") {
      html += `<span class="delete-message" data-id="${escapeHtml(item._id)}" title="Xóa tin nhắn">✕</span>`;
    }
    // Hiển thị content
    if (item.content) {
      html += `
        <p>${escapeHtml(item.content)}</p>
      `;
    }
    // Hiển thị files
    if (item.files && item.files.length > 0) {
      html += `<div class="chat-files">`;
      item.files.forEach(file => {
        const filePath = safeFilePath(file);
        if (!filePath) return;
        const ext = filePath.split(".").pop().toLowerCase();
        if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
          html += `
            <a href="${domainPublic}${filePath}" target="_blank">
              <img src="${domainPublic}${filePath}" class="chat-image">
            </a>
          `;
        } else {
          html += `
            <a href="${domainPublic}${filePath}" target="_blank">
              📄 File đính kèm
            </a>
          `;
        }
      });
      html += `</div>`;
    }
    elementMessage.innerHTML = `
      <div class="chat-box w-100 ${item.senderRole === 'admin' ? 'reverse' : ''}">
        <div class="user-chat" title="${escapeHtml(item.createdAtFormat)}">
          ${html}
        </div>
      </div>
    `;
    if(isPrepend) {
      chatDetail.prepend(elementMessage);
    } else {
      chatDetail.appendChild(elementMessage);
    }
  }
  
  // Nhận tin nhắn từ server
  socket.on("SERVER_SEND_MESSAGE", (data) => {
    if(chatRoomId == data.roomId) {
      appendMessage(data);
    }
  });

  // Load 20 tin nhắn gần nhất
  const loadInitialMessages = async () => {
    const res = await fetch(`/${pathAdmin}/chat/messages?limit=20&roomId=${chatRoomId}`);
    const data = await res.json();
    
    for (const item of data.messages) {
      appendMessage(item);
    }

    // Khi mở chat scroll xuống tin nhắn mới nhất
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  loadInitialMessages();

  // Khi scorll lên load thêm những tin nhắn cũ
  let isLoading = false;
  let hasMore = true;
  chatBody.addEventListener("scroll", async () => {
    if (chatBody.scrollTop === 0 && !isLoading && hasMore) {
      isLoading = true;

      const lastMessage = chatBody.querySelector(".d-flex");
      const lastMessageId = lastMessage.getAttribute("id");

      if (!lastMessageId) return;

      const res = await fetch(`/${pathAdmin}/chat/messages?lastMessageId=${lastMessageId}&limit=20&roomId=${chatRoomId}`);
      const data = await res.json();

      if (data.messages.length === 0) {
        hasMore = false;
      } else {
        const oldHeight = chatBody.scrollHeight;

        data.messages.forEach(item => {
          appendMessage(item, true);
        });

        const newHeight = chatBody.scrollHeight;

        // Giữ nguyên vị trí scroll
        chatBody.scrollTop = newHeight - oldHeight;
      }

      isLoading = false;
    }
  });

  // Lắng nghe sự kiện USER_STATUS_ONLINE
  socket.on("USER_STATUS_ONLINE", (data) => {
    const elementUserOnlineBoxLeft = document.querySelector(`.chat-body-left [user-id="${data.id}"] [user-status]`);
    if(elementUserOnlineBoxLeft) {
      if(data.status == "online") {
      elementUserOnlineBoxLeft.classList.remove("d-none");
      } else if (data.status == "offline") {
        elementUserOnlineBoxLeft.classList.add("d-none");
      }
    }
  });

  // Danh sách user đang online
  socket.on("LIST_USER_ONLINE", (data) => {
    data.listUserOnline.forEach(id => {
      const elementUserOnlineBoxLeft = document.querySelector(`.chat-body-left [user-id="${id}"] [user-status]`);
      if(elementUserOnlineBoxLeft) {
        elementUserOnlineBoxLeft.classList.remove("d-none");
      }
    });
  });

  // Gửi tín hiệu đang gõ
  let typingTimeout;
  let isTyping = false; // Để biết đang gõ hay không

  inputContent.addEventListener("keyup", () => {
    if (!isTyping) {
      isTyping = true;
      socket.emit("ADMIN_TYPING", {
        isTyping: true
      });
    }

    clearTimeout(typingTimeout); // Khi vẫn đang gõ thì không chạy vào setTimeout

    typingTimeout = setTimeout(() => {
      isTyping = false;
      socket.emit("ADMIN_TYPING", {
        isTyping: false
      });
    }, 2000);
  });

  // Click vào nút attach thì mở phần chọn file
  chatAttach.addEventListener("click", () => {
    chatFile.click();
  });

  // Chọn file
  chatFile.addEventListener("change", (e) => {
    const files = Array.from(e.target.files); // Danh sách file từ dạng object chuyển thành dạnh mảng

    files.forEach(file => {
      selectedFiles.push(file);

      const reader = new FileReader(); // Khởi tạo đọc file

      const previewItem = document.createElement("div"); // Tạo phần preview
      previewItem.classList.add("preview-item"); // Thêm class preview-item cho phần preview

      // Nếu là ảnh thì hiển thị img
      if (file.type.startsWith("image/")) {
        reader.onload = (event) => { // Khi đọc file xảy ra sự kiện
          previewItem.innerHTML = `
            <img src="${event.target.result}" />
            <div class="preview-remove">×</div>
          `;
        };
        reader.readAsDataURL(file); // Đọc file với dạng data url
      } else {
        // Nếu không phải ảnh
        previewItem.innerHTML = `
          <div class="preview-file-item">
            📄 ${escapeHtml(file.name)}
          </div>
          <div class="preview-remove">×</div>
        `;
      }

      // Xử lý xoá file
      previewItem.addEventListener("click", () => {
        selectedFiles = selectedFiles.filter(f => f !== file); // Xóa file trong danh sách
        previewItem.remove(); // Xóa phần preview
        if(selectedFiles.length === 0) {
          chatPreview.classList.add("d-none");
        }
      });

      chatPreview.appendChild(previewItem); // Chèn item vào giao diện
      chatPreview.classList.remove("d-none");
    });

    chatFile.value = ""; // Xóa file khỏi input
  });

  // Đổi trạng thái phòng chat
  const buttonLock = document.querySelector("[button-lock]");
  buttonLock.addEventListener("click", () => {
    const status = buttonLock.getAttribute("button-lock");
    
    const dataFinal = {
      status: status,
      roomId: chatRoomId
    };

    fetch(`/${pathAdmin}/chat/change-status`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataFinal),
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "error") {
          notyf.error(data.message);
        }

        if(data.code == "success") {
          drawNotify("success", data.message);
          window.location.reload();
        }
      })
  });

  // Lắng nghe sự kiện SERVER_DELETE_MESSAGE
  socket.on("SERVER_DELETE_MESSAGE", (data) => {
    const { messageId } = data;
    const messageItem = document.querySelector(`.chat-detail [id="${messageId}"]`);
    if(messageItem) {
      messageItem.remove();
    }
  });

  // Xóa tin nhắn
  chatBody.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-message")) {
      const isConfirm = confirm("Bạn có chắc muốn xóa tin nhắn này?");
      if (!isConfirm) return;
      const messageId = event.target.getAttribute("data-id");
      socket.emit("CLIENT_DELETE_MESSAGE", {
        messageId: messageId
      });
    }
  });

  
  // Xóa phòng chat
  const buttonDeleteRoom = document.querySelector("[button-delete-room]");
  buttonDeleteRoom.addEventListener("click", () => {
    const isConfirm = confirm("Bạn có chắc muốn xóa phòng chat?");
    if (!isConfirm) return;
    socket.emit("ADMIN_DELETE_ROOM", {
      roomId: chatRoomId
    });
  });

  // Lắng nghe sự kiện SERVER_DELETE_ROOM
  socket.on("SERVER_DELETE_ROOM", (data) => {
    const { roomId } = data;
    if(roomId !== chatRoomId) return;
    drawNotify("success", "Đã xóa phòng chat!");
    window.location.href = `/${pathAdmin}/chat/list/my-chat`;
  });

  // Các nút AI: hiện "đang xử lý" trong khung gợi ý, khóa nút khi chờ, báo lỗi nếu thất bại
  const chatAiSuggestReply = document.querySelector("#chat-ai-suggest-reply");
  const aiBox = chatAiSuggestReply.querySelector(".inner-content");
  const runAi = async (button, url, options) => {
    // Nút là thẻ <a> nên khóa bằng class, bỏ qua lần bấm khi đang chờ
    if(button.classList.contains("disabled")) return;
    button.classList.add("disabled");
    aiBox.textContent = "AI đang xử lý...";
    chatAiSuggestReply.classList.remove("d-none");
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      aiBox.textContent = data.code === "success" ? data.content : (data.message || "AI chưa trả lời được, thử lại sau!");
    } catch (error) {
      aiBox.textContent = "Không kết nối được tới máy chủ, thử lại sau!";
    } finally {
      button.classList.remove("disabled");
    }
  };

  // AI Suggest Reply
  const buttonAiSuggestReply = document.querySelector("#button-ai-suggest-reply");
  if(buttonAiSuggestReply) {
    buttonAiSuggestReply.addEventListener("click", () => {
      runAi(buttonAiSuggestReply, `/${pathAdmin}/chat/suggest-reply/${chatRoomId}`);
    });
  }

  // Đóng gợi ý
  const buttonCloseAiSuggestReply = chatAiSuggestReply.querySelector(".inner-close");
  buttonCloseAiSuggestReply.addEventListener("click", () => {
    chatAiSuggestReply.classList.add("d-none");
    aiBox.textContent = "";
  });

  // AI Edit Reply
  const buttonAiEditReply = document.querySelector("#button-ai-edit-reply");
  if(buttonAiEditReply) {
    buttonAiEditReply.addEventListener("click", () => {
      runAi(buttonAiEditReply, `/${pathAdmin}/chat/edit-reply/${chatRoomId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: inputContent.value.trim()
        })
      });
    });
  }

  // AI Chat Summary
  const buttonAiChatSummary = document.querySelector("#button-ai-chat-summary");
  if(buttonAiChatSummary) {
    buttonAiChatSummary.addEventListener("click", () => {
      runAi(buttonAiChatSummary, `/${pathAdmin}/chat/summary/${chatRoomId}`);
    });
  }

  // AI Phân tích cảm xúc khách hàng
  const buttonAiCustomerEmotions = document.querySelector("#button-ai-customer-emotions");
  if(buttonAiCustomerEmotions) {
    buttonAiCustomerEmotions.addEventListener("click", () => {
      runAi(buttonAiCustomerEmotions, `/${pathAdmin}/chat/customer-emotions/${chatRoomId}`);
    });
  }
}
