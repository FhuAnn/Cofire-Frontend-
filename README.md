![UIT](https://img.shields.io/badge/from-UIT%20VNUHCM-blue?style=for-the-badge&link=https%3A%2F%2Fwww.uit.edu.vn%2F)

# COFIRE - VS CODE AI ASSISTANT EXTENSION

## 📑 Table of Contents
* [Giới thiệu chung](#giới-thiệu-chung)
* [Các chức năng](#các-chức-năng)
* [Framework và công nghệ](#framework-và-công-nghệ)
* [Hướng dẫn chạy dự án](#hướng-dẫn-chạy-dự-án)
* [Demo (Screenshots)](#demo-screenshots)

---

## 👨‍💻 Giới thiệu chung
**Tác giả:**  
- Hồ Phạm Phú An - 22520013 - [Github](https://github.com/FhuAnn)  
- Nguyễn Nguyên Ngọc Anh - 22520058 - [Github](https://github.com/AndreNguyen03)  

**Mô tả:**  
**Cofire** là một extension cho Visual Studio Code tích hợp AI để hỗ trợ lập trình viên trong quá trình phát triển phần mềm. Extension cung cấp các tính năng như gợi ý code tự động, sinh code từ mô tả, giải thích code, trò chuyện với AI, và mở rộng ngữ cảnh bằng cách đính kèm file hoặc đoạn code.  
Dự án nhằm giải quyết các vấn đề như tốn thời gian viết code lặp lại, lỗi cú pháp, và khó khăn trong việc hiểu source code lớn, mang lại trải nghiệm lập trình thông minh và hiệu quả hơn.  

---

## ⚙️ Các chức năng
### Người dùng chung (Lập trình viên, Sinh viên CNTT)
- Kiểm tra kết nối tới AI model  
- Tự động hoàn thành code (Inline Completion)  
- Sinh code bằng mô tả (Inline)  
- Giải thích code (Code Explanation)  
- Trao đổi với AI (Chat with AI)  
- Mở rộng ngữ cảnh (Add Context: file, folder, selection)  
- Chuyển đổi AI model (Switch between models like GPT, Claude, Gemini)  

---

## 🛠 Framework và công nghệ
- **Kiến trúc:** VSCode Extension Architecture (Frontend + Backend)  
- **Frontend:** TypeScript, HTML/CSS/JavaScript (Xây dựng UI chat và giao diện)  
- **Backend:** ExpressJS (Xử lý API kết nối AI models)  
- **Công nghệ chính:**  
  - VSCode API (Extension Host, Commands, Events)  
  - AI Models: GPT-3.5/GPT-4 (OpenAI), Claude (Anthropic), Gemini (Google), LLaMA (Meta)  
- **Công cụ & IDE:**  
  - Visual Studio Code, Figma (Thiết kế UI/UX), Postman (Test API)  
  - GitHub (Quản lý source code), Yeoman Generator (Scaffold extension)  

---

## 🔧 Hướng dẫn chạy dự án
0. Clone hoặc tải về project này từ [https://github.com/FhuAnn/Cofire-Frontend-/](https://github.com/FhuAnn/Cofire-Frontend-/).  
1. Cài đặt các dependencies:  
   ```
   npm install
   ```  
2. Tải extension hỗ trợ: esbuild Problem Matchers và Extension Test Runner (Ctrl + Shift + X).  
3. Nhấn F5 để chạy extension ở Deployment Mode (môi trường giả lập đã cài extension).  

---

## 📸 Demo (Screenshots)
### Giao diện Chat AI
![Giao diện Chat AI](https://github.com/FhuAnn/Cofire-Frontend-/blob/main/images/chat-ai.jpg?raw=true)

### Sơ đồ Use-Case tổng quát
![Use-Case Diagram](https://github.com/FhuAnn/Cofire-Frontend-/blob/main/images/use-case.jpg?raw=true)

### Sơ đồ Kiến trúc hệ thống
![Kiến trúc hệ thống](https://github.com/FhuAnn/Cofire-Frontend-/blob/main/images/architect.jpg?raw=true)
