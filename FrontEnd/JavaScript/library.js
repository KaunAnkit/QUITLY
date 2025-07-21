// Modal box script
const addBookBtn = document.querySelector(".add-book-button2");
const modal = document.getElementById("modalContainer");
const closeBtn = document.getElementById("closeModal");

let books = [];

const bookName = document.getElementById("bookName");
const authorName = document.getElementById("authorName");
const coverUpload = document.getElementById("coverUpload");
const useFirstPage = document.getElementById("useFirstPage");
const pdfUpload = document.getElementById("pdfUpload");
const submitBook = document.getElementById("add-book-submit");

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
let bookCardsContainer = document.getElementById("bookCardsContainer");

function cardCreator(BookName, AuthorName, coverUrl = null) {
    console.log(`[cardCreator] Creating card for: ${BookName}`);
    console.log(`[cardCreator] Cover URL received: ${coverUrl}`);

    const bookcard = document.createElement('div');
    bookcard.classList.add('bookCard');

    if (coverUrl) {
        bookcard.style.backgroundImage = `url(${coverUrl})`;
        bookcard.style.backgroundSize = 'cover';
        bookcard.style.backgroundPosition = 'center';
    } else {
        const randomHue = Math.floor(Math.random() * 360);
        const saturation = 70;
        const lightness = 85;
        const randomColor = `hsl(${randomHue}, ${saturation}%, ${lightness}%)`;
        bookcard.style.backgroundColor = randomColor;
    }

    
    bookCardsContainer.appendChild(bookcard);
}


function renderAllBooks() {
    console.log("[renderAllBooks] Rendering all books...");
    bookCardsContainer.innerHTML = '';
    if (books.length === 0) {
        bookCardsContainer.textContent = "No books in your collection yet";
        bookCardsContainer.style.textAlign = 'center';
        bookCardsContainer.style.padding = '20px';
        return;
    }
    bookCardsContainer.style.textAlign = '';
    bookCardsContainer.style.padding = '';

    books.forEach(book => {
        cardCreator(book.bookName, book.authorName, book.coverUrl);
    });

    console.log("[renderAllBooks] Finished rendering books.");
}

// Backend API Integration
async function uploadBookToServer(bookData, coverFile, pdfFile) {
    try {
        console.log('[uploadBookToServer] Uploading to server...');
        console.log('[uploadBookToServer] Book Data:', bookData);
        console.log('[uploadBookToServer] Cover File:', coverFile ? coverFile.name : 'N/A');
        console.log('[uploadBookToServer] PDF File:', pdfFile ? pdfFile.name : 'N/A');

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
            const errorText = await response.text();
            console.error(`[uploadBookToServer] HTTP error! Status: ${response.status}, Response: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('[uploadBookToServer] Server response:', result);

        if (result.success) {
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

// Submit Book Handler
submitBook.addEventListener('click', async (event) => {
    event.preventDefault();

    const currentBookNameValue = bookName.value.trim();
    const currentAuthorNameValue = authorName.value.trim();

    if (!currentBookNameValue) {
        alert("Please enter a Book name.");
        return;
    }

    const originalText = submitBook.textContent;
    const originalColor = submitBook.style.backgroundColor;
    submitBook.textContent = "Uploading...";
    submitBook.style.backgroundColor = "#007bff";
    submitBook.disabled = true;

    try {
        const bookData = {
            bookName: currentBookNameValue,
            authorName: currentAuthorNameValue,
            useFirstPage: useFirstPage.checked
        };

        const coverFile = coverUpload.files[0] || null;
        const pdfFile = pdfUpload.files[0] || null;

        if (!coverFile) {
            alert("Please select a book cover image to upload.");
            submitBook.textContent = originalText;
            submitBook.style.backgroundColor = originalColor;
            submitBook.disabled = false;
            return;
        }

        const uploadResult = await uploadBookToServer(bookData, coverFile, pdfFile);

        if (uploadResult.success) {
            const newBook = {
                bookName: currentBookNameValue,
                authorName: currentAuthorNameValue,
                coverUrl: uploadResult.data.coverUrl,
                pdfUrl: uploadResult.data.pdfUrl,
                coverUpload: coverFile.name,
                pdfUpload: pdfFile ? pdfFile.name : '',
                useFirstPage: useFirstPage.checked,
                uploadedAt: new Date().toISOString()
            };

            console.log('[submitBook] New book object:', newBook);

            books.push(newBook);
            renderAllBooks();

            bookName.value = '';
            authorName.value = '';
            coverUpload.value = '';
            pdfUpload.value = '';
            useFirstPage.checked = false;

            submitBook.textContent = "Added Successfully!";
            submitBook.style.backgroundColor = "green";

            setTimeout(() => {
                modal.classList.remove("show");
                submitBook.style.backgroundColor = originalColor;
                submitBook.textContent = originalText;
                submitBook.disabled = false;
            }, 1000);

        } else {
            alert(`Failed to upload book: ${uploadResult.error}`);
            submitBook.textContent = originalText;
            submitBook.style.backgroundColor = originalColor;
            submitBook.disabled = false;
        }

    } catch (error) {
        console.error('[submitBook] Unexpected error:', error);
        alert('An unexpected error occurred. Please try again.');
        submitBook.textContent = originalText;
        submitBook.style.backgroundColor = originalColor;
        submitBook.disabled = false;
    }
});

// Initial Render (no localStorage, just empty)
renderAllBooks();

// Clear Books Button
const clearBooksBtn = document.getElementById("clearBooksBtn");

function cleaningbook(){
        clearBooksBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to remove all books?")) {
            books.length = 0;
            renderAllBooks();
            console.log("All books cleared.");
        }
    });

}

