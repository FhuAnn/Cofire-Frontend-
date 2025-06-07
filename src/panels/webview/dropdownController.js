// ====== Dropdown Controller ======

import { stateManager } from './stateManager.js';

export class DropdownController {
  constructor() {
    this.dropdownMenu = document.getElementById("dropdownMenu");
    this.selectedModelElement = document.getElementById("selectedModel");
  }

  toggleDropdown() {
    this.dropdownMenu.classList.toggle("show");
    console.log("Toggle dropdown");
  }

  selectModel(label) {
    const items = document.querySelectorAll(".dropdown-item");
    items.forEach((item) => item.classList.remove("selected"));

    const selectedItem = Array.from(items).find(
      (item) => item.getAttribute("data-label") === label
    );
    
    if (selectedItem) {
      selectedItem.classList.add("selected");
      console.log("Selected item:", selectedItem.getAttribute("data-label"));
    } else {
      console.log("Item not found for label:", label);
    }

    this.selectedModelElement.textContent = label;
    stateManager.setSelectedModel(label);
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