// js/app.js - Arquivo único simplificado
console.log('Iniciando BALANCE...');

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBPUuOlcsivBei1gLWiKQXRbIqDREym3zs",
    authDomain: "dadosdinheiro.firebaseapp.com",
    databaseURL: "https://dadosdinheiro-default-rtdb.firebaseio.com",
    projectId: "dadosdinheiro",
    storageBucket: "dadosdinheiro.firebasestorage.app",
    messagingSenderId: "812414354703",
    appId: "1:812414354703:web:6767af47fe7416daa46a7a"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Variáveis globais
let userId = null;
let transactionsRef = null;
let categoriesRef = null;

// Funções auxiliares
function showError(message) {
    console.error('Erro:', message);
    const errorAlert = document.getElementById('error-alert');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showLoading(type) {
    const loadingElement = document.getElementById(type + '-loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoading(type) {
    const loadingElement = document.getElementById(type + '-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function hideAllSections() {
    const sections = [
        'auth-container', 
        'dashboard-container',
        'login-form',
        'register-form', 
        'register-info-form'
    ];
    
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Funções de navegação
function showLogin() {
    console.log('Mostrando login');
    hideAllSections();
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('login-form').style.display = 'block';
}

function showRegister() {
    console.log('Mostrando registro');
    hideAllSections();
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('register-form').style.display = 'block';
}

// Funções de autenticação
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showError('Por favor, preencha todos os campos!');
        return;
    }
    
    console.log('Tentando login:', email);
    showLoading('login');
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            hideLoading('login');
            console.log('Login realizado com sucesso');
            handleUserAuth(userCredential.user);
        })
        .catch(err => {
            hideLoading('login');
            console.error('Erro no login:', err);
            showError('Erro no login: ' + err.message);
        });
}

function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!email || !password) {
        showError('Por favor, preencha todos os campos!');
        return;
    }
    
    console.log('Tentando cadastrar:', email);
    showLoading('register');
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            hideLoading('register');
            console.log('Usuário cadastrado com sucesso');
            handleNewUser(userCredential.user);
        })
        .catch(err => {
            hideLoading('register');
            console.error('Erro no cadastro:', err);
            showError('Erro no cadastro: ' + err.message);
        });
}

function loginWithGoogle() {
    console.log('Tentando login com Google');
    showLoading('register');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            hideLoading('register');
            console.log('Login com Google realizado');
            handleNewUser(result.user);
        })
        .catch(err => {
            hideLoading('register');
            console.error('Erro com Google:', err);
            showError('Erro com Google: ' + err.message);
        });
}

function logout() {
    console.log('Fazendo logout');
    auth.signOut().then(() => {
        console.log('Logout realizado');
        userId = null;
        transactionsRef = null;
        categoriesRef = null;
        showLogin();
    }).catch(error => {
        console.error('Erro no logout:', error);
        showError('Erro ao sair: ' + error.message);
    });
}

// Manipulação de usuários
function handleNewUser(user) {
    console.log('Manipulando novo usuário:', user.uid);
    userId = user.uid;
    transactionsRef = db.ref('users/' + userId + '/transactions');
    categoriesRef = db.ref('users/' + userId + '/categories');
    
    checkUserInfo(user, true);
}

function handleUserAuth(user) {
    console.log('Manipulando usuário existente:', user.uid);
    userId = user.uid;
    transactionsRef = db.ref('users/' + userId + '/transactions');
    categoriesRef = db.ref('users/' + userId + '/categories');
    
    checkUserInfo(user, false);
}

function checkUserInfo(user, isNewUser) {
    console.log('Verificando informações do usuário:', user.uid);
    
    db.ref('users/' + userId + '/info').once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                console.log('Usuário tem informações, mostrando dashboard');
                showDashboard(user);
            } else {
                console.log('Usuário não tem informações');
                if (isNewUser) {
                    showUserInfoForm(user);
                } else {
                    showDashboard(user);
                }
            }
        })
        .catch((error) => {
            console.error('Erro ao verificar informações:', error);
            showDashboard(user);
        });
}

function showUserInfoForm(user) {
    console.log('Mostrando formulário de informações');
    hideAllSections();
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('register-info-form').style.display = 'block';
    
    if (user.displayName) {
        document.getElementById('user-name').value = user.displayName;
    }
}

function saveUserInfo() {
    const info = {
        name: document.getElementById('user-name').value,
        birth: document.getElementById('user-birth').value,
        phone: document.getElementById('user-phone').value,
        address: document.getElementById('user-address').value,
        email: auth.currentUser.email,
        createdAt: new Date().toISOString()
    };
    
    if (!info.name) {
        showError('Por favor, preencha pelo menos o nome!');
        return;
    }
    
    console.log('Salvando informações do usuário');
    showLoading('info');
    
    db.ref('users/' + userId + '/info').set(info)
        .then(() => {
            hideLoading('info');
            console.log('Informações salvas com sucesso');
            showDashboard(auth.currentUser);
        })
        .catch(error => {
            hideLoading('info');
            console.error('Erro ao salvar informações:', error);
            showDashboard(auth.currentUser);
        });
}

// Dashboard e transações
function showDashboard(user) {
    console.log('Mostrando dashboard para:', user.email);
    
    hideAllSections();
    document.getElementById('dashboard-container').style.display = 'block';
    document.getElementById('user-email').textContent = user.email || 'Usuário';
    
    loadCategories();
    getTransactions();
    updateDashboard();
}

function formatCurrency(amount) { 
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(amount || 0); 
}

function updateDashboard() {
    console.log('Atualizando dashboard...');
    
    if (!transactionsRef) {
        console.warn('transactionsRef não disponível');
        return;
    }
    
    transactionsRef.once('value').then(snapshot => {
        const transactions = snapshot.val() || {};
        let balance = 0, income = 0, expense = 0;
        const now = new Date();
        const monthNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        for(let key in transactions) {
            const tx = transactions[key];
            if(tx.type === 'income') {
                balance += tx.amount;
            } else {
                balance -= tx.amount;
            }
            
            if(tx.date && tx.date.startsWith(monthNow)) {
                if(tx.type === 'income') income += tx.amount;
                else expense += tx.amount;
            }
        }
        
        document.getElementById('current-balance').textContent = formatCurrency(balance);
        document.getElementById('monthly-income').textContent = formatCurrency(income);
        document.getElementById('monthly-expenses').textContent = formatCurrency(expense);
        
    }).catch(error => {
        console.error('Erro ao atualizar dashboard:', error);
    });
}

function openTransactionForm() {
    console.log('Abrindo formulário de transação');
    try {
        new bootstrap.Modal(document.getElementById('transaction-modal')).show();
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        showError('Erro ao abrir formulário: ' + error.message);
    }
}

function saveTransaction() {
    console.log('Salvando transação...');
    
    const tx = {
        description: document.getElementById('transaction-description').value,
        amount: parseFloat(document.getElementById('transaction-amount').value),
        type: document.getElementById('transaction-type').value,
        date: document.getElementById('transaction-date').value,
        category: document.getElementById('transaction-category').value,
        createdAt: new Date().toISOString()
    };
    
    if (!tx.description || isNaN(tx.amount) || !tx.date || !tx.category) {
        showError('Preencha todos os campos!');
        return;
    }
    
    if (!transactionsRef) {
        showError('Sistema não inicializado. Recarregue a página.');
        return;
    }
    
    transactionsRef.push(tx)
        .then(() => {
            console.log('Transação salva com sucesso');
            bootstrap.Modal.getInstance(document.getElementById('transaction-modal')).hide();
            
            document.getElementById('transaction-description').value = '';
            document.getElementById('transaction-amount').value = '';
            document.getElementById('transaction-date').value = '';
            
            getTransactions();
            updateDashboard();
        })
        .catch(error => {
            console.error('Erro ao salvar transação:', error);
            showError('Erro ao salvar transação: ' + error.message);
        });
}

function editTransaction(key, tx) {
    document.getElementById('edit-transaction-key').value = key;
    document.getElementById('edit-transaction-description').value = tx.description;
    document.getElementById('edit-transaction-amount').value = tx.amount;
    document.getElementById('edit-transaction-type').value = tx.type;
    document.getElementById('edit-transaction-date').value = tx.date;
    document.getElementById('edit-transaction-category').value = tx.category;
    new bootstrap.Modal(document.getElementById('edit-transaction-modal')).show();
}

function updateTransaction() {
    const key = document.getElementById('edit-transaction-key').value;
    const tx = {
        description: document.getElementById('edit-transaction-description').value,
        amount: parseFloat(document.getElementById('edit-transaction-amount').value),
        type: document.getElementById('edit-transaction-type').value,
        date: document.getElementById('edit-transaction-date').value,
        category: document.getElementById('edit-transaction-category').value
    };
    transactionsRef.child(key).update(tx).then(() => {
        bootstrap.Modal.getInstance(document.getElementById('edit-transaction-modal')).hide();
        updateDashboard();
    });
}

function getTransactions() {
    if (!transactionsRef) {
        console.warn('transactionsRef não disponível');
        return;
    }
    
    transactionsRef.on('value', snapshot => {
        try {
            const transactions = snapshot.val() || {};
            updateTransactionList(transactions);
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
        }
    });
}

function updateTransactionList(transactions) {
    const list = document.getElementById('transactions-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    for(let key in transactions) {
        const tx = transactions[key];
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = `${tx.date} - ${tx.description} - ${formatCurrency(tx.amount)} - ${tx.category}`;
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-sm me-2';
        editBtn.textContent = 'Editar';
        editBtn.onclick = () => editTransaction(key, tx);
        li.appendChild(editBtn);

        const btn = document.createElement('button');
        btn.className = 'btn btn-danger btn-sm';
        btn.textContent = 'Excluir';
        btn.onclick = () => {
            if(confirm('Tem certeza que deseja excluir esta transação?')) {
                transactionsRef.child(key).remove();
                updateDashboard();
            }
        };
        
        li.appendChild(btn);
        list.appendChild(li);
    }
}

function openCategoryForm() {
    console.log('Abrindo formulário de categoria');
    try {
        new bootstrap.Modal(document.getElementById('category-modal')).show();
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        showError('Erro ao abrir formulário: ' + error.message);
    }
}

function saveCategory() {
    console.log('Salvando categoria...');
    
    const cat = {
        name: document.getElementById('category-name').value,
        createdAt: new Date().toISOString()
    };
    
    if (!cat.name) {
        showError('Digite o nome da categoria');
        return;
    }
    
    if (!categoriesRef) {
        showError('Sistema não inicializado. Recarregue a página.');
        return;
    }
    
    categoriesRef.push(cat)
        .then(() => {
            console.log('Categoria salva com sucesso');
            bootstrap.Modal.getInstance(document.getElementById('category-modal')).hide();
            document.getElementById('category-name').value = '';
            loadCategories();
        })
        .catch(error => {
            console.error('Erro ao salvar categoria:', error);
            showError('Erro ao salvar categoria: ' + error.message);
        });
}

function loadCategories() {
    if (!categoriesRef) {
        console.warn('categoriesRef não disponível');
        return;
    }
    
    console.log('Carregando categorias...');
    
    categoriesRef.on('value', snapshot => {
        try {
            const categories = snapshot.val() || {};
            updateCategorySelect(categories);
            updateCategoryList(categories);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    });
}

function updateCategorySelect(categories) {
    const select = document.getElementById('transaction-category');
    if (!select) return;
    
    select.innerHTML = '';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione uma categoria';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    for(let key in categories) {
        const option = document.createElement('option');
        option.value = categories[key].name;
        option.textContent = categories[key].name;
        select.appendChild(option);
    }
}

function updateCategoryList(categories) {
    const list = document.getElementById('categories-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    for(let key in categories) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = categories[key].name;
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-danger btn-sm';
        btn.textContent = 'Excluir';
        btn.onclick = () => {
            if(confirm('Tem certeza que deseja excluir esta categoria?')) {
                categoriesRef.child(key).remove();
            }
        };
        
        li.appendChild(btn);
        list.appendChild(li);
    }
}

function togglePassword(id, btn) {
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👀' : '🙈';
}

function filterTransactionsByMonth() {
    const monthInput = document.getElementById('filter-month');
    if (!monthInput || !transactionsRef) return;
    const selectedMonth = monthInput.value; // formato YYYY-MM
    transactionsRef.once('value').then(snapshot => {
        const transactions = snapshot.val() || {};
        const filtered = {};
        for (let key in transactions) {
            if (transactions[key].date && transactions[key].date.startsWith(selectedMonth)) {
                filtered[key] = transactions[key];
            }
        }
        updateTransactionList(filtered);
    });
}

function changePassword() {
    const newPass = prompt('Digite a nova senha:');
    if (!newPass) return;
    auth.currentUser.updatePassword(newPass)
        .then(() => alert('Senha alterada com sucesso!'))
        .catch(err => showError('Erro ao alterar senha: ' + err.message));
}

function deleteAccount() {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) return;
    const user = auth.currentUser;
    db.ref('users/' + user.uid).remove().then(() => {
        return user.delete();
    }).then(() => {
        alert('Conta excluída com sucesso!');
        showLogin();
    }).catch(err => showError('Erro ao excluir conta: ' + err.message));
}

function openEditUserInfo() {
    db.ref('users/' + userId + '/info').once('value').then(snapshot => {
        const info = snapshot.val();
        const newName = prompt('Nome:', info.name || '');
        const newPhone = prompt('Telefone:', info.phone || '');
        const newAddress = prompt('Endereço:', info.address || '');
        db.ref('users/' + userId + '/info').update({
            name: newName, phone: newPhone, address: newAddress
        }).then(() => alert('Informações atualizadas!'));
    });
}


// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando...');
    
    // Verificar estado de autenticação
    auth.onAuthStateChanged((user) => {
        console.log('Estado de autenticação:', user ? user.email : 'null');
        if (user) {
            handleUserAuth(user);
        } else {
            showLogin();
        }
    }, (error) => {
        console.error('Erro no auth state:', error);
        showError('Erro de autenticação: ' + error.message);
    });
    
    console.log('Aplicação inicializada com sucesso');
});

// Handler de erro global
window.addEventListener('error', function(e) {
    console.error('Erro global:', e.error);
});
