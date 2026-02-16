// global variables
let currentUser = null;

// storage key for localStorage
const STORAGE_KEY = 'ipt_demo_v1';

// database object to hold all data
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// when page loads, run this
document.addEventListener('DOMContentLoaded', () => {
    
    // load data from localStorage
    loadFromStorage();

    // setup all event listeners
    initializeEventListeners();

    // if no hash in url, go to home
    if (!window.location.hash) {
        window.location.hash = '#/';
    }

    // check if user was logged in before (session restore)
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        // try to find the user with this token
        const user = window.db.accounts.find(acc => acc.email === authToken && acc.verified);
        if (user) {
            // user found, log them in
            setAuthState(true, user);
        } else {
            // token is invalid, remove it
            localStorage.removeItem('auth_token');
        }
    }

    // show the current page based on hash
    handleRouting();

    // listen for hash changes (when user clicks links)
    window.addEventListener('hashchange', handleRouting);
});

// load data from localStorage
function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            // data exists, parse it
            window.db = JSON.parse(stored);
        } else {
            // no data, create default
            seedDatabase();
        }
    } catch (e) {
        // if error, reset database
        console.error('Error loading data:', e);
        seedDatabase();
    }
}

// save data to localStorage
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    } catch (e) {
        console.error('Error saving data:', e);
        showToast('Error saving data', 'danger');
    }
}

// create initial data
function seedDatabase() {
    window.db = {
        accounts: [
            {
                id: generateId(),
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'Admin',
                verified: true
            }
        ],
        departments: [
            { id: generateId(), name: 'Engineering', description: 'Software team' },
            { id: generateId(), name: 'HR', description: 'Human Resources' }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

// navigate to different page
function navigateTo(hash) {
    window.location.hash = hash;
}

// main routing function - handles page navigation
function handleRouting() {
    // get current hash
    const hash = window.location.hash || '#/';
    const route = hash.substring(2); // remove '#/'

    // hide all pages first
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // check if route needs login
    const protectedRoutes = ['profile', 'employees', 'departments', 'accounts', 'requests'];
    const adminRoutes = ['employees', 'departments', 'accounts'];

    // if not logged in and trying to access protected page
    if (protectedRoutes.includes(route) && !currentUser) {
        showToast('Please log in first', 'warning');
        navigateTo('#/login');
        return;
    }

    // if not admin and trying to access admin page
    if (adminRoutes.includes(route) && (!currentUser || currentUser.role !== 'Admin')) {
        showToast('Access denied. Admin only.', 'danger');
        navigateTo('#/');
        return;
    }

    // determine which page to show
    let pageId = '';
    switch (route) {
        case '':
        case '/':
            pageId = 'home-page';
            break;
        case 'register':
            pageId = 'register-page';
            break;
        case 'verify-email':
            pageId = 'verify-email-page';
            // show email on verification page
            const unverifiedEmail = localStorage.getItem('unverified_email');
            if (unverifiedEmail) {
                document.getElementById('verify-email-display').textContent = unverifiedEmail;
            }
            break;
        case 'login':
            pageId = 'login-page';
            // show success message if coming from verification
            if (localStorage.getItem('email_verified') === 'true') {
                document.getElementById('login-success-alert').classList.remove('d-none');
                localStorage.removeItem('email_verified');
            }
            break;
        case 'profile':
            pageId = 'profile-page';
            renderProfile();
            break;
        case 'employees':
            pageId = 'employees-page';
            renderEmployeesList();
            break;
        case 'departments':
            pageId = 'departments-page';
            renderDepartmentsList();
            break;
        case 'accounts':
            pageId = 'accounts-page';
            renderAccountsList();
            break;
        case 'requests':
            pageId = 'requests-page';
            renderRequestsList();
            break;
        default:
            pageId = 'home-page';
    }

    // show the page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}


// handle registration
function handleRegister(e) {
    e.preventDefault();

    // get form values
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    // check if email already exists
    if (window.db.accounts.find(acc => acc.email === email)) {
        showToast('Email already registered', 'danger');
        return;
    }

    // check password length
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }

    // create new account
    const newAccount = {
        id: generateId(),
        firstName,
        lastName,
        email,
        password,
        role: 'User',
        verified: false
    };

    // add to database
    window.db.accounts.push(newAccount);
    saveToStorage();

    // save email for verification page
    localStorage.setItem('unverified_email', email);

    showToast('Account created! Please verify your email.', 'success');
    navigateTo('#/verify-email');
}

// simulate email verification
function handleVerifyEmail() {
    const email = localStorage.getItem('unverified_email');
    if (!email) {
        showToast('No pending verification', 'warning');
        return;
    }

    // find account
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        // mark as verified
        account.verified = true;
        saveToStorage();

        // cleanup
        localStorage.removeItem('unverified_email');
        localStorage.setItem('email_verified', 'true');

        showToast('Email verified successfully!', 'success');
        navigateTo('#/login');
    } else {
        showToast('Account not found', 'danger');
    }
}

// handle login
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    // find matching account
    const account = window.db.accounts.find(
        acc => acc.email === email && acc.password === password && acc.verified
    );

    if (account) {
        // login successful
        localStorage.setItem('auth_token', email);
        setAuthState(true, account);
        showToast('Login successful!', 'success');
        navigateTo('#/profile');
    } else {
        // login failed
        showToast('Invalid credentials or unverified email', 'danger');
    }
}

// update authentication state
function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;

    if (isAuth && user) {
        // user is logged in
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');

        // check if admin
        if (user.role === 'Admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }

        // update navbar with user name
        document.getElementById('username-display').textContent = user.firstName + ' ' + user.lastName;
    } else {
        // user is logged out
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        currentUser = null;
    }
}

// handle logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    setAuthState(false);
    showToast('Logged out successfully', 'info');
    navigateTo('#/');
}

