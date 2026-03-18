/**
 * Supabase API Compatibility Layer
 *
 * This module replaces the Supabase JS client with a drop-in adapter
 * that routes all calls to our custom Express/MongoDB backend.
 *
 * The frontend code calls:
 *   supabase.from('table').select('*').eq('id', x).order('name').limit(5)
 *   supabase.auth.signUp({ email, password, options })
 *   supabase.storage.from('bucket').upload(path, file)
 *   supabase.rpc('function_name', params)
 *
 * This adapter mimics the exact same chaining API surface.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================
// Token Management
// ============================================================
let _accessToken = localStorage.getItem('hms_access_token') || null;
let _authListeners = [];
let _currentUser = null;

function setToken(token) {
  _accessToken = token;
  if (token) {
    localStorage.setItem('hms_access_token', token);
  } else {
    localStorage.removeItem('hms_access_token');
  }
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  return headers;
}

function notifyAuthListeners(event, session) {
  for (const cb of _authListeners) {
    try { cb(event, session); } catch (e) { console.error('Auth listener error:', e); }
  }
}

// ============================================================
// Query Builder — mimics supabase.from('table').select().eq().order()
// ============================================================
class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._operation = 'select';
    this._select = '*';
    this._filters = [];
    this._orFilter = null;
    this._order = [];
    this._limit = null;
    this._single = false;
    this._data = null;
    this._returnData = false; // Whether to return data after insert (.select() after .insert())
  }

  select(columns = '*') {
    if (this._operation === 'insert') {
      this._returnData = true;
      return this;
    }
    this._operation = 'select';
    this._select = columns;
    return this;
  }

  insert(data) {
    this._operation = 'insert';
    this._data = data;
    return this;
  }

  update(data) {
    this._operation = 'update';
    this._data = data;
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  eq(column, value) {
    this._filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column, value) {
    this._filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column, value) {
    this._filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column, value) {
    this._filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column, value) {
    this._filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column, value) {
    this._filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column, value) {
    this._filters.push({ column, operator: 'like', value });
    return this;
  }

  ilike(column, value) {
    this._filters.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column, values) {
    this._filters.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column, value) {
    this._filters.push({ column, operator: 'is', value });
    return this;
  }

  or(filterString) {
    this._orFilter = filterString;
    return this;
  }

  order(column, options = {}) {
    this._order.push({
      column,
      ascending: options.ascending !== undefined ? options.ascending : true,
    });
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this._execute();
  }

  maybeSingle() {
    this._single = true;
    return this._execute().then(result => {
      // maybeSingle doesn't error if no rows
      if (result.error && result.error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return result;
    });
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }

  async _execute() {
    try {
      const body = {
        table: this._table,
        operation: this._operation,
        select: this._select,
        filters: this._filters,
        orFilter: this._orFilter,
        order: this._order,
        limit: this._limit,
        single: this._single,
        data: this._data,
        returnData: this._returnData,
      };

      const res = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const result = await res.json();
      return result;
    } catch (error) {
      console.error('Query execution error:', error);
      return { data: null, error: { message: error.message } };
    }
  }
}

// ============================================================
// Storage Builder — mimics supabase.storage.from('bucket')
// ============================================================
class StorageBuilder {
  constructor(bucket) {
    this._bucket = bucket;
  }

  async upload(filePath, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', filePath);

      const headers = {};
      if (_accessToken) {
        headers['Authorization'] = `Bearer ${_accessToken}`;
      }

      const res = await fetch(`${API_URL}/api/storage/upload/${this._bucket}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await res.json();
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  }

  async download(filePath) {
    try {
      const res = await fetch(`${API_URL}/api/storage/download/${this._bucket}/${filePath}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        return { data: null, error: { message: 'Download failed' } };
      }

      const blob = await res.blob();
      return { data: blob, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  }

  getPublicUrl(filePath) {
    const publicUrl = `${API_URL}/api/storage/download/${this._bucket}/${filePath}`;
    return { data: { publicUrl } };
  }
}

// ============================================================
// Auth Module — mimics supabase.auth.*
// ============================================================
const auth = {
  async signUp({ email, password, options = {} }) {
    try {
      const body = {
        email,
        password,
        fullName: options.data?.full_name || '',
        age: options.data?.age || null,
        gender: options.data?.gender || null,
        blood_group: options.data?.blood_group || null,
        phone: options.data?.phone || null,
        role: options.data?.role || 'patient',
      };

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.data?.session?.access_token) {
        setToken(result.data.session.access_token);
        _currentUser = result.data.session.user;
        notifyAuthListeners('SIGNED_IN', result.data.session);
      }

      return result;
    } catch (error) {
      return { data: { user: null, session: null }, error: { message: error.message } };
    }
  },

  async signInWithPassword({ email, password }) {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (result.data?.session?.access_token) {
        setToken(result.data.session.access_token);
        _currentUser = result.data.session.user;
        notifyAuthListeners('SIGNED_IN', result.data.session);
      }

      return result;
    } catch (error) {
      return { data: { user: null, session: null }, error: { message: error.message } };
    }
  },

  async signOut() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      // Ignore errors
    }
    setToken(null);
    _currentUser = null;
    notifyAuthListeners('SIGNED_OUT', null);
    return { error: null };
  },

  async getSession() {
    try {
      if (!_accessToken) {
        return { data: { session: null }, error: null };
      }

      const res = await fetch(`${API_URL}/api/auth/session`, {
        headers: getAuthHeaders(),
      });

      const result = await res.json();

      if (result.data?.session) {
        _currentUser = result.data.session.user;
      } else {
        // Token invalid/expired
        setToken(null);
        _currentUser = null;
      }

      return result;
    } catch (error) {
      return { data: { session: null }, error: null };
    }
  },

  async getUser() {
    try {
      if (!_accessToken) {
        return { data: { user: null }, error: null };
      }

      const res = await fetch(`${API_URL}/api/auth/user`, {
        headers: getAuthHeaders(),
      });

      const result = await res.json();
      if (result.data?.user) {
        _currentUser = result.data.user;
      }
      return result;
    } catch (error) {
      return { data: { user: null }, error: { message: error.message } };
    }
  },

  onAuthStateChange(callback) {
    _authListeners.push(callback);

    // Fire initial state if we have a token
    if (_accessToken) {
      auth.getSession().then(({ data }) => {
        if (data?.session) {
          callback('INITIAL_SESSION', data.session);
        } else {
          callback('SIGNED_OUT', null);
        }
      });
    } else {
      // Defer to next tick to match Supabase behavior
      setTimeout(() => callback('INITIAL_SESSION', null), 0);
    }

    // Return unsubscribe function matching Supabase API
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            _authListeners = _authListeners.filter(cb => cb !== callback);
          }
        }
      }
    };
  },
};

// ============================================================
// Main Supabase-compatible client
// ============================================================
export const supabase = {
  from(table) {
    return new QueryBuilder(table);
  },

  auth,

  storage: {
    from(bucket) {
      return new StorageBuilder(bucket);
    }
  },

  async rpc(functionName, params = {}) {
    try {
      const res = await fetch(`${API_URL}/api/rpc/${functionName}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      });

      return await res.json();
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  },
};
