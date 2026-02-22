
const board = document.querySelector(".board");

// Load board from LocalStorage on startup
window.addEventListener("load", () => {
    const savedData = localStorage.getItem("kanban-save");
    if (savedData) {
        board.innerHTML = savedData;
    }
    attachAllEvents();
});

// Save board HTML to LocalStorage
function saveBoard() {
    localStorage.setItem("kanban-save", board.innerHTML);
}

// Function to bind events to elements (even those loaded from storage)
function attachAllEvents() {
    // 1. Setup existing cards
    document.querySelectorAll(".card").forEach(card => {
        addDragEvents(card);
        const del = card.querySelector(".delete-btn");
        if(del) {
            del.onclick = (e) => {
                e.stopPropagation();
                card.remove();
                saveBoard();
            };
        }
    });

    // 2. Setup Add Buttons
    document.querySelectorAll(".add-btn").forEach(btn => {
        btn.onclick = () => {
            const list = btn.closest(".list");
            const container = list.querySelector(".cards-container");
            
            // Prevent creating multiple inputs at once
            if (container.querySelector(".temp-input")) return;

            const input = document.createElement("input");
            input.className = "temp-input";
            input.placeholder = "Press Enter to add...";
            container.appendChild(input);
            input.focus();

            // Handle adding task on Enter
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && input.value.trim() !== "") {
                    const newCard = createCardElement(input.value.trim());
                    input.replaceWith(newCard);
                    saveBoard();
                }
            });

            // Remove input if user clicks away without typing
            input.addEventListener("blur", () => {
                if (!input.value.trim()) input.remove();
            });
        };
    });

    // 3. Setup Drop Zone logic for lists
    document.querySelectorAll(".list").forEach(list => {
        const container = list.querySelector(".cards-container");
        
        list.addEventListener("dragover", e => {
            e.preventDefault();
            const draggingCard = document.querySelector(".dragging");
            if (!draggingCard) return;
            
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggingCard);
            } else {
                container.insertBefore(draggingCard, afterElement);
            }
        });
        
        list.addEventListener("drop", () => saveBoard());
    });
}

// Helper to create a new card element
function createCardElement(text) {
    const card = document.createElement("div");
    card.className = "card";
    card.draggable = true;
    card.innerHTML = `<span>${text}</span><span class="delete-btn">🗑</span>`;
    
    card.querySelector(".delete-btn").onclick = (e) => {
        e.stopPropagation();
        card.remove();
        saveBoard();
    };
    
    addDragEvents(card);
    return card;
}

// Attach DragStart and DragEnd
function addDragEvents(card) {
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        saveBoard();
    });
}

// Logic to determine where to drop the card in the list
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".card:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}