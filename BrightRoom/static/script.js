//const BASE_URL = 'https://brightroom-brightroom.amvera.io';
const BASE_URL = 'http://127.0.0.1:80';
let cart = [];
let favorites = [];
let currentUser = null;
let products = [];

// Шот для алертов
function showAlert(message) {
    const alertElement = document.getElementById('custom-alert');
    document.getElementById('alert-message').textContent = message;
    alertElement.style.display = 'flex';
}

function hideAlert() {
    document.getElementById('custom-alert').style.display = 'none';
}

// Грузим товары
async function loadProducts() {
    try {
        const response = await fetch(`${BASE_URL}/products`);
        const data = await response.json();
        if (response.ok) products = data;
        else showAlert('Ошибка загрузки товаров: ' + data.error);
    } catch (error) {
        showAlert('Ошибка загрузки товаров: ' + error.message);
    }
}

async function loadCart() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${BASE_URL}/cart?user_id=${currentUser.id}`);
        const data = await response.json();
        if (response.ok) cart = data;
        else showAlert('Ошибка загрузки корзины: ' + data.error);
    } catch (error) {
        showAlert('Ошибка загрузки корзины: ' + error.message);
    }
}

async function loadFavorites() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${BASE_URL}/favorites?user_id=${currentUser.id}`);
        const data = await response.json();
        if (response.ok) favorites = data;
        else showAlert('Ошибка загрузки избранного: ' + data.error);
    } catch (error) {
        showAlert('Ошибка загрузки избранного: ' + error.message);
    }
}

// Профиль и авторизация
function initProfilePage() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        handleAuth();
    } else handleAuth();
}

async function handleAuth() {
    if (currentUser) {
        await Promise.all([loadCart(), loadFavorites()]);
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('profile-content').style.display = 'block';
        updateProfileInfo();
        const adminButton = document.getElementById('admin-button');
        if (adminButton) adminButton.style.display = currentUser.is_admin ? 'block' : 'none';
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('profile-content').style.display = 'none';
        switchAuthMode('login');
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await handleAuth();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка входа: ' + error.message);
    }
}

function switchAuthMode(mode) {
    const authForms = document.querySelector('.auth-forms');
    if (mode === 'register') {
        authForms.innerHTML = `
            <input type="text" id="reg-name" placeholder="Имя">
            <input type="email" id="reg-email" placeholder="Email">
            <input type="password" id="reg-password" placeholder="Пароль">
            <button onclick="handleRegister()">Зарегистрироваться</button>
            <button onclick="switchAuthMode('login')">Назад</button>
        `;
    } else {
        authForms.innerHTML = `
            <input type="email" id="auth-email" placeholder="Email">
            <input type="password" id="auth-password" placeholder="Пароль">
            <button onclick="handleLogin()">Войти</button>
            <button onclick="switchAuthMode('register')">Регистрация</button>
        `;
    }
}

async function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    if (!name || !email || !password) return showAlert('Заполните все поля!');
    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await handleAuth();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка регистрации: ' + error.message);
    }
}

function showProfileSection(section) {
    const sections = ['edit', 'password', 'notifications', 'orders', 'admin'];
    sections.forEach(s => {
        const sectionElement = document.getElementById(`${s}-section`);
        if (sectionElement) {
            sectionElement.style.visibility = 'hidden';
            sectionElement.style.position = 'absolute';
        }
    });
    if (section === 'main') {
        document.getElementById('profile-main-menu').style.visibility = 'visible';
        document.getElementById('profile-main-menu').style.position = 'relative';
    } else {
        document.getElementById('profile-main-menu').style.visibility = 'hidden';
        document.getElementById('profile-main-menu').style.position = 'absolute';
        const activeSection = document.getElementById(`${section}-section`);
        if (activeSection) {
            activeSection.style.visibility = 'visible';
            activeSection.style.position = 'relative';
            if (section === 'edit') loadEditForm();
            if (section === 'notifications') loadNotifications();
            if (section === 'orders') loadOrders();
            if (section === 'admin') loadAdminPanel();
        }
    }
}

function loadEditForm() {
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-email').value = currentUser.email;
    document.getElementById('edit-phone').value = currentUser.phone;
}

async function saveProfileChanges() {
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    if (!name || !email) return showAlert('Имя и email обязательны!');
    try {
        const response = await fetch(`${BASE_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, name, email, phone })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = { ...currentUser, ...data };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateProfileInfo();
            showProfileSection('main');
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка сохранения: ' + error.message);
    }
}

function saveNewPassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (newPassword !== confirmPassword) return showAlert('Новые пароли не совпадают!');
    if (newPassword.length < 6) return showAlert('Пароль должен содержать минимум 6 символов!');
    showAlert('Пароль успешно изменён! (Пока только на клиенте)');
    showProfileSection('main');
}

function updateProfileInfo() {
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email || 'Email не указан';
    document.getElementById('profile-phone').textContent = currentUser.phone || 'Телефон не указан';
}

function loadNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = currentUser.notifications.length > 0
        ? currentUser.notifications.map(n => `<div class="notification-item">${n}</div>`).join('')
        : '<p>Уведомлений пока нет.</p>';
}

function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = currentUser.orders.length > 0
        ? currentUser.orders.map(o => `<div class="order-item">${o}</div>`).join('')
        : '<p>Заказов пока нет.</p>';
}

// Админские приколюхи
async function loadAdminPanel() {
    showAdminSubsection('products');
}

function showAdminSubsection(subsection) {
    const productsSubsection = document.getElementById('admin-products-subsection');
    const usersSubsection = document.getElementById('admin-users-subsection');
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-button[onclick*="${subsection}"]`).classList.add('active');
    if (subsection === 'products') {
        productsSubsection.style.display = 'block';
        usersSubsection.style.display = 'none';
        loadAdminProducts();
    } else if (subsection === 'users') {
        productsSubsection.style.display = 'none';
        usersSubsection.style.display = 'block';
        loadAdminUsers();
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch(`${BASE_URL}/admin`);
        const data = await response.json();
        if (response.ok) {
            const productsList = document.getElementById('admin-products-list');
            productsList.innerHTML = data.products.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.price} руб</td>
                    <td>
                        <button class="table-button" onclick="editProduct(${p.id})">Редактировать</button>
                        <button class="table-button" onclick="deleteProduct(${p.id})">Удалить</button>
                    </td>
                </tr>
            `).join('');
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка загрузки товаров: ' + error.message);
    }
}

async function loadAdminUsers() {
    try {
        const response = await fetch(`${BASE_URL}/admin`);
        const data = await response.json();
        if (response.ok) {
            const usersList = document.getElementById('admin-users-list');
            usersList.innerHTML = data.users.map(u => `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.id}</td>
                    <td>${u.is_admin ? 'Да' : 'Нет'}</td>
                    <td>
                        <button class="table-button" onclick="toggleAdmin(${u.id}, ${u.is_admin ? 0 : 1})">${u.is_admin ? 'Снять админа' : 'Сделать админом'}</button>
                        <button class="table-button" onclick="deleteUser(${u.id})">Удалить</button>
                    </td>
                </tr>
            `).join('');
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка загрузки пользователей: ' + error.message);
    }
}

async function addAdminProduct() {
    const name = document.getElementById('admin-product-name').value;
    const price = parseInt(document.getElementById('admin-product-price').value);
    const description = document.getElementById('admin-product-description').value;
    const image = document.getElementById('admin-product-image').value;
    if (!name || !price) return showAlert('Заполните название и цену!');
    try {
        const response = await fetch(`${BASE_URL}/admin/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, description, image })
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Товар добавлен!');
            await loadAdminProducts();
            hideAddProductForm();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка добавления товара: ' + error.message);
    }
}

async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    const name = prompt('Новое название:', product.name);
    const price = parseInt(prompt('Новая цена:', product.price));
    const description = prompt('Новое описание:', product.description);
    const image = prompt('Новый URL изображения:', product.image);
    if (!name || !price) return showAlert('Название и цена обязательны!');
    try {
        const response = await fetch(`${BASE_URL}/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, description, image })
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Товар обновлён!');
            await loadProducts();
            await loadAdminProducts();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка редактирования товара: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
        const response = await fetch(`${BASE_URL}/admin/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Товар удалён!');
            await loadProducts();
            await loadAdminProducts();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка удаления товара: ' + error.message);
    }
}

async function toggleAdmin(userId, isAdmin) {
    try {
        const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_admin: isAdmin })
        });
        const data = await response.json();
        if (response.ok) {
            showAlert(`Статус администратора ${isAdmin ? 'назначен' : 'снят'}!`);
            await loadAdminUsers();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка изменения статуса: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    try {
        const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Пользователь удалён!');
            await loadAdminUsers();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка удаления пользователя: ' + error.message);
    }
}

function showAddProductForm() {
    document.getElementById('add-product-form').style.display = 'block';
}

function hideAddProductForm() {
    document.getElementById('add-product-form').style.display = 'none';
    document.getElementById('admin-product-name').value = '';
    document.getElementById('admin-product-price').value = '';
    document.getElementById('admin-product-description').value = '';
    document.getElementById('admin-product-image').value = '';
}

function logout() {
    currentUser = null;
    cart = [];
    favorites = [];
    localStorage.removeItem('currentUser');
    handleAuth();
}

// Переключение страниц
function showPage(pageId) {
    const pages = ['home-page', 'favorites-page', 'profile-page', 'catalog-page', 'cart-page', 'product-page', 'search-page'];
    pages.forEach(id => {
        const page = document.getElementById(id);
        if (page) page.style.display = 'none';
    });
    const currentPage = document.getElementById(pageId);
    if (currentPage) {
        currentPage.style.display = 'block';
        updateFooterIcons(pageId);
        switch (pageId) {
            case 'home-page': updatePromoGrid('home-promo-grid'); break;
            case 'favorites-page':
                updatePromoGrid('favorites-promo-grid');
                updateFavoritesPage();
                break;
            case 'profile-page': initProfilePage(); break;
            case 'catalog-page': updatePromoGrid('catalog-promo-grid'); break;
            case 'cart-page': updateCartPage(); break;
            case 'search-page': document.getElementById('search-input').focus(); break;
        }
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        if (pageId !== 'search-page') {
            if (searchInput) searchInput.style.display = 'none';
            if (searchResults) searchResults.style.display = 'none';
        } else {
            if (searchInput) searchInput.style.display = 'block';
            if (searchResults) searchResults.style.display = 'block';
        }
    }
}

function goBack() {
    const previousPage = localStorage.getItem('previousPage') || 'catalog-page';
    showPage(previousPage);
}

// Работа с товарами
function openProductPage(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('product-image2').style.backgroundImage = `url(${product.image})`;
        document.getElementById('product-title').textContent = `Наименование: ${product.name}`;
        document.getElementById('product-price').textContent = `Цена: ${product.price} рублей`;
        document.getElementById('product-description').innerHTML = `${product.description}`;
        const item = cart.find(item => item.id === productId);
        const addToCartButton = document.getElementById('add-to-cart');
        if (item) {
            addToCartButton.textContent = `В корзине (${item.quantity})`;
            addToCartButton.classList.add("remove");
        } else {
            addToCartButton.textContent = "В корзину";
            addToCartButton.classList.remove("remove");
        }
        document.getElementById('add-to-favorites').onclick = () => toggleFavorites(productId);
        document.getElementById('add-to-cart').onclick = () => toggleCart(productId);
        localStorage.setItem('previousPage', document.querySelector('.container:not([style*="none"])').id);
        showPage('product-page');
    }
}

function updateCartButtons(productId) {
    const item = cart.find(item => item.id === productId);
    const catalogButton = document.querySelector(`.catalog-item[data-id="${productId}"] .add-to-cart-button`);
    if (catalogButton) {
        if (item) {
            catalogButton.textContent = `В корзине (${item.quantity})`;
            catalogButton.classList.add("remove");
        } else {
            catalogButton.textContent = "В корзину";
            catalogButton.classList.remove("remove");
        }
    }
    const productPageButton = document.getElementById('add-to-cart');
    if (productPageButton && productPageButton.onclick) {
        if (item) {
            productPageButton.textContent = `В корзине (${item.quantity})`;
            productPageButton.classList.add("remove");
        } else {
            productPageButton.textContent = "В корзину";
            productPageButton.classList.remove("remove");
        }
    }
}

async function toggleFavorites(productId) {
    if (!currentUser) {
        showAlert('Войдите в аккаунт, чтобы добавить в избранное!');
        showPage('profile-page');
        return;
    }
    const button = document.querySelector(`.favorite-button[onclick*="${productId}"]`);
    if (favorites.includes(productId)) await removeFromFavorites(productId);
    else await addToFavorites(productId);
    updateFavoriteButton(productId, button);
}

function updateFavoriteButton(productId, button) {
    if (favorites.includes(productId)) button.classList.add("active");
    else button.classList.remove("active");
}

async function addToFavorites(productId) {
    const product = products.find(p => p.id === productId);
    if (product && !favorites.includes(productId)) {
        try {
            const response = await fetch(`${BASE_URL}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, product_id: productId })
            });
            const data = await response.json();
            if (response.ok) {
                favorites.push(productId);
                showAlert(`${product.name} добавлен в избранное!`);
                updateFavoritesPage();
            } else showAlert(data.error);
        } catch (error) {
            showAlert('Ошибка добавления в избранное: ' + error.message);
        }
    }
}

async function removeFromFavorites(productId) {
    try {
        const response = await fetch(`${BASE_URL}/favorites`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, product_id: productId })
        });
        const data = await response.json();
        if (response.ok) {
            favorites = favorites.filter(id => id !== productId);
            showAlert(`Товар удалён из избранного.`);
            updateFavoritesPage();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка удаления из избранного: ' + error.message);
    }
}

function updateAllFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    favoriteButtons.forEach(button => {
        const productId = parseInt(button.getAttribute('onclick').match(/\d+/)[0]);
        updateFavoriteButton(productId, button);
    });
}

async function toggleCart(productId) {
    if (!currentUser) {
        showAlert('Войдите в аккаунт, чтобы добавить в корзину!');
        showPage('profile-page');
        return;
    }
    const item = cart.find(item => item.id === productId);
    if (item) await increaseQuantity(productId);
    else await addToCart(productId);
}

async function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        try {
            const response = await fetch(`${BASE_URL}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, product_id: productId, quantity: 1 })
            });
            const data = await response.json();
            if (response.ok) {
                const item = cart.find(item => item.id === productId);
                if (item) item.quantity += 1;
                else cart.push({ id: productId, quantity: 1 });
                showAlert(`${product.name} добавлен в корзину!`);
                updateCartPage();
                updateCartButtons(productId);
            } else showAlert(data.error);
        } catch (error) {
            showAlert('Ошибка добавления в корзину: ' + error.message);
        }
    }
}

async function removeFromCart(productId) {
    if (!currentUser) return;
    try {
        const response = await fetch(`${BASE_URL}/cart`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, product_id: productId })
        });
        const data = await response.json();
        if (response.ok) {
            cart = cart.filter(item => item.id !== productId);
            showAlert(`Товар удалён из корзины.`);
            updateCartButtons(productId);
            updateCartPage();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка удаления из корзины: ' + error.message);
    }
}

async function checkout() {
    if (!currentUser) {
        showAlert('Пожалуйста, войдите в аккаунт для оформления заказа!');
        showPage('profile-page');
        return;
    }
    if (cart.length === 0) return showAlert('Ваша корзина пуста!');
    const order = `Заказ от ${new Date().toLocaleString()}: ${cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return `${product.name} (${item.quantity} шт.)`;
    }).join(', ')}`;
    const notification = `Ваш заказ от ${new Date().toLocaleString()} принят в обработку!`;
    try {
        const response = await fetch(`${BASE_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, order, notification })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser.orders = data.orders;
            currentUser.notifications = data.notifications;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAlert('Заказ оформлен! Скоро с вами свяжется менеджер!');
            cart = [];
            updateCartPage();
        } else showAlert(data.error);
    } catch (error) {
        showAlert('Ошибка оформления заказа: ' + error.message);
    }
}

function updateFavoritesPage() {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '<p>В избранном пока ничего нет.</p>';
    } else {
        favoritesGrid.innerHTML = favorites.map(id => {
            const product = products.find(p => p.id === id);
            return `
                <div class="favorites-item" data-id="${product.id}">
                    <div class="product-image" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})">
                        <button class="favorite-button" onclick="toggleFavorites(${product.id}); event.stopPropagation();">
                            <img src="static/favorite.png" class="favorite-icon">
                            <img src="static/favorite_active.png" class="favorite-icon active">
                        </button>
                    </div>
                    <div class="card-bottom">
                        <div class="product-price">${product.price} руб</div>
                        <div class="product-name">${product.name}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    updateAllFavoriteButtons();
}

function updateCartPage() {
    const cartItems = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Ваша корзина пуста.</p>';
    } else {
        cartItems.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.id);
            return `
                <div class="cart-item" data-id="${product.id}">
                    <div class="product-image" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})">
                        <button class="favorite-button" onclick="toggleFavorites(${product.id}); event.stopPropagation();">
                            <img src="static/favorite.png" class="favorite-icon">
                            <img src="static/favorite_active.png" class="favorite-icon active">
                        </button>
                    </div>
                    <div class="card-bottom">
                        <div class="product-price">${product.price} руб</div>
                        <div class="product-name">${product.name}</div>
                        <div class="quantity-controls">
                            <button class="quantity-button" onclick="decreaseQuantity(${product.id}); event.stopPropagation();">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-button" onclick="increaseQuantity(${product.id}); event.stopPropagation();">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    updateAllFavoriteButtons();
}

function updatePromoGrid(gridId) {
    const promoGrid = document.getElementById(gridId);
    if (promoGrid) {
        const randomProducts = getRandomProducts(3);
        promoGrid.innerHTML = randomProducts.map(product => `
            <div class="promo-item" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})"></div>
        `).join('');
    }
}

function getRandomProducts(count) {
    const shuffled = products.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function updateFooterIcons(activePage) {
    const footerIcons = document.querySelectorAll('.footer-icon');
    footerIcons.forEach(icon => icon.classList.remove('active'));
    switch (activePage) {
        case 'home-page': document.querySelector('.footer-icon:nth-child(1)').classList.add('active'); break;
        case 'catalog-page': document.querySelector('.footer-icon:nth-child(2)').classList.add('active'); break;
        case 'cart-page': document.querySelector('.footer-icon:nth-child(3)').classList.add('active'); break;
        case 'favorites-page': document.querySelector('.footer-icon:nth-child(4)').classList.add('active'); break;
        case 'profile-page': document.querySelector('.footer-icon:nth-child(5)').classList.add('active'); break;
    }
}

function initCatalog() {
    const catalogGrid = document.getElementById('catalog-grid');
    catalogGrid.innerHTML = products.map(product => {
        const item = cart.find(item => item.id === product.id);
        const quantity = item ? item.quantity : 0;
        return `
            <div class="catalog-item" data-id="${product.id}">
                <div class="product-image" style="background-image: url('${product.image}')" onclick="openProductPage(${product.id})">
                    <button class="favorite-button" onclick="toggleFavorites(${product.id}); event.stopPropagation();">
                        <img src="static/favorite.png" class="favorite-icon">
                        <img src="static/favorite_active.png" class="favorite-icon active">
                    </button>
                </div>
                <div class="card-bottom">
                    <div class="product-price">${product.price} руб</div>
                    <div class="product-name">${product.name}</div>
                    <button class="add-to-cart-button" onclick="toggleCart(${product.id}); event.stopPropagation();">
                        ${quantity > 0 ? `В корзине (${quantity})` : "В корзину"}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    updateAllFavoriteButtons();
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    if (query.trim() === '') return resultsContainer.innerHTML = '<p>Введите запрос для поиска.</p>';
    const results = products.filter(product =>
        product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
    );
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>Ничего не найдено.</p>';
    } else {
        resultsContainer.innerHTML = results.map(product => `
            <div class="result-item" onclick="openProductPage(${product.id})">
                <br>${product.name}</br>
                <p>${product.description}</p>
                <br>Цена: ${product.price} руб</p>
            </div>
        `).join('');
    }
}

function showSearchPage() {
    showPage('search-page');
    document.getElementById('search-input').focus();
}

async function increaseQuantity(productId) {
    if (!currentUser) return;
    const item = cart.find(item => item.id === productId);
    if (item) {
        try {
            const response = await fetch(`${BASE_URL}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, product_id: productId, quantity: 1 })
            });
            const data = await response.json();
            if (response.ok) {
                item.quantity += 1;
                updateCartButtons(productId);
                updateCartPage();
            } else showAlert(data.error);
        } catch (error) {
            showAlert('Ошибка увеличения количества: ' + error.message);
        }
    }
}

async function decreaseQuantity(productId) {
    if (!currentUser) return;
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (item.quantity > 1) {
            try {
                const response = await fetch(`${BASE_URL}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUser.id, product_id: productId, quantity: -1 })
                });
                const data = await response.json();
                if (response.ok) {
                    item.quantity -= 1;
                    updateCartButtons(productId);
                    updateCartPage();
                } else showAlert(data.error);
            } catch (error) {
                showAlert('Ошибка уменьшения количества: ' + error.message);
            }
        } else {
            await removeFromCart(productId);
        }
    }
}

// Старт
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    initCatalog();
    showPage('home-page');
    initProfilePage();
});