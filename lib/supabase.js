/**
 * lib/supabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mock Supabase client for LingoVibe.
 * Uses localStorage to persist data client-side, making the app 100% reliable
 * and independent of external DB instances, while preserving full interactive
 * state (including student-teacher chat logs and assignment creation).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Helper to generate unique IDs
const generateUUID = () => {
  return 'uuid_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};

// Seed initial data if database doesn't exist in localStorage
const seedDatabase = () => {
  if (typeof window === 'undefined') return;

  // 1. Seed Profiles
  if (!localStorage.getItem('lv_db_profiles')) {
    const defaultProfiles = [
      { id: 'student_id_1', email: 'student@example.com', role: 'student', full_name: 'Alex Johnson', current_level: 'B1', created_at: new Date().toISOString() },
      { id: 'teacher_id_1', email: 'teacher@example.com', role: 'teacher', full_name: 'Prof. Sarah Sterling', current_level: null, created_at: new Date().toISOString() },
      { id: '1', email: 'emma.watson@gmail.com', role: 'student', full_name: 'Emma Watson', current_level: 'B2', created_at: new Date().toISOString() },
      { id: '2', email: 'liam.neeson@outlook.com', role: 'student', full_name: 'Liam Neeson', current_level: 'C1', created_at: new Date().toISOString() },
      { id: '3', email: 'sophia.loren@yahoo.com', role: 'student', full_name: 'Sophia Loren', current_level: 'A2', created_at: new Date().toISOString() },
      { id: '4', email: 'daniel.craig@gmail.com', role: 'student', full_name: 'Daniel Craig', current_level: 'B1', created_at: new Date().toISOString() },
      { id: '5', email: 'olivia.colman@gmail.com', role: 'student', full_name: 'Olivia Colman', current_level: 'C2', created_at: new Date().toISOString() },
      { id: '6', email: 'george@clooney.com', role: 'student', full_name: 'George Clooney', current_level: 'B1', created_at: new Date().toISOString() }
    ];
    localStorage.setItem('lv_db_profiles', JSON.stringify(defaultProfiles));
  }

  // 2. Seed Assignments
  if (!localStorage.getItem('lv_db_assignments')) {
    const defaultAssignments = [
      {
        id: 'asg_1',
        teacher_id: 'teacher_id_1',
        title: 'Essential Word Match B1',
        type: 'matching',
        content: {
          instructions: 'Match the synonyms for B1 level vocabulary.',
          pairs: [
            { english: 'Acknowledge', translation: 'Accept/Recognize' },
            { english: 'Redundant', translation: 'No longer needed' },
            { english: 'Superficial', translation: 'Only on the surface' },
            { english: 'Mitigate', translation: 'Make less severe' }
          ]
        },
        assigned_student_ids: null, // public
        comment: 'Standard practice for vocabulary expansion.',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'asg_2',
        teacher_id: 'teacher_id_1',
        title: 'Shuffled Sentence Structure',
        type: 'sentence',
        content: {
          instructions: 'Arrange the shuffled words to form a correct sentence.',
          sentence: 'She speaks English fluently every day.',
          badges: ['fluently', 'every', 'speaks', 'She', 'day.', 'English']
        },
        assigned_student_ids: null, // public
        comment: 'Focus on word order and adverbs of frequency.',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
    localStorage.setItem('lv_db_assignments', JSON.stringify(defaultAssignments));
  }

  // 3. Seed Student Progress
  if (!localStorage.getItem('lv_db_student_progress')) {
    const defaultProgress = [
      { id: 'prog_1', student_id: '1', assignment_id: 'asg_1', type: 'assignment', score: 4, max_score: 4, feedback: 'Great job!', completed_at: new Date(Date.now() - 3600000 * 23).toISOString() },
      { id: 'prog_2', student_id: '2', assignment_id: 'asg_1', type: 'assignment', score: 4, max_score: 4, feedback: 'Perfect score!', completed_at: new Date(Date.now() - 3600000 * 22).toISOString() },
      { id: 'prog_3', student_id: '3', assignment_id: 'asg_1', type: 'assignment', score: 2, max_score: 4, feedback: 'Keep practicing.', completed_at: new Date(Date.now() - 3600000 * 21).toISOString() }
    ];
    localStorage.setItem('lv_db_student_progress', JSON.stringify(defaultProgress));
  }

  // 4. Seed Speaking Messages
  if (!localStorage.getItem('lv_db_speaking_messages')) {
    localStorage.setItem('lv_db_speaking_messages', JSON.stringify([]));
  }

  // 5. Seed Peer Messages
  if (!localStorage.getItem('lv_db_peer_messages')) {
    localStorage.setItem('lv_db_peer_messages', JSON.stringify([]));
  }
};

// Seed database on import in client environment
if (typeof window !== 'undefined') {
  seedDatabase();
}

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderConfig = null;
    this.limitVal = null;
    this.isSingle = false;
    this.action = 'select'; // 'select', 'insert', 'update', 'delete'
    this.actionData = null;
    this.selectFields = '*';
    this.selectOptions = null;
  }

  select(fields = '*', options = {}) {
    if (this.action !== 'insert' && this.action !== 'update' && this.action !== 'delete') {
      this.action = 'select';
    }
    this.selectFields = fields;
    this.selectOptions = options;
    return this;
  }

  insert(data) {
    this.action = 'insert';
    this.actionData = data;
    return this;
  }

  update(data) {
    this.action = 'update';
    this.actionData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  or(expr) {
    this.filters.push({ type: 'or', expr });
    return this;
  }

  order(column, config = { ascending: true }) {
    this.orderConfig = { column, ...config };
    return this;
  }

  limit(val) {
    this.limitVal = val;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    if (typeof window === 'undefined') {
      return { data: this.isSingle ? null : [], error: null, count: 0 };
    }

    // Ensure database is seeded
    seedDatabase();

    let items = [];
    const stored = localStorage.getItem(`lv_db_${this.table}`);
    if (stored) {
      try {
        items = JSON.parse(stored);
      } catch (e) {
        items = [];
      }
    }

    if (this.action === 'select') {
      // Filter items
      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          items = items.filter(item => String(item[filter.column]) === String(filter.value));
        } else if (filter.type === 'neq') {
          items = items.filter(item => String(item[filter.column]) !== String(filter.value));
        } else if (filter.type === 'or') {
          // e.g. "assigned_student_ids.is.null,assigned_student_ids.cs.{studentId}"
          // or "sender_id.eq.studentId,receiver_id.eq.studentId"
          // or "full_name.ilike.%val%,email.ilike.%val%"
          const parts = filter.expr.split(',');
          items = items.filter(item => {
            return parts.some(part => {
              if (part.includes('.is.null')) {
                const col = part.split('.')[0];
                return item[col] === null || item[col] === undefined || (Array.isArray(item[col]) && item[col].length === 0);
              }
              if (part.includes('.cs.')) {
                const col = part.split('.')[0];
                const matchVal = part.match(/\{([^}]+)\}/);
                if (matchVal) {
                  const val = matchVal[1];
                  return Array.isArray(item[col]) && item[col].includes(val);
                }
              }
              if (part.includes('.eq.')) {
                const col = part.split('.')[0];
                const val = part.split('.eq.')[1];
                return String(item[col]) === String(val);
              }
              if (part.includes('.ilike.')) {
                const col = part.split('.')[0];
                let val = part.split('.ilike.')[1];
                val = val.replace(/%/g, '').toLowerCase();
                return item[col] && String(item[col]).toLowerCase().includes(val);
              }
              return false;
            });
          });
        }
      }

      // Order items
      if (this.orderConfig) {
        const { column, ascending } = this.orderConfig;
        items.sort((a, b) => {
          const valA = a[column];
          const valB = b[column];
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Limit items
      if (this.limitVal !== null) {
        items = items.slice(0, this.limitVal);
      }

      if (this.isSingle) {
        return { data: items[0] || null, error: items[0] ? null : { message: 'Not found', code: 'PGRST116' } };
      }

      return { data: items, error: null, count: items.length };

    } else if (this.action === 'insert') {
      const rows = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      const insertedRows = [];
      for (const row of rows) {
        const newRow = {
          id: row.id || generateUUID(),
          created_at: row.created_at || new Date().toISOString(),
          ...row
        };
        items.push(newRow);
        insertedRows.push(newRow);
      }
      localStorage.setItem(`lv_db_${this.table}`, JSON.stringify(items));
      
      return { data: this.isSingle ? insertedRows[0] : insertedRows, error: null };

    } else if (this.action === 'update') {
      let updatedRows = [];
      items = items.map(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (filter.type === 'eq' && String(item[filter.column]) !== String(filter.value)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const updated = { ...item, ...this.actionData };
          updatedRows.push(updated);
          return updated;
        }
        return item;
      });
      localStorage.setItem(`lv_db_${this.table}`, JSON.stringify(items));

      return { data: this.isSingle ? updatedRows[0] : updatedRows, error: null };

    } else if (this.action === 'delete') {
      let deletedRows = [];
      const remainingItems = items.filter(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (filter.type === 'eq' && String(item[filter.column]) !== String(filter.value)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          deletedRows.push(item);
          return false;
        }
        return true;
      });
      localStorage.setItem(`lv_db_${this.table}`, JSON.stringify(remainingItems));
      return { data: deletedRows, error: null };
    }

    return { data: null, error: null };
  }

  // Promise-like interface
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      if (typeof window === 'undefined') return { data: { user: null, session: null }, error: null };
      
      seedDatabase();
      const profiles = JSON.parse(localStorage.getItem('lv_db_profiles') || '[]');
      let profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      // Auto-register student/teacher if it doesn't exist, to keep it simple and seamless
      if (!profile) {
        const isTeacher = email.toLowerCase().includes('teacher');
        profile = {
          id: generateUUID(),
          email: email.toLowerCase(),
          role: isTeacher ? 'teacher' : 'student',
          full_name: isTeacher ? 'Prof. ' + email.split('@')[0] : email.split('@')[0],
          current_level: isTeacher ? null : 'B1',
          created_at: new Date().toISOString()
        };
        profiles.push(profile);
        localStorage.setItem('lv_db_profiles', JSON.stringify(profiles));
      }

      const user = {
        id: profile.id,
        email: profile.email,
        user_metadata: {
          role: profile.role,
          full_name: profile.full_name
        }
      };

      return {
        data: {
          user,
          session: {
            access_token: 'mock_jwt_token',
            user
          }
        },
        error: null
      };
    },

    async signUp({ email, password, options }) {
      if (typeof window === 'undefined') return { data: { user: null, session: null }, error: null };

      seedDatabase();
      const profiles = JSON.parse(localStorage.getItem('lv_db_profiles') || '[]');
      const existing = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return { data: { user: null, session: null }, error: { message: 'User already exists' } };
      }

      const role = options?.data?.role || 'student';
      const fullName = options?.data?.full_name || 'Anonymous Learner';

      const profile = {
        id: generateUUID(),
        email: email.toLowerCase(),
        role: role,
        full_name: fullName,
        current_level: role === 'student' ? 'Not Tested' : null,
        created_at: new Date().toISOString()
      };
      profiles.push(profile);
      localStorage.setItem('lv_db_profiles', JSON.stringify(profiles));

      const user = {
        id: profile.id,
        email: profile.email,
        user_metadata: {
          role: profile.role,
          full_name: profile.full_name
        }
      };

      return {
        data: {
          user,
          session: {
            access_token: 'mock_jwt_token',
            user
          }
        },
        error: null
      };
    },

    async getSession() {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };

      const userId = localStorage.getItem('userId');
      if (!userId) {
        return { data: { session: null }, error: null };
      }

      const user = {
        id: userId,
        email: localStorage.getItem('userEmail') || '',
        user_metadata: {
          role: localStorage.getItem('userRole') || 'student',
          full_name: localStorage.getItem('userName') || 'Anonymous Learner'
        }
      };

      return {
        data: {
          session: {
            access_token: 'mock_jwt_token',
            user
          }
        },
        error: null
      };
    },

    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userLevel');
      }
      return { error: null };
    },

    onAuthStateChange(callback) {
      return {
        data: {
          subscription: {
            unsubscribe() {}
          }
        }
      };
    }
  },

  from(tableName) {
    return new MockQueryBuilder(tableName);
  }
};
