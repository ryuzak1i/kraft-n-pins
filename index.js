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
let uploadedFilesState = { '25': [], '32': [], '58': [] }; 
let holoUpgradesState = {}; 

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
        
        this.classList.add('clicked-animation');
        setTimeout(() => {
            this.classList.remove('clicked-animation');
        }, 400);
    });
});

function updateBasketUI() {
    const list = document.getElementById('basket-items-list');
    const upgradesSection = document.getElementById('upgrades-section');
    const holoWrapper = document.getElementById('holo-items-wrapper');
    
    list.innerHTML = '';
    holoWrapper.innerHTML = '';
    let totalAmount = 0;
    let sizeCounts = {}; 

    if (orderBasket.length === 0) {
        list.innerHTML = '<li class="empty-basket">No pins added yet!</li>';
        document.getElementById('basket-total-price').innerText = 'PHP 0';
        upgradesSection.style.display = 'none';
        updateDropZones({});
        holoUpgradesState = {};
        return;
    }

    upgradesSection.style.display = 'block';

    orderBasket.forEach(item => {
        if (holoUpgradesState[item.id] === undefined) {
            holoUpgradesState[item.id] = false;
        }

        let itemTotal = item.price;
        if (holoUpgradesState[item.id]) {
            itemTotal += (6 * item.pinQty);
        }

        totalAmount += itemTotal;
        sizeCounts[item.size] = (sizeCounts[item.size] || 0) + item.pinQty;

        // Populate Main Basket
        const li = document.createElement('li');
        li.className = 'basket-list-item';
        li.innerHTML = `
            <div class="basket-item-info">
                <span class="basket-item-name">${item.size}mm — ${item.type} ${holoUpgradesState[item.id] ? '✨' : ''}</span>
                <span class="basket-item-price">PHP ${itemTotal}</span>
            </div>
            <button class="basket-remove-btn" onclick="removeItem(${item.id})"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(li);

        // Populate Upgrades Section
        const holoBox = document.createElement('label');
        holoBox.className = 'holo-toggle-box';
        holoBox.innerHTML = `
            <div class="holo-info">
                <span class="holo-name">${item.size}mm [${item.type}]</span>
                <span class="holo-price">+PHP ${6 * item.pinQty}</span>
            </div>
            <input type="checkbox" class="holo-checkbox" data-id="${item.id}" ${holoUpgradesState[item.id] ? 'checked' : ''}>
            <span class="holo-custom-check"></span>
        `;
        holoWrapper.appendChild(holoBox);
    });

    document.getElementById('basket-total-price').innerText = 'PHP ' + totalAmount;
    updateDropZones(sizeCounts);

    // Event listeners for individual checkboxes
    document.querySelectorAll('.holo-checkbox').forEach(box => {
        box.addEventListener('change', (e) => {
            const itemId = parseInt(e.target.getAttribute('data-id'));
            holoUpgradesState[itemId] = e.target.checked;
            updateBasketUI(); 
        });
    });
    
    updateSelectAllButtons();
}

function removeItem(id) {
    orderBasket = orderBasket.filter(item => item.id !== id);
    delete holoUpgradesState[id];
    updateBasketUI();
}

// ==========================================
// UPGRADES (Select All Logic)
// ==========================================
const selectAllBtn = document.getElementById('select-all-holo-btn');
const deselectAllBtn = document.getElementById('deselect-all-holo-btn');

if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
        orderBasket.forEach(item => holoUpgradesState[item.id] = true);
        updateBasketUI();
    });
    deselectAllBtn.addEventListener('click', () => {
        orderBasket.forEach(item => holoUpgradesState[item.id] = false);
        updateBasketUI();
    });
}

function updateSelectAllButtons() {
    const allSelected = orderBasket.length > 0 && orderBasket.every(item => holoUpgradesState[item.id]);
    if (allSelected) {
        selectAllBtn.style.display = 'none';
        deselectAllBtn.style.display = 'inline-block';
    } else {
        selectAllBtn.style.display = 'inline-block';
        deselectAllBtn.style.display = 'none';
    }
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

        if (uploadedFilesState[size].length > 0) {
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
        if (e.target.closest('.remove-thumb-btn') || e.target.closest('.view-thumb-btn')) {
            return;
        }
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
            dropZoneElement.classList.remove("is-full"); 
            if (promptElement) promptElement.style.display = 'flex'; 
        });
    }

    let viewBtn = thumbnailElement.querySelector(".view-thumb-btn");
    if (!viewBtn) {
        viewBtn = document.createElement("button");
        viewBtn.className = "view-thumb-btn";
        viewBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        viewBtn.style.setProperty('background-color', '#a55166', 'important');
        thumbnailElement.appendChild(viewBtn);

        viewBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            openPreviewModal(uploadedFilesState[size], size);
        });
    }

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
        dropZoneElement.classList.add("is-full"); 
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
    submitBtn.addEventListener('click', () => {
        if(orderBasket.length === 0) {
            alert("Please add items to your basket first!");
            return;
        }

        const requiredSizes = new Set(orderBasket.map(item => item.size));
        let missingSizes = [];

        requiredSizes.forEach(size => {
            if (uploadedFilesState[size].length === 0) {
                missingSizes.push(`${size}mm`);
            }
        });

        if (missingSizes.length > 0) {
            alert(`Upload Required: Please add at least 1 design for your ${missingSizes.join(' and ')} pins before reviewing your order!`);
            return; 
        }
        
        const receiptList = document.getElementById('receipt-items-list');
        receiptList.innerHTML = '';
        let totalPins = 0;
        let totalAmount = 0;

        const aggregatedBasket = {};
        orderBasket.forEach(item => {
            totalPins += item.pinQty;
            const isHolo = holoUpgradesState[item.id];
            
            let itemPrice = item.price;
            let holoAddedForThisItem = isHolo ? (6 * item.pinQty) : 0;
            
            if (isHolo) itemPrice += holoAddedForThisItem;
            
            totalAmount += itemPrice;
            
            const key = `${item.size}-${item.type}-${isHolo ? 'holo' : 'normal'}`;
            if (!aggregatedBasket[key]) {
                aggregatedBasket[key] = {
                    size: item.size,
                    type: item.type,
                    isHolo: isHolo,
                    pricePerBundle: itemPrice,
                    count: 0,
                    holoAddedAmount: 0 // Tracks the total holographic price added for this group
                };
            }
            aggregatedBasket[key].count += 1;
            aggregatedBasket[key].totalRowPrice = aggregatedBasket[key].count * itemPrice;
            aggregatedBasket[key].holoAddedAmount += holoAddedForThisItem;
        });

        // ONLY ONE LOOP to build the receipt items!
        Object.values(aggregatedBasket).forEach(group => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.marginBottom = '12px';
            li.style.fontSize = '0.85rem';
            li.style.color = '#5e2e3a';
            li.style.fontWeight = '600';

            const holoLine = group.isHolo 
                ? `<span style="font-size: 0.75rem; opacity: 0.55; margin-top: 2px;">Holo: + PHP ${group.holoAddedAmount}</span>` 
                : '';

            li.innerHTML = `
                <div style="display: flex; flex-direction: column; text-align: left;">
                    <span style="color: #a55166; font-weight: 700;">${group.size}mm [${group.type}]</span>
                    <span style="font-size: 0.75rem; opacity: 0.55; margin-top: 2px;">Quantity: ${group.count}</span>
                    ${holoLine}
                </div> 
                <span>PHP ${group.totalRowPrice}</span>
            `;
            receiptList.appendChild(li);
        });

        // Set Total
        document.getElementById('receipt-final-total').innerText = 'PHP ' + totalAmount;

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

    receiptModal.querySelector('.close-receipt-modal').addEventListener('click', () => {
        receiptModal.style.display = 'none';
    });
    
    // PUT YOUR COPIED GOOGLE APPS SCRIPT WEB APP URL HERE:
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-JvP3X8m4sWO94lll537NLbr8-QV3mwWyRB-3EHt7jmDOcwKSWh85biA_4gUjmkmE/exec";

    // Helper function to turn image files into text data (Base64) to send to Google
    const getBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = error => reject(error);
    });

    document.getElementById('confirm-order-btn').addEventListener('click', async function() {
        // 1. Gather Customer Inputs
        const name = document.getElementById('cust-name').value.trim();
        const ig = document.getElementById('cust-ig').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const paymentRadio = document.querySelector('input[name="payment_method"]:checked');
        
        // Validation
        if (!name || !ig || !phone) {
            alert("Please fill out all your contact details!");
            return;
        }
        if (!paymentRadio) {
            alert("Please select a Payment Method!");
            return;
        }

        // 2. Button Loading State
        const submitBtn = this;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;

        // 3. Process Uploaded Images to Base64
        let imagePromises = [];
        for (let size in uploadedFilesState) {
            let files = uploadedFilesState[size];
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                imagePromises.push(getBase64(file).then(base64 => ({
                    size: size,
                    filename: file.name,
                    mimeType: file.type,
                    base64: base64
                })));
            }
        }
        
        try {
            // Wait for all images to finish converting before sending
            const base64Images = await Promise.all(imagePromises);
            
            // 4. Package the Order Data
            const payload = {
                items: orderBasket.map(item => ({
                    size: item.size,
                    type: item.type,
                    count: item.pinQty,
                    isHolo: holoUpgradesState[item.id],
                    price: item.price + (holoUpgradesState[item.id] ? 6 * item.pinQty : 0)
                })),
                images: base64Images, // Attaches the converted images here
                customer: {
                    name: name,
                    ig: ig,
                    phone: phone,
                    payment: paymentRadio.value
                }
            };

            // 5. Send to Google Apps Script
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.status === "success") {
                submitBtn.innerHTML = 'Order Sent! 💖';
                setTimeout(() => {
                    receiptModal.style.display = 'none';
                    orderBasket = []; 
                    
                    // Clear files and form
                    uploadedFilesState = { '25': [], '32': [], '58': [] };
                    document.getElementById('cust-name').value = '';
                    document.getElementById('cust-ig').value = '';
                    document.getElementById('cust-phone').value = '';
                    if(paymentRadio) paymentRadio.checked = false;
                    
                    updateBasketUI();
                    
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    alert("Thank you! Your order has been placed.");
                }, 1500);
            } else {
                throw new Error(data.message || "Script returned an error");
            }
        } catch (error) {
            console.error("Error submitting order:", error);
            submitBtn.innerHTML = "Error! Try Again";
            submitBtn.disabled = false;
            alert("There was a problem sending your order. Please try again.");
        }
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