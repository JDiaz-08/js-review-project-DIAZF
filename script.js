// global variables
let currentUser = null;

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
