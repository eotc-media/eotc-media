import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import 'admin-lte';
import 'bootstrap/dist/js/bootstrap.bundle.js';
