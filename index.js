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
// NEW: Global memory to preserve uploaded files across basket clicks!
let uploadedFilesState = { '25': [], '32': [], '58': [] }; 

document.querySelectorAll('.add-to-basket').forEach(box => {
    box.addEventListener('click', function() {
        const parentBox = this.closest('.pop-box');
        let size = "25";
        if (parentBox.classList.contains('pop-32')) size = "32";
        if (parentBox.classList.contains('pop-58')) size = "58";

        const type = this.querySelector('#qty b').innerText;
        const priceText = this.querySelector('#amount').innerText;
        const price = parseInt(priceText.replace(/[^0-9]/g, ''));

        let pinQty = 1;
        if (type.includes('2') || type.includes('Duo')) pinQty = 2;
        if (type.includes('3') || type.includes('Trio')) pinQty = 3;
        if (type.includes('5+1') || type.includes('Squad')) pinQty = 6;

        orderBasket.push({
            id: Date.now(),
            size: size,
            type: type,
            price: price,
            pinQty: pinQty
        });

        updateBasketUI();
        
        // Emphatic bounce and color flash animation
        this.classList.add('clicked-animation');
        setTimeout(() => {
            this.classList.remove('clicked-animation');
        }, 400);
    });
});

function updateBasketUI() {
    const list = document.getElementById('basket-items-list');
    list.innerHTML = '';
    let totalAmount = 0;
    let sizeCounts = {}; 

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
    updateDropZones(sizeCounts);
}

function removeItem(id) {
    orderBasket = orderBasket.filter(item => item.id !== id);
    updateBasketUI();
}

// ==========================================
// DYNAMIC DRAG & DROP WITH MEMORY
// ==========================================
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
                <span>Upload designs for <b>${size}mm</b> (Max: ${totalPins} images)</span>
            </div>
            <input type="file" name="files_${size}" class="drop-zone-input" multiple accept="image/*">
        `;
        wrapper.appendChild(zone);
        
        bindDragAndDrop(zone, totalPins, size);

        // MEMORY RECOVERY: If files were already uploaded for this size, restore them immediately!
        if (uploadedFilesState[size].length > 0) {
            // Trim files if they deleted a bundle from the basket making the max smaller
            if (uploadedFilesState[size].length > totalPins) {
                uploadedFilesState[size] = uploadedFilesState[size].slice(0, totalPins);
            }
            
            const inputElement = zone.querySelector(".drop-zone-input");
            const dt = new DataTransfer();
            uploadedFilesState[size].forEach(file => dt.items.add(file));
            inputElement.files = dt.files;
            
            renderThumbnail(zone, uploadedFilesState[size], size, totalPins);
        }
    }
}

function bindDragAndDrop(dropZoneElement, maxAllowed, size) {
    const inputElement = dropZoneElement.querySelector(".drop-zone-input");

    dropZoneElement.addEventListener("click", (e) => {
        if (!e.target.closest('.remove-thumb-btn')) {
            inputElement.click();
        }
    });

    inputElement.addEventListener("change", (e) => {
        if (e.target.files.length) appendFiles(e.target.files);
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
        dropZoneElement.classList.remove("drop-zone-over");
        if (e.dataTransfer.files.length) appendFiles(e.dataTransfer.files);
    });

    function appendFiles(newFiles) {
        let currentFiles = uploadedFilesState[size];
        let spaceLeft = maxAllowed - currentFiles.length;
        
        if (spaceLeft <= 0) {
            alert(`You have already reached the maximum of ${maxAllowed} design(s).`);
            syncInput(); 
            return;
        }

        let filesToAdd = Array.from(newFiles).slice(0, spaceLeft);
        
        if (newFiles.length > spaceLeft) {
            alert(`You can only add ${spaceLeft} more design(s) to this size. Extra files were ignored.`);
        }

        uploadedFilesState[size] = currentFiles.concat(filesToAdd);
        syncInput();
        
        renderThumbnail(dropZoneElement, uploadedFilesState[size], size, maxAllowed);
    }
    
    function syncInput() {
        const dt = new DataTransfer();
        uploadedFilesState[size].forEach(file => dt.items.add(file));
        inputElement.files = dt.files;
    }
}

// 6. Renders the Thumbnail and UI Overlays (No Blurs!)
function renderThumbnail(dropZoneElement, files, size, maxAllowed) {
    let thumbnailElement = dropZoneElement.querySelector(".drop-zone-thumb");
    let promptElement = dropZoneElement.querySelector(".drop-zone-prompt");
    const inputElement = dropZoneElement.querySelector(".drop-zone-input");

    if (promptElement) promptElement.style.display = 'none';

    if (!thumbnailElement) {
        thumbnailElement = document.createElement("div");
        thumbnailElement.className = "drop-zone-thumb";
        dropZoneElement.appendChild(thumbnailElement);
    }

    // 1. Remove/Cancel Button ('X')
    let removeBtn = thumbnailElement.querySelector(".remove-thumb-btn");
    if (!removeBtn) {
        removeBtn = document.createElement("button");
        removeBtn.className = "remove-thumb-btn";
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        thumbnailElement.appendChild(removeBtn);

        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            uploadedFilesState[size] = []; 
            inputElement.value = ""; 
            thumbnailElement.remove(); 
            if (promptElement) promptElement.style.display = 'flex'; 
        });
    }

    // 2. Inline Square Grid Preview
    let gridContainer = thumbnailElement.querySelector(".thumb-grid-container");
    if (!gridContainer) {
        gridContainer = document.createElement("div");
        gridContainer.className = "thumb-grid-container";
        thumbnailElement.appendChild(gridContainer);
    }
    gridContainer.innerHTML = ''; // Wipe and redraw grid on every new upload

    files.forEach(file => {
        if (file.type.startsWith("image/")) {
            const img = document.createElement("div");
            img.className = "grid-img-preview";
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                img.style.backgroundImage = `url('${reader.result}')`;
            };
            gridContainer.appendChild(img);
        }
    });

    // 3. Dynamic "Add More" Badge and Text Label
    const fileCount = files.length;
    let addMoreBadge = thumbnailElement.querySelector(".add-more-badge");

    if (fileCount < maxAllowed) {
        thumbnailElement.dataset.label = `${fileCount} of ${maxAllowed} selected`;
        
        if (!addMoreBadge) {
            addMoreBadge = document.createElement("div");
            addMoreBadge.className = "add-more-badge";
            addMoreBadge.innerHTML = '<i class="fa-solid fa-plus"></i> Add More';
            thumbnailElement.appendChild(addMoreBadge);
        }
    } else {
        if (addMoreBadge) addMoreBadge.remove();
        thumbnailElement.dataset.label = `Max ${maxAllowed} images selected`;
    }
}

// Proceed to DM Button Setup
const submitBtn = document.getElementById('checkout-submit-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', () => {
        if(orderBasket.length === 0) {
            alert("Please add items to your basket first!");
            return;
        }
        let orderString = "Hi! I'd like to place an order:%0A";
        orderBasket.forEach(item => {
            orderString += `- ${item.size}mm ${item.type}%0A`;
        });
        orderString += `%0ATotal: ${document.getElementById('basket-total-price').innerText}`;
        
        window.open(`https://ig.me/m/kraftnpins?text=${orderString}`, '_blank');
    });
}

// ==========================================
// SQUARE GRID PREVIEW MODAL
// ==========================================
function openPreviewModal(files, size) {
    let modal = document.getElementById('image-preview-modal');
    
    // Create the modal if it doesn't exist in the DOM yet
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-preview-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content preview-modal-content">
                <span class="close-preview-modal"><i class="fa-solid fa-xmark"></i></span>
                <h3 id="preview-modal-title"></h3>
                <div class="preview-grid" id="preview-grid-container"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close logic
        modal.querySelector('.close-preview-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // Populate the modal data
    document.getElementById('preview-modal-title').innerText = `${size}mm Uploaded Designs`;
    const grid = document.getElementById('preview-grid-container');
    grid.innerHTML = ''; // Wipe previous images

    files.forEach(file => {
        if (file.type.startsWith("image/")) {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'preview-grid-item';
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                imgWrapper.style.backgroundImage = `url('${reader.result}')`;
            };
            grid.appendChild(imgWrapper);
        }
    });

    modal.style.display = 'flex'; // Show the modal
}