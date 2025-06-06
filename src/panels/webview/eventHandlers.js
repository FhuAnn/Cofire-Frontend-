// eventHandlers.js - Xử lý các sự kiện giao diện

export class EventHandlers {
  constructor(state, vscode) {
    this.state = state;
    this.vscode = vscode;
    this.dropZone = document.getElementById("dropZone");
    this.toggleBtn = document.getElementById("toggleVisibilityBtn");
    this.currentFile = document.getElementById("currentFile");
  }

  // Khởi tạo tất cả event handlers
  initialize() {
    this.initializeToggleButton();
    this.initializeDragDrop();
    this.initializeAttachButton();
    this.initializeModelDropdown();
  }

  // Toggle visibility button
  initializeToggleButton() {
    this.toggleBtn.addEventListener("click", () => {
      this.state.isInVisible = !this.state.isInVisible;
      this.toggleBtn.textContent = this.state.isInVisible ? "🙈" : "👁️";
      
      if (this.state.isInVisible) {
        this.currentFile.classList.add("textLineThough");
      } else {
        this.currentFile.classList.remove("textLineThough");
      }
    });
  }

  // Drag and drop functionality
  initializeDragDrop() {
    window.addEventListener("dragenter", (e) => {
      e.preventDefault();
      this.state.dragCounter++;
      this.dropZone.classList.add("active");
    });

    window.addEventListener("dragleave", (e) => {
      e.preventDefault();
      this.state.dragCounter--;
      if (this.state.dragCounter === 0) {
        this.dropZone.classList.remove("active");
      }
    });

    window.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    window.addEventListener("drop", (e) => {
      e.preventDefault();
      this.state.dragCounter = 0;
      this.dropZone.classList.remove("active");
      
      const uriList = e.dataTransfer.getData("text/uri-list");
      if (uriList) {
        const uris = uriList
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        
        if (uris.length > 0) {
          this.vscode.postMessage({
            type: "filesDropped",
            uris: uris,
          });
        }
      }
    });
  }

  // Attach file button
  initializeAttachButton() {
    document.getElementById("attachFileBtn").onclick = () => {
      this.vscode.postMessage({ type: "attachFile" });
    };
  }

  // Model dropdown functionality
  initializeModelDropdown() {
    window.toggleDropdown = () => {
      const dropdownMenu = document.getElementById("dropdownMenu");
      dropdownMenu.classList.toggle("show");
    };

    window.selectModel = (label) => {
      const items = document.querySelectorAll(".dropdown-item");
      items.forEach((item) => item.classList.remove("selected"));

      const selectedItem = Array.from(items).find(
        (item) => item.getAttribute("data-label") === label
      );
      
      if (selectedItem) {
        selectedItem.classList.add("selected");
      }

      const selectedModel = document.getElementById("selectedModel");
      selectedModel.textContent = label;

      const dropdownMenu = document.getElementById("dropdownMenu");
      dropdownMenu.classList.remove("show");
    };

    // Close dropdown when clicking outside
    window.onclick = (event) => {
      if (!event.target.closest(".dropdown")) {
        const dropdownMenu = document.getElementById("dropdownMenu");
        if (dropdownMenu.classList.contains("show")) {
          dropdownMenu.classList.remove("show");
        }
      }
    };
  }
}