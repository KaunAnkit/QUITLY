//Modal box script
const addBookBtn = document.querySelector(".add-book-button2");
const modal = document.getElementById("modalContainer");
const closeBtn = document.getElementById("closeModal");
let books = []
const bookName = document.getElementById("bookName")
const authorName = document.getElementById("authorName")
const coverUpload = document.getElementById("coverUpload")
const useFirstPage = document.getElementById("useFirstPage")
const pdfUpload = document.getElementById("pdfUpload")
const submitBook = document.getElementById("add-book-submit")
const closeModal = document.getElementById("closeModal")

addBookBtn.addEventListener("click", () => {
    modal.classList.add("show");
});

closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
});

// Card Creating Part
let bookCardsContainer = document.getElementById("bookCardsContainer")

function cardCreator(BookName, AuthorName, coverUrl = null) {
    // --- DEBUG LOG 3: Confirm coverUrl received by cardCreator ---
    console.log(`[cardCreator] Creating card for: ${BookName}`);
    console.log(`[cardCreator] Cover URL received: ${coverUrl}`);

    const bookcard = document.createElement('div');
    bookcard.classList.add('bookCard');

    // If we have a cover image, use it; otherwise use random color
    if (coverUrl) {
        bookcard.style.backgroundImage = `url(${coverUrl})`;
        bookcard.style.backgroundSize = 'cover';
        bookcard.style.backgroundPosition = 'center';
        bookcard.style.color = 'white';
        bookcard.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
        console.log(`[cardCreator] Applied background-image: url(${coverUrl})`);
    } else {
        const randomHue = Math.floor(Math.random() * 360);
        const saturation = 70;
        const lightness = 85;
        const randomColor = `hsl(${randomHue}, ${saturation}%, ${lightness}%)`;
        bookcard.style.backgroundColor = randomColor;
        console.log(`[cardCreator] No cover URL, applied random background color: ${randomColor}`);
    }

    const cardHeading = document.createElement('h3')
    cardHeading.textContent = BookName;

    const cardPara = document.createElement('p')
    cardPara.textContent = `Author : ${AuthorName || "NA"}`;

    bookcard.appendChild(cardHeading)
    bookcard.appendChild(cardPara)

    bookCardsContainer.appendChild(bookcard);
}

function renderAllBooks() {
    console.log("[renderAllBooks] Rendering all books...");
    bookCardsContainer.innerHTML = '';
    if (books.length === 0) {
        bookCardsContainer.textContent = "No books in your collection yet"
        bookCardsContainer.style.textAlign = 'center';
        bookCardsContainer.style.padding = '20px';
        return;
    }
    bookCardsContainer.style.textAlign = '';
    bookCardsContainer.style.padding = '';

    books.forEach(book => {
        cardCreator(book.bookName, book.authorName, book.coverUrl)
    })
    console.log("[renderAllBooks] Finished rendering books.");
}

function saveBooksToLocalStorage() {
    localStorage.setItem("books", JSON.stringify(books));
    console.log("Books saved to localStorage:", books);
}

function loadBooksFromLocalStorage() {
    const storedBooksJSON = localStorage.getItem("books")
    if (storedBooksJSON) {
        try {
            books = JSON.parse(storedBooksJSON)
            console.log("Books loaded from localStorage:", books);
        } catch (e) {
            console.error("Error parsing books details from localStorage:", e); // Use console.error for errors
            books = []
        }
    } else {
        books = []
        console.log("No Books found in local storage");
    }
    renderAllBooks();
}

// Backend API Integration
async function uploadBookToServer(bookData, coverFile, pdfFile) {
    try {
        console.log('[uploadBookToServer] Uploading to server...');
        console.log('[uploadBookToServer] Book Data:', bookData);
        console.log('[uploadBookToServer] Cover File:', coverFile ? coverFile.name : 'N/A');
        console.log('[uploadBookToServer] PDF File:', pdfFile ? pdfFile.name : 'N/A');

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('bookName', bookData.bookName);
        formData.append('authorName', bookData.authorName);
        formData.append('useFirstPage', bookData.useFirstPage);

        if (coverFile) {
            formData.append('coverupload', coverFile);
        }

        if (pdfFile) {
            formData.append('pdfUpload', pdfFile);
        }

        const response = await fetch('http://localhost:8000/coverpage', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            // --- DEBUG LOG 1: Log HTTP error response ---
            const errorText = await response.text(); // Get raw text for more info
            console.error(`[uploadBookToServer] HTTP error! Status: ${response.status}, Response: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('[uploadBookToServer] Server response (parsed JSON):', result); // See the full object from backend

        if (result.success) {
            // --- DEBUG LOG 2: Confirm coverUrl from successful server response ---
            console.log('[uploadBookToServer] Cloudinary URL received from backend (result.data.coverUrl):', result.data.coverUrl);
            return {
                success: true,
                data: result.data
            };
        } else {
            throw new Error(result.message || 'Upload failed');
        }

    } catch (error) {
        console.error('[uploadBookToServer] Upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Updated submit book event listener with backend integration
submitBook.addEventListener('click', async (event) => {
    event.preventDefault();

    const currentBookNameValue = bookName.value.trim();
    const currentAuthorNameValue = authorName.value.trim();

    if (!currentBookNameValue) {
        alert("Please enter a Book name.");
        return;
    }

    // Show loading state
    const originalText = submitBook.textContent;
    const originalColor = submitBook.style.backgroundColor;
    submitBook.textContent = "Uploading...";
    submitBook.style.backgroundColor = "#007bff";
    submitBook.disabled = true;

    try {
        // Prepare book data
        const bookData = {
            bookName: currentBookNameValue,
            authorName: currentAuthorNameValue,
            useFirstPage: useFirstPage.checked
        };

        // Get files
        const coverFile = coverUpload.files[0] || null;
        const pdfFile = pdfUpload.files[0] || null;

        if (!coverFile) { // Added a check to ensure cover file is selected
            alert("Please select a book cover image to upload.");
            submitBook.textContent = originalText;
            submitBook.style.backgroundColor = originalColor;
            submitBook.disabled = false;
            return;
        }

        // Upload to server
        const uploadResult = await uploadBookToServer(bookData, coverFile, pdfFile);

        if (uploadResult.success) {
            // Create book object for local storage (with server URLs)
            const newBook = {
                bookName: currentBookNameValue,
                authorName: currentAuthorNameValue,
                coverUrl: uploadResult.data.coverUrl, // This is where it's assigned
                pdfUrl: uploadResult.data.pdfUrl,
                coverUpload: coverFile ? coverFile.name : '',
                pdfUpload: pdfFile ? pdfFile.name : '',
                useFirstPage: useFirstPage.checked,
                uploadedAt: new Date().toISOString()
            };

            // --- DEBUG LOG 4: Confirm newBook object before saving/rendering ---
            console.log('[submitBook] New book object prepared for storage/display:', newBook);


            // Add to local array and save to localStorage
            books.push(newBook);
            saveBooksToLocalStorage();
            renderAllBooks(); // This will trigger cardCreator with the coverUrl

            // Clear form
            bookName.value = '';
            authorName.value = '';
            coverUpload.value = '';
            pdfUpload.value = '';
            useFirstPage.checked = false;

            // Show success state
            submitBook.textContent = "Added Successfully!";
            submitBook.style.backgroundColor = "green";

            // Close modal after delay
            setTimeout(() => {
                modal.classList.remove("show");
                submitBook.style.backgroundColor = originalColor;
                submitBook.textContent = originalText;
                submitBook.disabled = false;
            }, 1000);

        } else {
            // Handle upload error
            alert(`Failed to upload book: ${uploadResult.error}`);

            // Reset button
            submitBook.textContent = originalText;
            submitBook.style.backgroundColor = originalColor;
            submitBook.disabled = false;
        }

    } catch (error) {
        console.error('[submitBook] Unexpected error during upload process:', error);
        alert('An unexpected error occurred. Please try again.');

        // Reset button
        submitBook.textContent = originalText;
        submitBook.style.backgroundColor = originalColor;
        submitBook.disabled = false;
    }
});

// Initialize the app
loadBooksFromLocalStorage();

// Optional: Add a function to sync books with server (for future use)
async function syncBooksWithServer() {
    // This function can be implemented later to fetch books from server
    // and sync with local storage
    console.log('Sync with server - to be implemented');
}