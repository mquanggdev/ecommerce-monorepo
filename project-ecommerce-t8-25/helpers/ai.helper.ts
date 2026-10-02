export const aiGenerateAnswer = async (prompt: string) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      // llama-3.1-8b-instant đã bị Groq gỡ (404 model_not_found)
      model: "openai/gpt-oss-20b",
      messages: [
        {
          // Khung AI bên admin hiển thị văn bản thuần, nên không cho trả Markdown
          role: "system",
          content: "Trả lời bằng tiếng Việt, ngắn gọn, văn bản thuần. Không dùng Markdown: không bảng, không **, không #."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });
  const data = await response.json();

  const content = data.choices?.[0]?.message?.content || "";

  // Ném lỗi để controller trả code "error" thay vì một câu trả lời rỗng
  if(!response.ok || !content) {
    throw new Error(`Groq API lỗi ${response.status}: ${data.error?.message || "không có nội dung trả về"}`);
  }

  return content;
}
