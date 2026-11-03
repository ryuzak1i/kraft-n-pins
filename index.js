// ==========================================
// HAMBURGER MENU
// ==========================================
const hamburger = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');
if(hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('show-menu');
    });
}

// ==========================================
// INTERACTIVE ORDERING & BASKET LOGIC
// ==========================================
let orderBasket = [];

// 1. Add click listeners to all bundle boxes
document.querySelectorAll('.add-to-basket').forEach(box => {
    box.addEventListener('click', function() {
        // Determine size from parent
        const parentBox = this.closest('.pop-box');
        let size = "25";
        if (parentBox.classList.contains('pop-32')) size = "32";
        if (parentBox.classList.contains('pop-58')) size = "58";

        // Extract bundle type and price
        const type = this.querySelector('#qty b').innerText;
        const priceText = this.querySelector('#amount').innerText;
        const price = parseInt(priceText.replace(/[^0-9]/g, ''));

        // Determine quantity for uploads
        let pinQty = 1;
        if (type.includes('2') || type.includes('Duo')) pinQty = 2;
        if (type.includes('3') || type.includes('Trio')) pinQty = 3;
        if (type.includes('5+1') || type.includes('Squad')) pinQty = 6;

        // Add to array
        orderBasket.push({
            id: Date.now(),
            size: size,
            type: type,
            price: price,
            pinQty: pinQty
        });

        updateBasketUI();
        
        // Add a cute little pop animation on click
        this.style.transform = 'scale(0.95)';
        setTimeout(() => this.style.transform = '', 150);
    });
});

// 2. Update the Sidebar Basket and Upload Zones
function updateBasketUI() {
    const list = document.getElementById('basket-items-list');
    list.innerHTML = '';
    let totalAmount = 0;
    let sizeCounts = {}; // Tracks how many pins of each size are in basket

    if (orderBasket.length === 0) {
        list.innerHTML = '<li class="empty-basket">No pins added yet!</li>';
        document.getElementById('basket-total-price').innerText = 'PHP 0';
        updateDropZones({});
        return;
    }

    orderBasket.forEach(item => {
        totalAmount += item.price;
        sizeCounts[item.size] = (sizeCounts[item.size] || 0) + item.pinQty;

        const li = document.createElement('li');
        li.className = 'basket-list-item';
        li.innerHTML = `
            <div class="basket-item-info">
                <span class="basket-item-name">${item.size}mm — ${item.type}</span>
                <span class="basket-item-price">PHP ${item.price}</span>
            </div>
            <button class="basket-remove-btn" onclick="removeItem(${item.id})"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(li);
    });

    document.getElementById('basket-total-price').innerText = 'PHP ' + totalAmount;
    
    // Generate drop zones based on total quantities grouped by size
    updateDropZones(sizeCounts);
}

// 3. Remove Item
function removeItem(id) {
    orderBasket = orderBasket.filter(item => item.id !== id);
    updateBasketUI();
}

// 4. Generate Drag & Drop Zones per Size
function updateDropZones(sizeCounts) {
    const wrapper = document.getElementById('drop-zones-wrapper');
    wrapper.innerHTML = '';
    
    if (Object.keys(sizeCounts).length === 0) {
        wrapper.innerHTML = '<div class="empty-upload-state">Basket is empty. Select sizes above!</div>';
        return;
    }

    for (let size in sizeCounts) {
        const totalPins = sizeCounts[size];
        const zone = document.createElement('div');
        zone.className = 'custom-drop-zone';
        zone.innerHTML = `
            <div class="drop-zone-prompt">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>Upload designs for <b>${size}mm</b> (${totalPins} pins)</span>
            </div>
            <input type="file" name="files_${size}" class="drop-zone-input" multiple accept="image/*">
        `;
        wrapper.appendChild(zone);
        bindDragAndDrop(zone);
    }
}

// 5. Handle Drag and Drop Logic
function bindDragAndDrop(dropZoneElement) {
    const inputElement = dropZoneElement.querySelector(".drop-zone-input");

    dropZoneElement.addEventListener("click", () => inputElement.click());

    inputElement.addEventListener("change", () => {
        if (inputElement.files.length) {
            renderThumbnail(dropZoneElement, inputElement.files);
        }
    });

    dropZoneElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZoneElement.classList.add("drop-zone-over");
    });

    ["dragleave", "dragend"].forEach(type => {
        dropZoneElement.addEventListener(type, () => dropZoneElement.classList.remove("drop-zone-over"));
    });

    dropZoneElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            inputElement.files = e.dataTransfer.files;
            renderThumbnail(dropZoneElement, e.dataTransfer.files);
        }
        dropZoneElement.classList.remove("drop-zone-over");
    });
}

function renderThumbnail(dropZoneElement, files) {
    let thumbnailElement = dropZoneElement.querySelector(".drop-zone-thumb");
    let promptElement = dropZoneElement.querySelector(".drop-zone-prompt");

    if (promptElement) promptElement.style.display = 'none';

    if (!thumbnailElement) {
        thumbnailElement = document.createElement("div");
        thumbnailElement.className = "drop-zone-thumb";
        dropZoneElement.appendChild(thumbnailElement);
    }

    const fileCount = files.length;
    thumbnailElement.dataset.label = fileCount > 1 ? `${fileCount} images selected` : files[0].name;

    // Show preview of the first image
    if (files[0].type.startsWith("image/")) {
        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        reader.onload = () => {
            thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
        };
    }
}

// 6. Proceed to DM Button Setup
const submitBtn = document.getElementById('checkout-submit-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        if(orderBasket.length === 0) {
            alert("Please add items to your basket first!");
            return;
        }
        // Builds the order string for Instagram
        let orderString = "Hi! I'd like to place an order:%0A";
        orderBasket.forEach(item => {
            orderString += `- ${item.size}mm ${item.type}%0A`;
        });
        orderString += `%0ATotal: ${document.getElementById('basket-total-price').innerText}`;
        
        window.open(`https://ig.me/m/kraftnpins?text=${orderString}`, '_blank');
    });
}