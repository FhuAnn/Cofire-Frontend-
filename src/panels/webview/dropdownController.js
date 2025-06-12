// ====== Dropdown Controller ======

import { MODELS } from "./constants.js";
import { stateManager } from "./stateManager.js";

export class DropdownController {
  constructor() {
    this.dropdownMenu = document.getElementById("dropdownMenu");
    this.selectedModelElement = document.getElementById("selectedModel");
  }

  toggleDropdown() {
    this.dropdownMenu.classList.toggle("show");
    console.log("Toggle dropdown");
  }

  selectModel(value) {
    const items = document.querySelectorAll(".dropdown-item");
    items.forEach((item) => item.classList.remove("selected"));

    const selectedItem = Array.from(items).find(
      (item) => item.getAttribute("data-label") === value
    );

    if (selectedItem) {
      selectedItem.classList.add("selected");
      console.log(
        "Selected item (value):",
        selectedItem.getAttribute("data-label")
      );
    } else {
      console.log("Item not found for value:", value);
    }

    // Tìm object model trong MODELS dựa trên value
    const modelObj = MODELS.find((m) => m.value === value);

    if (modelObj) {
      // Hiển thị label
      this.selectedModelElement.textContent = modelObj.label;
      // Set model theo value
      stateManager.setSelectedModel(modelObj.value);
    } else {
      // fallback nếu không tìm thấy modelObj
      this.selectedModelElement.textContent =
        selectedItem?.textContent ?? value;
      stateManager.setSelectedModel(value);
    }

    this.closeDropdown();
  }

  closeDropdown() {
    this.dropdownMenu.classList.remove("show");
  }

  handleOutsideClick(event) {
    if (!event.target.closest(".dropdown")) {
      if (this.dropdownMenu.classList.contains("show")) {
        this.closeDropdown();
        console.log("Closed dropdown");
      }
    }
  }
}
