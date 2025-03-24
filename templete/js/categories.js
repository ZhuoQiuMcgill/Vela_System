/**
 * VELA SYSTEM - Categories Page
 * Handles category management (add, edit, delete)
 */

// Global variables
let categoriesData = [];
let currentCategory = null;

/**
 * Initialize categories page
 */
function initCategories() {
    // Ensure user is authenticated
    if (!utils.requireAuth()) {
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // Load categories data
    loadCategories();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Add category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            openCategoryModal();
        });
    }

    // Save category button
    const saveCategoryBtn = document.getElementById('save-category-btn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', saveCategory);
    }

    // Edit category button in details modal
    const editCategoryBtn = document.getElementById('edit-category-btn');
    if (editCategoryBtn) {
        editCategoryBtn.addEventListener('click', () => {
            if (currentCategory) {
                openEditCategoryModal(currentCategory);
            }
        });
    }

    // Delete category button in details modal
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    if (deleteCategoryBtn) {
        deleteCategoryBtn.addEventListener('click', () => {
            if (currentCategory) {
                openDeleteConfirmModal(currentCategory);
            }
        });
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCategory);
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });
}

/**
 * Load categories data
 */
async function loadCategories() {
    try {
        // Show loading state
        document.getElementById('income-categories-loading').style.display = 'block';
        document.getElementById('expense-categories-loading').style.display = 'block';
        document.getElementById('income-categories-container').style.display = 'none';
        document.getElementById('expense-categories-container').style.display = 'none';
        document.getElementById('no-income-categories').style.display = 'none';
        document.getElementById('no-expense-categories').style.display = 'none';

        // Get categories from API
        const result = await api.categories.getAll();
        categoriesData = result.categories || [];

        // Separate income and expense categories (based on simple heuristic)
        const incomeCategories = categoriesData.filter(category => {
            const name = category.name.toLowerCase();
            return name.includes('salary') ||
                   name.includes('income') ||
                   name.includes('revenue') ||
                   name.includes('freelance') ||
                   name.includes('investment');
        });

        const expenseCategories = categoriesData.filter(category => {
            const name = category.name.toLowerCase();
            return !name.includes('salary') &&
                   !name.includes('income') &&
                   !name.includes('revenue');
        });

        // Render category grids
        renderCategoryGrid('income', incomeCategories);
        renderCategoryGrid('expense', expenseCategories);

    } catch (error) {
        console.error('Error loading categories:', error);
        utils.showNotification('Error loading categories', 'error');

        // Hide loading state
        document.getElementById('income-categories-loading').style.display = 'none';
        document.getElementById('expense-categories-loading').style.display = 'none';
    }
}

/**
 * Render a category grid (income or expense)
 */
function renderCategoryGrid(type, categories) {
    const containerEl = document.getElementById(`${type}-categories-container`);
    const loadingEl = document.getElementById(`${type}-categories-loading`);
    const noDataEl = document.getElementById(`no-${type}-categories`);

    if (!containerEl || !loadingEl || !noDataEl) return;

    // Hide loading
    loadingEl.style.display = 'none';

    if (categories.length === 0) {
        // Show no data message with improved styling
        containerEl.style.display = 'none';
        noDataEl.innerHTML = `
            <div>
                <i class="fas fa-folder-open fa-3x mb-3 text-muted"></i>
                <h4>No ${type} categories found</h4>
                <p class="text-muted">Click the "Add Category" button to create your first ${type} category.</p>
                <button class="btn btn-primary add-category-btn mt-3">
                    <i class="fas fa-plus-circle mr-2"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)} Category
                </button>
            </div>
        `;
        noDataEl.style.display = 'block';

        // Add event listener to the new Add Category button
        const addBtn = noDataEl.querySelector('.add-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', openCategoryModal);
        }

        return;
    }

    // Show container and hide no data message
    containerEl.style.display = 'grid';
    noDataEl.style.display = 'none';

    // Clear container
    containerEl.innerHTML = '';

    // Add categories to grid
    categories.forEach(category => {
        const categoryCard = createCategoryCard(category, type);
        containerEl.appendChild(categoryCard);
    });
}

/**
 * Create a category card element with improved styling
 */
function createCategoryCard(category, type) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('data-id', category.id);

    // Set different styles based on type
    const typeClass = type === 'income' ? 'category-income' : 'category-expense';
    const bgClass = type === 'income' ? 'bg-income' : 'bg-expense';
    const icon = type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
    const iconClass = type === 'income' ? 'text-success' : 'text-danger';

    // Choose a suitable icon based on category name (or fallback to default)
    let categoryIcon = 'fa-tag';

    // Map common category names to appropriate icons
    const categoryName = category.name.toLowerCase();
    if (categoryName.includes('salary') || categoryName.includes('income')) {
        categoryIcon = 'fa-money-bill-wave';
    } else if (categoryName.includes('freelance')) {
        categoryIcon = 'fa-laptop-code';
    } else if (categoryName.includes('investment')) {
        categoryIcon = 'fa-chart-line';
    } else if (categoryName.includes('food') || categoryName.includes('grocery')) {
        categoryIcon = 'fa-utensils';
    } else if (categoryName.includes('housing') || categoryName.includes('rent') || categoryName.includes('mortgage')) {
        categoryIcon = 'fa-home';
    } else if (categoryName.includes('transport')) {
        categoryIcon = 'fa-car';
    } else if (categoryName.includes('entertainment')) {
        categoryIcon = 'fa-film';
    }

    card.innerHTML = `
        <div class="category-card-inner ${bgClass}">
            <div class="category-card-header">
                <div class="category-icon ${typeClass}">
                    <i class="fas ${categoryIcon}"></i>
                </div>
                <div class="category-type-indicator">
                    <i class="fas ${icon} ${iconClass}"></i>
                    ${type === 'income' ? 'Income' : 'Expense'}
                </div>
            </div>
            <div class="category-card-body">
                <h3 class="category-name">${category.name}</h3>
                <p class="category-description">${category.description || 'No description available'}</p>
            </div>
            <div class="category-card-footer">
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-category-btn mr-2" title="Edit">
                        <i class="fas fa-edit mr-1"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-category-btn" title="Delete">
                        <i class="fas fa-trash mr-1"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listener for viewing category details
    card.addEventListener('click', (e) => {
        // Ignore clicks on buttons
        if (!e.target.closest('button')) {
            viewCategoryDetails(category.id);
        }
    });

    // Add event listeners for action buttons
    const editBtn = card.querySelector('.edit-category-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditCategoryModal(category);
    });

    const deleteBtn = card.querySelector('.delete-category-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirmModal(category);
    });

    return card;
}

/**
 * View category details
 */
async function viewCategoryDetails(categoryId) {
    try {
        // Find category in data
        currentCategory = categoriesData.find(c => c.id.toString() === categoryId.toString());

        if (!currentCategory) {
            utils.showNotification('Category not found', 'error');
            return;
        }

        // Populate details modal
        const modal = document.getElementById('category-details-modal');
        const titleEl = document.getElementById('category-details-title');
        const nameEl = document.getElementById('detail-category-name');
        const descriptionEl = document.getElementById('detail-category-description');

        titleEl.textContent = 'Category Details';
        nameEl.textContent = currentCategory.name;
        descriptionEl.textContent = currentCategory.description || 'No description available';

        // Show modal
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } catch (error) {
        console.error('Error viewing category details:', error);
        utils.showNotification('Error loading category details', 'error');
    }
}

/**
 * Open category modal for adding a new category
 */
function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    const idInput = document.getElementById('category-id');

    // Reset form
    form.reset();
    idInput.value = '';

    // Set title
    titleEl.textContent = 'Add Category';

    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Focus first input
    document.getElementById('category-name').focus();
}

/**
 * Open category modal for editing
 */
function openEditCategoryModal(category) {
    // Close details modal if open
    const detailsModal = document.getElementById('category-details-modal');
    closeModal(detailsModal);

    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    const idInput = document.getElementById('category-id');
    const nameInput = document.getElementById('category-name');
    const descriptionInput = document.getElementById('category-description');

    // Set form values
    idInput.value = category.id;
    nameInput.value = category.name;
    descriptionInput.value = category.description || '';

    // Set title
    titleEl.textContent = 'Edit Category';

    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Focus first input
    nameInput.focus();
}

/**
 * Open delete confirmation modal
 */
function openDeleteConfirmModal(category) {
    // Close any open modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => closeModal(modal));

    // Set current category
    currentCategory = category;

    // Set confirmation message
    const messageEl = document.getElementById('delete-confirm-message');
    messageEl.textContent = `Are you sure you want to delete the category "${category.name}"? All associated transactions will be moved to the "Other" category.`;

    // Show modal
    const modal = document.getElementById('delete-confirm-modal');
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Save category (create or update)
 */
async function saveCategory() {
    const form = document.getElementById('category-form');
    const modal = document.getElementById('category-modal');
    const idInput = document.getElementById('category-id');

    // Validate form
    if (!utils.validateForm(form)) {
        return;
    }

    // Get form data
    const formData = utils.serializeForm(form);

    // Prepare category data
    const categoryData = {
        name: formData.name,
        description: formData.description
    };

    try {
        // Show loading state
        const saveButton = document.getElementById('save-category-btn');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="loading"></span> Saving...';

        let response;

        if (idInput.value) {
            // Update existing category
            response = await api.categories.update(idInput.value, categoryData);
            utils.showNotification('Category updated successfully', 'success');
        } else {
            // Create new category
            response = await api.categories.create(categoryData);
            utils.showNotification('Category created successfully', 'success');
        }

        // Close modal
        closeModal(modal);

        // Reload categories
        loadCategories();

    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error saving category', 'error');
    } finally {
        // Reset save button
        const saveButton = document.getElementById('save-category-btn');
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

/**
 * Delete category
 */
async function deleteCategory() {
    if (!currentCategory) return;

    try {
        // Show loading state
        const deleteButton = document.getElementById('confirm-delete-btn');
        const originalText = deleteButton.textContent;
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<span class="loading"></span> Deleting...';

        // Delete category
        await api.categories.delete(currentCategory.id);

        // Show success message
        utils.showNotification('Category deleted successfully', 'success');

        // Close modal
        closeModal(document.getElementById('delete-confirm-modal'));

        // Reload categories
        loadCategories();

    } catch (error) {
        // Show error message
        utils.showNotification(error.message || 'Error deleting category', 'error');
    } finally {
        // Reset delete button
        const deleteButton = document.getElementById('confirm-delete-btn');
        deleteButton.disabled = false;
        deleteButton.textContent = originalText;
    }
}

/**
 * Close modal
 */
function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}