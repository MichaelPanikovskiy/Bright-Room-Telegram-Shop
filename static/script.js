// Данные о товарах
const products = [
    {
        id: 1,
        name: "LP-270",
        price: 5000,
        description: "Классический потолочный светильник с регулируемым углом наклона. Идеально подходит для освещения жилых и офисных помещений.",
        image: "static/tov1.png",
    },
    {
        id: 2,
        name: "LT-150",
        price: 7000,
        description: "Современный встраиваемый светильник с ярким светом. Отлично подходит для кухонь и ванных комнат. Энергоэффективен и долговечен, создает комфортную атмосферу в любом интерьере.",
        image: "static/tov2.png",
    },
    {
        id: 3,
        name: "LS-300",
        price: 3000,
        description: "Настенный светильник с двумя подвижными плафонами. Позволяет направить свет в нужную сторону, идеален для создания акцентов в интерьере. Простой в установке и использовании.",
        image: "static/tov3.png",
    },
    {
        id: 4,
        name: "LX-450",
        price: 4000,
        description: "Трековый светильник с гибкой направленностью света. Подходит для освещения выставочных залов и галерей. Легко монтируется на потолочные рельсы, обеспечивает точечное освещение.",
        image: "static/tov4.png",
    },
    {
        id: 5,
        name: "LG-500",
        price: 5600,
        description: "Стильный подвесной светильник с металлическим абажуром. Придает интерьеру современный вид. Подходит для освещения столовых зон и рабочих мест. Легко регулируется по высоте.",
        image: "static/tov5.png",
    },
    {
        id: 6,
        name: "LB-120",
        price: 1240,
        description: "Оригинальный настольный светильник с кожаным абажуром. Создает уютную атмосферу в спальнях и гостиных. Компактный и легкий, удобен в использовании.",
        image: "static/tov6.png",
    },
    {
        id: 7,
        name: "LM-100",
        price: 1200,
        description: "Промышленный светильник с двумя подвесами и цепями. Идеален для освещения больших помещений, таких как склады и производственные цеха. Прочный и надежный.",
        image: "static/tov7.png",
    },
    {
        id: 8,
        name: "LK-780",
        price: 7800,
        description: "Линейный светильник для подвешивания с современным дизайном. Подходит для освещения офисов и конференц-залов. Обеспечивает равномерное освещение больших площадей.",
        image: "static/tov8.png",
    },
    {
        id: 9,
        name: "LF-520",
        price: 5200,
        description: "Настенно-потолочный светильник с широким абажуром. Универсален и подходит для любых помещений. Создает мягкое рассеянное освещение, идеален для зон отдыха.",
        image: "static/tov9.png",
    },
    {
        id: 10,
        name: "LZ-820",
        price: 8200,
        description: "Дизайнерский потолочный светильник с декоративными элементами. Станет изюминкой любого интерьера. Обеспечивает яркое и равномерное освещение, подходит для гостиных и холлов.",
        image: "static/tov10.png",
    },
];

// Корзина и избранное
let cart = [];
let favorites = [];

// Функция для отображения страницы
function showPage(pageId) {
    const pages = ['home-page', 'favorites-page', 'profile-page', 'catalog-page', 'cart-page', 'product-page', 'search-page'];
    pages.forEach(id => {
        const page = document.getElementById(id);
        if (page) {
            page.style.display = 'none';
        }
    });

    const currentPage = document.getElementById(pageId);
    if (currentPage) {
        currentPage.style.display = 'block';

        updateFooterIcons(pageId);
        switch (pageId) {
            case 'home-page':
                updatePromoGrid('home-promo-grid');
                break;
            case 'favorites-page':
                updatePromoGrid('favorites-promo-grid');
                updateFavoritesPage();
                break;
            case 'profile-page':
                updatePromoGrid('profile-promo-grid');
                break;
            case 'catalog-page':
                updatePromoGrid('catalog-promo-grid');
                break;
            case 'cart-page':
                updateCartPage();
                break;
            case 'search-page':
                document.getElementById('search-input').focus();
                break;
        }

        // Скрываем поиск и результаты, если переходим на другую страницу
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        if (pageId !== 'search-page') {
            if (searchInput) searchInput.style.display = 'none';
            if (searchResults) searchResults.style.display = 'none';
        } else {
            if (searchInput) searchInput.style.display = 'block';
            if (searchResults) searchResults.style.display = 'block';
        }
    } else {
        console.error(`Страница с ID ${pageId} не найдена.`);
    }
}

// Функция для возврата на предыдущую страницу
function goBack() {
    const previousPage = localStorage.getItem('previousPage') || 'catalog-page';
    showPage(previousPage);
}

// Функция для открытия страницы товара
function openProductPage(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('product-image').style.backgroundImage = `url(${product.image})`;
        document.getElementById('product-title').textContent = `Наименование: ${product.name}`;
        document.getElementById('product-price').textContent = `Цена: ${product.price} рублей`;
        document.getElementById('product-description').innerHTML = `${product.description}`;

        // Обработчики для кнопок
        document.getElementById('add-to-favorites').onclick = () => addToFavorites(productId);
        document.getElementById('add-to-cart').onclick = () => addToCart(productId);

        localStorage.setItem('previousPage', document.querySelector('.container:not([style*="none"])').id);
        showPage('product-page');
    }
}

// Функция для добавления в избранное
function addToFavorites(productId) {
    const product = products.find(p => p.id === productId);
    if (product && !favorites.includes(productId)) {
        favorites.push(productId);
        alert(`${product.name} добавлен в избранное!`);
        updateFavoritesPage();
    }
}

// Функция для удаления из избранного
function removeFromFavorites(productId) {
    favorites = favorites.filter(id => id !== productId);
    updateFavoritesPage();
}

// Функция для добавления в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(productId);
        alert(`${product.name} добавлен в корзину!`);
        updateCartPage();
    }
}

// Функция для удаления из корзины
function removeFromCart(productId) {
    cart = cart.filter(id => id !== productId);
    updateCartPage();
}

// Функция для оформления заказа
function checkout() {
    if (cart.length === 0) {
        alert("Ваша корзина пуста!");
        return;
    }
    alert("Заказ оформлен! Скоро с вами свяжется менеджер!");
    cart = [];
    updateCartPage();
}

// Функция для обновления страницы избранного
function updateFavoritesPage() {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '<p>В избранном пока ничего нет.</p>';
    } else {
        favoritesGrid.innerHTML = favorites
            .map(id => {
                const product = products.find(p => p.id === id);
                return `
                    <div class="favorites-item" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})">
                        <div class="label">${product.name}<br>${product.price} руб</div>
                        <div class="item-actions">
                            <button class="remove-from-favorites" onclick="removeFromFavorites(${product.id}); event.stopPropagation();">❤️</button>
                        </div>
                    </div>
                `;
            })
            .join('');
    }
}

// Функция для обновления страницы корзины
function updateCartPage() {
    const cartItems = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Ваша корзина пуста.</p>';
    } else {
        cartItems.innerHTML = cart
            .map(id => {
                const product = products.find(p => p.id === id);
                return `
                    <div class="cart-item" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})">
                        <div class="label">${product.name}<br>${product.price} руб</div>
                        <div class="item-actions">
                            <button class="remove-from-cart" onclick="removeFromCart(${product.id}); event.stopPropagation();">🗑️</button>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    const cartButton = document.querySelector('.cart-button');
    if (cart.length > 0) {
        cartButton.style.display = 'block';
        cartButton.onclick = checkout;
    } else {
        cartButton.style.display = 'none';
    }
}

// Функция для обновления предложений
function updatePromoGrid(gridId) {
    const promoGrid = document.getElementById(gridId);
    if (promoGrid) {
        const randomProducts = getRandomProducts(3);
        promoGrid.innerHTML = randomProducts
            .map(product => `
                <div class="promo-item" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})">
                    <div class="label">${product.price} руб</div>
                </div>
            `)
            .join('');
    } else {
        console.error(`Элемент с ID ${gridId} не найден.`);
    }
}

// Функция для получения случайных товаров
function getRandomProducts(count) {
    const shuffled = products.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Функция для обновления иконок в футере
function updateFooterIcons(activePage) {
    const footerIcons = document.querySelectorAll('.footer-icon');
    footerIcons.forEach(icon => {
        icon.classList.remove('active');
    });

    switch (activePage) {
        case 'home-page':
            document.querySelector('.footer-icon:nth-child(1)').classList.add('active');
            break;
        case 'catalog-page':
            document.querySelector('.footer-icon:nth-child(2)').classList.add('active');
            break;
        case 'cart-page':
            document.querySelector('.footer-icon:nth-child(3)').classList.add('active');
            break;
        case 'favorites-page':
            document.querySelector('.footer-icon:nth-child(4)').classList.add('active');
            break;
        case 'profile-page':
            document.querySelector('.footer-icon:nth-child(5)').classList.add('active');
            break;
    }
}

// Инициализация каталога
function initCatalog() {
    const catalogGrid = document.getElementById('catalog-grid');
    catalogGrid.innerHTML = products
        .map(product => `
            <div class="catalog-item" data-id="${product.id}" onclick="openProductPage(${product.id})" style="background-image: url('${product.image}')">
                <div class="label">${product.name}<br>${product.price} руб</div>
                <div class="catalog-actions">
                    <button class="add-to-favorites" onclick="addToFavorites(${product.id}); event.stopPropagation();">❤️</button>
                    <button class="add-to-cart" onclick="addToCart(${product.id}); event.stopPropagation();">🛒</button>
                </div>
            </div>
        `)
        .join('');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    showPage('home-page');
});

// Функция для выполнения поиска
function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (query.trim() === '') {
        resultsContainer.innerHTML = '<p>Введите запрос для поиска.</p>';
        return;
    }

    const results = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>Ничего не найдено.</p>';
    } else {
        resultsContainer.innerHTML = results.map(product => `
            <div class="result-item" onclick="openProductPage(${product.id})">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p><strong>Цена:</strong> ${product.price} руб</p>
            </div>
        `).join('');
    }
}

// Функция для отображения страницы поиска
function showSearchPage() {
    showPage('search-page');
    document.getElementById('search-input').focus();
}
