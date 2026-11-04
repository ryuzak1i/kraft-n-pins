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
        // Prevent upload prompt if clicking the X or View buttons
        if (e.target.closest('.remove-thumb-btn') || e.target.closest('.view-thumb-btn')) {
            return;
        }
        
        // 1. UPLOAD LOCKOUT: Prevent clicking if the max limit is reached!
        if (uploadedFilesState[size].length >= maxAllowed) {
            return; 
        }

        inputElement.click();
    });

    inputElement.addEventListener("change", (e) => {
        if (e.target.files.length) appendFiles(e.target.files);
    });

    dropZoneElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        // Only show hover effect if they still have space
        if (uploadedFilesState[size].length < maxAllowed) {
            dropZoneElement.classList.add("drop-zone-over");
        }
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

// 6. Renders the Thumbnail and UI Overlays
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
            dropZoneElement.classList.remove("is-full"); // Re-enables clicking
            if (promptElement) promptElement.style.display = 'flex'; 
        });
    }

    // 2. View Summary Button (Expand Icon)
    let viewBtn = thumbnailElement.querySelector(".view-thumb-btn");
    if (!viewBtn) {
        viewBtn = document.createElement("button");
        viewBtn.className = "view-thumb-btn";
        viewBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        thumbnailElement.appendChild(viewBtn);

        viewBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            openPreviewModal(uploadedFilesState[size], size);
        });
    }

    // 3. Inline Square Grid Preview
    let gridContainer = thumbnailElement.querySelector(".thumb-grid-container");
    if (!gridContainer) {
        gridContainer = document.createElement("div");
        gridContainer.className = "thumb-grid-container";
        thumbnailElement.appendChild(gridContainer);
    }
    gridContainer.innerHTML = ''; 

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

    // 4. Dynamic "Add More" Badge and Full State Lockout
    const fileCount = files.length;
    let addMoreBadge = thumbnailElement.querySelector(".add-more-badge");

    if (fileCount < maxAllowed) {
        dropZoneElement.classList.remove("is-full");
        thumbnailElement.dataset.label = `${fileCount} of ${maxAllowed} selected`;
        
        if (!addMoreBadge) {
            addMoreBadge = document.createElement("div");
            addMoreBadge.className = "add-more-badge";
            addMoreBadge.innerHTML = '<i class="fa-solid fa-plus"></i> Add More';
            thumbnailElement.appendChild(addMoreBadge);
        }
    } else {
        dropZoneElement.classList.add("is-full"); // Triggers CSS cursor lock
        if (addMoreBadge) addMoreBadge.remove();
        thumbnailElement.dataset.label = `Max ${maxAllowed} images selected`;
    }
}

// ==========================================
// RECEIPT MODAL & CHECKOUT LOGIC
// ==========================================
const submitBtn = document.getElementById('checkout-submit-btn');
const receiptModal = document.getElementById('receipt-modal');

if (submitBtn && receiptModal) {
    // 1. Open the summary receipt
    submitBtn.addEventListener('click', () => {
        if(orderBasket.length === 0) {
            alert("Please add items to your basket first!");
            return;
        }

        // --- NEW: REQUIRE UPLOADS BEFORE CHECKOUT ---
        // 1. Find out which sizes the user has actually added to their basket
        const requiredSizes = new Set(orderBasket.map(item => item.size));
        let missingSizes = [];

        // 2. Check if the memory array for those specific sizes is empty
        requiredSizes.forEach(size => {
            if (uploadedFilesState[size].length === 0) {
                missingSizes.push(`${size}mm`);
            }
        });

        // 3. Block checkout and alert the user if any required sizes are missing designs
        if (missingSizes.length > 0) {
            alert(`Upload Required: Please add at least 1 design for your ${missingSizes.join(' and ')} pins before reviewing your order!`);
            return; // Stops the script so the receipt modal will not open
        }
        // --------------------------------------------
        
        const receiptList = document.getElementById('receipt-items-list');
        receiptList.innerHTML = '';
        let totalPins = 0;
        let totalAmount = 0;

        // Combine (Aggregate) identical items in the basket
        const aggregatedBasket = {};
        orderBasket.forEach(item => {
            totalPins += item.pinQty;
            totalAmount += item.price;
            
            const key = `${item.size}-${item.type}`;
            if (!aggregatedBasket[key]) {
                aggregatedBasket[key] = {
                    size: item.size,
                    type: item.type,
                    price: item.price,
                    count: 0
                };
            }
            aggregatedBasket[key].count += 1;
            aggregatedBasket[key].totalRowPrice = aggregatedBasket[key].count * item.price;
        });

        // Print the grouped items to the receipt
        Object.values(aggregatedBasket).forEach(group => {
            const li = document.createElement('li');
            li.className = 'receipt-item-row';
            li.innerHTML = `
                <div class="receipt-item-details">
                    <span class="receipt-item-title">${group.size}mm [${group.type}]</span>
                    <span class="receipt-item-qty">Quantity: ${group.count}</span>
                </div> 
                <span>PHP ${group.totalRowPrice}</span>
            `;
            receiptList.appendChild(li);
        });

        document.getElementById('receipt-final-total').innerText = 'PHP ' + totalAmount;

        // Calculate Processing Time
        const isRush = document.getElementById('rush-order-checkbox').checked;
        const processingBox = document.getElementById('receipt-processing-time');
        
        if (isRush) {
            processingBox.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Processing: <b>Priority (Rush Order)</b></span>';
            processingBox.style.backgroundColor = '#fdf6c6';
            processingBox.style.borderColor = '#e988a0';
        } else if (totalPins >= 30) {
            processingBox.innerHTML = '<i class="fa-regular fa-clock"></i> <span>Processing: <b>5-10 business days</b> (Bulk)</span>';
            processingBox.style.backgroundColor = '#ffffff';
            processingBox.style.borderColor = '#fcd2dc';
        } else {
            processingBox.innerHTML = '<i class="fa-regular fa-clock"></i> <span>Processing: <b>1-2 business days</b> (Standard)</span>';
            processingBox.style.backgroundColor = '#ffffff';
            processingBox.style.borderColor = '#fcd2dc';
        }

        receiptModal.style.display = 'flex';
    });

    // 2. Close Modal Logic
    receiptModal.querySelector('.close-receipt-modal').addEventListener('click', () => {
        receiptModal.style.display = 'none';
    });
    
    // 3. Confirm & Send to Instagram
    document.getElementById('confirm-order-btn').addEventListener('click', () => {
        const isRush = document.getElementById('rush-order-checkbox').checked;
        let orderString = "Hi! I'd like to place an order:%0A";
        
        if (isRush) {
            orderString = "🚨 RUSH ORDER REQUEST 🚨%0A%0AHi! I'd like to place a priority order:%0A";
        }

        // Aggregate again for the DM message
        const dmBasket = {};
        orderBasket.forEach(item => {
            const key = `${item.size}-${item.type}`;
            if (!dmBasket[key]) {
                dmBasket[key] = { size: item.size, type: item.type, count: 0 };
            }
            dmBasket[key].count += 1;
        });

        Object.values(dmBasket).forEach(group => {
            orderString += `- ${group.count}x ${group.size}mm [${group.type}]%0A`;
        });
        
        orderString += `%0ATotal: ${document.getElementById('basket-total-price').innerText}`;
        
        window.open(`https://ig.me/m/kraftnpins?text=${orderString}`, '_blank');
        receiptModal.style.display = 'none';
    });
}

// ==========================================
// SQUARE GRID SUMMARY PREVIEW MODAL
// ==========================================
function openPreviewModal(files, size) {
    let modal = document.getElementById('image-preview-modal');
    
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

        modal.querySelector('.close-preview-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    document.getElementById('preview-modal-title').innerText = `${size}mm Uploaded Designs`;
    const grid = document.getElementById('preview-grid-container');
    grid.innerHTML = ''; 

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

    modal.style.display = 'flex'; 
}